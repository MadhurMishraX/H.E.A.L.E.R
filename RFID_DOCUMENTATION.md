# 🎴 H.E.A.L.E.R - RFID Integration Guide

This document serves as a reference for how RFID technology is integrated into the H.E.A.L.E.R system, connecting the physical hardware to the React application.

---

## 1. 🧠 Hardware Logic (Arduino Mega)
The **Arduino Mega** is the "Brain" that handles the physical card reader (`MFRC522`).

- **Polling:** Every few milliseconds, the Arduino checks for a new card.
- **Message Format:** When a card is detected, it sends a specific string over the Serial (USB/WiFi) connection:
  - `RFID_DETECTED:xxxxxxxx` (Where `xxxxxxxx` is the unique Hex ID of the card).
- **Visual Feedback:** The Arduino blinks the onboard LED **twice** to confirm it "heard" the card.

---

## 2. 🛡️ Admin Authentication
RFID acts as the first layer of security for the Admin Panel.

- **Purpose:** Physical multi-factor authentication.
- **Screen:** `AdminLoginScreen.tsx`
- **Behavior:**
  1. The screen starts in **"Scan Card"** mode.
  2. When the app receives a message starting with `RFID_DETECTED:`, it unlocks the **PIN Pad**.
  3. This ensures that only someone with the **Physical Admin Card** can even attempt to type a PIN.

---

## 3. 💳 Patient "Tap & Go" Login
RFID acts as a digital "Insurance Card" or "Patient ID" for returning users.

- **Purpose:** Instant, password-less login for patients.
- **Screen:** `LandingScreen.tsx`
- **Behavior:**
  1. If a patient is on the main Home Screen and taps their card, the app extracts the **Card ID**.
  2. It searches the local database (`Dexie`) for a patient whose `qr_code` matches that Card ID.
  3. If a match is found, the patient is **instantly logged in** and sent to their medical dashboard.

---

## 4. 🛠️ Troubleshooting (The "Secret Word")
If the RFID is showing in the console but not logging in, check the following:

1. **Prefix Match:** The React app looks for messages that **START WITH** `RFID_DETECTED:`. If the Arduino code changes this prefix, the app will become "deaf" to the card.
2. **Line Buffering:** The app uses a "Line Buffer" in `serialComm.ts`. This means it waits for a "Newline" (`\n`) from the Arduino before processing the message.
3. **Admin Step:** The Admin screen only listens for the RFID if the `step` is currently set to `rfid`.

---

## 📂 Key Files
- **Arduino:** `arduino/H.E.A.L.E.R_Mega.ino`
- **Frontend Utility:** `src/utils/serialComm.ts`
- **Admin Screen:** `src/screens/AdminLoginScreen.tsx`
- **Patient Screen:** `src/screens/LandingScreen.tsx`

---
*Created by Antigravity AI for the H.E.A.L.E.R Project* 🦾🚀
