/*
 * H.E.A.L.E.R - Arduino Uno Firmware
 * ------------------------------------
 * Controls 4 medicine compartments (servos), ESP32-CAM trigger,
 * and RFID authentication for the H.E.A.L.E.R system.
 * 
 * Hardware: Arduino Uno
 * Libraries: Servo, SPI, MFRC522
 */

#include <Servo.h>
#include <SPI.h>
#include <MFRC522.h>

// --- Configuration ---
const int SERVO_OPEN_ANGLE = 90;
const int SERVO_CLOSE_ANGLE = 0;
const int BAUD_RATE = 9600; // Reverted for better compatibility

// --- Pin Assignments (Uno Compatible) ---
const int SERVO_PINS[] = {6, 7, 8, 9, 3}; // CP 1, 2, 3, 4, FA (First Aid)
const int CAM_TRIGGER_PIN = 4;        
const int RFID_RST_PIN = 5;
const int RFID_SS_PIN = 10;           
const int LED_PIN = 13;

// --- Global Objects ---
Servo servos[5];
MFRC522 mfrc522(RFID_SS_PIN, RFID_RST_PIN);

// String buffer for serial commands
String inputString = "";

/**
 * Sends message to both USB and WiFi
 */
void broadcastMessage(String msg) {
  Serial.println(msg);   // To USB
  Serial1.println(msg);  // To ESP WiFi
}

void setup() {
  // 1. Initialize Serial (USB)
  Serial.begin(BAUD_RATE);
  
  // 2. Initialize Serial1 (WiFi/ESP Bridge)
  Serial1.begin(115200); // ESP32-CAM defaults to 115200
  
  inputString.reserve(50);

  // 3. Initialize Servos
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
  Serial.println("ARDUINO_READY");
  blinkLED(3, 100); // 3 quick blinks on start
}

void loop() {
  // A. Check for Serial Commands
  handleSerial();

  // B. Poll for RFID
  checkRFID();
}

/**
 * Handle incoming serial data from USB or WiFi
 */
void handleSerial() {
  // Check USB Serial
  while (Serial.available()) {
    char inChar = (char)Serial.read();
    if (inChar == '\n') {
      processCommand(inputString);
      inputString = "";
    } else if (inChar != '\r') {
      inputString += inChar;
    }
  }

  // Check WiFi Serial (Serial1)
  while (Serial1.available()) {
    char inChar = (char)Serial1.read();
    if (inChar == '\n') {
      processCommand(inputString);
      inputString = "";
    } else if (inChar != '\r') {
      inputString += inChar;
    }
  }
}

/**
 * Process received command string
 */
void processCommand(String cmd) {
  cmd.trim();
  
  if (cmd == "PING") {
    digitalWrite(LED_PIN, HIGH);     // Solid ON to show connection established
    Serial.println("ARDUINO_READY"); // Respond to ping
  }
  else if (cmd == "OPEN_1") { openServo(0); }
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
    Serial.println("ACK_CAM_ON");
  }
  else if (cmd == "CAM_OFF") {
    digitalWrite(CAM_TRIGGER_PIN, LOW);
    Serial.println("ACK_CAM_OFF");
  }
  
  else if (cmd == "OPEN_ALL") {
    for (int i = 0; i < 5; i++) {
      servos[i].write(SERVO_OPEN_ANGLE);
      delay(200);
    }
    Serial.println("ACK_OPEN_ALL");
  }
  else if (cmd == "CLOSE_ALL") {
    for (int i = 0; i < 5; i++) {
      servos[i].write(SERVO_CLOSE_ANGLE);
      delay(200);
    }
    Serial.println("ACK_CLOSE_ALL");
  }
  
  else if (cmd.length() > 0) {
    Serial.println("ERR_UNKNOWN_CMD");
  }
}

/**
 * Control logic for single servo open
 */
void openServo(int index) {
  servos[index].write(SERVO_OPEN_ANGLE);
  String msg = "ACK_OPEN_" + String(index + 1);
  broadcastMessage(msg);
  blinkLED(1, 200);
}

/**
 * Control logic for single servo close
 */
void closeServo(int index) {
  servos[index].write(SERVO_CLOSE_ANGLE);
  String msg = "ACK_CLOSE_" + String(index + 1);
  broadcastMessage(msg);
  blinkLED(1, 200);
}

/**
 * Control logic for First Aid servo open
 */
void openFAServo() {
  servos[4].write(SERVO_OPEN_ANGLE);
  broadcastMessage("ACK_OPEN_FA");
  blinkLED(2, 200); // 2 blinks for FA
}

/**
 * Control logic for First Aid servo close
 */
void closeFAServo() {
  servos[4].write(SERVO_CLOSE_ANGLE);
  broadcastMessage("ACK_CLOSE_FA");
  blinkLED(1, 200);
}

/**
 * Poll for RFID card presence
 */
void checkRFID() {
  // Look for new cards
  if ( ! mfrc522.PICC_IsNewCardPresent()) return;
  // Select one of the cards
  if ( ! mfrc522.PICC_ReadCardSerial()) return;

  // Signal detection
  String rfidMsg = "RFID_DETECTED:";
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    if (mfrc522.uid.uidByte[i] < 0x10) rfidMsg += "0";
    rfidMsg += String(mfrc522.uid.uidByte[i], HEX);
  }
  broadcastMessage(rfidMsg);
  
  blinkLED(2, 100);

  // Stop crypto on PICC
  mfrc522.PICC_HaltA();
  mfrc522.PCD_StopCrypto1();
}

/**
 * Helper to blink the onboard LED
 */
void blinkLED(int count, int ms) {
  for (int i = 0; i < count; i++) {
    digitalWrite(LED_PIN, HIGH);
    delay(ms);
    digitalWrite(LED_PIN, LOW);
    if (i < count - 1) delay(ms);
  }
}

