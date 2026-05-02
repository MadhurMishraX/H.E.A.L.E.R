/*
 * H.E.A.L.E.R - ESP32-CAM Firmware
 * ---------------------------------
 * Captures photos every 2 seconds when triggered by Arduino.
 * Serves captured photos over Wi-Fi.
 * Acts as a bridge between the Web App and the Arduino Mega via Wi-Fi.
 * 
 * Hardware: AI-Thinker ESP32-CAM
 * Wiring to Arduino Mega:
 * - ESP32 GPIO 13  <-> Arduino Pin 22 (Trigger)
 * - ESP32 GPIO 1 (TX) <-> Arduino Mega RX3 (Pin 15)  [Commands & Data]
 * - ESP32 GPIO 3 (RX) <-> Arduino Mega TX3 (Pin 14)  [Commands & Data]
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
const char* WIFI_SSID = "your_ssid_here";
const char* WIFI_PASSWORD = "your_password_here";
const char* MDNS_HOSTNAME = "healer-esp32";

const int TRIGGER_PIN = 13;
const int CAPTURE_INTERVAL = 2000;

bool isCapturing = false;
unsigned long lastCaptureTime = 0;
unsigned long sessionStartTime = 0;
int photoCounter = 0;

WebServer server(80);

// Buffer for messages from Mega
String messageBuffer[10];
int msgHead = 0;
int msgTail = 0;

void addMessage(String msg) {
  messageBuffer[msgHead] = msg;
  msgHead = (msgHead + 1) % 10;
  if(msgHead == msgTail) {
    msgTail = (msgTail + 1) % 10; // Overwrite oldest
  }
}

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
  
  // Initialize Serial to Mega at 9600
  Serial.begin(9600);
  pinMode(TRIGGER_PIN, INPUT);

  // Initialize Camera
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

  esp_camera_init(&config);
  
  if (SD_MMC.begin()) {
    if (!SD_MMC.exists("/photos")) {
      SD_MMC.mkdir("/photos");
    }
  }

  // Connect Wi-Fi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int retry = 0;
  while (WiFi.status() != WL_CONNECTED && retry < 20) {
    delay(500);
    retry++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    MDNS.begin(MDNS_HOSTNAME);
    
    server.on("/ping", HTTP_GET, []() {
      server.sendHeader("Access-Control-Allow-Origin", "*");
      server.send(200, "text/plain", "ARDUINO_READY");
    });

    server.on("/command", HTTP_GET, []() {
      server.sendHeader("Access-Control-Allow-Origin", "*");
      if (server.hasArg("cmd")) {
        String cmd = server.arg("cmd");
        Serial.println(cmd); // Send to Mega
        server.send(200, "text/plain", "OK");
      } else {
        server.send(400, "text/plain", "Missing cmd param");
      }
    });

    server.on("/messages", HTTP_GET, []() {
      server.sendHeader("Access-Control-Allow-Origin", "*");
      String json = "[";
      while(msgHead != msgTail) {
        if(json != "[") json += ",";
        json += "\"" + messageBuffer[msgTail] + "\"";
        msgTail = (msgTail + 1) % 10;
      }
      json += "]";
      server.send(200, "application/json", json);
    });

    server.on("/photos", HTTP_GET, handleListPhotos);
    server.onNotFound(handlePhotoRequest);
    server.begin();
  }
}

String serialStr = "";
void loop() {
  server.handleClient();

  // Relay data from Mega to Web App Buffer
  while (Serial.available()) {
    char c = Serial.read();
    if (c == '\n') {
      serialStr.trim();
      if(serialStr.length() > 0) addMessage(serialStr);
      serialStr = "";
    } else if (c != '\r') {
      serialStr += c;
    }
  }

  int triggerStatus = digitalRead(TRIGGER_PIN);
  if (triggerStatus == HIGH) {
    if (!isCapturing) {
      isCapturing = true;
      sessionStartTime = millis();
      photoCounter = 0;
    }
    if (millis() - lastCaptureTime >= CAPTURE_INTERVAL) {
      capturePhoto();
      lastCaptureTime = millis();
    }
  } else {
    if (isCapturing) {
      isCapturing = false;
      unsigned long endTime = millis();
      saveLog(sessionStartTime, endTime, photoCounter);
    }
  }
}

void capturePhoto() {
  camera_fb_t * fb = esp_camera_fb_get();
  if (!fb) return;

  char path[64];
  sprintf(path, "/photos/%lu_%d.jpg", millis(), photoCounter);
  
  File file = SD_MMC.open(path, FILE_WRITE);
  if (file) {
    file.write(fb->buf, fb->len);
    file.close();
    photoCounter++;
  }
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

void handleListPhotos() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
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
  server.sendHeader("Access-Control-Allow-Origin", "*");
  if(server.method() == HTTP_OPTIONS) {
    server.sendHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    server.send(204);
    return;
  }
  
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
