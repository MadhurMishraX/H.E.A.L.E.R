# Kiosk Mode Setup

To run H.E.A.L.E.R in a production environment as a dedicated kiosk on an Android tablet, follow these steps to securely lock down the device:

1. **In Android Settings → Security → Device Admin** 
   Enable the app (or your kiosk wrapper browser like Fully Kiosk Browser) as a device admin. This grants it permissions to prevent the user from exiting or changing system settings.

2. **Screen Pinning** 
   Use Android's built-in Screen Pinning (`Settings → Security → Screen Pinning`) to pin the app. Once pinned, the user cannot leave the app without entering the device PIN/password.

3. **React Native Kiosk Mode**
   If this app is wrapped in a React Native shell wrapper (Capacitor/React Native Web), consider using libraries like `react-native-kiosk-mode` to gain finer programmatic control over the lock task mode.

4. **Disable the Status Bar**
   In the wrapper's `AndroidManifest.xml`, use an Android theme with `windowFullscreen` and `windowNoTitle` to hide the status bar and navigation software buttons.

5. **Prevent Back Button**
   The application already intercepts the hardware back button internally via browser history states. Pressing the back button will clear any sensitive state (current patient/session) and return to the Landing Screen without exiting the app.

6. **Prevent Home Button**
   The Home button can only be reliably disabled via Device Admin policies or by provisioning the Android tablet using a specialized MDM (Mobile Device Management) profile in single-app mode (COSU - Corporate Owned Single Use).
