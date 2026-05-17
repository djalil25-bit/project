"""
AI Agricultural Advisory Service
=================================
Combines IoT sensor readings with weather forecast data, builds
structured prompts, and calls Gemini AI to generate actionable
farming recommendations.

Architecture:
  IoT Sensors → Backend Aggregation → Weather API → Prompt Builder
  → Gemini API → Response Sanitization → Cache → Farmer Dashboard
"""

import os
import json
import logging
import hashlib
import time
from datetime import datetime, timedelta
from typing import Optional

from google import genai
from google.genai import types as genai_types
import requests

from django.core.cache import cache
from django.utils import timezone

logger = logging.getLogger('agrigov.ai')

# ══════════════════════════════════════════════
# CONFIGURATION
# ══════════════════════════════════════════════

GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')
OPENWEATHER_API_KEY = os.environ.get('OPENWEATHER_API_KEY', '')

# Rate limiting: max 1 AI generation per farm every 10 minutes
AI_COOLDOWN_SECONDS = 600
# Cache AI responses for 15 minutes
AI_CACHE_TTL = 900
# Gemini request timeout
GEMINI_TIMEOUT = 15
# Max recommendations to return
MAX_RECOMMENDATIONS = 3

# Wilaya code → city mapping (shared with weather system)
WILAYA_CODE_TO_CITY = {
    '1': 'Adrar', '2': 'Chlef', '3': 'Laghouat', '4': 'Oum El Bouaghi',
    '5': 'Batna', '6': 'Béjaïa', '7': 'Biskra', '8': 'Béchar',
    '9': 'Blida', '10': 'Bouira', '11': 'Tamanrasset', '12': 'Tébessa',
    '13': 'Tlemcen', '14': 'Tiaret', '15': 'Tizi Ouzou', '16': 'Algiers',
    '17': 'Djelfa', '18': 'Jijel', '19': 'Sétif', '20': 'Saïda',
    '21': 'Skikda', '22': 'Sidi Bel Abbès', '23': 'Annaba', '24': 'Guelma',
    '25': 'Constantine', '26': 'Médéa', '27': 'Mostaganem', '28': "M'Sila",
    '29': 'Mascara', '30': 'Ouargla', '31': 'Oran', '32': 'El Bayadh',
    '33': 'Illizi', '34': 'Bordj Bou Arréridj', '35': 'Boumerdès',
    '36': 'El Tarf', '37': 'Tindouf', '38': 'Tissemsilt', '39': 'El Oued',
    '40': 'Khenchela', '41': 'Souk Ahras', '42': 'Tipaza', '43': 'Mila',
    '44': 'Aïn Defla', '45': 'Naâma', '46': 'Aïn Témouchent',
    '47': 'Ghardaïa', '48': 'Relizane',
}


def _resolve_city(wilaya_value):
    """Convert a wilaya field value to a searchable city name."""
    if not wilaya_value:
        return 'Algiers'
    stripped = str(wilaya_value).strip()
    if stripped.isdigit():
        return WILAYA_CODE_TO_CITY.get(stripped, 'Algiers')
    return stripped if stripped else 'Algiers'


# ══════════════════════════════════════════════
# DATA AGGREGATION LAYER
# ══════════════════════════════════════════════

def aggregate_sensor_data(reading):
    """
    Extract structured sensor context from a SensorReading instance.
    Only sends clean, contextual data — never raw DB dumps.
    """
    if not reading:
        return None

    return {
        'soil_moisture': reading.soil_moisture,
        'temperature': reading.temperature,
        'humidity': reading.humidity,
        'rain_status': reading.rain_status,
        'ir_status': reading.ir_status,
        'sound_status': reading.sound_status,
        'recorded_at': reading.recorded_at.strftime('%Y-%m-%d %H:%M') if reading.recorded_at else None,
    }


def fetch_weather_data(farm):
    """
    Fetch current weather + 24h forecast for a farm's location.
    Returns structured weather context for the AI prompt.
    """
    if not OPENWEATHER_API_KEY:
        logger.warning('[AI] OpenWeather API key not configured')
        return None

    try:
        # Determine location
        if farm.latitude and farm.longitude:
            geo_params = {'lat': farm.latitude, 'lon': farm.longitude}
        else:
            city = _resolve_city(farm.wilaya)
            geo_params = {'q': f'{city},DZ'}

        base_params = {**geo_params, 'appid': OPENWEATHER_API_KEY, 'units': 'metric', 'lang': 'en'}

        # Current weather
        current_resp = requests.get(
            'https://api.openweathermap.org/data/2.5/weather',
            params=base_params, timeout=8
        )
        current_resp.raise_for_status()
        current_data = current_resp.json()

        weather_context = {
            'current_temp': round(current_data['main']['temp']),
            'feels_like': round(current_data['main']['feels_like']),
            'humidity': current_data['main']['humidity'],
            'wind_speed_kmh': round(current_data['wind']['speed'] * 3.6, 1),
            'description': current_data['weather'][0]['description'],
            'city': current_data.get('name', 'Unknown'),
        }

        # 24h forecast (3-hour intervals)
        forecast_resp = requests.get(
            'https://api.openweathermap.org/data/2.5/forecast',
            params=base_params, timeout=8
        )
        forecast_resp.raise_for_status()
        forecast_data = forecast_resp.json()

        # Extract next 24h (8 intervals × 3 hours)
        forecast_entries = forecast_data.get('list', [])[:8]

        rain_probability = 0
        max_wind = 0
        max_temp_24h = -100
        min_temp_24h = 100
        rain_expected = False

        for entry in forecast_entries:
            pop = entry.get('pop', 0) * 100  # probability of precipitation
            rain_probability = max(rain_probability, pop)
            wind = entry.get('wind', {}).get('speed', 0) * 3.6
            max_wind = max(max_wind, wind)
            temp = entry.get('main', {}).get('temp', 0)
            max_temp_24h = max(max_temp_24h, temp)
            min_temp_24h = min(min_temp_24h, temp)
            # Check for rain/thunderstorm in weather conditions
            for w in entry.get('weather', []):
                main_cond = w.get('main', '').lower()
                if main_cond in ('rain', 'thunderstorm', 'drizzle'):
                    rain_expected = True

        weather_context['rain_probability_24h'] = round(rain_probability)
        weather_context['max_wind_24h_kmh'] = round(max_wind, 1)
        weather_context['max_temp_24h'] = round(max_temp_24h)
        weather_context['min_temp_24h'] = round(min_temp_24h)
        weather_context['rain_expected_24h'] = rain_expected

        return weather_context

    except requests.RequestException as e:
        logger.error(f'[AI] Weather API error: {e}')
        return None
    except (KeyError, IndexError, TypeError) as e:
        logger.error(f'[AI] Weather data parsing error: {e}')
        return None


# ══════════════════════════════════════════════
# PROMPT ENGINEERING
# ══════════════════════════════════════════════

SYSTEM_PROMPT = """You are an agricultural AI advisor for the AgriGov platform.
Analyze the provided farm sensor data and weather conditions to generate SHORT, ACTIONABLE farming recommendations.

STRICT RULES:
- Generate exactly 1 to 3 recommendations as a JSON array
- Each recommendation must have: "type", "severity", "message"
- "type" must be one of: "irrigation", "weather", "crop_safety", "optimization", "security"
- "severity" must be one of: "critical", "warning", "info"
- "message" must be 1-2 sentences maximum, direct and actionable
- Focus on: irrigation timing, weather risks, crop safety, water efficiency
- Do NOT provide general farming advice — only respond to the specific data
- Do NOT use chatbot language, greetings, or explanations
- Sound professional and operational
- Return ONLY the JSON array, no other text

Example output format:
[
  {"type": "irrigation", "severity": "warning", "message": "Rain expected within 18 hours. Delay irrigation to conserve water."},
  {"type": "crop_safety", "severity": "critical", "message": "High temperature stress detected. Avoid pesticide application during peak hours."}
]"""


def build_prompt(sensor_data, weather_data):
    """
    Build a structured prompt combining sensor + weather context.
    """
    prompt_parts = ["Farm conditions report:\n"]

    if sensor_data:
        prompt_parts.append("=== IoT SENSOR READINGS ===")
        if sensor_data.get('soil_moisture') is not None:
            prompt_parts.append(f"Soil Moisture: {sensor_data['soil_moisture']}%")
        if sensor_data.get('temperature') is not None:
            prompt_parts.append(f"Temperature: {sensor_data['temperature']}°C")
        if sensor_data.get('humidity') is not None:
            prompt_parts.append(f"Humidity: {sensor_data['humidity']}%")
        if sensor_data.get('rain_status'):
            rain_map = {'sec': 'Dry', 'humide': 'Wet/Damp', 'pluie': 'Raining'}
            prompt_parts.append(f"Rain Sensor: {rain_map.get(sensor_data['rain_status'], sensor_data['rain_status'])}")
        if sensor_data.get('ir_status'):
            prompt_parts.append(f"IR Motion: {'Movement detected' if sensor_data['ir_status'] == 'detected' else 'Clear'}")
        if sensor_data.get('sound_status'):
            prompt_parts.append(f"Sound Sensor: {'Noise detected' if sensor_data['sound_status'] == 'detected' else 'Silent'}")
        prompt_parts.append("")

    if weather_data:
        prompt_parts.append("=== WEATHER CONDITIONS ===")
        prompt_parts.append(f"Current Weather: {weather_data.get('description', 'N/A')}")
        prompt_parts.append(f"Current Temperature: {weather_data.get('current_temp', 'N/A')}°C (feels like {weather_data.get('feels_like', 'N/A')}°C)")
        prompt_parts.append(f"Atmospheric Humidity: {weather_data.get('humidity', 'N/A')}%")
        prompt_parts.append(f"Wind Speed: {weather_data.get('wind_speed_kmh', 'N/A')} km/h")
        prompt_parts.append(f"Rain Probability (next 24h): {weather_data.get('rain_probability_24h', 'N/A')}%")
        prompt_parts.append(f"Rain Expected (next 24h): {'Yes' if weather_data.get('rain_expected_24h') else 'No'}")
        prompt_parts.append(f"Max Wind (next 24h): {weather_data.get('max_wind_24h_kmh', 'N/A')} km/h")
        prompt_parts.append(f"Temperature Range (next 24h): {weather_data.get('min_temp_24h', 'N/A')}°C – {weather_data.get('max_temp_24h', 'N/A')}°C")
        prompt_parts.append("")

    prompt_parts.append("Generate agricultural recommendations based on these conditions.")

    return "\n".join(prompt_parts)


# ══════════════════════════════════════════════
# GEMINI AI ENGINE
# ══════════════════════════════════════════════

def _get_cache_key(farm_id, sensor_data, weather_data):
    """Generate a deterministic cache key based on input data."""
    data_str = json.dumps({
        'farm_id': farm_id,
        'sensor': sensor_data,
        'weather': weather_data,
    }, sort_keys=True, default=str)
    return f"ai_advisory_{farm_id}_{hashlib.md5(data_str.encode()).hexdigest()[:12]}"


def _get_cooldown_key(farm_id):
    """Rate limiting key per farm."""
    return f"ai_cooldown_{farm_id}"


def _sanitize_response(raw_text):
    """
    Parse and sanitize the Gemini response.
    Extracts JSON array from response, validates structure.
    """
    if not raw_text:
        return []

    # Strip markdown code fences if present
    text = raw_text.strip()
    if text.startswith('```json'):
        text = text[7:]
    elif text.startswith('```'):
        text = text[3:]
    if text.endswith('```'):
        text = text[:-3]
    text = text.strip()

    # Try to find JSON array in the response
    start_idx = text.find('[')
    end_idx = text.rfind(']')
    if start_idx == -1 or end_idx == -1:
        logger.warning(f'[AI] No JSON array found in response: {text[:200]}')
        return []

    json_str = text[start_idx:end_idx + 1]

    try:
        recommendations = json.loads(json_str)
    except json.JSONDecodeError as e:
        logger.error(f'[AI] JSON parse error: {e} — raw: {json_str[:300]}')
        return []

    if not isinstance(recommendations, list):
        return []

    # Validate each recommendation
    valid_types = {'irrigation', 'weather', 'crop_safety', 'optimization', 'security'}
    valid_severities = {'critical', 'warning', 'info'}
    validated = []

    for rec in recommendations[:MAX_RECOMMENDATIONS]:
        if not isinstance(rec, dict):
            continue

        rec_type = str(rec.get('type', '')).lower()
        severity = str(rec.get('severity', '')).lower()
        message = str(rec.get('message', '')).strip()

        if not message:
            continue

        # Fallback for invalid types/severities
        if rec_type not in valid_types:
            rec_type = 'optimization'
        if severity not in valid_severities:
            severity = 'info'

        # Truncate excessively long messages
        if len(message) > 200:
            message = message[:197] + '...'

        validated.append({
            'type': rec_type,
            'severity': severity,
            'message': message,
        })

    return validated


def generate_recommendations(farm, force=False):
    """
    Main entry point: generate AI recommendations for a farm.

    Args:
        farm: Farm model instance
        force: If True, bypass rate limiting and cache

    Returns:
        dict with 'recommendations', 'generated_at', 'source' keys
    """
    farm_id = farm.id

    # ── Rate limiting check ──
    if not force:
        cooldown_key = _get_cooldown_key(farm_id)
        if cache.get(cooldown_key):
            # Return cached response if available during cooldown
            cached = _get_cached_response(farm_id)
            if cached:
                logger.info(f'[AI] Farm {farm_id}: returning cached (cooldown active)')
                return cached
            logger.info(f'[AI] Farm {farm_id}: cooldown active, no cache available')
            return {
                'recommendations': [],
                'generated_at': None,
                'source': 'cooldown',
                'error': None,
            }

    # ── Aggregate data ──
    from .models import SensorReading
    reading = SensorReading.objects.filter(farm=farm).order_by('-recorded_at').first()
    sensor_data = aggregate_sensor_data(reading)

    if not sensor_data:
        return {
            'recommendations': [],
            'generated_at': None,
            'source': 'no_data',
            'error': 'No sensor readings available',
        }

    weather_data = fetch_weather_data(farm)

    # ── Check cache ──
    if not force:
        cache_key = _get_cache_key(farm_id, sensor_data, weather_data)
        cached_result = cache.get(cache_key)
        if cached_result:
            logger.info(f'[AI] Farm {farm_id}: cache hit')
            return cached_result

    # ── Verify Gemini API key ──
    if not GEMINI_API_KEY:
        logger.error('[AI] GEMINI_API_KEY not configured')
        return {
            'recommendations': [],
            'generated_at': None,
            'source': 'error',
            'error': 'AI service not configured',
        }

    # ── Build prompt ──
    prompt = build_prompt(sensor_data, weather_data)
    logger.info(f'[AI] Farm {farm_id}: generating recommendations via Gemini')

    # ── Call Gemini ──
    try:
        client = genai.Client(api_key=GEMINI_API_KEY)

        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=prompt,
            config=genai_types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                temperature=0.3,
                max_output_tokens=500,
            ),
        )

        raw_text = response.text if response and response.text else ''
        recommendations = _sanitize_response(raw_text)

    except Exception as e:
        logger.error(f'[AI] Gemini API error for farm {farm_id}: {e}')
        # Return fallback — don't break existing IoT system
        return {
            'recommendations': [],
            'generated_at': None,
            'source': 'error',
            'error': f'AI generation failed: {str(e)[:100]}',
        }

    # ── Build response ──
    now = timezone.now()
    result = {
        'recommendations': recommendations,
        'generated_at': now.isoformat(),
        'source': 'gemini',
        'error': None,
    }

    # ── Cache result ──
    cache_key = _get_cache_key(farm_id, sensor_data, weather_data)
    cache.set(cache_key, result, AI_CACHE_TTL)

    # ── Set cooldown ──
    cooldown_key = _get_cooldown_key(farm_id)
    cache.set(cooldown_key, True, AI_COOLDOWN_SECONDS)

    # ── Store latest for quick retrieval ──
    cache.set(f"ai_latest_{farm_id}", result, AI_CACHE_TTL * 2)

    logger.info(f'[AI] Farm {farm_id}: generated {len(recommendations)} recommendations')
    return result


def _get_cached_response(farm_id):
    """Try to get the latest cached response for a farm."""
    cached = cache.get(f"ai_latest_{farm_id}")
    if cached:
        cached['source'] = 'cache'
    return cached
