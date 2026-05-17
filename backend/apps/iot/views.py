from django.db.models import Min, Max, Avg, Count, OuterRef, Subquery, FloatField
from django.db.models.functions import Round
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from apps.accounts.permissions import IsFarmerRole, IsAdminRole
from apps.farms.models import Farm
from .models import SensorReading, AlertHistory

WILAYA_COORDS = {
  "Adrar": (27.87, -0.29),
  "Chlef": (36.16, 1.33),
  "Laghouat": (33.80, 2.86),
  "Oum El Bouaghi": (35.87, 7.11),
  "Batna": (35.55, 6.17),
  "Béjaïa": (36.75, 5.08),
  "Biskra": (34.85, 5.73),
  "Béchar": (31.61, -2.22),
  "Blida": (36.47, 2.83),
  "Bouira": (36.37, 3.90),
  "Tamanrasset": (22.78, 5.52),
  "Tébessa": (35.40, 8.12),
  "Tlemcen": (34.88, -1.32),
  "Tiaret": (35.37, 1.32),
  "Tizi Ouzou": (36.71, 4.05),
  "Alger": (36.74, 3.06),
  "Djelfa": (34.67, 3.26),
  "Jijel": (36.82, 5.77),
  "Sétif": (36.19, 5.41),
  "Saïda": (34.83, 0.15),
  "Skikda": (36.87, 6.90),
  "Sidi Bel Abbès": (35.19, -0.63),
  "Annaba": (36.90, 7.76),
  "Guelma": (36.46, 7.43),
  "Constantine": (36.36, 6.61),
  "Médéa": (36.26, 2.75),
  "Mostaganem": (35.93, 0.09),
  "M'Sila": (35.70, 4.54),
  "Mascara": (35.40, 0.14),
  "Ouargla": (31.95, 5.32),
  "Oran": (35.69, -0.63),
  "El Bayadh": (33.68, 1.01),
  "Illizi": (26.48, 8.48),
  "Bordj Bou Arréridj": (36.07, 4.76),
  "Boumerdès": (36.76, 3.47),
  "El Tarf": (36.77, 8.31),
  "Tindouf": (27.67, -8.14),
  "Tissemsilt": (35.60, 1.81),
  "El Oued": (33.36, 6.86),
  "Khenchela": (35.43, 7.14),
  "Souk Ahras": (36.28, 7.95),
  "Tipaza": (36.58, 2.45),
  "Mila": (36.45, 6.26),
  "Aïn Defla": (36.26, 1.97),
  "Naâma": (33.27, -0.31),
  "Aïn Témouchent": (35.30, -1.14),
  "Ghardaïa": (32.49, 3.67),
  "Relizane": (35.73, 0.56)
}


class SensorDataView(APIView):
    permission_classes = [IsFarmerRole]

    def post(self, request):
        """
        POST /api/v1/iot/data/
        Called by the ESP32 to submit a new sensor reading.
        """
        farm_id = request.data.get('farm_id')
        if not farm_id:
            return Response(
                {'error': 'farm_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            farm = Farm.objects.get(pk=farm_id)
        except Farm.DoesNotExist:
            return Response(
                {'error': 'Farm not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Verify the authenticated farmer owns this farm
        if farm.owner != request.user:
            return Response(
                {'error': 'You do not own this farm'},
                status=status.HTTP_403_FORBIDDEN
            )

        SensorReading.objects.create(
            farm=farm,
            temperature=request.data.get('temperature'),
            humidity=request.data.get('humidity'),
            soil_moisture=request.data.get('soil_moisture'),
            rain_status=request.data.get('rain_status'),
            ir_status=request.data.get('ir_status'),
            sound_status=request.data.get('sound_status'),
        )

        return Response({'status': 'ok'}, status=status.HTTP_201_CREATED)

    def get(self, request, farm_id=None):
        """
        GET /api/v1/iot/data/<farm_id>/
        Returns the last 50 sensor readings for the given farm (chronological).
        """
        if farm_id is None:
            return Response(
                {'error': 'farm_id is required in URL'},
                status=status.HTTP_400_BAD_REQUEST
            )

        readings = SensorReading.objects.filter(
            farm_id=farm_id,
            farm__owner=request.user,
        ).order_by('-recorded_at')[:50]

        # Reverse to chronological order for charts
        data = list(reversed([
            {
                'temperature': r.temperature,
                'humidity': r.humidity,
                'soil_moisture': r.soil_moisture,
                'rain_status': r.rain_status,
                'ir_status': r.ir_status,
                'sound_status': r.sound_status,
                'recorded_at': r.recorded_at.strftime('%H:%M'),
            }
            for r in readings
        ]))

        return Response(data, status=status.HTTP_200_OK)


# ═══════════════════════════════════════════
# ALERT RULES ENGINE
# ═══════════════════════════════════════════

ICON_MAP = {
    'soil_low': '🔴',
    'soil_high': '🔵',
    'temp_high': '🟠',
    'temp_low': '🟣',
    'rain': '🔵',
    'ir': '👁️',
    'sound': '🔊',
}


def evaluate_alerts(reading):
    """
    Evaluate a SensorReading against all alert rules.
    Returns a list of alert dicts.
    """
    alerts = []

    if reading.soil_moisture is not None:
        if reading.soil_moisture < 30:
            alerts.append({
                'level': 'danger',
                'sensor': 'Soil',
                'message': 'Irrigate immediately!',
                'icon': ICON_MAP['soil_low'],
            })
        elif reading.soil_moisture > 80:
            alerts.append({
                'level': 'warning',
                'sensor': 'Soil',
                'message': 'Soil too wet!',
                'icon': ICON_MAP['soil_high'],
            })

    if reading.temperature is not None:
        if reading.temperature > 35:
            alerts.append({
                'level': 'danger',
                'sensor': 'Temperature',
                'message': 'Extreme heat risk!',
                'icon': ICON_MAP['temp_high'],
            })
        elif reading.temperature < 5:
            alerts.append({
                'level': 'danger',
                'sensor': 'Temperature',
                'message': 'Frost risk!',
                'icon': ICON_MAP['temp_low'],
            })

    # pH Logic Removed per user request

    if reading.rain_status == 'pluie':
        alerts.append({
            'level': 'info',
            'sensor': 'Rain',
            'message': "Raining — no irrigation needed",
            'icon': ICON_MAP['rain'],
        })

    if reading.ir_status == 'detected':
        alerts.append({
            'level': 'danger',
            'sensor': 'Intrusion',
            'message': "Mouvement détecté sur la ferme",
            'icon': ICON_MAP['ir'],
        })

    if reading.sound_status == 'detected':
        alerts.append({
            'level': 'warning',
            'sensor': 'Son',
            'message': "Bruit suspect détecté",
            'icon': ICON_MAP['sound'],
        })

    return alerts


class AlertsView(APIView):
    permission_classes = [IsFarmerRole]

    def get(self, request, farm_id):
        """
        GET /api/v1/iot/alerts/<farm_id>/
        Evaluate the latest reading and return active alerts.
        """
        # Verify ownership
        try:
            farm = Farm.objects.get(pk=farm_id, owner=request.user)
        except Farm.DoesNotExist:
            return Response(
                {'error': 'Farm not found or access denied'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Get the latest reading
        reading = SensorReading.objects.filter(farm=farm).first()

        if not reading:
            return Response({
                'alerts': [],
                'alerts_count': 0,
                'has_danger': False,
                'last_reading': None,
            })

        alerts = evaluate_alerts(reading)

        return Response({
            'alerts': alerts,
            'alerts_count': len(alerts),
            'has_danger': any(a['level'] == 'danger' for a in alerts),
            'last_reading': {
                'temperature': reading.temperature,
                'humidity': reading.humidity,
                'soil_moisture': reading.soil_moisture,
                'rain_status': reading.rain_status,
                'ir_status': reading.ir_status,
                'sound_status': reading.sound_status,
                'recorded_at': reading.recorded_at.strftime('%d/%m/%Y %H:%M'),
            },
        })

    def post(self, request, farm_id):
        """
        POST /api/v1/iot/alerts/<farm_id>/
        Evaluate the latest reading and persist triggered alerts to AlertHistory.
        """
        try:
            farm = Farm.objects.get(pk=farm_id, owner=request.user)
        except Farm.DoesNotExist:
            return Response(
                {'error': 'Farm not found or access denied'},
                status=status.HTTP_404_NOT_FOUND
            )

        reading = SensorReading.objects.filter(farm=farm).first()
        if not reading:
            return Response({'saved': 0})

        alerts = evaluate_alerts(reading)

        for alert in alerts:
            AlertHistory.objects.create(
                farm=farm,
                sensor=alert['sensor'],
                message=alert['message'],
                level=alert['level'],
            )

        return Response({
            'saved': len(alerts),
            'alerts': alerts,
        }, status=status.HTTP_201_CREATED)


class AlertHistoryView(APIView):
    permission_classes = [IsFarmerRole]

    def get(self, request, farm_id):
        """
        GET /api/v1/iot/alerts/history/<farm_id>/
        Returns the last 20 AlertHistory entries for this farm.
        """
        try:
            farm = Farm.objects.get(pk=farm_id, owner=request.user)
        except Farm.DoesNotExist:
            return Response(
                {'error': 'Farm not found or access denied'},
                status=status.HTTP_404_NOT_FOUND
            )

        entries = AlertHistory.objects.filter(farm=farm).order_by('-triggered_at')[:20]

        # Map sensor names back to icons
        sensor_icon_map = {
            'Soil': '🔴',
            'Temperature': '🟠',
            'Rain': '🔵',
            'Intrusion': '👁️',
            'Son': '🔊',
        }

        data = [
            {
                'sensor': e.sensor,
                'message': e.message,
                'level': e.level,
                'icon': sensor_icon_map.get(e.sensor, '⚪'),
                'triggered_at': e.triggered_at.strftime('%d/%m/%Y %H:%M'),
            }
            for e in entries
        ]

        return Response(data)


class AdminIoTOverviewView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        critical_alerts = []
        warning_alerts = []
        normal_farms = []

        farms = Farm.objects.all()
        for farm in farms:
            lat = farm.latitude if farm.latitude is not None else WILAYA_COORDS.get(farm.wilaya, (28.0, 2.5))[0]
            lng = farm.longitude if farm.longitude is not None else WILAYA_COORDS.get(farm.wilaya, (28.0, 2.5))[1]

            # Get the latest reading for this farm
            reading = SensorReading.objects.filter(farm=farm).order_by('-recorded_at').first()
            if not reading:
                continue

            alerts = evaluate_alerts(reading)
            has_danger = any(a['level'] == 'danger' for a in alerts)
            has_warning = any(a['level'] == 'warning' for a in alerts)

            farm_data = {
                "farm_id": farm.id,
                "farm_name": farm.name,
                "farmer_name": farm.owner.full_name,
                "wilaya": farm.wilaya,
                "latitude": lat,
                "longitude": lng,
                "last_reading": {
                    "temperature": reading.temperature,
                    "humidity": reading.humidity,
                    "soil_moisture": reading.soil_moisture,
                    "rain_status": reading.rain_status,
                    "ir_status": reading.ir_status,
                    "sound_status": reading.sound_status,
                }
            }

            if has_danger:
                farm_data["alerts"] = alerts
                critical_alerts.append(farm_data)
            elif has_warning:
                farm_data["alerts"] = alerts
                warning_alerts.append(farm_data)
            else:
                normal_farms.append(farm_data)

        # Bug Fix 1: Calculate farms_by_wilaya correctly
        farms_by_wilaya = (
            SensorReading.objects.values('farm__wilaya')
            .annotate(
                avg_temperature=Round(Avg('temperature'), 1),
                farms_count=Count('farm', distinct=True)
            )
            .filter(avg_temperature__isnull=False)
            .order_by('farm__wilaya')
        )

        return Response({
            "summary": {
                "farms_danger": len(critical_alerts),
                "farms_warning": len(warning_alerts),
                "farms_normal": len(normal_farms),
                "total_readings": SensorReading.objects.count()
            },
            "farms_by_wilaya": list(farms_by_wilaya),
            "critical_alerts": critical_alerts,
            "warning_alerts": warning_alerts,
            "normal_farms": normal_farms
        })


class AlertHistoryListView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        alerts = AlertHistory.objects.select_related(
            'farm', 'farm__owner'
        ).order_by('-triggered_at')[:100]

        data = [
            {
                "farm_id": a.farm.id,
                "farm_name": a.farm.name,
                "farmer_name": a.farm.owner.full_name,
                "wilaya": a.farm.wilaya,
                "sensor": a.sensor,
                "message": a.message,
                "level": a.level,
                "triggered_at": a.triggered_at.strftime("%d/%m/%Y %H:%M")
            }
            for a in alerts
        ]
        return Response(data)


class SensorStatsView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        stats = SensorReading.objects.aggregate(
            temp_min=Min('temperature'),
            temp_max=Max('temperature'),
            temp_avg=Avg('temperature'),
            hum_min=Min('humidity'),
            hum_max=Max('humidity'),
            hum_avg=Avg('humidity'),
            soil_min=Min('soil_moisture'),
            soil_max=Max('soil_moisture'),
            soil_avg=Avg('soil_moisture'),
            total_readings=Count('id')
        )

        def rd(val):
            return round(val, 1) if val is not None else 0.0

        return Response({
            "total_readings": stats['total_readings'],
            "temperature": {"min": rd(stats['temp_min']), "max": rd(stats['temp_max']), "avg": rd(stats['temp_avg'])},
            "humidity": {"min": rd(stats['hum_min']), "max": rd(stats['hum_max']), "avg": rd(stats['hum_avg'])},
            "soil_moisture": {"min": rd(stats['soil_min']), "max": rd(stats['soil_max']), "avg": rd(stats['soil_avg'])},
        })


class SoilByWilayaView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        # latest reading per farm, then avg per wilaya
        # This is a bit tricky with pure Django ORM without subqueries
        # Let's use a simpler approach: group by wilaya and get average of ALL readings
        # BUT the user specifically asked for "latest SensorReading per farm"
        
        # Subquery approach for latest readings
        
        latest_readings = SensorReading.objects.filter(
            farm=OuterRef('pk')
        ).order_by('-recorded_at')
        
        farms_with_soil = Farm.objects.annotate(
            latest_soil=Subquery(latest_readings.values('soil_moisture')[:1])
        ).filter(latest_soil__isnull=False)
        
        # Now group these by wilaya
        wilaya_stats = (
            farms_with_soil.values('wilaya')
            .annotate(
                avg_soil_moisture=Round(Avg('latest_soil', output_field=FloatField()), 1),
                farms_count=Count('id')
            )
            .filter(avg_soil_moisture__isnull=False)
            .order_by('avg_soil_moisture')
        )
        
        return Response(list(wilaya_stats))


class FarmComparisonView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        farms = Farm.objects.all()
        data = []
        
        for farm in farms:
            readings = SensorReading.objects.filter(farm=farm).order_by('-recorded_at')[:10]
            if not readings.exists():
                continue
                
            # Aggregate stats for these 10 readings
            stats = readings.aggregate(
                avg_temp=Avg('temperature'),
                avg_hum=Avg('humidity'),
                avg_soil=Avg('soil_moisture'),
                count=Count('id')
            )
            
            avg_temp = stats['avg_temp'] or 0
            avg_soil = stats['avg_soil'] or 0
            
            status_level = "normal"
            if avg_soil < 30 or avg_temp > 35:
                status_level = "danger"
                
            data.append({
                "farm_id": farm.id,
                "farm_name": farm.name,
                "farmer_name": farm.owner.full_name,
                "wilaya": farm.wilaya,
                "stats": {
                    "avg_temperature": round(avg_temp, 1),
                    "avg_humidity": round(stats['avg_hum'] or 0, 1),
                    "avg_soil_moisture": round(avg_soil, 1),
                    "readings_count": stats['count'],
                    "last_update": readings[0].recorded_at.strftime("%d/%m %H:%M")
                },
                "status": status_level
            })
            
        # Sort by status priority: danger, warning, normal
        status_priority = {"danger": 0, "warning": 1, "normal": 2}
        data.sort(key=lambda x: status_priority.get(x['status'], 3))
        
        return Response(data)


class AIRecommendationsView(APIView):
    """
    GET /api/v1/iot/ai-recommendations/<farm_id>/
    
    Generates AI-powered agricultural recommendations by combining
    IoT sensor readings with weather forecast data via Gemini AI.
    
    This is an ENHANCEMENT LAYER — it never affects the existing
    IoT alerts system. If AI generation fails, it returns gracefully.
    """
    permission_classes = [IsFarmerRole]

    def get(self, request, farm_id):
        import logging
        logger = logging.getLogger('agrigov.ai')

        # Verify farm ownership
        try:
            farm = Farm.objects.get(pk=farm_id, owner=request.user)
        except Farm.DoesNotExist:
            return Response(
                {'error': 'Farm not found or access denied'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check for force-refresh parameter
        force = request.query_params.get('force', '').lower() in ('true', '1')

        try:
            from .ai_service import generate_recommendations
            result = generate_recommendations(farm, force=force)
        except Exception as e:
            # Never break the dashboard — fail gracefully
            logger.error(f'[AI] Unexpected error for farm {farm_id}: {e}')
            result = {
                'recommendations': [],
                'generated_at': None,
                'source': 'error',
                'error': 'AI service temporarily unavailable',
            }

        return Response(result, status=status.HTTP_200_OK)
