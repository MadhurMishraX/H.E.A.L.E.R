/*
 * H.E.A.L.E.R - Arduino Mega Firmware
 * ------------------------------------
 * Controls 4 medicine compartments (servos), ESP32-CAM trigger,
 * and RFID authentication for the H.E.A.L.E.R system.
 * Supports commands via USB (Serial) or Wi-Fi via ESP32 (Serial1).
 * 
 * Hardware: Arduino Mega 2560
 * Libraries: Servo, SPI, MFRC522
 */

#include <Servo.h>
#include <SPI.h>
#include <MFRC522.h>

// --- Configuration ---
const int SERVO_OPEN_ANGLE = 90;
const int SERVO_CLOSE_ANGLE = 0;
const int BAUD_RATE = 9600;

// --- Pin Assignments ---
const int SERVO_PINS[] = {6, 7, 8, 9, 10}; // CP 1, 2, 3, 4, FA (First Aid)
const int CAM_TRIGGER_PIN = 22;
const int RFID_RST_PIN = 5;
const int RFID_SS_PIN = 53; // Mega SS pin
const int LED_PIN = 13;

// --- Global Objects ---
Servo servos[5];
MFRC522 mfrc522(RFID_SS_PIN, RFID_RST_PIN);

// String buffers
String inputStringUSB = "";
String inputStringESP = "";

void setup() {
  // 1. Initialize Serial (USB) and Serial1 (ESP32)
  Serial.begin(BAUD_RATE);
  Serial1.begin(BAUD_RATE); // Connected to ESP32 TX/RX
  inputStringUSB.reserve(50);
  inputStringESP.reserve(50);

  // 2. Initialize Servos
  for (int i = 0; i < 5; i++) {
    servos[i].attach(SERVO_PINS[i]);
    servos[i].write(SERVO_CLOSE_ANGLE);
  }

  // 3. Initialize CAM Trigger
  pinMode(CAM_TRIGGER_PIN, OUTPUT);
  digitalWrite(CAM_TRIGGER_PIN, LOW);

  // 4. Initialize LED
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  // 5. Initialize RFID (SPI)
  SPI.begin();
  mfrc522.PCD_Init();

  // 6. Signal Readiness
  broadcast("ARDUINO_READY");
  blinkLED(3, 100); 
}

void loop() {
  handleSerial();
  checkRFID();
}

/**
 * Handle incoming serial data from both USB and ESP32
 */
void handleSerial() {
  // Read from USB
  while (Serial.available()) {
    char inChar = (char)Serial.read();
    if (inChar == '\n') {
      processCommand(inputStringUSB);
      inputStringUSB = "";
    } else if (inChar != '\r') {
      inputStringUSB += inChar;
    }
  }

  // Read from ESP32
  while (Serial1.available()) {
    char inChar = (char)Serial1.read();
    if (inChar == '\n') {
      processCommand(inputStringESP);
      inputStringESP = "";
    } else if (inChar != '\r') {
      inputStringESP += inChar;
    }
  }
}

/**
 * Send messages to both USB and ESP32
 */
void broadcast(String msg) {
  Serial.println(msg);
  Serial1.println(msg);
}

/**
 * Process received command string
 */
void processCommand(String cmd) {
  cmd.trim();
  if(cmd.length() == 0) return;
  
  if (cmd == "OPEN_1") { openServo(0); }
  else if (cmd == "OPEN_2") { openServo(1); }
  else if (cmd == "OPEN_3") { openServo(2); }
  else if (cmd == "OPEN_4") { openServo(3); }
  else if (cmd == "OPEN_FA") { openFAServo(); }
  
  else if (cmd == "CLOSE_1") { closeServo(0); }
  else if (cmd == "CLOSE_2") { closeServo(1); }
  else if (cmd == "CLOSE_3") { closeServo(2); }
  else if (cmd == "CLOSE_4") { closeServo(3); }
  else if (cmd == "CLOSE_FA") { closeFAServo(); }
  
  else if (cmd == "CAM_ON") {
    digitalWrite(CAM_TRIGGER_PIN, HIGH);
    broadcast("ACK_CAM_ON");
  }
  else if (cmd == "CAM_OFF") {
    digitalWrite(CAM_TRIGGER_PIN, LOW);
    broadcast("ACK_CAM_OFF");
  }
  
  else if (cmd == "OPEN_ALL") {
    for (int i = 0; i < 5; i++) {
      servos[i].write(SERVO_OPEN_ANGLE);
      delay(200);
    }
    broadcast("ACK_OPEN_ALL");
  }
  else if (cmd == "CLOSE_ALL") {
    for (int i = 0; i < 5; i++) {
      servos[i].write(SERVO_CLOSE_ANGLE);
      delay(200);
    }
    broadcast("ACK_CLOSE_ALL");
  }
  
  else {
    broadcast("ERR_UNKNOWN_CMD");
  }
}

void openServo(int index) {
  servos[index].write(SERVO_OPEN_ANGLE);
  broadcast("ACK_OPEN_" + String(index + 1));
  blinkLED(1, 200);
}

void closeServo(int index) {
  servos[index].write(SERVO_CLOSE_ANGLE);
  broadcast("ACK_CLOSE_" + String(index + 1));
  blinkLED(1, 200);
}

void openFAServo() {
  servos[4].write(SERVO_OPEN_ANGLE);
  broadcast("ACK_OPEN_FA");
  blinkLED(2, 200); 
}

void closeFAServo() {
  servos[4].write(SERVO_CLOSE_ANGLE);
  broadcast("ACK_CLOSE_FA");
  blinkLED(1, 200);
}

void checkRFID() {
  if ( ! mfrc522.PICC_IsNewCardPresent()) return;
  if ( ! mfrc522.PICC_ReadCardSerial()) return;

  broadcast("RFID_DETECTED");
  blinkLED(2, 100);

  mfrc522.PICC_HaltA();
  mfrc522.PCD_StopCrypto1();
}

void blinkLED(int count, int ms) {
  for (int i = 0; i < count; i++) {
    digitalWrite(LED_PIN, HIGH);
    delay(ms);
    digitalWrite(LED_PIN, LOW);
    if (i < count - 1) delay(ms);
  }
}
