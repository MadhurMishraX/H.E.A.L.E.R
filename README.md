# H.E.A.L.E.R (Health Empowerment & Automated Learning Environment Robot)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![SQLite](https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![Hardware](https://img.shields.io/badge/Hardware-Arduino_%7C_ESP32-blue?style=for-the-badge&logo=arduino&logoColor=white)](https://www.arduino.cc/)

H.E.A.L.E.R is a production-grade, hardware-integrated intelligent medical kiosk designed for remote health assistance and automated medicine dispensing. It leverages a custom-built **Smart Diagnosis Engine**, **Web Serial API** for hardware control, and a full-stack **SQLite + Express** architecture.

---

## 🚀 Key Features

### 🧠 Smart Diagnosis Engine (v3.0 - Redesigned)
- **4 Main tracks:** Focused on most common conditions in India:
  - **Track A:** Flu / Fever / Viral
  - **Track B:** Headache / Migraine
  - **Track C:** Stomach / Gastroenteritis / Acidity
  - **Track D:** Skin Infections / Fungal / Allergy
- **Professional Guidelines:** Integrated dosage guidelines for Adults, Children (1-12 years), and Elderly (60+).
- **Safety Overrides:** Mandatory red-flag checks for severe symptoms (e.g., meningitis signs, severe dehydration, respiratory distress).

### ⚙️ Hardware-Integrated Dispensing
- **Real-time Web Serial Control:** Communicates directly with Arduino Mega from the browser without drivers.
- **RFID-Based Secure Access:** Patients can log in using unique RFID tags or QR codes.
- **ESP32-CAM Documentation:** Captures patient/symptom photos during diagnostic sessions for remote doctor review.
- **Servo-Driven Logistics:** Precision medicine dispensing via multiple compartment silos.

### 👥 Patient Experience
- **Bi-lingual Interface:** Full localization support for **English** and **Hindi**.
- **Intuitive UI:** High-contrast, accessibility-focused design inspired by modern medical equipment using Tailwind CSS and Motion.
- **Digital Prescriptions:** Instant QR-code based prescriptions sent via email (Nodemailer integration).

### 🛡️ Admin & Analytics Dashboard
- **Inventory Management:** Real-time tracking of medicine stock in specific compartments.
- **Session Audit Logs:** Detailed history of patient sessions, diagnostic outcomes, and action results.
- **Hardware Debugger:** Low-level serial console for testing motor movements and sensor data.

---

## 🛠️ Technical Setup & Activation

### 1. Software Prerequisites
- **Node.js:** v20 or higher recommended.
- **Yarn/NPM:** For dependency management.
- **Browser:** Latest version of **Google Chrome** or **Edge** (Required for Web Serial API support).

### 2. Environment Configuration
Create a `.env` file in the root directory to activate critical services:
```env
# Email Service (Nodemailer)
GMAIL_USER=your_clinic_email@gmail.com
GMAIL_APP_PASSWORD=xxxx_xxxx_xxxx_xxxx # Generate via Google Account > App Passwords

# API Keys
GEMINI_API_KEY=your_api_key_here # For optional AI-powered analysis extensions

# Admin Access
ADMIN_PASSWORD=admin123
```

### 3. Installation Steps
```bash
# 1. Install dependencies
npm install

# 2. Start the development environment
npm run dev

# 3. Access the application
# Open http://localhost:3000 in your browser
```

### 4. Hardware Firmware Deployment
1. **Arduino Mega:**
   - Locate code in `/arduino/H.E.A.L.E.R_Mega.ino`.
   - Install `Servo`, `SPI`, `MFRC522` libraries in Arduino IDE.
   - Upload via USB.
2. **ESP32-CAM:**
   - Locate code in `/arduino/H.E.A.L.E.R_ESP32CAM.ino`.
   - Setup FTDI programmer and select `AI Thinker ESP32-CAM`.
   - Flash firmware.

---

## 🏗️ Hardware Architecture & Connection
- **Tablet to Arduino:** Connect via USB-OTG. The browser will prompt for permission to access "Arduino Mega".
- **Serial Protocol:** Uses `9600` baud rate with custom command packets (e.g., `DISPENSE:1`).
- **Indicator Status:** 
  - 🟢 **Online:** Active serial communication found.
  - 🔴 **Offline:** Check OTG connection or browser permissions.

---

## 📊 Feature Reference List
| Component | Technology | Role |
| :--- | :--- | :--- |
| **Frontend** | React 19, Motion, Tailwind | User interface & animations |
| **Backend** | Express, Node.js | API routing & Email service |
| **Database** | SQLite3 | Local storage for patients, logs, and settings |
| **Logic** | DiagnosisEngine v3 | Clinical decision support system |
| **Control** | Web Serial API | Direct browser-to-hardware data bridge |
| **Network** | Nodemailer | Automated prescription delivery |

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Developed with ❤️ by **[Madhur Mishra](https://github.com/Madhurmishrax)** & **[Nikhil Kumar Yadav](https://github.com/NikhilKY64)**.

---
Developed with a focus on medical integrity and high-availability kiosk deployment.
