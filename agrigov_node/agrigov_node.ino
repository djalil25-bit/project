#include <ArduinoJson.h>
#include <DHT.h>
#include <ESP8266HTTPClient.h>
#include <ESP8266WiFi.h>
#include <WiFiClient.h>

// ======================================================
// CONFIGURATION (À MODIFIER SELON VOTRE RÉSEAU)
// ======================================================
const char *WIFI_SSID = "ZTE_2.4G_7kCSXj"; // Remplacer par votre SSID
const char *WIFI_PASSWORD = "57hHRFHT";    // Remplacer par votre mot de passe
const char *SERVER_URL = "http://192.168.1.104:8000/api/v1/iot/data/"; // Remplacer 192.168.1.X par
                                                  // l'IP de votre serveur
const char *JWT_TOKEN = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzc4MzYzMDc4LCJpYXQiOjE3NzgyNzY2NzgsImp0aSI6ImJkODZkMWVjZTE5NjRiYTNiNTM3NTg4MDdhMDIwMTc1IiwidXNlcl9pZCI6NCwidXNlciI6eyJpZCI6NCwiZnVsbF9uYW1lIjoibWVyb3VhbmUuZmFybWVyIiwiZW1haWwiOiJtZXJvdWFuZS5mYXJtZXJAZ21haWwuY29tIiwicm9sZSI6ImZhcm1lciIsInN0YXR1cyI6ImFwcHJvdmVkIiwiaXNfdmVyaWZpZWQiOmZhbHNlLCJpc19lbWFpbF92ZXJpZmllZCI6dHJ1ZSwidHJ1c3RfbGV2ZWwiOiJuZXciLCJwcm9maWxlX3BpY3R1cmUiOm51bGwsImRhc2hib2FyZF9yb3V0ZSI6Ii9mYXJtZXItZGFzaGJvYXJkIn19.3DvmEKrARhQ_7yFscCXjGugDl762-VpL2VqH1gXUQp8"; // Token JWT obtenu lors
                                                   // de la connexion
const int FARM_ID = 1;           // ID de la ferme dans la base de données
const int SEND_INTERVAL = 60000; // 10 minutes (600,000 ms)

// ======================================================
// PIN DEFINITIONS (NodeMCU Labels)

// ======================================================
// On utilise D2 (GPIO4) car D4 a souvent des interférences avec la LED intégrée
#define DHT_PIN D2
#define DHT_TYPE DHT11
#define SOIL_PIN A0  // Seule broche analogique
#define RAIN_PIN D0  // GPIO16
#define IR_PIN D5    // GPIO14
#define SOUND_PIN D7 // GPIO13

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
  // Calibration: 1023 (sec) -> 0%, 300 (immersion) -> 100%
  float percentage = map(raw, 1023, 300, 0, 100);
  return (float)constrain(percentage, 0, 100);
}

String readRainStatus() {
  // HIGH = Sec (pas de pluie), LOW = Pluie détectée
  // Note: D0 (GPIO16) a un pull-down interne, ce qui inverse la logique
  return (digitalRead(RAIN_PIN) == HIGH) ? "pluie" : "sec";
}

String readIRStatus() {
  // HIGH = Objet détecté, LOW = Libre
  return (digitalRead(IR_PIN) == HIGH) ? "detected" : "clear";
}

String readSoundStatus() {
  // HIGH = Son/Vibration détecté, LOW = Silencieux
  return (digitalRead(SOUND_PIN) == HIGH) ? "detected" : "silent";
}

void setup() {
  Serial.begin(115200);
  delay(2000);

  pinMode(RAIN_PIN, INPUT);
  pinMode(IR_PIN, INPUT);
  pinMode(SOUND_PIN, INPUT);
  pinMode(DHT_PIN, INPUT_PULLUP);  // DHT11 needs pull-up on data line

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
  // 1. Lire les capteurs
  float temp = readTemperature();
  float hum = readHumidity();
  float soil = readSoilMoisture();
  String rain = readRainStatus();
  String ir = readIRStatus();
  String sound = readSoundStatus();

  // 2. Affichage sur le Moniteur Série
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

  // 3. Envoyer vers l'API
  if (WiFi.status() == WL_CONNECTED) {
    WiFiClient client;
    HTTPClient http;

    Serial.println("Sending data to server...");
    http.begin(client, SERVER_URL);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("Authorization", JWT_TOKEN);

    // DynamicJsonDocument pour plus de flexibilité avec ArduinoJson 6/7
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
    doc["ir_status"] = ir;
    doc["sound_status"] = sound;

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
