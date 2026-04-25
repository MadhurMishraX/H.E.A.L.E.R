import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Calendar, 
  Mail as MailIcon, 
  Clock, 
  Stethoscope, 
  AlertCircle,
  CheckCircle2,
  Package,
  Plus,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeDisplay } from '../utils/qrUtils';
import { sendQRCodeEmail } from '../services/emailService';
import QRCode from 'qrcode';

export const PatientDashboardScreen = () => {
  const { t, currentPatient, setCurrentPatient } = useAppContext();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentPatient) {
      navigate('/');
      return;
    }

    const fetchHistory = async () => {
      try {
        const response = await fetch(`/api/admin/patients/${currentPatient.id}/full`);
        const data = await response.json();
        setSessions(data.sessions || []);
      } catch (err) {
        console.error("Failed to fetch visit history", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [currentPatient, navigate]);

  const handleBack = () => {
    setCurrentPatient(null);
    navigate('/');
  };

  const handleEmailQR = async () => {
    if (!currentPatient) return;
    try {
      const qrDataUrl = await QRCode.toDataURL(`HEALER_PATIENT_${currentPatient.id}`);
      await sendQRCodeEmail(currentPatient, qrDataUrl);
      alert(t('prescription.reportSent'));
    } catch (err) {
      alert(t('prescription.reportFailed'));
    }
  };

  if (!currentPatient) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="w-full h-full bg-brand-navy flex flex-col overflow-hidden font-sans text-text-primary"
    >
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none">
         <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-[radial-gradient(ellipse_at_center,_var(--color-brand-card)_0%,_transparent_60%)] blur-[100px] opacity-60" />
      </div>

      {/* Header Bar */}
      <div className="px-10 h-24 flex justify-between items-center z-30 border-b border-white/10 bg-brand-navy/80 backdrop-blur-xl">
        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={handleBack}
          className="flex items-center gap-3 text-text-muted hover:text-white transition-colors bg-white/5 hover:bg-white/10 py-3 px-6 rounded-full border border-white/10"
        >
          <ArrowLeft size={24} />
          <span className="text-sm font-bold uppercase tracking-widest">{t('adminLogin.back')}</span>
        </motion.button>
        
        <h1 className="text-2xl font-bold tracking-wide">{t('dashboard.title')}</h1>
        
        <div className="flex items-center gap-4 bg-[rgba(33,150,243,0.1)] border border-brand-primary/30 px-6 py-2.5 rounded-full">
          <div className="w-8 h-8 bg-brand-primary rounded-full flex items-center justify-center text-white shadow-[0_0_10px_rgba(33,150,243,0.5)]">
            <User size={16} />
          </div>
          <span className="text-sm font-bold text-white tracking-wide">{currentPatient.name}</span>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden p-8 gap-8 relative z-20">
        
        {/* Left Panel: Profile */}
        <div className="w-[400px] glass-card flex flex-col overflow-y-auto p-1px">
          <div className="p-10 flex flex-col">
            <div className="flex flex-col items-center border-b border-white/10 pb-10 mb-10">
              <div className="w-32 h-32 bg-[rgba(0,188,212,0.1)] border border-brand-secondary/30 rounded-full flex items-center justify-center text-brand-secondary mb-6 shadow-[0_0_30px_rgba(0,188,212,0.2)]">
                <User size={48} />
              </div>
              <h2 className="text-3xl font-bold text-white mb-3 text-center">{currentPatient.name}</h2>
              <p className="text-sm text-brand-secondary font-bold uppercase tracking-widest">
                {currentPatient.age} Y <span className="opacity-50 mx-2">•</span> {currentPatient.gender}
              </p>
            </div>

            <div className="space-y-8 mb-12">
              <div className="flex items-center gap-5 text-text-muted">
                <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <Mail className="text-text-secondary" size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mb-1">Email Account</span>
                  <span className="text-base font-bold text-white">{currentPatient.email}</span>
                </div>
              </div>
              <div className="flex items-center gap-5 text-text-muted">
                <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <Calendar className="text-text-secondary" size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mb-1">Registration Date</span>
                  <span className="text-base font-mono font-bold text-white">{new Date(currentPatient.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center gap-6 p-8 bg-[rgba(255,255,255,0.02)] border border-white/5 rounded-3xl mb-12">
               <div className="p-4 bg-white rounded-2xl shadow-xl">
                 <QRCodeDisplay qrString={`HEALER_PATIENT_${currentPatient.id}`} />
               </div>
               <motion.button 
                 whileTap={{ scale: 0.95 }}
                 onClick={handleEmailQR}
                 className="w-full h-14 border border-brand-secondary hover:bg-[rgba(0,188,212,0.1)] text-brand-secondary rounded-full text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-3 transition-all"
               >
                 <MailIcon size={18} />
                 {t('dashboard.emailQR')}
               </motion.button>
            </div>
            
            <div className="mt-auto">
              <motion.button 
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/diagnosis')}
                className="w-full h-20 bg-gradient-to-r from-brand-primary to-[#00BCD4] text-white rounded-[28px] text-lg font-bold uppercase tracking-widest shadow-[0_10px_30px_rgba(33,150,243,0.4)] hover:shadow-[0_10px_40px_rgba(33,150,243,0.6)] flex items-center justify-center gap-4 transition-all"
              >
                <Plus size={24} strokeWidth={3} />
                {t('dashboard.startDiagnosis')}
              </motion.button>
            </div>

          </div>
        </div>

        {/* Right Panel: History */}
        <div className="flex-1 overflow-y-auto pr-2 flex flex-col pb-8">
          <h3 className="text-sm font-bold text-text-muted uppercase tracking-[0.2em] mb-8 px-4">{t('dashboard.subtitle')}</h3>

          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-6 text-brand-secondary">
              <Loader2 className="animate-spin" size={64} strokeWidth={1.5} />
              <span className="text-sm font-bold uppercase tracking-widest glow">Loading Medical Records...</span>
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 text-center px-20">
              <div className="w-40 h-40 bg-[rgba(255,255,255,0.02)] border border-white/5 rounded-full flex items-center justify-center text-text-muted mb-8">
                <Stethoscope size={64} strokeWidth={1} />
              </div>
              <p className="text-xl text-text-secondary font-medium max-w-sm leading-relaxed tracking-wide">
                {t('dashboard.noVisits')}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <AnimatePresence>
                {sessions.map((session, idx) => (
                  <motion.div 
                    key={session.id}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                    className="glass-card p-10 flex flex-col gap-10 hover:bg-[rgba(15,32,64,0.7)] transition-colors"
                  >
                    <div className="flex justify-between items-start border-b border-white/10 pb-8">
                      <div className="flex gap-8 items-center">
                        <div className="text-center min-w-[100px] border-r border-white/10 pr-8">
                          <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">{new Date(session.timestamp).toLocaleDateString()}</p>
                          <p className="text-3xl font-mono font-bold text-white">{new Date(session.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        <div>
                          <h4 className="text-3xl font-bold text-brand-secondary mb-3">{session.diagnosed_disease}</h4>
                          <div className="flex items-center gap-3">
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.1em] border ${
                              session.confidence_score >= 80 ? 'bg-[rgba(0,230,118,0.1)] text-brand-success border-brand-success/30' : 
                              session.confidence_score >= 60 ? 'bg-[rgba(255,179,0,0.1)] text-brand-warning border-brand-warning/30' : 
                              'bg-[rgba(255,82,82,0.1)] text-brand-danger border-brand-danger/30'
                            }`}>
                              Confidence: {session.confidence_score >= 80 ? t('dashboard.highConfidence') : 
                               session.confidence_score >= 60 ? t('dashboard.moderateConfidence') : 
                               t('dashboard.underReview')}
                            </span>
                            {session.action_taken === 'auto_referred' && (
                              <span className="px-4 py-1.5 bg-[rgba(255,82,82,0.1)] text-brand-danger border border-brand-danger/30 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                                <AlertCircle size={14} />
                                {t('dashboard.referred')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-12">
                       <div className="flex flex-col gap-5">
                         <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">{t('prescription.prescribedMedicines')}</p>
                         <div className="space-y-3">
                           {session.prescriptions.map((p: any, i: number) => (
                             <div key={i} className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/5">
                               <span className="text-lg font-bold text-white">{p.medicine_name}</span>
                               <span className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">{p.dosage}</span>
                             </div>
                           ))}
                           {session.prescriptions.length === 0 && (
                             <div className="text-text-muted text-sm italic">No medicines prescribed.</div>
                           )}
                         </div>
                       </div>

                       <div className="flex flex-col gap-5">
                         <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">Activity & Results</p>
                         <div className="space-y-3">
                           {session.dispenses.map((d: any, i: number) => (
                             <div key={i} className="flex justify-between items-center bg-[rgba(33,150,243,0.1)] p-4 rounded-xl border border-brand-primary/30">
                               <div className="flex items-center gap-3">
                                 <Package className="text-brand-primary" size={18} />
                                 <span className="text-sm font-bold text-white">Dispensed {d.quantity_dispensed} {d.medicine_name}</span>
                               </div>
                               <CheckCircle2 className="text-brand-success" size={18} />
                             </div>
                           ))}
                           {session.dispenses.length === 0 && (
                             <div className="flex items-center gap-3 bg-white/5 p-4 rounded-xl text-text-muted text-sm italic">
                               <AlertCircle size={18} />
                               No medicine dispensed
                             </div>
                           )}
                         </div>
                       </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

    </motion.div>
  );
};
