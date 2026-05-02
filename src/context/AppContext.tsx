import React, { createContext, useContext, useState, ReactNode } from 'react';
import locales from '../locales.json';

type Language = 'en' | 'hi';

type Patient = any; // Will refine types in later chunks
type Session = any; // Will refine types in later chunks

interface AppContextType {
  currentPatient: Patient | null;
  currentSession: Session | null;
  language: Language;
  isHardwareConnected: boolean;
  hwError: string | null;
  setLanguage: (lang: Language) => void;
  setCurrentPatient: (patient: Patient | null) => void;
  setCurrentSession: (session: Session | null) => void;
  setIsHardwareConnected: (connected: boolean) => void;
  setHwError: (error: string | null) => void;
  t: (path: string) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [language, setLanguage] = useState<Language>('en');
  const [isHardwareConnected, setIsHardwareConnected] = useState<boolean>(false);
  const [hwError, setHwError] = useState<string | null>(null);

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
      hwError,
      setLanguage,
      setCurrentPatient,
      setCurrentSession,
      setIsHardwareConnected,
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
