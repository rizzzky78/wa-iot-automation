#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// Wi-Fi credentials
const char *ssid = "your_ssid";
const char *password = "your_password";

// Node.js server URL
const char *serverUrl = "http://your-server-ip:3000/api/device";

// Interval for sending data (in milliseconds)
const unsigned long interval = 10000; // 10 seconds
unsigned long previousMillis = 0;

// Pin for controlling an LED
const int ledPin = 2;

void setup()
{
  Serial.begin(115200);
  pinMode(ledPin, OUTPUT);

  // Connect to Wi-Fi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED)
  {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }
  Serial.println("Connected to WiFi");
}

void loop()
{
  unsigned long currentMillis = millis();

  // Send data at regular intervals
  if (currentMillis - previousMillis >= interval)
  {
    previousMillis = currentMillis;
    sendData();
  }

  // Check for commands from the server
  receiveControl();
}

void sendData()
{
  if (WiFi.status() == WL_CONNECTED)
  {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");

    // Create JSON object
    StaticJsonDocument<200> jsonDoc;
    jsonDoc["deviceId"] = "esp32-001";
    jsonDoc["deviceType"] = "smart_sensor";
    jsonDoc["temperature"] = random(20, 30); // Dummy temperature data

    // Serialize JSON to string
    String jsonString;
    serializeJson(jsonDoc, jsonString);

    // Send POST request
    int httpResponseCode = http.POST(jsonString);
    if (httpResponseCode > 0)
    {
      String response = http.getString();
      Serial.println("Data sent successfully: " + response);
    }
    else
    {
      Serial.println("Error sending data: " + String(httpResponseCode));
    }
    http.end();
  }
}

void receiveControl()
{
  if (WiFi.status() == WL_CONNECTED)
  {
    HTTPClient http;
    http.begin(serverUrl);
    int httpResponseCode = http.GET();
    if (httpResponseCode > 0)
    {
      String response = http.getString();
      Serial.println("Received control data: " + response);

      // Parse JSON response
      StaticJsonDocument<200> jsonDoc;
      deserializeJson(jsonDoc, response);
      const char *state = jsonDoc["payload"]["state"];

      // Control LED based on server command
      if (strcmp(state, "on") == 0)
      {
        digitalWrite(ledPin, HIGH);
      }
      else if (strcmp(state, "off") == 0)
      {
        digitalWrite(ledPin, LOW);
      }
    }
    else
    {
      Serial.println("Error receiving control data: " + String(httpResponseCode));
    }
    http.end();
  }
}
