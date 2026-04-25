import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext';
import {
  LandingScreen,
  RegistrationScreen,
  DiagnosisScreen,
  PrescriptionScreen,
  DispensingScreen,
  PatientDashboardScreen,
  AdminLoginScreen,
  AdminDashboardScreen
} from './screens';
import { Loader2 } from 'lucide-react';
import { initSerial, onMessage } from './utils/serialComm';

const MainLayout = () => {
  const [dbReady, setDbReady] = useState(false);
  const { t, setCurrentPatient, setCurrentSession, setIsHardwareConnected } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Intercept back button for Android Kiosk
    const handlePopState = (e: PopStateEvent) => {
      if (location.pathname === '/' || location.pathname === '') {
        // Do nothing, stay on landing
        window.history.pushState(null, '', '/');
      } else {
        // Clear state and force navigate to landing
        setCurrentPatient(null);
        setCurrentSession(null);
        navigate('/', { replace: true });
        window.history.pushState(null, '', '/');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [location.pathname, navigate, setCurrentPatient, setCurrentSession]);

  useEffect(() => {
    // Ping backend to check if DB is initialized
    fetch('/api/health')
      .then(res => res.json())
      .then(async data => {
        if (data.status === 'ok') {
          await initSerial();
          
          let connected = false;
          const timeoutId = setTimeout(() => {
            if (!connected) {
               setIsHardwareConnected(false);
               setDbReady(true);
            }
          }, 3000);

          onMessage((msg) => {
            if (msg.trim() === 'ARDUINO_READY') {
              connected = true;
              setIsHardwareConnected(true);
              clearTimeout(timeoutId);
              setDbReady(true);
              
              fetch('/api/logs/admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: `Hardware connected on startup [${new Date().toISOString()}]` })
              }).catch(() => {});
            }
          });
        }
      })
      .catch(err => console.error("Backend not ready yet", err));
  }, []);

  if (!dbReady) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-blue-600 text-white select-none overflow-hidden font-sans">
        <Loader2 className="w-24 h-24 mb-8 animate-spin" />
        <h1 className="text-6xl font-bold tracking-tight">H.E.A.L.E.R</h1>
        <p className="text-2xl mt-4 opacity-80">{t('loading')}</p>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen overflow-hidden bg-white text-gray-900 select-none font-sans relative">
      <Routes>
        <Route path="/" element={<LandingScreen />} />
        <Route path="/registration" element={<RegistrationScreen />} />
        <Route path="/diagnosis" element={<DiagnosisScreen />} />
        <Route path="/prescription" element={<PrescriptionScreen />} />
        <Route path="/dispensing" element={<DispensingScreen />} />
        <Route path="/dashboard" element={<PatientDashboardScreen />} />
        <Route path="/admin" element={<AdminLoginScreen />} />
        <Route path="/admin/dashboard" element={<AdminDashboardScreen />} />
      </Routes>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <MainLayout />
      </BrowserRouter>
    </AppProvider>
  );
}
