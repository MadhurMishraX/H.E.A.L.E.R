import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { 
  ShieldCheck, 
  QrCode, 
  UserPlus, 
  Settings, 
  X,
  Smartphone,
  ChevronRight,
  Activity
} from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { motion, AnimatePresence } from 'motion/react';

export const LandingScreen = () => {
  const { t, language, setLanguage, setCurrentPatient, isHardwareConnected } = useAppContext();
  const navigate = useNavigate();
  const [showScanner, setShowScanner] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;

    if (showScanner) {
      scanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 400, height: 400 } },
        /* verbose= */ false
      );

      scanner.render((decodedText) => {
        handleScan(decodedText);
        scanner?.clear();
        setShowScanner(false);
      }, (error) => {
        // console.warn(error);
      });
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(err => console.error("Failed to clear scanner", err));
      }
    };
  }, [showScanner]);

  const handleScan = async (scannedId: string) => {
    try {
      const response = await fetch(`/api/admin/patients/${scannedId.replace('HEALER_PATIENT_', '')}/full`);
      if (response.ok) {
        const patient = await response.json();
        setCurrentPatient(patient);
        navigate('/dashboard');
      } else {
        setErrorMessage(t('landing.errorPatientNotFound'));
        setTimeout(() => setErrorMessage(''), 5000);
      }
    } catch (err) {
      console.error("Error fetching patient", err);
      setErrorMessage("Error connecting to server.");
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full h-full flex overflow-hidden relative font-sans text-text-primary"
    >
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--color-brand-card)_0%,_transparent_50%)] pointer-events-none opacity-50" />
      
      {/* Top Right Hardware Status */}
      <motion.button 
        whileTap={{ scale: 0.95 }}
        onClick={() => !isHardwareConnected && setShowStatusModal(true)}
        className="absolute top-10 right-10 flex items-center gap-3 bg-[rgba(15,32,64,0.6)] backdrop-blur-md px-6 py-4 rounded-full border border-[rgba(33,150,243,0.2)] z-20"
      >
        <motion.div 
          animate={isHardwareConnected ? { opacity: [1, 0.3, 1] } : {}}
          transition={{ repeat: Infinity, duration: 2 }}
          className={`w-3 h-3 rounded-full ${isHardwareConnected ? 'bg-brand-success shadow-[0_0_12px_var(--color-brand-success)]' : 'bg-brand-danger shadow-[0_0_12px_var(--color-brand-danger)] animate-pulse'}`} 
        />
        <span className="text-sm font-bold uppercase tracking-[1.5px] text-text-secondary">
          {isHardwareConnected ? 'Hardware Ready' : 'Hardware Offline'}
        </span>
      </motion.button>

      {/* LEFT HALF */}
      <div className="w-1/2 h-full flex flex-col items-center justify-center border-r border-[rgba(33,150,243,0.1)] relative z-10">
        <div className="relative mb-12">
          {/* Cyan Glow Halo */}
          <div className="absolute inset-0 bg-brand-secondary blur-[80px] opacity-15 rounded-full scale-150" />
          <motion.div 
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
            className="w-64 h-64 glass-card rounded-full flex flex-col items-center justify-center text-brand-secondary shadow-[0_0_40px_rgba(33,150,243,0.2)]"
          >
            <Activity size={80} strokeWidth={1.5} />
          </motion.div>
        </div>
        
        <h1 className="text-5xl font-black text-text-primary mb-4 relative">
          H.E.A.L.E.R
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-16 h-1 bg-brand-secondary rounded-full shadow-[0_0_10px_var(--color-brand-secondary)]" />
        </h1>
        <p className="text-xl text-text-muted mt-6 font-medium tracking-wide">
          {t('landing.tagline')}
        </p>
      </div>

      {/* RIGHT HALF */}
      <div className="w-1/2 h-full flex flex-col items-center p-16 pt-32 z-10">
        
        {/* Language Toggle */}
        <div className="flex bg-[rgba(15,32,64,0.5)] p-1.5 rounded-full mb-16 border border-[rgba(33,150,243,0.2)]">
          <button
            onClick={() => setLanguage('en')}
            className={`px-8 py-3 rounded-full text-sm font-bold tracking-widest uppercase transition-all duration-300 ${
              language === 'en' 
                ? 'bg-brand-primary text-text-primary shadow-[0_4px_12px_rgba(33,150,243,0.4)]' 
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            {t('landing.en')}
          </button>
          <button
            onClick={() => setLanguage('hi')}
            className={`px-8 py-3 rounded-full text-sm font-bold tracking-widest uppercase transition-all duration-300 ${
              language === 'hi' 
                ? 'bg-brand-primary text-text-primary shadow-[0_4px_12px_rgba(33,150,243,0.4)]' 
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            {t('landing.hi')}
          </button>
        </div>

        {/* Main Menu */}
        <div className="w-full max-w-md flex flex-col gap-6">
          
          {errorMessage && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-[rgba(255,82,82,0.1)] border border-brand-danger text-brand-danger p-4 rounded-xl text-sm font-bold text-center glow">
              {errorMessage}
            </motion.div>
          )}

          {/* Button 1: Get Started */}
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate('/registration')}
            className="w-full glass-card border-l-4 border-l-brand-secondary p-6 flex items-center justify-between group hover:bg-[rgba(33,150,243,0.05)] transition-colors"
          >
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 rounded-full bg-[rgba(0,188,212,0.1)] flex items-center justify-center text-brand-secondary group-hover:scale-110 transition-transform">
                <UserPlus size={28} />
              </div>
              <span className="text-2xl font-bold text-text-primary">{t('landing.getStarted')}</span>
            </div>
            <ChevronRight className="text-text-muted group-hover:text-brand-secondary transition-colors" />
          </motion.button>

          {/* Button 2: Returning Patient */}
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setShowScanner(true)}
            className="w-full glass-card border-l-4 border-l-brand-primary p-6 flex items-center justify-between group hover:bg-[rgba(33,150,243,0.05)] transition-colors"
          >
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 rounded-full bg-[rgba(33,150,243,0.1)] flex items-center justify-center text-brand-primary group-hover:scale-110 transition-transform">
                <QrCode size={28} />
              </div>
              <span className="text-2xl font-bold text-text-primary">{t('landing.returningPatient')}</span>
            </div>
            <ChevronRight className="text-text-muted group-hover:text-brand-primary transition-colors" />
          </motion.button>

          {/* Button 3: Admin Access */}
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate('/admin')}
            className="w-full glass-card border-l-4 border-l-text-muted p-6 flex items-center justify-between group hover:bg-[rgba(255,255,255,0.05)] transition-colors mt-4 opacity-70 hover:opacity-100"
          >
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 rounded-full bg-[rgba(255,255,255,0.05)] flex items-center justify-center text-text-muted group-hover:text-text-primary transition-colors">
                <ShieldCheck size={28} />
              </div>
              <span className="text-xl font-bold text-text-secondary">{t('landing.adminAccess')}</span>
            </div>
            <ChevronRight className="text-text-muted group-hover:text-text-primary transition-colors" />
          </motion.button>
        </div>
      </div>

      {/* QR Scanner Modal */}
      <AnimatePresence>
        {showScanner && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-brand-navy/90 backdrop-blur-xl z-[100] flex items-center justify-center p-12"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass-card w-full max-w-3xl overflow-hidden relative"
            >
              <button 
                onClick={() => setShowScanner(false)}
                className="absolute top-6 right-6 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center hover:bg-brand-danger/20 hover:text-brand-danger transition-colors z-10"
              >
                <X size={24} />
              </button>
              
              <div className="p-12 flex flex-col items-center">
                <div className="flex items-center gap-4 mb-8">
                  <Smartphone size={36} className="text-brand-primary" />
                  <h2 className="text-3xl font-bold">Scan Your Card</h2>
                </div>
                
                <div 
                  id="qr-reader" 
                  className="w-full max-w-lg aspect-[4/3] rounded-2xl overflow-hidden border-2 border-brand-primary/30 shadow-[0_0_30px_rgba(33,150,243,0.15)] bg-brand-card"
                ></div>
                
                <p className="mt-8 text-center text-text-secondary">
                  Hold your QR code card steadily in front of the camera
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hardware Status Modal */}
      <AnimatePresence>
        {showStatusModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-brand-navy/90 backdrop-blur-xl z-[100] flex items-center justify-center p-12"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card w-full max-w-lg p-10 text-center border-l-4 border-l-brand-danger"
            >
              <div className="w-20 h-20 bg-brand-danger/10 text-brand-danger rounded-full flex items-center justify-center mx-auto mb-6">
                <Settings size={40} />
              </div>
              <h2 className="text-3xl font-bold mb-4">Hardware Offline</h2>
              <p className="text-text-secondary mb-8">
                The application could not detect the Arduino hardware via USB.
              </p>
              <div className="bg-brand-card p-6 rounded-xl text-left border border-white/5 mb-8">
                <h3 className="font-bold text-text-primary mb-3 text-sm tracking-widest uppercase">Troubleshooting:</h3>
                <ul className="list-disc pl-5 text-text-muted space-y-2 text-sm">
                  <li>Ensure the USB cable is securely connected.</li>
                  <li>Check if the Arduino Mega is powered on.</li>
                  <li>Verify browser supports Web Serial API.</li>
                  <li>Restart the app or accept USB permissions.</li>
                </ul>
              </div>
              <motion.button 
                whileTap={{ scale: 0.96 }}
                onClick={() => setShowStatusModal(false)}
                className="w-full py-4 bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.15)] text-text-primary rounded-xl font-bold transition-colors"
              >
                Close
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
