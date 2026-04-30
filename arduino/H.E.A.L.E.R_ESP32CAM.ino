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
const bool SD_ENABLED = false; // Set to true later when you insert an SD card
const char* WIFI_SSID = "HEALER_Control";
const char* WIFI_PASSWORD = "password123";

const int TRIGGER_PIN = 13;
const int CAPTURE_INTERVAL = 2000; // 2 seconds

// --- State Variables ---
String lastSerialMsg = "";
String serialBuffer = "";
bool isCapturing = false;
unsigned long lastCaptureTime = 0;
unsigned long sessionStartTime = 0;
int photoCounter = 0;

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
  if (SD_ENABLED) {
    if (!SD_MMC.begin()) {
      Serial.println("SD Card Mount Failed");
    } else {
      if (!SD_MMC.exists("/photos")) {
        SD_MMC.mkdir("/photos");
      }
    }
  }

  // 4. Initialize Wi-Fi (Connect to your Router)
  if (WIFI_ENABLED) {
    WiFi.mode(WIFI_STA);
    WiFi.disconnect();
    delay(100);

    // NEW: Scan for networks to see if the Tablet is visible
    Serial.println("Scanning for networks...");
    int n = WiFi.scanNetworks();
    Serial.printf("%d networks found\n", n);
    for (int i = 0; i < n; ++i) {
      Serial.printf("%d: %s (%d)%s\n", i + 1, WiFi.SSID(i).c_str(), WiFi.RSSI(i), (WiFi.encryptionType(i) == WIFI_AUTH_OPEN) ? " " : "*");
      delay(10);
    }

    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    Serial.print("Connecting to WiFi");
    WiFi.printDiag(Serial); // ADD THIS TO SEE WHAT IS WRONG
    
    while (WiFi.status() != WL_CONNECTED) {
      delay(500);
      Serial.print(".");
    }
    Serial.println("");
    Serial.println("WiFi connected");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());

    server.on("/photos", HTTP_GET, handleListPhotos);
    server.on("/cmd", HTTP_GET, handleWiFiCommand); 
    server.on("/getMsg", HTTP_GET, handleWiFiGetMessage);
    server.onNotFound(handlePhotoRequest);
    server.begin();

    // Start mDNS
    if (MDNS.begin("healer")) {
      Serial.println("mDNS responder started: http://healer.local");
      MDNS.addService("http", "tcp", 80);
    }
  }

  Serial.println("ESP32CAM_READY");
}

/**
 * NEW: Handles commands coming from the Web App via WiFi
 * Example: http://192.168.1.50/cmd?v=OPEN_1
 */
void handleWiFiCommand() {
  if (server.hasArg("v")) {
    String command = server.arg("v");
    
    // Relay the command to the Arduino Mega via Serial
    Serial.println(command);
    
    server.send(200, "text/plain", "ACK: " + command);
  } else {
    server.send(400, "text/plain", "ERR: No command provided");
  }
}

/**
 * NEW: Sends the last received hardware message to the Web App
 */
void handleWiFiGetMessage() {
  server.sendHeader("Access-Control-Allow-Origin", "*"); // Allow Android/Web to read data
  if (lastSerialMsg.length() > 0) {
    server.send(200, "text/plain", lastSerialMsg);
    lastSerialMsg = ""; // Clear buffer after sending
  } else {
    server.send(200, "text/plain", ""); // Empty response if no new message
  }
}

void loop() {
  if (WIFI_ENABLED) {
    server.handleClient();
  }

  // NEW: Faster, Non-blocking Read from Arduino Mega
  while (Serial.available()) {
    char c = (char)Serial.read();
    if (c == '\n') {
      serialBuffer.trim();
      if (serialBuffer.length() > 0) {
        lastSerialMsg = serialBuffer; // Save finished line to mailbox
        serialBuffer = "";            // Clear accumulator
      }
    } else if (c != '\r') {
      serialBuffer += c;
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
  if (!SD_ENABLED) return;
  
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
