#include <ArduinoJson.h>
#include <DHT.h>
#include <ESP8266HTTPClient.h>
#include <ESP8266WiFi.h>
#include <WiFiClient.h>

// ======================================================
// CONFIGURATION (MODIFY TO MATCH YOUR NETWORK)
// ======================================================
const char *WIFI_SSID = "iPhone de merouane"; // Replace with your SSID
const char *WIFI_PASSWORD = "12345677";    // Replace with your password
const char *SERVER_URL = "http://172.20.10.13:8000/api/v1/iot/data/"; // Replace 192.168.1.X with
                                                  // your server IP
const char *JWT_TOKEN = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzc5MzgyNDM2LCJpYXQiOjE3NzkyOTYwMzYsImp0aSI6ImQzY2ZjNmEwNGFmZDRlMjFhOWI5NzU0Y2Y2NzY2MDQ5IiwidXNlcl9pZCI6NCwidXNlciI6eyJpZCI6NCwiZnVsbF9uYW1lIjoibWVyb3VhbmUuZmFybWVyIiwiZW1haWwiOiJtZXJvdWFuZS5mYXJtZXJAZ21haWwuY29tIiwicm9sZSI6ImZhcm1lciIsInN0YXR1cyI6ImFwcHJvdmVkIiwiaXNfdmVyaWZpZWQiOmZhbHNlLCJpc19lbWFpbF92ZXJpZmllZCI6dHJ1ZSwiY2FuY2VsbGF0aW9uX2NvdW50IjowLCJzdXNwZW5kZWRfdW50aWwiOm51bGwsInByb2ZpbGVfcGljdHVyZSI6Ii9tZWRpYS9wcm9maWxlcy9mYXJtZXIuYXZpZiIsImRhc2hib2FyZF9yb3V0ZSI6Ii9mYXJtZXItZGFzaGJvYXJkIn19.0fmkzhc99uFjWt6T5QW9lfKNylFEiGgqX2zVJbe0FnM"; // JWT token obtained
                                                   // at login
const int FARM_ID = 1;           // Farm ID in the database
const int SEND_INTERVAL = 60000; // 1 minute (60,000 ms)

// ======================================================
// PIN DEFINITIONS (NodeMCU Labels)
// ======================================================
// Using D2 (GPIO4) because D4 often has interference with the onboard LED
#define DHT_PIN D2
#define DHT_TYPE DHT11
#define SOIL_PIN A0  // Only analog pin
#define RAIN_PIN D0  // GPIO16
#define IR_PIN D5    // GPIO14
#define SOUND_PIN D7 // GPIO13

// ======================================================
// SENSOR CONNECTION FLAGS
// Set to false if the sensor is NOT physically connected.
// This prevents floating pin noise from generating false data.
// ======================================================
#define IR_SENSOR_CONNECTED false
#define SOUND_SENSOR_CONNECTED false

DHT dht(DHT_PIN, DHT_TYPE);

// ======================================================
// SENSOR READING FUNCTIONS
// ======================================================

float readTemperature() {
  for (int i = 0; i < 5; i++) {
    float t = dht.readTemperature();
    if (!isnan(t)) return t;
    Serial.printf("  DHT11 temp attempt %d/5 failed...\n", i + 1);
    delay(2000);
  }
  return -99.0;
}

float readHumidity() {
  for (int i = 0; i < 5; i++) {
    float h = dht.readHumidity();
    if (!isnan(h)) return h;
    Serial.printf("  DHT11 hum attempt %d/5 failed...\n", i + 1);
    delay(2000);
  }
  return -99.0;
}

float readSoilMoisture() {
  int raw = analogRead(SOIL_PIN); // 0 - 1023
  // Calibration: 1023 (dry) -> 0%, 300 (submerged) -> 100%
  float percentage = map(raw, 1023, 300, 0, 100);
  return (float)constrain(percentage, 0, 100);
}

String readRainStatus() {
  // HIGH = Dry (no rain), LOW = Rain detected
  // Note: D0 (GPIO16) has an internal pull-down, which inverts the logic
  return (digitalRead(RAIN_PIN) == HIGH) ? "dry" : "rain";
}

String readIRStatus() {
  if (!IR_SENSOR_CONNECTED) return "disconnected";
  // LOW = Object detected, HIGH = Clear
  return (digitalRead(IR_PIN) == LOW) ? "detected" : "clear";
}

String readSoundStatus() {
  if (!SOUND_SENSOR_CONNECTED) return "disconnected";
  // HIGH = Sound/Vibration detected, LOW = Silent
  return (digitalRead(SOUND_PIN) == HIGH) ? "detected" : "silent";
}

void setup() {
  Serial.begin(115200);
  delay(2000);

  pinMode(RAIN_PIN, INPUT);
  pinMode(IR_PIN, INPUT_PULLUP);    // Pull-up: unconnected pin reads HIGH (clear)
  pinMode(SOUND_PIN, INPUT_PULLUP); // Pull-up: unconnected pin reads HIGH (silent)
  pinMode(DHT_PIN, INPUT_PULLUP);   // DHT11 needs pull-up on data line

  dht.begin();
  delay(3000);  // DHT11 needs 2-3s warm-up
  dht.begin();  // Re-initialize after warm-up

  Serial.println("\n\n================================");
  Serial.println("AgriGov IoT Node Starting...");
  Serial.println("================================");

  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int retry = 0;
  while (WiFi.status() != WL_CONNECTED && retry < 20) {
    delay(1000);
    Serial.print(".");
    retry++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi Connected!");
    Serial.print("Local IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nWiFi Connection Failed! Will retry in loop.");
  }
}

void loop() {
  // 1. Read sensors
  float temp = readTemperature();
  float hum = readHumidity();
  float soil = readSoilMoisture();
  String rain = readRainStatus();
  String ir = readIRStatus();
  String sound = readSoundStatus();

  // 2. Display on Serial Monitor
  Serial.println("\n--- [ Sensor Data ] ---");
  if (temp == -99.0) {
    Serial.println("DHT11: Error reading sensor!");
  } else {
    Serial.printf("Temperature: %.1f °C\n", temp);
    Serial.printf("Humidity   : %.1f %%\n", hum);
  }
  Serial.printf("Soil Moist.: %.1f %%\n", soil);
  Serial.printf("Rain Status: %s\n", rain.c_str());
  Serial.printf("IR Status  : %s\n", ir.c_str());
  Serial.printf("Sound Stat.: %s\n", sound.c_str());
  Serial.println("-----------------------");

  // 3. Send to API
  if (WiFi.status() == WL_CONNECTED) {
    WiFiClient client;
    HTTPClient http;

    Serial.println("Sending data to server...");
    http.begin(client, SERVER_URL);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("Authorization", JWT_TOKEN);

    // StaticJsonDocument for ArduinoJson 6/7 compatibility
    StaticJsonDocument<512> doc;
    doc["farm_id"] = FARM_ID;

    if (temp != -99.0) {
      doc["temperature"] = temp;
      doc["humidity"] = hum;
    } else {
      doc["temperature"] = nullptr;
      doc["humidity"] = nullptr;
    }

    doc["soil_moisture"] = soil;
    doc["rain_status"] = rain;

    // Only send IR/Sound data if sensors are connected
    if (IR_SENSOR_CONNECTED) {
      doc["ir_status"] = ir;
    } else {
      doc["ir_status"] = nullptr;
    }

    if (SOUND_SENSOR_CONNECTED) {
      doc["sound_status"] = sound;
    } else {
      doc["sound_status"] = nullptr;
    }

    String jsonStr;
    serializeJson(doc, jsonStr);

    int httpCode = http.POST(jsonStr);

    if (httpCode == 201 || httpCode == 200) {
      Serial.println("✓ Data sent successfully!");
    } else {
      Serial.printf("✗ Error sending data (HTTP %d)\n", httpCode);
      if (httpCode < 0) {
        Serial.printf("  Reason: %s\n", http.errorToString(httpCode).c_str());
      }
    }
    http.end();
  } else {
    Serial.println("WiFi disconnected! Attempting to reconnect...");
    WiFi.reconnect();
  }

  Serial.printf("Waiting %d minutes for next reading...\n",
                SEND_INTERVAL / 60000);
  delay(SEND_INTERVAL);
}
