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
  Activity,
  Thermometer,
  Heart,
  Droplets,
  Stethoscope,
  ArrowDown,
  Lock
} from 'lucide-react';
import { motion } from 'motion/react';
import { sendPrescriptionEmail, sendAutoReferralEmail } from '../services/emailService';

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
      const [prescRes, invRes, setRes, mapRes] = await Promise.all([
        fetch(`/api/prescriptions/session/${currentSession.id}`),
        fetch('/api/inventory'),
        fetch('/api/settings'),
        fetch(`/api/disease-map/${currentSession.diagnosed_disease}`)
      ]);

      const prescData = await prescRes.json();
      const invData = await invRes.json();
      const setData = await setRes.json();
      const mapData = await mapRes.json();

      setPrescriptions(prescData);
      setInventory(invData);
      setSettings(setData);
      setDiseaseMap(mapData);

      // Check which items are dispensed
      const dispensedMap: Record<string, boolean> = {};
      await Promise.all(prescData.map(async (p: any) => {
        const checkRes = await fetch(`/api/dispense/check/${currentSession.id}/${p.medicine_name}`);
        const checkData = await checkRes.json();
        dispensedMap[p.medicine_name] = checkData.dispensed;

        // Unavailability logging
        if (!checkData.dispensed) {
          const invItem = invData.find((i: any) => i.compartment_number === p.compartment_number);
          const isDispensable = p.compartment_number > 0 && mapData?.is_dispensable === 1;
          const outOfStock = invItem ? invItem.current_count <= 0 : true;

          if (!isDispensable || outOfStock) {
             await fetch('/api/logs/unavailability', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ 
                 reason: !isDispensable ? 'manual_pharmacy' : 'out_of_stock',
                 patient_id: currentPatient?.id,
                 session_id: currentSession?.id
               })
             }).catch(() => {});
          }
        }
      }));
      setDispensedItems(dispensedMap);

      if (currentSession.action_taken === 'auto_referred') {
        handleAutoReferral(setData, prescData);
      }
    } catch (err) {
      console.error("Failed to fetch prescription details", err);
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
    
    await fetch('/api/logs/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });

    await fetch('/api/logs/unavailability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        reason: 'serious_referred',
        patient_id: currentPatient?.id,
        session_id: currentSession?.id
      })
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
    
    fetch('/api/logs/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: `Patient ${currentPatient?.name} initiated doctor call, session ${currentSession?.id}` 
      })
    });
  };

  const handleDone = () => {
    setCurrentPatient(null);
    setCurrentSession(null);
    navigate('/');
  };

  const handleDispense = (p: any) => {
    const invItem = inventory.find(i => i.compartment_number === p.compartment_number);
    if (!invItem || invItem.current_count <= 0) return;

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

  const isInconclusive = currentSession?.diagnosed_disease === "Inconclusive — Doctor Referral Required";
  const isSerious = diseaseMap?.is_serious === 1 || currentSession?.action_taken === 'auto_referred';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
      className="w-full h-full flex flex-col bg-brand-navy overflow-hidden font-sans text-text-primary"
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
              <div className={`px-4 py-1.5 rounded-full flex items-center gap-2 shadow-[0_0_15px_rgba(0,0,0,0.2)] ${isInconclusive ? 'bg-gradient-to-r from-[#FFB300] to-[#FF8F00]' : 'bg-gradient-to-r from-brand-success to-[#00C853]'}`}>
                {isInconclusive ? <AlertCircle size={16} /> : <CheckCircle2 size={16} className="text-white" />}
                <span className="text-xs font-bold uppercase tracking-widest text-white">
                  {currentSession?.confidence_score >= 60 ? t('prescription.successfulDiagnosis') : t('prescription.doctorReview')}
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
              <div className="bg-[rgba(255,82,82,0.1)] p-5 rounded-2xl border border-brand-danger flex items-center gap-5 animate-pulse">
                <AlertCircle className="text-brand-danger shrink-0" size={28} />
                <p className="text-brand-danger font-bold text-sm leading-relaxed m-0">
                  {currentSession.action_taken === 'auto_referred' 
                    ? t('prescription.autoReferralText').replace('{{name}}', settings.doctor_name || 'Doctor') 
                    : t('prescription.seriousWarning')}
                </p>
              </div>
            )}

            <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-2">
              {prescriptions.map((p, i) => {
                const invItem = inventory.find(inv => inv.compartment_number === p.compartment_number);
                const outOfStock = invItem ? invItem.current_count <= 0 : true;
                const isDispensable = p.compartment_number > 0 && diseaseMap?.is_dispensable === 1;

                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + (i * 0.1) }}
                    key={i} 
                    className="p-6 rounded-2xl glass-card flex justify-between items-center border-[rgba(255,255,255,0.05)] hover:border-[rgba(33,150,243,0.3)] transition-colors"
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 bg-[rgba(33,150,243,0.1)] rounded-full flex items-center justify-center text-brand-primary border border-brand-primary/20">
                        <Package size={28} />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h5 className="text-[22px] font-bold text-white m-0 leading-none">{p.medicine_name}</h5>
                          {isDispensable && (
                            <span className="px-2.5 py-0.5 bg-[rgba(0,188,212,0.15)] text-brand-secondary text-[10px] font-bold rounded-full uppercase tracking-widest border border-brand-secondary/30">
                              CPMT {p.compartment_number}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-text-secondary m-0 tracking-wide mt-2">
                          {p.dosage} • {p.frequency} • {p.duration}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      {dispensedItems[p.medicine_name] ? (
                        <div className="flex items-center gap-2 text-brand-success font-bold text-sm bg-[rgba(0,230,118,0.1)] px-5 py-3 rounded-full border border-brand-success/30 shadow-[0_0_15px_rgba(0,230,118,0.2)]">
                          <CheckCircle2 size={18} />
                          {t('prescription.dispensed')}
                        </div>
                      ) : isSerious ? (
                        <span className="text-brand-danger font-bold text-sm uppercase tracking-widest">{t('prescription.doctorReview')}</span>
                      ) : !isDispensable ? (
                        <span className="text-text-muted font-bold text-xs uppercase tracking-widest max-w-[140px] text-right">
                          {t('prescription.availableAtPharmacy')}
                        </span>
                      ) : outOfStock ? (
                        <button disabled className="h-12 px-6 bg-white/5 border border-white/10 text-text-muted rounded-full font-bold text-sm flex items-center gap-2 cursor-not-allowed">
                          <Lock size={16} />
                          {t('prescription.outOfStock')}
                        </button>
                      ) : (
                        <motion.button 
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleDispense(p)}
                          className="h-12 px-8 bg-brand-primary hover:bg-[#1E88E5] text-white rounded-full font-bold text-sm shadow-[0_0_20px_rgba(33,150,243,0.5)] flex items-center gap-2 transition-colors"
                        >
                          <ArrowDown size={18} />
                          {t('prescription.dispense')}
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
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
