/*
 * H.E.A.L.E.R - ESP32-CAM Firmware
 * ---------------------------------
 * Captures photos every 2 seconds when triggered by Arduino.
 * Serves captured photos over a local Wi-Fi web server.
 * 
 * Hardware: AI-Thinker ESP32-CAM
 * Wiring to Arduino Mega:
 * - ESP32 GPIO 13  <-> Arduino Pin 22 (Trigger)
 * - ESP32 GND      <-> Arduino GND
 * - ESP32 5V       <-> Arduino 5V
 */

#include "esp_camera.h"
#include "Arduino.h"
#include "FS.h"
#include "SD_MMC.h"
#include "soc/soc.h"
#include "soc/rtc_cntl_reg.h"
#include "driver/rtc_io.h"
#include <WiFi.h>
#include <WebServer.h>
#include <ESPmDNS.h>

// --- Configuration ---
const bool WIFI_ENABLED = true;
// Replace these with your actual WiFi credentials
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

const int TRIGGER_PIN = 13;
const int CAPTURE_INTERVAL = 2000; // 2 seconds

// --- State Variables ---
bool isCapturing = false;
unsigned long lastCaptureTime = 0;
unsigned long sessionStartTime = 0;
int photoCounter = 0;

// Communication queues
String messageQueue[10];
int msgHead = 0;
int msgTail = 0;

WebServer server(80);

// --- AI-Thinker Camera Pinout ---
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27
#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

void setup() {
  WRITE_PERI_REG(RTC_CNTL_BROWN_OUT_REG, 0); // Disable brownout detector
  
  Serial.begin(115200);
  Serial.setDebugOutput(true);
  Serial.println();

  // 1. Initialize Trigger Pin
  pinMode(TRIGGER_PIN, INPUT);

  // 2. Initialize Camera
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sscb_sda = SIOD_GPIO_NUM;
  config.pin_sscb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;

  if (psramFound()) {
    config.frame_size = FRAMESIZE_UXGA;
    config.jpeg_quality = 10;
    config.fb_count = 2;
  } else {
    config.frame_size = FRAMESIZE_SVGA;
    config.jpeg_quality = 12;
    config.fb_count = 1;
  }

  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed with error 0x%x", err);
    return;
  }

  // 3. Initialize SD Card
  if (!SD_MMC.begin()) {
    Serial.println("SD Card Mount Failed");
    return;
  }

  // Create photos directory
  if (!SD_MMC.exists("/photos")) {
    SD_MMC.mkdir("/photos");
  }

  // 4. Initialize Wi-Fi and Server
  if (WIFI_ENABLED) {
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    while (WiFi.status() != WL_CONNECTED) {
      delay(500);
      Serial.print(".");
    }
    Serial.println("");
    Serial.println("WiFi connected");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());

    if (!MDNS.begin("healer-esp32")) {
      Serial.println("Error setting up MDNS responder!");
    } else {
      Serial.println("mDNS responder started: healer-esp32.local");
    }

    // Configure CORS headers for all responses
    server.on("/ping", HTTP_GET, []() {
      server.sendHeader("Access-Control-Allow-Origin", "*");
      server.send(200, "text/plain", "pong");
    });

    server.on("/command", HTTP_GET, []() {
      server.sendHeader("Access-Control-Allow-Origin", "*");
      if (server.hasArg("cmd")) {
        String cmd = server.arg("cmd");
        // Forward command to Arduino Mega via Serial1
        Serial1.println(cmd);
        Serial.println("Forwarded to Mega: " + cmd);
        server.send(200, "text/plain", "OK");
      } else {
        server.send(400, "text/plain", "Missing cmd param");
      }
    });

    server.on("/messages", HTTP_GET, []() {
      server.sendHeader("Access-Control-Allow-Origin", "*");
      String json = "[";
      bool first = true;
      while (msgHead != msgTail) {
        if (!first) json += ",";
        json += "\"" + messageQueue[msgTail] + "\"";
        msgTail = (msgTail + 1) % 10;
        first = false;
      }
      json += "]";
      server.send(200, "application/json", json);
    });

    server.on("/photos", HTTP_GET, handleListPhotos);
    server.onNotFound(handlePhotoRequest);
    server.begin();
  }

  // Initialize Serial1 for communication with Mega
  // ESP32 RX = GPIO 3 (RX0) or define custom. We'll use standard Serial1 if reassigned, but usually:
  // Assuming Mega is connected to ESP32 pins 12, 14 or similar. Adjust as needed.
  // Using standard pins for Serial1 (RX=9, TX=10) on some boards, but for ESP32CAM we carefully pick pins.
  // Actually, GPIO 1 and 3 are standard Serial.
  // Let's use GPIO 14 (TX) and 15 (RX) for Serial1
  Serial1.begin(9600, SERIAL_8N1, 15, 14);

  Serial.println("ESP32CAM_READY");
}

void loop() {
  if (WIFI_ENABLED) {
    server.handleClient();
  }

  // Read incoming messages from Arduino Mega
  if (Serial1.available()) {
    String msg = Serial1.readStringUntil('\n');
    msg.trim();
    if (msg.length() > 0) {
      Serial.println("From Mega: " + msg);
      messageQueue[msgHead] = msg;
      msgHead = (msgHead + 1) % 10;
      if (msgHead == msgTail) { // Queue full, drop oldest
        msgTail = (msgTail + 1) % 10;
      }
    }
  }

  int triggerStatus = digitalRead(TRIGGER_PIN);

  if (triggerStatus == HIGH) {
    if (!isCapturing) {
      // Start new capture session
      isCapturing = true;
      sessionStartTime = millis();
      photoCounter = 0;
      Serial.println("Capture Session Started");
    }

    // Capture every 2 seconds
    if (millis() - lastCaptureTime >= CAPTURE_INTERVAL) {
      capturePhoto();
      lastCaptureTime = millis();
    }
  } else {
    if (isCapturing) {
      // End capture session
      isCapturing = false;
      unsigned long endTime = millis();
      saveLog(sessionStartTime, endTime, photoCounter);
      Serial.println("Capture Session Ended");
    }
  }
}

void capturePhoto() {
  camera_fb_t * fb = NULL;
  fb = esp_camera_fb_get();
  if (!fb) {
    Serial.println("Camera capture failed");
    return;
  }

  char path[64];
  sprintf(path, "/photos/%lu_%d.jpg", millis(), photoCounter);
  
  File file = SD_MMC.open(path, FILE_WRITE);
  if (!file) {
    Serial.println("Failed to open file for writing");
  } else {
    file.write(fb->buf, fb->len);
    Serial.printf("Saved: %s\n", path);
    photoCounter++;
  }
  file.close();
  esp_camera_fb_return(fb);
}

void saveLog(unsigned long start, unsigned long end, int count) {
  char logPath[64];
  sprintf(logPath, "/photos/log_%lu.txt", start);
  File file = SD_MMC.open(logPath, FILE_WRITE);
  if (file) {
    file.printf("Session Start: %lu\n", start);
    file.printf("Session End: %lu\n", end);
    file.printf("Photos Captured: %d\n", count);
    file.close();
  }
}

// --- Server Handlers ---

void handleListPhotos() {
  String json = "[";
  File root = SD_MMC.open("/photos");
  if (root) {
    File file = root.openNextFile();
    while (file) {
      if (json != "[") json += ",";
      json += "\"" + String(file.name()) + "\"";
      file = root.openNextFile();
    }
    root.close();
  }
  json += "]";
  server.send(200, "application/json", json);
}

void handlePhotoRequest() {
  String path = server.uri();
  if (!path.startsWith("/photos/")) {
    server.send(404, "text/plain", "Not Found");
    return;
  }

  File file = SD_MMC.open(path, FILE_READ);
  if (!file) {
    server.send(404, "text/plain", "File Not Found");
    return;
  }

  server.streamFile(file, "image/jpeg");
  file.close();
}
