import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { 
  Package, 
  Clock, 
  Plus, 
  CheckCircle2, 
  ArrowLeft, 
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { initSerial, sendCommand, onMessage, closeSerial } from '../utils/serialComm';
import { db } from '../utils/db';

export const DispensingScreen = () => {
  const { t, currentPatient, isHardwareConnected, connectHardware } = useAppContext();
  const location = useLocation();
  const navigate = useNavigate();
  const params = location.state || {};
  
  const { 
    compartment_number, 
    medicine_name, 
    quantity_dispensed, 
    session_id,
    isFirstAid 
  } = params;

  const [timeLeft, setTimeLeft] = useState(10);
  const [isCompleted, setIsCompleted] = useState(false);
  const [hardwareError, setHardwareError] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dbError, setDbError] = useState('');

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isFirstAid && !params.compartment_number) {
      navigate('/prescription');
      return;
    }

    let unsubscribe: (() => void) | null = null;

    const startFlow = async () => {
      // 1. Ensure connected
      if (!isHardwareConnected) {
        const res = await connectHardware();
        if (!res) {
          setHardwareError(true);
          return;
        }
      }

      // 2. Register listener
      unsubscribe = onMessage((msg) => {
        db.logs.add({
          timestamp: new Date().toISOString(),
          type: 'system',
          message: `HW_ACK: ${msg}`
        });
      });

      // 3. Send Commands
      try {
        if (isFirstAid) {
          await sendCommand(`OPEN_FA`);
        } else {
          await sendCommand(`OPEN_${compartment_number}`);
        }
        await sendCommand(`CAM_ON`);
      } catch (err) {
        console.error("Hardware command failed:", err);
        setHardwareError(true);
      }

      // 4. Start Timer
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    };

    startFlow();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (unsubscribe) unsubscribe();
    };
  }, [isHardwareConnected, connectHardware, compartment_number, navigate, params.compartment_number, isFirstAid]);

  const handleComplete = async () => {
    setIsProcessing(true);
    
    // 5. Send Stop Commands
    if (isFirstAid) {
      await sendCommand(`CLOSE_FA`);
    } else {
      await sendCommand(`CLOSE_${compartment_number}`);
    }
    await sendCommand(`CAM_OFF`);

    if (isFirstAid) {
      setIsCompleted(true);
      setIsProcessing(false);
      return;
    }

    try {
      // 6. DB Updates & Logging (Offline-First)
      if (!isFirstAid) {
        // Find item in local DB
        const item = await db.inventory.where('slot').equals(parseInt(compartment_number)).first();
        if (item && item.id) {
          const newCount = Math.max(0, item.count - (parseInt(quantity_dispensed) || 1));
          await db.inventory.update(item.id, { count: newCount });
        }

        // Add to local logs
        await db.logs.add({
          timestamp: new Date().toISOString(),
          type: 'dispense',
          message: `Dispensed ${quantity_dispensed} units of ${medicine_name} from slot ${compartment_number} for patient ${currentPatient?.name || 'Unknown'}`
        });
      }

      setIsCompleted(true);
    } catch (err) {
      console.error("Local DB update failed:", err);
      // Even if logging fails, we show success if hardware worked
      setIsCompleted(true); 
    } finally {
      setIsProcessing(false);
    }
  };

  const addTime = () => {
    if(!isCompleted && !isProcessing) {
       setTimeLeft((prev) => prev + 10);
    }
  };

  const handleCancel = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    handleComplete();
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="w-full h-full flex flex-col bg-brand-navy overflow-hidden font-sans relative"
    >
      {/* Background Glow */}
      <motion.div 
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className={`absolute inset-0 blur-[150px] pointer-events-none transition-colors duration-1000 ${isCompleted ? 'bg-[radial-gradient(ellipse_at_center,_var(--color-brand-success)_0%,_transparent_60%)]' : isFirstAid ? 'bg-[radial-gradient(ellipse_at_center,_var(--color-brand-danger)_0%,_transparent_60%)]' : 'bg-[radial-gradient(ellipse_at_center,_var(--color-brand-primary)_0%,_transparent_60%)]'}`} 
      />

      {hardwareError && (
        <motion.div 
          initial={{ y: -50 }}
          animate={{ y: 0 }}
          className="absolute top-0 w-full bg-brand-danger text-white p-4 flex items-center justify-center gap-3 z-50 shadow-xl"
        >
          <AlertTriangle size={24} />
          <span className="text-sm font-black uppercase tracking-widest">{t('dispensing.hardwareError')}</span>
        </motion.div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center p-12 z-10 w-full max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          {!isCompleted && !dbError ? (
            <motion.div 
              key="active"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="flex flex-col items-center text-center w-full"
            >
              <h2 className={`text-4xl font-bold mb-2 tracking-wide ${isFirstAid ? 'text-brand-danger' : 'text-text-primary'}`}>
                {isFirstAid ? t('dispensing.firstAidKit') : t('dispensing.dispensing').replace('{{medicine}}', medicine_name)}
              </h2>
              <p className={`text-xl font-bold mb-16 uppercase tracking-[0.2em] ${isFirstAid ? 'text-brand-danger/80' : 'text-brand-secondary/80'}`}>
                {isFirstAid ? t('dispensing.emergencyAccess') : t('dispensing.subtitle').replace('{{n}}', compartment_number)}
              </p>

              {/* Timer Circle */}
              <div className="relative w-[320px] h-[320px] flex items-center justify-center mb-16">
                <svg className="absolute w-full h-full rotate-[-90deg]">
                  <defs>
                    <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor={isFirstAid ? "var(--color-brand-danger)" : "var(--color-brand-secondary)"} />
                      <stop offset="100%" stopColor={isFirstAid ? "#FF5252" : "var(--color-brand-primary)"} />
                    </linearGradient>
                  </defs>
                  <circle 
                    cx="160" cy="160" r="140" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12"
                  />
                  <motion.circle 
                    cx="160" cy="160" r="140" fill="none" stroke="url(#timerGrad)" strokeWidth="12" strokeLinecap="round"
                    strokeDasharray={880}
                    animate={{ strokeDashoffset: 880 - (timeLeft / Math.max(10, timeLeft)) * 880 }}
                    transition={{ ease: "linear", duration: 1 }}
                    className={`drop-shadow-[0_0_15px_${isFirstAid ? 'rgba(255,82,82,0.5)' : 'rgba(33,150,243,0.5)'}]`}
                  />
                </svg>
                <div className="flex flex-col items-center z-10">
                  <span className="text-[80px] font-mono font-bold text-white leading-none drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
                    {timeLeft}
                  </span>
                  <span className={`text-sm font-bold uppercase tracking-[0.2em] mt-2 glow ${isFirstAid ? 'text-brand-danger' : 'text-brand-secondary'}`}>
                    Seconds
                  </span>
                </div>
              </div>

              <p className="text-xl text-text-secondary font-medium mb-12 max-w-lg">
                {isFirstAid 
                  ? t('dispensing.collectFirstAid')
                  : t('dispensing.collectInstructions')
                      .replace('{{q}}', quantity_dispensed)
                      .replace('{{m}}', medicine_name)}
              </p>

              <div className="flex gap-6">
                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  onClick={addTime}
                  disabled={isProcessing}
                  className={`h-16 px-8 rounded-full flex items-center gap-4 transition-all border-2 ${isFirstAid ? 'border-brand-danger text-brand-danger hover:bg-[rgba(255,82,82,0.1)] hover:shadow-[0_0_20px_rgba(255,82,82,0.3)]' : 'border-brand-secondary text-brand-secondary hover:bg-[rgba(0,188,212,0.1)] hover:shadow-[0_0_20px_rgba(0,188,212,0.3)]'} disabled:opacity-50`}
                >
                  <Plus size={24} />
                  <span className="text-sm font-bold uppercase tracking-widest">+10 Seconds</span>
                </motion.button>

                {isFirstAid && (
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCancel}
                    disabled={isProcessing}
                    className="h-16 px-8 rounded-full flex items-center gap-4 transition-all bg-brand-danger text-white shadow-[0_4px_15px_rgba(255,82,82,0.3)] disabled:opacity-50"
                  >
                    <AlertTriangle size={24} />
                    <span className="text-sm font-bold uppercase tracking-widest">{t('dispensing.cancel')}</span>
                  </motion.button>
                )}
              </div>
              
              {isProcessing && (
                <div className={`mt-8 flex items-center gap-3 font-bold text-sm tracking-widest uppercase glow ${isFirstAid ? 'text-brand-danger' : 'text-brand-primary'}`}>
                  <Loader2 className="animate-spin" size={20} />
                  Processing...
                </div>
              )}
            </motion.div>
          ) : dbError ? (
            <motion.div 
               key="error"
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               className="glass-card w-full p-16 flex flex-col items-center text-center shadow-[0_20px_50px_rgba(255,82,82,0.15)] border-brand-danger"
            >
              <div className="w-24 h-24 bg-[rgba(255,82,82,0.1)] text-brand-danger rounded-full flex items-center justify-center mb-8 border border-brand-danger/30">
                <AlertTriangle size={48} />
              </div>
              <h2 className="text-3xl font-bold text-text-primary mb-12">{dbError}</h2>
              <motion.button 
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate('/prescription')}
                className="h-16 px-10 bg-brand-primary text-white rounded-full text-sm font-bold tracking-widest uppercase shadow-[0_0_20px_rgba(33,150,243,0.4)]"
              >
                {t('dispensing.backToPrescription')}
              </motion.button>
            </motion.div>
          ) : (
            <motion.div 
              key="completed"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center text-center w-full"
            >
              <div className="relative w-[320px] h-[320px] flex items-center justify-center mb-16">
                 <svg className="absolute w-full h-full rotate-[-90deg]">
                  <circle cx="160" cy="160" r="140" fill="none" stroke="rgba(0,230,118,0.2)" strokeWidth="12" />
                  <motion.circle 
                    cx="160" cy="160" r="140" fill="none" stroke="var(--color-brand-success)" strokeWidth="12" strokeLinecap="round"
                    strokeDasharray={880} strokeDashoffset={0}
                    initial={{ strokeDashoffset: 880 }} animate={{ strokeDashoffset: 0 }} transition={{ duration: 1, ease: 'easeOut' }}
                    className="drop-shadow-[0_0_20px_rgba(0,230,118,0.6)]"
                  />
                </svg>
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: 'spring' }} className="z-10">
                   <div className="w-40 h-40 rounded-full bg-[rgba(0,230,118,0.1)] border border-brand-success/30 flex items-center justify-center text-brand-success shadow-[0_0_30px_rgba(0,230,118,0.3)]">
                      <CheckCircle2 size={80} strokeWidth={1.5} />
                   </div>
                </motion.div>
              </div>

              <h2 className="text-4xl font-bold text-text-primary mb-4 glow-success">{t('dispensing.success')}</h2>
              <p className="text-xl text-text-secondary font-medium mb-16 tracking-wide">{t('dispensing.closed')}</p>
              
              <motion.button 
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate(isFirstAid ? '/' : '/prescription')}
                className="h-16 px-10 bg-brand-primary hover:bg-[#1E88E5] text-white rounded-full text-sm font-bold tracking-widest uppercase shadow-[0_0_20px_rgba(33,150,243,0.5)] flex items-center gap-3 transition-colors"
              >
                <ArrowLeft size={20} strokeWidth={3} />
                {isFirstAid ? t('landing.home') : t('dispensing.backToPrescription')}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
