import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import locales from '../locales.json';
import { 
  initHardware, 
  onConnectionStatus, 
  onMessage, 
  getHardwareConfig, 
  getConnectionStatus 
} from '../utils/serialComm';

type Language = 'en' | 'hi';
type HardwareStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
type HardwareMode = 'usb' | 'bluetooth';

type Patient = any; // Will refine types in later chunks
type Session = any; // Will refine types in later chunks

interface AppContextType {
  currentPatient: Patient | null;
  currentSession: Session | null;
  language: Language;
  hwStatus: HardwareStatus;
  hwMode: HardwareMode | null;
  hwError: string | null;
  lastHardwareMessage: string | null;
  setLanguage: (lang: Language) => void;
  setCurrentPatient: (patient: Patient | null) => void;
  setCurrentSession: (session: Session | null) => void;
  reconnect: () => Promise<void>;
  setIsHardwareConnected: (connected: boolean) => void;
  setHwError: (error: string | null) => void;
  t: (path: string) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [language, setLanguage] = useState<Language>('en');
  
  const [hwStatus, setHwStatus] = useState<HardwareStatus>(getConnectionStatus());
  const [hwMode, setHwMode] = useState<HardwareMode | null>(getHardwareConfig().type as HardwareMode);
  const [hwError, setHwError] = useState<string | null>(null);
  const [lastHardwareMessage, setLastHardwareMessage] = useState<string | null>(null);

  // Global Hardware Handlers
  useEffect(() => {
    // 1. Initial Connection Status Sync
    const unlistenStatus = onConnectionStatus((status, error) => {
      setHwStatus(status);
      setHwMode(getHardwareConfig().type as HardwareMode);
      if (error) setHwError(error);
      else if (status === 'connected') setHwError(null);
    });

    // 2. Global Message Listener (e.g. for RFID, Emergency stops, etc.)
    const unlistenMessages = onMessage((msg) => {
      console.log(`[GLOBAL HW MESSAGE]: ${msg}`);
      setLastHardwareMessage(msg);
      // Automatically clear after a short delay so the same message can trigger again if needed
      setTimeout(() => setLastHardwareMessage(null), 100);
    });

    // 3. Auto-Init on start (Default to USB)
    initHardware('usb').then((res: any) => {
      if (res && res.success === false && res.error === 'NEEDS_USER_GESTURE') {
        setHwStatus('disconnected');
      }
    });

    return () => {
      unlistenStatus();
      unlistenMessages();
    };
  }, []);

  const reconnect = useCallback(async () => {
    setHwError(null);
    await initHardware('usb');
  }, []);

  // Simple translation helper t('landing.title')
  const t = (path: string): string => {
    const keys = path.split('.');
    let current: any = locales[language];
    for (const key of keys) {
      if (current[key] === undefined) {
        return path; // Fallback
      }
      current = current[key];
    }
    return current;
  };

  return (
    <AppContext.Provider value={{
      currentPatient,
      currentSession,
      language,
      hwStatus,
      hwMode,
      hwError,
      lastHardwareMessage,
      setLanguage,
      setCurrentPatient,
      setCurrentSession,
      reconnect,
      setIsHardwareConnected: (connected: boolean) => setHwStatus(connected ? 'connected' : 'disconnected'),
      setHwError,
      t
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
