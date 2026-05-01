import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { 
  ArrowLeft, 
  Shield, 
  Rss, 
  CheckCircle2, 
  AlertCircle, 
  Delete,
  Lock,
  CreditCard
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { initSerial, onMessage, closeSerial } from '../utils/serialComm';
import { getSetting, addAdminLog } from '../services/dbService';

export const AdminLoginScreen = () => {
  const { t } = useAppContext();
  const navigate = useNavigate();

  const [step, setStep] = useState<'rfid' | 'pin'>('rfid');
  const [rfidStatus, setRfidStatus] = useState<'pending' | 'detected' | 'timeout'>('pending');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [lockoutSecs, setLockoutSecs] = useState(0);
  const [adminPin, setAdminPin] = useState('');

  const rfidTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lockoutIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const setup = async () => {
      // Get admin pin from settings
      const pinSetting = await getSetting('admin_pin');
      setAdminPin(pinSetting || '1234');

      // Init serial and listen for RFID
      await initSerial();
      onMessage((msg) => {
        if (msg.trim() === 'RFID_DETECTED' && step === 'rfid') {
          handleRfidSuccess();
        }
      });

      // Start RFID timeout
      startRfidTimeout();
    };

    setup();

    return () => {
      if (rfidTimeoutRef.current) clearTimeout(rfidTimeoutRef.current);
      if (lockoutIntervalRef.current) clearInterval(lockoutIntervalRef.current);
      closeSerial();
    };
  }, []);

  const startRfidTimeout = () => {
    if (rfidTimeoutRef.current) clearTimeout(rfidTimeoutRef.current);
    rfidStatus !== 'detected' && setRfidStatus('pending');
    
    rfidTimeoutRef.current = setTimeout(() => {
      if (step === 'rfid' && rfidStatus !== 'detected') {
        setRfidStatus('timeout');
      }
    }, 30000);
  };

  const handleRfidSuccess = () => {
    if (rfidTimeoutRef.current) clearTimeout(rfidTimeoutRef.current);
    setRfidStatus('detected');
    setTimeout(() => {
      setStep('pin');
    }, 1500);
  };

  const handleNumClick = (num: string) => {
    if (lockoutSecs > 0) return;
    if (pin.length < 4) {
      setPin(prev => prev + num);
      setError('');
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleConfirm = async () => {
    if (pin === adminPin) {
      // Log success
      await addAdminLog(`Admin login successful [${new Date().toISOString()}]`);
      navigate('/admin/dashboard');
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setPin('');
      setError(t('adminLogin.incorrectPin'));

      if (newAttempts >= 5) {
        startLockout();
      }
    }
  };

  const startLockout = () => {
    setLockoutSecs(60);
    lockoutIntervalRef.current = setInterval(() => {
      setLockoutSecs(prev => {
        if (prev <= 1) {
          clearInterval(lockoutIntervalRef.current!);
          setAttempts(0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const retryRfid = () => {
    setRfidStatus('pending');
    startRfidTimeout();
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="w-full h-full bg-brand-navy flex items-center justify-center font-sans relative overflow-hidden"
    >
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center pointer-events-none opacity-40">
        <div className="w-[800px] h-[800px] bg-[radial-gradient(circle,_var(--color-brand-card)_0%,_transparent_70%)] rounded-full blur-[100px]" />
      </div>

      {/* Back Button */}
      <motion.button 
        whileTap={{ scale: 0.9 }}
        onClick={() => navigate('/')}
        className="absolute top-10 left-10 w-16 h-16 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full flex items-center justify-center text-text-muted hover:text-white transition-colors z-20"
      >
        <ArrowLeft size={28} />
      </motion.button>

      <div className="w-full max-w-xl glass-card border border-white/10 p-16 shadow-[0_40px_100px_rgba(0,0,0,0.6)] z-10 flex flex-col items-center text-center">
        
        <div className="w-20 h-20 bg-brand-primary/10 text-brand-secondary border border-brand-secondary/30 rounded-full flex items-center justify-center mb-8 shadow-[0_0_20px_rgba(0,188,212,0.3)]">
          <Shield size={36} />
        </div>

        <h1 className="text-4xl font-bold text-text-primary mb-3 tracking-wide">{t('adminLogin.title')}</h1>
        <p className="text-sm font-bold text-text-muted uppercase tracking-[0.2em] mb-12">{t('adminLogin.subtitle')}</p>

        <AnimatePresence mode="wait">
          {step === 'rfid' ? (
            <motion.div 
              key="rfid"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="w-full flex flex-col items-center"
            >
              <div className="relative mb-12 flex flex-col items-center">
                {/* RFID Animation */}
                <div className="relative w-48 h-32 flex items-center justify-center mb-8">
                  <Rss size={64} className={`absolute right-0 ${rfidStatus === 'detected' ? 'text-brand-success glow-success' : 'text-brand-secondary glow'}`} />
                  <motion.div
                    animate={rfidStatus === 'pending' ? { x: [ -60, -20, -60 ] } : { x: -20, opacity: rfidStatus === 'detected' ? 0.5 : 1 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute left-8"
                  >
                    <CreditCard size={64} className={rfidStatus === 'detected' ? 'text-brand-success' : 'text-text-primary'} strokeWidth={1} />
                  </motion.div>
                </div>

                {rfidStatus === 'detected' && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute m-auto bg-brand-success text-brand-navy rounded-full p-2">
                    <CheckCircle2 size={40} />
                  </motion.div>
                )}
                {rfidStatus === 'timeout' && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute m-auto bg-brand-danger text-white rounded-full p-2">
                    <AlertCircle size={40} />
                  </motion.div>
                )}
              </div>

              <h2 className="text-2xl font-bold text-text-primary mb-4">
                {rfidStatus === 'detected' ? t('adminLogin.rfidDetected') : t('adminLogin.rfidTitle')}
              </h2>
              <p className="text-text-muted font-medium mb-12 max-w-sm">
                {rfidStatus === 'timeout' ? t('adminLogin.rfidTimeout') : t('adminLogin.rfidSubtitle')}
              </p>

              {rfidStatus === 'timeout' && (
                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  onClick={retryRfid}
                  className="h-16 px-10 border border-brand-primary text-brand-primary rounded-full text-sm uppercase tracking-widest font-bold hover:bg-brand-primary/10 transition-colors"
                >
                  {t('adminLogin.retry')}
                </motion.button>
              )}

              {/* Simulation Helper */}
              {process.env.NODE_ENV === 'development' && rfidStatus === 'pending' && (
                <button 
                  onClick={handleRfidSuccess}
                  className="mt-8 text-white/20 text-xs uppercase tracking-widest font-bold hover:text-white transition-colors"
                >
                  [ Simulate RFID Tap ]
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="pin"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full flex flex-col items-center max-w-sm"
            >
              {/* PIN Dots */}
              <div className="flex gap-6 mb-12 justify-center">
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className="w-6 h-6 flex items-center justify-center">
                    {pin.length > i ? (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-5 h-5 bg-brand-secondary rounded-full shadow-[0_0_10px_rgba(0,188,212,0.6)]" />
                    ) : (
                      <div className="w-5 h-5 border-2 border-text-muted rounded-full opacity-50" />
                    )}
                  </div>
                ))}
              </div>

              {error && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-brand-danger font-bold mb-8 text-sm uppercase tracking-widest"
                >
                  {error}
                </motion.p>
              )}

              {lockoutSecs > 0 && (
                <div className="bg-brand-danger/10 p-5 rounded-2xl border border-brand-danger/30 flex items-center gap-4 mb-8 text-brand-danger">
                  <Lock size={20} />
                  <span className="text-sm font-bold tracking-widest uppercase">
                    {t('adminLogin.lockout').replace('{{seconds}}', lockoutSecs.toString())}
                  </span>
                </div>
              )}

              {/* Secure Numpad */}
              <div className="grid grid-cols-3 gap-6 w-full mb-12 justify-items-center">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back'].map((key, i) => (
                  key === '' ? <div key={i} className="w-[72px] h-[72px]" /> :
                  key === 'back' ? (
                    <motion.button 
                      whileTap={{ scale: 0.9 }}
                      key={i}
                      onClick={handleBackspace}
                      className="w-[72px] h-[72px] bg-transparent border border-white/5 hover:bg-white/5 rounded-full flex items-center justify-center text-text-muted transition-colors"
                    >
                      <Delete size={24} />
                    </motion.button>
                  ) : (
                    <motion.button 
                      whileTap={{ scale: 0.9 }}
                      key={i}
                      onClick={() => handleNumClick(key)}
                      disabled={lockoutSecs > 0}
                      className="w-[72px] h-[72px] bg-brand-navy border border-brand-primary/30 hover:bg-brand-primary/10 disabled:opacity-50 rounded-full text-2xl font-mono text-white transition-colors flex items-center justify-center shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]"
                    >
                      {key}
                    </motion.button>
                  )
                ))}
              </div>

              <motion.button 
                whileTap={{ scale: 0.96 }}
                onClick={handleConfirm}
                disabled={pin.length < 4 || lockoutSecs > 0}
                className="w-full h-16 bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded-full text-sm tracking-widest uppercase font-bold shadow-[0_0_20px_rgba(33,150,243,0.3)] disabled:opacity-30 disabled:grayscale transition-all"
              >
                Confirm Access
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

    </motion.div>
  );
};
