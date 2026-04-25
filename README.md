# H.E.A.L.E.R

H.E.A.L.E.R is an intelligent, hardware-integrated medicine dispensing system powered by AI, designed to run in a Kiosk mode on Android tablets connected to an Arduino Mega and ESP32-CAM.

## 1. Node.js Backend & Local Setup

The system consists of a Vite React frontend and an Express Node.js backend (`server.ts`) which manages the SQLite database, serial communication, and email services.

**Install dependencies:**
```sh
npm install
```

**Set up the environment:**
Create a `.env` file based on `.env.example`:
```env
GMAIL_USER=your_gmail_address@gmail.com
GMAIL_APP_PASSWORD=your_16_character_app_password
AI_API_KEY=your_ai_api_key
```

**Run the development server:**
```sh
npm run dev
```

**Build for production:**
```sh
npm run build
npm start
```

## 2. Hardware Setup

### Arduino Mega Firmware
The firmware for controlling the servo motors and reading RFID tags is located in `/arduino/H.E.A.L.E.R_Mega.ino`.
1. Open the Arduino IDE.
2. Install the necessary libraries: `Servo`, `SPI`, `MFRC522`.
3. Connect your hardware as documented in the `.ino` file.
4. Select Arduino Mega and flash the code via USB.

### ESP32-CAM Firmware
The camera module is triggered by the Arduino to capture photos securely. Firmware is in `/arduino/H.E.A.L.E.R_ESP32CAM.ino`.
1. Use an FTDI programmer to connect to the ESP32-CAM.
2. In Arduino IDE, select the `AI Thinker ESP32-CAM` board.
3. Flash the code (remember to short GPIO 0 to GND during flash).
4. Remove the jumper and hit Reset to start running.

### Connect Hardware to Tablet
Connect the Arduino Mega via a USB OTG cable to the tablet. The Web Serial API accessed from Chrome/Edge on the tablet will communicate directly to the Arduino.

## 3. How to Debug Serial Communication

If the text "Hardware Offline" appears in the top right corner:
1. Tap the indicator to bring up troubleshooting steps.
2. Ensure the USB cable supports data transfer, not just charging.
3. Ensure the browser has permissions to access USB/Serial devices. In Chrome, a popup appears; ensure you choose the Arduino device.
4. For deeper debugging, open the Admin Dashboard within the app and use the "Hardware Debug Log" in the Compartments tab to send and receive raw serial commands manually.
