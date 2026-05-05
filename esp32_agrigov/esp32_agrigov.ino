/*
 * AgriGov — ESP32 Farm Sensor Module
 * ===================================
 * Reads DHT11, FC-28, pH sensor, Rain sensor
 * Sends JSON payload every 10 minutes to Django backend
 *
 * Wiring:
 *   DHT11       → PIN 14
 *   FC-28       → PIN 34 (analog)
 *   pH Sensor   → PIN 35 (analog)
 *   Rain Sensor → PIN 32 (analog)
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>

// ═══════════════════════════════════════════
// CONFIGURATION — UPDATE THESE VALUES
// ═══════════════════════════════════════════
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* SERVER_URL    = "http://192.168.1.100:8000/api/v1/iot/data/";
const char* JWT_TOKEN     = "YOUR_JWT_TOKEN_HERE";
const int   FARM_ID       = 1;  // Your farm ID in AgriGov

// ═══════════════════════════════════════════
// PIN DEFINITIONS
// ═══════════════════════════════════════════
#define DHTPIN     14
#define DHTTYPE    DHT11
#define SOIL_PIN   34
#define PH_PIN     35
#define RAIN_PIN   32

// ═══════════════════════════════════════════
// TIMING
// ═══════════════════════════════════════════
const unsigned long SEND_INTERVAL = 600000;  // 10 minutes in ms
unsigned long lastSendTime = 0;

DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("═══════════════════════════════════════");
  Serial.println("  AgriGov — ESP32 Sensor Module");
  Serial.println("═══════════════════════════════════════");

  // Initialize DHT sensor
  dht.begin();

  // Configure analog pins
  analogReadResolution(12);  // 12-bit ADC (0-4095)

  // Connect to WiFi
  connectWiFi();
}

void loop() {
  unsigned long now = millis();

  // Send data every SEND_INTERVAL or on first run
  if (lastSendTime == 0 || (now - lastSendTime >= SEND_INTERVAL)) {
    lastSendTime = now;

    // Reconnect WiFi if needed
    if (WiFi.status() != WL_CONNECTED) {
      connectWiFi();
    }

    // Read all sensors
    float temperature   = readTemperature();
    float humidity       = readHumidity();
    float soilMoisture  = readSoilMoisture();
    float ph            = readPH();
    String rainStatus   = readRainStatus();

    // Print to Serial Monitor
    printReadings(temperature, humidity, soilMoisture, ph, rainStatus);

    // Send to server
    sendData(temperature, humidity, soilMoisture, ph, rainStatus);
  }

  delay(1000);
}

// ═══════════════════════════════════════════
// WiFi CONNECTION
// ═══════════════════════════════════════════
void connectWiFi() {
  Serial.print("[WiFi] Connecting to ");
  Serial.print(WIFI_SSID);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.print("[WiFi] Connected! IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println();
    Serial.println("[WiFi] Connection FAILED. Will retry on next cycle.");
  }
}

// ═══════════════════════════════════════════
// SENSOR READING FUNCTIONS
// ═══════════════════════════════════════════
float readTemperature() {
  float t = dht.readTemperature();
  if (isnan(t)) {
    Serial.println("[WARN] DHT11 temperature read failed!");
    return -1;
  }
  return t;
}

float readHumidity() {
  float h = dht.readHumidity();
  if (isnan(h)) {
    Serial.println("[WARN] DHT11 humidity read failed!");
    return -1;
  }
  return h;
}

float readSoilMoisture() {
  int raw = analogRead(SOIL_PIN);
  // FC-28: 4095 = dry (air), ~1500 = wet (water)
  // Map to percentage: 0% (dry) to 100% (wet)
  float moisture = map(raw, 4095, 1500, 0, 100);
  moisture = constrain(moisture, 0, 100);
  return moisture;
}

float readPH() {
  int raw = analogRead(PH_PIN);
  float voltage = raw * (3.3 / 4095.0);
  float ph = 7.0 + ((2.5 - voltage) / 0.18);
  // Clamp to valid pH range
  ph = constrain(ph, 0.0, 14.0);
  return ph;
}

String readRainStatus() {
  int raw = analogRead(RAIN_PIN);
  if (raw > 3000) {
    return "sec";
  } else if (raw > 1500) {
    return "humide";
  } else {
    return "pluie";
  }
}

// ═══════════════════════════════════════════
// SERIAL OUTPUT
// ═══════════════════════════════════════════
void printReadings(float temp, float hum, float soil, float ph, String rain) {
  Serial.println("───────────────────────────────────────");
  Serial.println("  📊 Sensor Readings");
  Serial.println("───────────────────────────────────────");
  Serial.print("  🌡️  Temperature : "); Serial.print(temp); Serial.println(" °C");
  Serial.print("  💧 Humidity    : "); Serial.print(hum);  Serial.println(" %");
  Serial.print("  🌱 Soil Moist. : "); Serial.print(soil); Serial.println(" %");
  Serial.print("  🧪 pH          : "); Serial.println(ph);
  Serial.print("  🌧️  Rain        : "); Serial.println(rain);
  Serial.println("───────────────────────────────────────");
}

// ═══════════════════════════════════════════
// HTTP POST TO DJANGO
// ═══════════════════════════════════════════
void sendData(float temp, float hum, float soil, float ph, String rain) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[HTTP] WiFi not connected. Skipping send.");
    return;
  }

  HTTPClient http;
  http.begin(SERVER_URL);
  http.addHeader("Content-Type", "application/json");

  // Authorization header
  String authHeader = "Bearer ";
  authHeader += JWT_TOKEN;
  http.addHeader("Authorization", authHeader);

  // Build JSON payload
  StaticJsonDocument<256> doc;
  doc["farm_id"]        = FARM_ID;
  doc["temperature"]    = temp;
  doc["humidity"]       = hum;
  doc["soil_moisture"]  = soil;
  doc["ph"]             = ph;
  doc["rain_status"]    = rain;

  String payload;
  serializeJson(doc, payload);

  Serial.print("[HTTP] Sending POST to ");
  Serial.println(SERVER_URL);
  Serial.print("[HTTP] Payload: ");
  Serial.println(payload);

  int httpCode = http.POST(payload);

  if (httpCode > 0) {
    Serial.print("[HTTP] Response code: ");
    Serial.println(httpCode);
    String response = http.getString();
    Serial.print("[HTTP] Response: ");
    Serial.println(response);
  } else {
    Serial.print("[HTTP] Error: ");
    Serial.println(http.errorToString(httpCode));
  }

  http.end();
}
