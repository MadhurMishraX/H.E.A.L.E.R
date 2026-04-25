import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { ArrowLeft, User, Mail, Calendar, Check, Mail as MailIcon, ArrowRight } from 'lucide-react';
import QRCode from 'qrcode';
import { QRCodeDisplay } from '../utils/qrUtils';
import { sendQRCodeEmail } from '../services/emailService';
import { getAllSettings } from '../services/settingsService';
import { motion, AnimatePresence } from 'motion/react';

export const RegistrationScreen = () => {
  const { t, language, setCurrentPatient } = useAppContext();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    email: '',
    language_preference: language
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showQRModal, setShowQRModal] = useState(false);
  const [registeredPatient, setRegisteredPatient] = useState<any>(null);
  const [clinicName, setClinicName] = useState('');

  const fetchSettings = async () => {
    const settings = await getAllSettings();
    setClinicName(settings.clinic_name || 'H.E.A.L.E.R');
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name) newErrors.name = t('registration.fieldRequired');
    
    const ageNum = parseInt(formData.age);
    if (!formData.age) {
      newErrors.age = t('registration.fieldRequired');
    } else if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
      newErrors.age = t('registration.ageError');
    }

    if (!formData.gender) newErrors.gender = t('registration.fieldRequired');
    
    if (!formData.email) {
      newErrors.email = t('registration.fieldRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('registration.emailError');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        let patient = await response.json();
        const qrCode = `HEALER_PATIENT_${patient.id}`;
        const updateResponse = await fetch(`/api/patients/${patient.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ qr_code: qrCode })
        });

        if (updateResponse.ok) {
          patient = await updateResponse.json();
          setRegisteredPatient(patient);
          setCurrentPatient(patient);
          setShowQRModal(true);
        }
      }
    } catch (err) {
      console.error("Registration failed", err);
    }
  };

  const handleEmailQR = async () => {
    if (!registeredPatient) return;
    try {
      const qrDataUrl = await QRCode.toDataURL(registeredPatient.qr_code);
      await sendQRCodeEmail(registeredPatient, qrDataUrl);
      alert(t('prescription.reportSent'));
    } catch (err) {
      console.error("Failed to email QR", err);
      alert(t('prescription.reportFailed'));
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full h-full flex flex-col overflow-hidden font-sans relative"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--color-brand-card)_0%,_transparent_100%)] pointer-events-none opacity-40" />

      {/* Header */}
      <div className="p-10 flex items-center gap-8 relative z-10 w-full max-w-5xl mx-auto">
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate('/')}
          className="w-16 h-16 bg-[rgba(255,255,255,0.05)] rounded-full flex items-center justify-center text-text-primary border border-white/10 hover:bg-white/10 transition-colors"
        >
          <ArrowLeft size={32} />
        </motion.button>
        <div>
          <h1 className="text-4xl font-black text-text-primary">{t('registration.title')}</h1>
          <p className="text-xl text-text-muted font-medium mt-1">{t('registration.subtitle')}</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center p-8 pt-0 relative z-10">
        <div className="glass-card w-full max-w-5xl overflow-hidden relative flex flex-col">
          {/* Top Gradient Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-primary to-brand-secondary" />
          
          <div className="p-12 pb-16 flex flex-col gap-10">
            <div className="grid grid-cols-2 gap-10">
              {/* Name */}
              <div className="flex flex-col gap-3 group relative">
                <label className="text-sm font-bold text-text-secondary flex items-center gap-2 uppercase tracking-widest transition-colors group-focus-within:text-brand-secondary">
                  <User size={18} />
                  {t('registration.fullName')}
                </label>
                <input 
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className={`h-16 px-6 text-xl bg-brand-navy rounded-xl border border-white/10 text-white placeholder-text-muted transition-all focus:outline-none focus:border-brand-secondary focus:shadow-[0_0_15px_rgba(0,188,212,0.2)] ${
                    errors.name ? 'border-brand-danger shadow-[0_0_15px_rgba(255,82,82,0.2)]' : ''
                  }`}
                />
                {errors.name && <span className="absolute -bottom-6 left-2 text-brand-danger text-sm font-bold">{errors.name}</span>}
              </div>

              {/* Age */}
              <div className="flex flex-col gap-3 group relative">
                <label className="text-sm font-bold text-text-secondary flex items-center gap-2 uppercase tracking-widest transition-colors group-focus-within:text-brand-secondary">
                  <Calendar size={18} />
                  {t('registration.age')}
                </label>
                <input 
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({...formData, age: e.target.value})}
                  className={`h-16 px-6 text-xl bg-brand-navy rounded-xl border border-white/10 text-white placeholder-text-muted transition-all focus:outline-none focus:border-brand-secondary focus:shadow-[0_0_15px_rgba(0,188,212,0.2)] ${
                    errors.age ? 'border-brand-danger shadow-[0_0_15px_rgba(255,82,82,0.2)]' : ''
                  }`}
                />
                {errors.age && <span className="absolute -bottom-6 left-2 text-brand-danger text-sm font-bold">{errors.age}</span>}
              </div>

              {/* Gender */}
              <div className="flex flex-col gap-3 col-span-2 relative">
                <label className="text-sm font-bold text-text-secondary uppercase tracking-widest">{t('registration.gender')}</label>
                <div className="flex gap-4">
                  {['male', 'female', 'other'].map((g) => (
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      key={g}
                      onClick={() => setFormData({...formData, gender: g})}
                      className={`flex-1 h-16 rounded-xl text-xl font-bold transition-all border ${
                        formData.gender === g 
                          ? 'bg-brand-primary text-white border-brand-primary shadow-[0_0_20px_rgba(33,150,243,0.4)]' 
                          : 'bg-brand-navy text-text-muted border-white/10 hover:border-white/20 hover:text-text-primary'
                      }`}
                    >
                      {t(`registration.${g}`)}
                    </motion.button>
                  ))}
                </div>
                {errors.gender && <span className="absolute -bottom-6 left-2 text-brand-danger text-sm font-bold">{errors.gender}</span>}
              </div>

              {/* Email */}
              <div className="flex flex-col gap-3 group relative">
                <label className="text-sm font-bold text-text-secondary flex items-center gap-2 uppercase tracking-widest transition-colors group-focus-within:text-brand-secondary">
                  <Mail size={18} />
                  {t('registration.email')}
                </label>
                <input 
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className={`h-16 px-6 text-xl bg-brand-navy rounded-xl border border-white/10 text-white placeholder-text-muted transition-all focus:outline-none focus:border-brand-secondary focus:shadow-[0_0_15px_rgba(0,188,212,0.2)] ${
                    errors.email ? 'border-brand-danger shadow-[0_0_15px_rgba(255,82,82,0.2)]' : ''
                  }`}
                />
                {errors.email && <span className="absolute -bottom-6 left-2 text-brand-danger text-sm font-bold">{errors.email}</span>}
              </div>

              {/* Language */}
              <div className="flex flex-col gap-3">
                <label className="text-sm font-bold text-text-secondary uppercase tracking-widest">{t('registration.language')}</label>
                <div className="flex gap-4">
                  {['en', 'hi'].map((l) => (
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      key={l}
                      onClick={() => setFormData({...formData, language_preference: l as any})}
                      className={`flex-1 h-16 rounded-xl text-xl font-bold transition-all border ${
                        formData.language_preference === l 
                          ? 'bg-brand-primary text-white border-brand-primary shadow-[0_0_20px_rgba(33,150,243,0.4)]' 
                          : 'bg-brand-navy text-text-muted border-white/10 hover:border-white/20 hover:text-text-primary'
                      }`}
                    >
                      {l === 'en' ? 'English' : 'हिंदी'}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>

            <motion.button 
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              className="w-full h-20 bg-gradient-to-r from-[#1565C0] to-[#2196F3] text-white rounded-xl text-2xl font-black shadow-[0_8px_24px_rgba(33,150,243,0.4)] flex items-center justify-center gap-4 mt-8 transition-all hover:shadow-[0_8px_32px_rgba(33,150,243,0.6)]"
            >
              <Check size={32} strokeWidth={3} />
              {t('registration.submit')}
              <ArrowRight size={32} />
            </motion.button>
          </div>
        </div>
      </div>

      {/* QR MODAL */}
      <AnimatePresence>
        {showQRModal && registeredPatient && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-brand-navy/95 backdrop-blur-xl z-[100] flex items-center justify-center p-12"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="glass-card w-full max-w-3xl p-16 flex flex-col items-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-brand-success to-brand-primary" />
              
              <h2 className="text-4xl font-black text-text-primary mb-4 text-center">{t('registration.qrTitle')}</h2>
              <p className="text-xl text-text-secondary font-medium mb-12 text-center max-w-xl">{t('registration.qrSubtitle')}</p>
              
              <div className="mb-12 p-8 bg-white rounded-3xl shadow-[0_0_50px_rgba(255,255,255,0.1)]">
                <QRCodeDisplay 
                  qrString={registeredPatient.qr_code} 
                  clinicName={clinicName}
                />
              </div>

              <div className="w-full flex flex-col gap-5">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={handleEmailQR}
                  className="w-full h-16 bg-[rgba(255,255,255,0.05)] border border-white/10 text-text-primary hover:bg-[rgba(255,255,255,0.1)] rounded-xl text-xl font-bold flex items-center justify-center gap-3 transition-colors"
                >
                  <MailIcon size={24} />
                  {t('registration.emailQR')}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => navigate('/diagnosis')}
                  className="w-full h-20 bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded-xl text-2xl font-black shadow-[0_8px_24px_rgba(33,150,243,0.4)] flex items-center justify-center gap-3 transition-all"
                >
                  {t('registration.continue')}
                  <ArrowRight size={28} />
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
