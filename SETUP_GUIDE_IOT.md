# Guide d'Installation AgriGov IoT (NodeMCU)

Ce guide détaille la configuration de votre environnement de développement et le branchement du matériel.

## SECTION 1 — Configuration de l'IDE Arduino
1. **Installer Arduino IDE 2.x** : Téléchargez et installez la version la plus récente sur le site officiel.
2. **Ajouter l'URL du gestionnaire de cartes ESP8266** :
   - Allez dans `Fichier` → `Préférences`.
   - Dans `URL supplémentaires du gestionnaire de cartes`, ajoutez : 
     `http://arduino.esp8266.com/stable/package_esp8266com_index.json`
3. **Installer la carte ESP8266** :
   - `Outils` → `Carte` → `Gestionnaire de carte`.
   - Recherchez "esp8266" et installez "esp8266 by ESP8266 Community".
4. **Sélectionner la carte** :
   - `Outils` → `Carte` → `NodeMCU 1.0 (ESP-12E Module)`.
5. **Sélectionner le port** :
   - `Outils` → `Port` → Sélectionnez le port `COMx` correspondant.
6. **Vitesse de téléversement** : Réglez sur `115200`.

## SECTION 2 — Installation des Bibliothèques
Allez dans `Outils` → `Gérer les bibliothèques` et installez :
1. **DHT sensor library** (Adafruit) : Installez-la ainsi que la dépendance "Adafruit Unified Sensor".
2. **ArduinoJson** (Benoit Blanchon) : Installez la version **6.x**.

## SECTION 3 — Configuration du Code
1. Ouvrez `esp32_agrigov.ino` dans l'IDE.
2. Modifiez `WIFI_SSID` et `WIFI_PASSWORD` avec vos identifiants WiFi.
3. Trouvez l'IP de votre ordinateur (`ipconfig` dans CMD sous Windows) et modifiez `SERVER_URL`. Exemple : `http://192.168.1.5:8000/api/v1/iot/data/`.
4. Obtenez votre token JWT via le backend Django (login) et collez-le dans `JWT_TOKEN`.
5. Vérifiez que `FARM_ID` correspond à l'ID de votre ferme dans la base de données.

## SECTION 4 — Téléversement et Test
1. Connectez le NodeMCU au PC.
2. Cliquez sur le bouton `Téléverser` (→).
3. Une fois terminé, ouvrez le `Moniteur Série` (`Outils` → `Moniteur Série`).
4. Réglez la vitesse sur `115200 baud`.
5. Vous devriez voir les lectures s'afficher et le message `✓ Data sent successfully!`.

## SECTION 6 — Table de Câblage Complète

| Capteur | Broche Capteur | Broche NodeMCU | Note |
| :--- | :--- | :--- | :--- |
| **DHT11** | VCC | 3V | Résistance 10kΩ entre VCC et DATA |
| | GND | G | |
| | DATA | **D4** | |
| **FC-28 (Sol)** | VCC | 3V | |
| | GND | G | |
| | AO | **A0** | Seule broche analogique |
| **MH-RD (Pluie)** | VCC | 3V | |
| | GND | G | |
| | DO | **D0** | |
| **IR (Obstacle)** | VCC | 3V | |
| | GND | G | |
| | OUT | **D5** | |
| **Son/Vibr.** | VCC | 3V | |
| | GND | G | |
| | OUT | **D7** | |
