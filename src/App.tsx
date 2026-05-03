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
  const { setCurrentPatient, setCurrentSession } = useAppContext();
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


  return (
    <div className="w-screen h-screen overflow-auto bg-white text-gray-900 select-none font-sans relative">
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
