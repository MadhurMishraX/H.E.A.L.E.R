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
import { loginPatient, loginPatientByQR, getPatientFullHistory } from '../services/dbService';
import { getHardwareConfig, updateHardwareConfig, requestWebSerialPort } from '../utils/serialComm';

export const LandingScreen = () => {
  const { t, language, setLanguage, setCurrentPatient, hwStatus, hwMode } = useAppContext();
  const isHardwareConnected = hwStatus === 'connected';
  const navigate = useNavigate();
  const [showScanner, setShowScanner] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [errorMessage, setErrorMessage] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleFirstAid = () => {
    navigate('/dispensing', { state: { isFirstAid: true } });
  };

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
      }, (error) => {});
    }
    return () => {
      if (scanner) scanner.clear().catch(err => console.error("Failed to clear scanner", err));
    };
  }, [showScanner]);

  const handleScan = async (scannedId: string) => {
    try {
      const patient = await loginPatientByQR(scannedId);
      if (patient && patient.id) {
        const fullPatient = await getPatientFullHistory(patient.id);
        setCurrentPatient(fullPatient);
        navigate('/dashboard');
      } else {
        setErrorMessage(t('landing.errorPatientNotFound'));
        setTimeout(() => setErrorMessage(''), 5000);
      }
    } catch (err) {
      setErrorMessage("Error connecting to database.");
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setErrorMessage('');
    try {
      const patient = await loginPatient(loginForm.email, loginForm.password);
      if (patient && patient.id) {
        const fullPatient = await getPatientFullHistory(patient.id);
        setCurrentPatient(fullPatient);
        navigate('/dashboard');
      } else {
        setErrorMessage(t('landing.errorLoginFailed'));
      }
    } catch (err) {
      setErrorMessage("Database error.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full h-full flex overflow-y-auto relative font-sans text-text-primary scrollbar-thin scrollbar-thumb-brand-primary"
    >
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--color-brand-card)_0%,_transparent_50%)] pointer-events-none opacity-50" />
      
      {/* Top Right Hardware Status */}
      <motion.button 
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowStatusModal(true)}
        className={`absolute top-10 right-10 flex items-center gap-3 bg-[rgba(15,32,64,0.6)] backdrop-blur-md px-6 py-4 rounded-full border z-20 transition-colors ${
          hwStatus === 'connected' ? 'border-[rgba(33,150,243,0.2)] hover:bg-[rgba(15,32,64,0.8)]' : 
          hwStatus === 'connecting' ? 'border-[rgba(255,179,0,0.2)] hover:bg-[rgba(15,32,64,0.8)]' :
          'border-[rgba(255,82,82,0.2)] hover:bg-[rgba(255,82,82,0.1)]'
        }`}
      >
        <motion.div 
          animate={hwStatus === 'connected' ? { opacity: [1, 0.3, 1] } : {}}
          transition={{ repeat: Infinity, duration: 2 }}
          className={`w-3 h-3 rounded-full ${
            hwStatus === 'connected' ? 'bg-brand-success shadow-[0_0_12px_var(--color-brand-success)]' : 
            hwStatus === 'connecting' ? 'bg-brand-warning shadow-[0_0_12px_var(--color-brand-warning)] animate-pulse' :
            'bg-brand-danger shadow-[0_0_12px_var(--color-brand-danger)] animate-pulse'
          }`} 
        />
        <span className="text-sm font-bold uppercase tracking-[1.5px] text-text-secondary whitespace-nowrap">
          {hwStatus === 'connected' ? `Hardware Ready (${hwMode})` : 
           hwStatus === 'connecting' ? 'Connecting...' : 
           'Hardware Offline'}
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
            onClick={() => setShowLoginModal(true)}
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

          {/* Button 3: First Aid */}
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleFirstAid}
            className="w-full glass-card border-l-4 border-l-brand-danger p-6 flex items-center justify-between group hover:bg-[rgba(255,82,82,0.05)] transition-colors"
          >
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 rounded-full bg-[rgba(255,82,82,0.1)] flex items-center justify-center text-brand-danger group-hover:scale-110 transition-transform">
                <Activity size={28} />
              </div>
              <span className="text-2xl font-bold text-brand-danger uppercase tracking-wider">{t('landing.dispenseFirstAid')}</span>
            </div>
            <ChevronRight className="text-text-muted group-hover:text-brand-danger transition-colors" />
          </motion.button>

          {/* Button 4: Admin Access */}
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

      {/* LOGIN MODAL */}
      <AnimatePresence>
        {showLoginModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-brand-navy/95 backdrop-blur-xl z-[100] flex items-center justify-center p-12"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass-card w-full max-w-xl p-12 relative"
            >
              <button 
                onClick={() => setShowLoginModal(false)}
                className="absolute top-6 right-6 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center hover:bg-brand-danger/20 hover:text-brand-danger transition-colors z-10"
              >
                <X size={24} />
              </button>

              <h2 className="text-3xl font-black text-white mb-8">{t('landing.returningPatient')}</h2>

              {errorMessage && (
                <div className="bg-brand-danger/10 border border-brand-danger text-brand-danger p-4 rounded-xl text-sm font-bold mb-6">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleEmailLogin} className="flex flex-col gap-6">
                <div className="flex flex-col gap-3">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">{t('landing.loginEmail')}</label>
                  <input 
                    type="email"
                    required
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                    className="h-14 px-6 bg-brand-navy rounded-xl border border-white/10 text-white focus:outline-none focus:border-brand-primary transition-all"
                  />
                </div>
                <div className="flex flex-col gap-3 text-left">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">{t('landing.loginPassword')}</label>
                  <input 
                    type="password"
                    required
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                    className="h-14 px-6 bg-brand-navy rounded-xl border border-white/10 text-white focus:outline-none focus:border-brand-primary transition-all"
                  />
                </div>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full h-16 bg-brand-primary text-white rounded-xl text-xl font-black shadow-[0_8px_24px_rgba(33,150,243,0.3)] mt-2 flex items-center justify-center gap-3"
                >
                  {isLoggingIn ? "Logging in..." : t('landing.loginBtn')}
                  {!isLoggingIn && <ChevronRight size={20} />}
                </motion.button>
              </form>

              <div className="mt-8 pt-8 border-t border-white/10 text-center">
                <button 
                  onClick={() => {
                    setShowLoginModal(false);
                    setShowScanner(true);
                  }}
                  className="text-brand-secondary font-bold flex items-center gap-2 mx-auto hover:underline"
                >
                  <QrCode size={20} />
                  {t('landing.loginScan')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
              className={`glass-card w-full max-w-lg p-10 relative border-l-4 ${isHardwareConnected ? 'border-l-brand-success' : 'border-l-brand-danger'}`}
            >
              <button 
                onClick={() => setShowStatusModal(false)}
                className="absolute top-6 right-6 w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>
              
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isHardwareConnected ? 'bg-brand-success/10 text-brand-success' : 'bg-brand-danger/10 text-brand-danger'}`}>
                  <Settings size={32} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Hardware Connection</h2>
                  <p className={isHardwareConnected ? "text-brand-success" : "text-brand-danger"}>
                    {isHardwareConnected ? 'Connected & Ready' : 'Offline / Disconnected'}
                  </p>
                </div>
              </div>

              <div className="space-y-6 mb-8 mt-8">
                <div className="space-y-3">
                  <label className="text-sm font-bold uppercase tracking-wider text-text-secondary">Connection Type</label>
                  <div className="flex gap-2">
                    {(['usb', 'wifi', 'simulated'] as const).map(type => (
                      <button
                        key={type}
                        onClick={() => {
                          const config = getHardwareConfig();
                          updateHardwareConfig(type, config.url);
                          window.location.reload(); // Reload to re-init
                        }}
                        className={`flex-1 py-3 rounded-xl font-bold transition-colors ${getHardwareConfig().type === type ? 'bg-brand-primary text-white border-2 border-brand-primary' : 'bg-brand-card text-text-secondary border-2 border-transparent hover:bg-white/5'}`}
                      >
                        {type.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {getHardwareConfig().type === 'wifi' && (
                  <div className="bg-brand-card p-5 rounded-xl border border-white/5 space-y-3">
                    <label className="text-sm font-bold uppercase tracking-wider text-text-secondary">Wi-Fi ESP32 Address</label>
                    <input 
                      type="text" 
                      defaultValue={getHardwareConfig().url}
                      onBlur={(e) => {
                         updateHardwareConfig('wifi', e.target.value);
                         window.location.reload();
                      }}
                      className="w-full bg-brand-navy border border-white/10 rounded-lg p-3 text-white focus:border-brand-primary outline-none"
                      placeholder="http://192.168.1.x or healer-esp32.local"
                    />
                    <p className="text-xs text-text-muted">Requires restarting connection. Be sure to include http://</p>
                  </div>
                )}

                {getHardwareConfig().type === 'usb' && !isHardwareConnected && (
                  <div className="bg-brand-card p-5 rounded-xl border border-white/5">
                    <button 
                      onClick={async () => {
                         const res = await requestWebSerialPort();
                         if(res.success) {
                            window.location.reload();
                         } else {
                            alert("Failed to connect: " + res.error);
                         }
                      }}
                      className="w-full py-3 bg-brand-primary hover:bg-brand-primary-light text-white rounded-lg font-bold transition-colors"
                    >
                      Connect USB Port
                    </button>
                  </div>
                )}

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
