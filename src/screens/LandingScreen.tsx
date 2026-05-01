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
  Activity,
  Wifi,
  Usb,
  Search,
  RefreshCw,
  Power,
  Globe,
  Signal,
  Cpu
} from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { motion, AnimatePresence } from 'motion/react';
import { loginPatient, loginPatientByQR, getPatientFullHistory } from '../services/dbService';
import { onMessage } from '../utils/serialComm';

export const LandingScreen = () => {
  const { 
    t, language, setLanguage, setCurrentPatient, 
    isHardwareConnected, setIsHardwareConnected, commMode, setCommMode, espIp, setEspIp,
    connectHardware, discoverHardware, disconnectHardware 
  } = useAppContext();
  
  const navigate = useNavigate();
  const [showScanner, setShowScanner] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [errorMessage, setErrorMessage] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);

  const handleFirstAid = () => {
    navigate('/dispensing', { state: { isFirstAid: true } });
  };

  const handleHardwareConnect = async () => {
    setIsScanning(true);
    setScanResult(null); // Reset scan result
    const success = await connectHardware();
    setIsScanning(false);
    if (success) {
      setScanResult('connected');
      setTimeout(() => setShowStatusModal(false), 1500);
    } else {
      setScanResult('failed');
    }
  };

  const handleForceConnect = () => {
    setIsScanning(false);
    setScanResult('connected');
    setIsHardwareConnected(true);
    setTimeout(() => setShowStatusModal(false), 1000);
    console.warn("[Comm] User forced connection despite ping timeout.");
  };

  const handleHardwareDiscover = async () => {
    setIsScanning(true);
    setScanResult('scanning');
    const ip = await discoverHardware();
    setIsScanning(false);
    if (ip) {
      setScanResult('found');
    } else {
      setScanResult('not_found');
    }
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

    const removeRfidListener = onMessage(async (msg) => {
      if (msg.startsWith('RFID_DETECTED:')) {
        const cardId = msg.split(':')[1];
        console.log(`[Landing] Card Tapped: ${cardId}`);
        
        // Try to login patient with this Card ID
        const patient = await loginPatientByQR(cardId);
        if (patient) {
          console.log(`[Landing] Returning Patient Found: ${patient.name}`);
          setCurrentPatient(patient);
          navigate('/patient-dashboard');
        } else {
          console.log(`[Landing] New card or no patient found for ID: ${cardId}`);
          setErrorMessage(t('login.patientNotFound'));
        }
      }
    });

    return () => {
      if (scanner) scanner.clear().catch(err => console.error("Failed to clear scanner", err));
      removeRfidListener();
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
        className="absolute top-10 right-10 flex items-center gap-3 bg-[rgba(15,32,64,0.6)] backdrop-blur-md px-6 py-4 rounded-full border border-[rgba(33,150,243,0.2)] z-20"
      >
        <motion.div 
          animate={isHardwareConnected ? { opacity: [1, 0.3, 1] } : {}}
          transition={{ repeat: Infinity, duration: 2 }}
          className={`w-3 h-3 rounded-full ${isHardwareConnected ? 'bg-brand-success shadow-[0_0_12px_var(--color-brand-success)]' : 'bg-brand-danger shadow-[0_0_12px_var(--color-brand-danger)] animate-pulse'}`} 
        />
        <span className="text-sm font-bold uppercase tracking-[1.5px] text-text-secondary">
          {isHardwareConnected ? 'Hardware Ready' : 'Hardware Setup'}
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

      {/* ADVANCED HARDWARE DASHBOARD */}
      <AnimatePresence>
        {showStatusModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-brand-navy/90 backdrop-blur-2xl z-[150] flex items-center justify-center p-8"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="glass-card w-full max-w-2xl overflow-hidden relative shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-primary animate-gradient-x" />
              
              <div className="p-10">
                <div className="flex justify-between items-start mb-10">
                  <div>
                    <h2 className="text-3xl font-black text-white mb-2 flex items-center gap-3">
                      <Cpu className="text-brand-secondary" />
                      Hardware Control
                    </h2>
                    <p className="text-text-muted font-medium">Configure and connect to your H.E.A.L.E.R machine</p>
                  </div>
                  <button 
                    onClick={() => setShowStatusModal(false)}
                    className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center hover:bg-brand-danger/20 hover:text-brand-danger transition-all"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-10">
                  <button 
                    onClick={() => setCommMode('serial')}
                    className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-4 ${commMode === 'serial' ? 'bg-brand-primary/10 border-brand-primary text-white shadow-[0_0_20px_rgba(33,150,243,0.2)]' : 'bg-white/5 border-transparent text-text-muted hover:border-white/10'}`}
                  >
                    <Usb size={32} />
                    <span className="font-bold tracking-widest uppercase text-xs">USB Serial</span>
                  </button>
                  <button 
                    onClick={() => setCommMode('wifi')}
                    className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-4 ${commMode === 'wifi' ? 'bg-brand-secondary/10 border-brand-secondary text-white shadow-[0_0_20px_rgba(0,188,212,0.2)]' : 'bg-white/5 border-transparent text-text-muted hover:border-white/10'}`}
                  >
                    <Wifi size={32} />
                    <span className="font-bold tracking-widest uppercase text-xs">WiFi (ESP32)</span>
                  </button>
                </div>

                {commMode === 'wifi' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mb-10 p-6 bg-white/5 rounded-2xl border border-white/10"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <Globe size={20} className="text-brand-secondary" />
                      <span className="text-xs font-bold uppercase tracking-widest text-text-secondary">Machine Network Address</span>
                    </div>
                    <div className="flex gap-3">
                      <input 
                        type="text"
                        value={espIp}
                        onChange={(e) => setEspIp(e.target.value)}
                        placeholder="e.g. 192.168.1.10 or healer.local"
                        className="flex-1 h-14 bg-brand-navy/50 border border-white/10 rounded-xl px-5 text-white font-mono focus:border-brand-secondary outline-none transition-all"
                      />
                      <button 
                        onClick={handleHardwareDiscover}
                        disabled={isScanning}
                        className="w-14 h-14 bg-brand-secondary text-brand-navy rounded-xl flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50"
                      >
                        {isScanning ? <RefreshCw size={24} className="animate-spin" /> : <Search size={24} />}
                      </button>
                    </div>
                    
                    {scanResult === 'failed' && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 p-5 rounded-xl bg-brand-danger/10 border border-brand-danger/30 text-center"
                      >
                        <p className="text-xs text-brand-danger font-black mb-3 uppercase tracking-wider">
                          Machine Connection Timed Out!
                        </p>
                        <p className="text-[10px] text-text-secondary/70 mb-4 leading-relaxed font-medium">
                          1. Check if Tablet & Machine are on the same WiFi. <br/>
                          2. Check <b>Serial Monitor</b> in Arduino IDE for the real IP.
                        </p>
                        <button 
                          onClick={handleForceConnect}
                          className="w-full py-3 rounded-lg border border-brand-danger/50 text-brand-danger text-[10px] font-black uppercase hover:bg-brand-danger hover:text-white transition-all"
                        >
                          I'm sure the IP is correct (Force Connect)
                        </button>
                      </motion.div>
                    )}
                  </motion.div>
                )}

                <div className="flex gap-4">
                  {isHardwareConnected ? (
                    <button 
                      onClick={disconnectHardware}
                      className="flex-1 h-16 bg-brand-danger/10 text-brand-danger border border-brand-danger/30 rounded-xl font-black uppercase tracking-[2px] flex items-center justify-center gap-3 hover:bg-brand-danger/20 transition-all"
                    >
                      <Power size={20} />
                      Disconnect
                    </button>
                  ) : (
                    <button 
                      onClick={handleHardwareConnect}
                      disabled={isScanning}
                      className="flex-1 h-16 bg-brand-primary text-white rounded-xl font-black uppercase tracking-[2px] flex items-center justify-center gap-3 shadow-[0_10px_25px_rgba(33,150,243,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      {isScanning ? <RefreshCw size={24} className="animate-spin" /> : <Signal size={24} />}
                      {isScanning ? 'Connecting...' : 'Connect Hardware'}
                    </button>
                  )}
                </div>
              </div>

              {/* Status Footer */}
              <div className="bg-white/5 p-6 flex items-center justify-between border-t border-white/5">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${isHardwareConnected ? 'bg-brand-success animate-pulse' : 'bg-brand-danger'}`} />
                  <span className="text-[10px] font-black uppercase tracking-[2px] text-text-muted">System Status: {isHardwareConnected ? 'READY' : 'WAITING'}</span>
                </div>
                <span className="text-[10px] font-black uppercase tracking-[2px] text-text-muted">H.E.A.L.E.R v3.0</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
