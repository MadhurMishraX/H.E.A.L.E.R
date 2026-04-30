import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  User, 
  Mail, 
  Phone, 
  LogOut, 
  Package, 
  Calendar,
  Clock,
  Check,
  Activity,
  Thermometer,
  Heart,
  Droplets,
  Stethoscope,
  ArrowDown,
  Lock,
  Info
} from 'lucide-react';
import { motion } from 'motion/react';
import { sendPrescriptionEmail, sendAutoReferralEmail } from '../services/emailService';
import { db } from '../utils/db';
import { useLiveQuery } from 'dexie-react-hooks';

export const PrescriptionScreen = () => {
  const { t, currentPatient, currentSession, setCurrentPatient, setCurrentSession } = useAppContext();
  const navigate = useNavigate();

  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [dispensedItems, setDispensedItems] = useState<Record<string, boolean>>({});
  const [inventory, setInventory] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [diseaseMap, setDiseaseMap] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      // Get all local data
      const [prescData, invData, setData] = await Promise.all([
        db.prescriptions.where('session_id').equals(currentSession.id).toArray(),
        db.inventory.toArray(),
        db.settings.toArray()
      ]);

      const settingsMap = setData.reduce((acc: any, s) => ({ ...acc, [s.key]: s.value }), {});
      
      setPrescriptions(prescData);
      setInventory(invData);
      setSettings(settingsMap);

      // Check which items are dispensed locally
      const dispensedMap: Record<string, boolean> = {};
      
      // We can check local logs or a dispensed field (simplified for now)
      prescData.forEach((p: any) => {
        dispensedMap[p.medicine_name] = false; // Will be updated by Dispense screen
      });
      setDispensedItems(dispensedMap);

      if (currentSession.action_taken === 'auto_referred') {
        handleAutoReferral(settingsMap, prescData);
      }
    } catch (err) {
      console.error("Failed to fetch local prescription details", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentPatient || !currentSession) {
      navigate('/');
      return;
    }
    fetchData();
  }, [currentPatient, currentSession]);

  const handleAutoReferral = async (currentSettings: any, prescList: any[]) => {
    const message = `Auto-referral sent for patient ${currentPatient?.name}, disease ${currentSession?.diagnosed_disease}, session ${currentSession?.id}`;
    
    await db.logs.add({
      timestamp: new Date().toISOString(),
      type: 'admin',
      message
    });

    await db.logs.add({
      timestamp: new Date().toISOString(),
      type: 'error',
      message: `Serious Referral: ${currentSession?.diagnosed_disease} for ${currentPatient?.name}`
    });

    try {
      await sendAutoReferralEmail(currentPatient, currentSession, prescList);
    } catch (err) {
      console.error("Auto-referral email failed", err);
    }
  };

  const handleSendEmail = async () => {
    try {
      await sendPrescriptionEmail(currentPatient, currentSession, prescriptions);
      alert(t('prescription.reportSent'));
    } catch (err) {
      alert(t('prescription.reportFailed'));
    }
  };

  const handleCallDoctor = () => {
    const phone = settings.doctor_phone || '';
    const whatsappUrl = `whatsapp://send?phone=${phone}`;
    window.location.href = whatsappUrl;
    
    db.logs.add({ 
      timestamp: new Date().toISOString(),
      type: 'admin',
      message: `Patient ${currentPatient?.name} initiated doctor call, session ${currentSession?.id}` 
    });
  };

  const handleDone = () => {
    setCurrentPatient(null);
    setCurrentSession(null);
    navigate('/');
  };

  const handleDispense = (p: any) => {
    const invItem = inventory.find(i => i.slot === p.compartment_number);
    if (!invItem || invItem.count <= 0) return;

    navigate('/dispensing', { 
      state: { 
        compartment_number: p.compartment_number,
        quantity_dispensed: 1, 
        session_id: currentSession?.id,
        medicine_name: p.medicine_name
      } 
    });
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-brand-navy">
        <Activity className="animate-spin text-brand-secondary" size={64} />
      </div>
    );
  }

  const confidence = currentSession?.confidence_score || 0;
  const isSerious = diseaseMap?.is_serious === 1 || currentSession?.action_taken === 'auto_referred';

  let confidenceLabel = "Possible Condition — Please Consult a Doctor";
  let labelColorClass = "from-amber-500 to-amber-600";
  
  if (confidence > 70) {
      confidenceLabel = "High Confidence Diagnosis";
      labelColorClass = "from-brand-success to-green-600";
  } else if (confidence >= 50) {
      confidenceLabel = "Good Match";
      labelColorClass = "from-brand-primary to-blue-600";
  } else if (confidence >= 35) {
      confidenceLabel = "Likely Condition — Doctor Confirmation Advised";
      labelColorClass = "from-amber-400 to-amber-500";
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
      className="w-full h-full flex flex-col bg-brand-navy overflow-y-auto font-sans text-text-primary scrollbar-thin scrollbar-thumb-brand-primary"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--color-brand-card)_0%,_transparent_100%)] pointer-events-none opacity-40" />

      {/* Header Bar */}
      <div className="px-10 py-6 flex justify-between items-center z-10 border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-brand-secondary to-brand-primary rounded-xl flex items-center justify-center text-white shadow-[0_0_15px_rgba(0,188,212,0.4)]">
            <Stethoscope size={24} />
          </div>
          <span className="text-2xl font-black text-white tracking-tight">H.E.A.L.E.R</span>
        </div>
        
        <h2 className="text-xl font-bold text-brand-secondary uppercase tracking-[0.2em]">
          {t('prescription.title')}
        </h2>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-xl font-bold text-text-primary">{currentPatient?.name}</p>
            <p className="text-sm font-medium text-text-muted">{new Date().toLocaleDateString()}</p>
          </div>
          <div className="w-14 h-14 glass-card rounded-full flex items-center justify-center text-text-secondary">
            <User size={24} />
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col p-10 gap-8 overflow-hidden z-10">
        
        {/* Section 1: Diagnosis Result */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card p-10 flex items-center justify-between"
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-6">
              <h3 className="text-[32px] font-bold text-text-primary m-0 leading-none">
                {currentSession?.diagnosed_disease}
              </h3>
              <div className={`px-4 py-1.5 rounded-full flex items-center gap-2 shadow-[0_0_15px_rgba(0,0,0,0.2)] bg-gradient-to-r ${labelColorClass}`}>
                {confidence >= 50 ? <CheckCircle2 size={16} className="text-white" /> : <AlertCircle size={16} className="text-white" />}
                <span className="text-xs font-bold uppercase tracking-widest text-white">
                  {confidenceLabel}
                </span>
              </div>
            </div>
            <p className="text-text-secondary max-w-3xl font-medium leading-relaxed m-0 text-lg">
              {t('prescription.supportingText')}
            </p>
          </div>
        </motion.div>

        <div className="flex-1 flex gap-8 overflow-hidden">
          
          {/* Section 2: Health Stats Panel */}
          <div className="w-1/3 flex flex-col gap-5 overflow-y-auto pr-2">
            <h4 className="text-sm font-bold text-text-muted uppercase tracking-[0.15em] px-2">{t('prescription.healthStats')}</h4>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: t('prescription.reportedFever'), value: currentSession?.diagnosed_disease.includes('Fever') ? t('prescription.yes') : t('prescription.no'), icon: <Thermometer size={20} />, active: true },
                { label: t('prescription.symptomDuration'), value: "2-5 d", icon: <Calendar size={20} />, active: true },
                { label: t('prescription.skinInvolvement'), value: currentSession?.ai_used ? t('prescription.yes') : t('prescription.no'), icon: <Droplets size={20} />, active: true },
                { label: t('prescription.cameraAnalysis'), value: currentSession?.ai_used ? t('prescription.used') : t('prescription.notUsed'), icon: <Activity size={20} />, active: !!currentSession?.ai_used },
                { label: t('prescription.temperature'), value: "—", sub: t('prescription.notMeasured'), icon: <Thermometer size={20} />, active: false },
                { label: t('prescription.pulse'), value: "—", sub: t('prescription.notMeasured'), icon: <Heart size={20} />, active: false },
              ].map((stat, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  key={i} 
                  className={`glass-card p-5 flex flex-col gap-4 border-t-2 ${stat.active ? 'border-t-brand-secondary opacity-100' : 'border-t-transparent opacity-50'}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${stat.active ? 'bg-[rgba(0,188,212,0.15)] text-brand-secondary' : 'bg-white/5 text-text-muted'}`}>
                    {stat.icon}
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-[11px] font-bold text-text-muted uppercase tracking-[1.5px]">{stat.label}</p>
                    <p className={`font-mono text-2xl font-bold ${stat.active ? 'text-white' : 'text-text-muted'}`}>{stat.value}</p>
                    {stat.sub && <p className="text-[10px] uppercase font-bold text-text-muted">{stat.sub}</p>}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Section 3: Prescription List */}
          <div className="w-2/3 glass-card p-8 flex flex-col gap-6 overflow-hidden">
            <div className="flex justify-between items-center px-2">
              <h4 className="text-xl font-bold text-white tracking-wide">{t('prescription.prescribedMedicines')}</h4>
              <FileText className="text-text-muted" size={28} />
            </div>

            {isSerious && (
              <div className="bg-[rgba(255,82,82,0.1)] p-6 rounded-2xl border-2 border-brand-danger flex flex-col gap-3 animate-pulse">
                <div className="flex items-center gap-4">
                  <AlertCircle className="text-brand-danger shrink-0" size={32} />
                  <h5 className="text-brand-danger font-black text-xl uppercase tracking-widest m-0">Urgent: Doctor Consultation Required</h5>
                </div>
                <p className="text-brand-danger font-bold text-sm leading-relaxed m-0 pl-12">
                  {currentSession.action_taken === 'auto_referred' 
                    ? t('prescription.autoReferralText').replace('{{name}}', settings.doctor_name || 'Doctor') 
                    : "This condition requires immediate professional medical attention. Please consult a doctor immediately. Auto-referral has been initiated."}
                </p>
                <div className="flex items-center gap-2 pl-12 text-brand-danger/70 text-xs font-bold uppercase tracking-widest">
                  <Check size={14} /> Referral Confirmation Sent to {settings.doctor_email || 'Clinic'}
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-2">
              {prescriptions.length > 0 ? prescriptions.map((p, i) => {
                const invItem = inventory.find(inv => inv.slot === p.compartment_number);
                const outOfStock = invItem ? invItem.count <= 0 : true;
                const isDispensable = p.compartment_number > 0; // Simplified for offline
                const isSerious = currentSession?.action_taken === 'serious_referred';
                const dispensed = p.is_dispensed === 1 || dispensedItems[p.medicine_name];

                return (
                  <motion.div 
                    key={p.id || i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={`p-6 glass-card border-l-4 transition-all ${
                      dispensed ? 'border-l-brand-success opacity-80' : 
                      isSerious ? 'border-l-brand-danger' : 
                      'border-l-brand-secondary'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${dispensed ? 'bg-brand-success/20 text-brand-success' : 'bg-brand-secondary/20 text-brand-secondary'}`}>
                            <Droplets size={20} />
                          </div>
                          <div>
                            <h4 className="text-xl font-black text-white uppercase tracking-wide">{p.medicine_name}</h4>
                            <p className="text-text-muted text-xs font-bold uppercase tracking-widest">{p.dosage}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-text-secondary uppercase tracking-widest bg-white/5 px-2 py-1 rounded">
                            <Clock size={12} />
                            {p.frequency}
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-text-secondary uppercase tracking-widest bg-white/5 px-2 py-1 rounded">
                            <Calendar size={12} />
                            {p.duration}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-3">
                        {dispensed ? (
                          <div className="flex items-center gap-2 px-4 py-2 bg-brand-success/10 border border-brand-success/30 text-brand-success rounded-full text-xs font-black uppercase tracking-widest">
                            <CheckCircle2 size={14} strokeWidth={3} />
                            {t('prescription.dispensed')}
                          </div>
                        ) : isSerious ? (
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-brand-danger font-bold text-xs uppercase tracking-widest">{t('prescription.doctorReview')}</span>
                            <button disabled className="h-10 px-4 bg-white/5 border border-white/10 text-white/20 rounded-full font-bold text-[10px] uppercase tracking-widest cursor-not-allowed">
                              {t('prescription.dispense')}
                            </button>
                          </div>
                        ) : !isDispensable ? (
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-text-muted font-bold text-[10px] uppercase tracking-widest mb-1">{t('prescription.availableAtPharmacy')}</span>
                            <button disabled className="h-10 px-6 bg-white/5 border border-white/10 text-white/20 rounded-full font-bold text-[10px] uppercase tracking-widest cursor-not-allowed flex items-center gap-2">
                              <Lock size={12} />
                              {t('prescription.dispense')}
                            </button>
                          </div>
                        ) : outOfStock ? (
                          <button disabled className="h-12 px-6 bg-white/5 border border-white/10 text-text-muted rounded-full font-bold text-sm flex items-center gap-2 cursor-not-allowed">
                            <Lock size={16} />
                            {t('prescription.outOfStock')}
                          </button>
                        ) : (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleDispense(p)}
                            className="h-12 px-8 bg-brand-secondary text-brand-navy rounded-full font-black text-sm uppercase tracking-widest shadow-[0_4px_12px_rgba(0,188,212,0.3)] hover:shadow-[0_6px_20px_rgba(0,188,212,0.4)] transition-all flex items-center gap-2"
                          >
                            <ArrowDown size={18} />
                            {t('prescription.dispense')}
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              }) : (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center p-12 text-center glass-card border-dashed border-2 border-white/10"
                >
                  <AlertCircle size={48} className="text-text-muted mb-4" />
                  <p className="text-text-secondary font-medium leading-relaxed">
                    {t('prescription.noMedicines')}
                  </p>
                </motion.div>
              )}

              {/* Advice Section */}
              {diseaseMap?.advice && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-6 glass-card border-l-4 border-l-brand-secondary bg-brand-secondary/5"
                >
                  <div className="flex items-center gap-3 mb-3 text-brand-secondary">
                    <Info size={20} />
                    <h5 className="font-bold uppercase tracking-wider text-sm">{t('prescription.advice')}</h5>
                  </div>
                  <p className="text-text-primary text-lg font-medium leading-relaxed italic">
                    "{diseaseMap.advice}"
                  </p>
                </motion.div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Section 4: Action Buttons */}
      <div className="p-8 pt-0 flex gap-6 z-10 w-full">
        <motion.button 
          whileTap={{ scale: 0.97 }}
          onClick={handleSendEmail}
          className="flex-1 h-20 glass-card border border-brand-secondary/30 text-text-primary hover:bg-brand-secondary/10 hover:border-brand-secondary rounded-[20px] text-sm tracking-widest uppercase font-bold flex flex-col items-center justify-center gap-2 transition-all"
        >
          <Mail size={24} className="text-brand-secondary" />
          {t('prescription.sendReport')}
        </motion.button>
        <motion.button 
          whileTap={{ scale: 0.97 }}
          onClick={handleCallDoctor}
          className="flex-1 h-20 glass-card border border-brand-success/30 text-text-primary hover:bg-brand-success/10 hover:border-brand-success rounded-[20px] text-sm tracking-widest uppercase font-bold flex flex-col items-center justify-center gap-2 transition-all"
        >
          <Phone size={24} className="text-brand-success" />
          {t('prescription.callDoctor')}
        </motion.button>
        <motion.button 
          whileTap={{ scale: 0.97 }}
          onClick={handleDone}
          className="flex-1 h-20 glass-card border border-brand-danger/30 text-brand-danger hover:bg-brand-danger/10 hover:border-brand-danger rounded-[20px] text-sm tracking-widest uppercase font-bold flex flex-col items-center justify-center gap-2 transition-all"
        >
          <LogOut size={24} />
          {t('prescription.done')}
        </motion.button>
      </div>

    </motion.div>
  );
};
