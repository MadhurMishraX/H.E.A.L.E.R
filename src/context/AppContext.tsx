import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import locales from '../locales.json';
import { initSerial, onMessage, setCommunicationMode, checkWiFiConnection } from '../utils/serialComm';

type Language = 'en' | 'hi';

type Patient = any; // Will refine types in later chunks
type Session = any; // Will refine types in later chunks

interface AppContextType {
  currentPatient: Patient | null;
  currentSession: Session | null;
  language: Language;
  isHardwareConnected: boolean;
  setLanguage: (lang: Language) => void;
  setCurrentPatient: (patient: Patient | null) => void;
  setCurrentSession: (session: Session | null) => void;
  setIsHardwareConnected: (connected: boolean) => void;
  commMode: 'serial' | 'wifi';
  setCommMode: (mode: 'serial' | 'wifi') => void;
  espIp: string;
  setEspIp: (ip: string) => void;
  connectHardware: () => Promise<boolean>;
  discoverHardware: () => Promise<string | null>;
  disconnectHardware: () => Promise<void>;
  t: (path: string) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [language, setLanguage] = useState<Language>(localStorage.getItem('healer_lang') as Language || 'en');
  const [isHardwareConnected, setIsHardwareConnected] = useState<boolean>(false);
  const [commMode, setCommMode] = useState<'serial' | 'wifi'>(localStorage.getItem('healer_comm_mode') as 'serial' | 'wifi' || 'serial');
  const [espIp, setEspIp] = useState<string>(localStorage.getItem('healer_esp_ip') || 'healer.local');

  // Auto-reconnect on mount
  useEffect(() => {
    const attemptAutoConnect = async () => {
      const res = await initSerial(true);
      if (res.success) {
        onMessage((msg) => {
          if (msg.trim() === 'ARDUINO_READY') {
            setIsHardwareConnected(true);
          }
        });
      }
    };
    attemptAutoConnect();
  }, []);

  // Sync Communication Mode and IP to the utility and localStorage
  useEffect(() => {
    setCommunicationMode(commMode, espIp);
    localStorage.setItem('healer_comm_mode', commMode);
    localStorage.setItem('healer_esp_ip', espIp);
    localStorage.setItem('healer_lang', language);
  }, [commMode, espIp, language]);

  const connectHardware = async () => {
    if (commMode === 'wifi') {
      const isOk = await checkWiFiConnection();
      if (isOk) setIsHardwareConnected(true);
      return isOk;
    }

    const res = await initSerial(false);
    if (res.success) {
      onMessage((msg) => {
        if (msg.trim() === 'ARDUINO_READY') {
          setIsHardwareConnected(true);
        }
      });
      return true;
    }
    return false;
  };

  const discoverHardwareAction = async () => {
    const { discoverHardware } = await import('../utils/serialComm');
    const foundIp = await discoverHardware();
    if (foundIp) {
      setEspIp(foundIp);
      setIsHardwareConnected(true);
    }
    return foundIp;
  };

  const disconnectHardware = async () => {
    if (commMode === 'serial') {
      const { closeSerial } = await import('../utils/serialComm');
      await closeSerial();
    }
    setIsHardwareConnected(false);
    console.log("Hardware Disconnected");
  };

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
      isHardwareConnected,
      setLanguage,
      setCurrentPatient,
      setCurrentSession,
      setIsHardwareConnected,
      commMode,
      setCommMode,
      espIp,
      setEspIp,
      connectHardware,
      discoverHardware: discoverHardwareAction,
      disconnectHardware,
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
