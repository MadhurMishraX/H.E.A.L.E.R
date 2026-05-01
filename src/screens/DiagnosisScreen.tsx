import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { QUESTION_TREE, calculateDiagnosis, getNextQuestion } from '../utils/diagnosisEngine';
import { getAgeGroup } from '../utils/ageUtils';
import { createSession, createPrescription, getDiseaseMap } from '../services/dbService';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Stethoscope, 
  ArrowRight, 
  ArrowLeft, 
  Camera, 
  Loader2, 
  Activity, 
  Info,
  CheckCircle2,
  Check,
  X
} from 'lucide-react';

export const DiagnosisScreen = () => {
  const { t, language, currentPatient, setCurrentSession } = useAppContext();
  const navigate = useNavigate();

  const [currentQuestionId, setCurrentQuestionId] = useState<string>('Q1');
  const [sessionAnswers, setSessionAnswers] = useState<any[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const [diseaseScores, setDiseaseScores] = useState<Record<string, number>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzingTextIndex, setAnalyzingTextIndex] = useState(0);
  const [showCamera, setShowCamera] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);
  const [aiResult, setAIResult] = useState<any>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const currentQuestion = QUESTION_TREE[currentQuestionId];
  const totalEstimatedSteps = 10;
  const progress = (sessionAnswers.length / totalEstimatedSteps) * 100;

  useEffect(() => {
    if (!currentPatient) {
      navigate('/');
    }
  }, [currentPatient, navigate]);

  useEffect(() => {
    if (isAnalyzing) {
      const interval = setInterval(() => {
        setAnalyzingTextIndex((prev) => (prev + 1) % 3);
      }, 700);
      return () => clearInterval(interval);
    }
  }, [isAnalyzing]);

  const handleOptionToggle = (idx: number) => {
    if (!currentQuestion) return;
    if (currentQuestion.type === 'multiple_select') {
      if (selectedOptions.includes(idx)) {
        setSelectedOptions(selectedOptions.filter(i => i !== idx));
      } else if (selectedOptions.length < 3) {
        setSelectedOptions([...selectedOptions, idx]);
      }
    } else {
      setSelectedOptions([idx]);
      // If it's single choice, we can auto-advance if we want, but let's stick to explicit next for consistency or auto-advance for yes_no
      if (currentQuestion.type === 'yes_no') {
        processAnswer([idx]);
      }
    }
  };

  const processAnswer = (indices: number[]) => {
    if (!currentQuestion) return;
    const newScores = { ...diseaseScores };
    indices.forEach(idx => {
      const opt = currentQuestion.options[idx] as any;
      Object.entries(opt.symptom_weights || {}).forEach(([disease, weight]) => {
        newScores[disease] = (newScores[disease] || 0) + (weight as number);
      });
    });

    const newAnswer = {
      question_id: currentQuestionId,
      question_text: language === 'en' ? currentQuestion.text_en : currentQuestion.text_hi,
      selected_option: currentQuestion.type === 'multiple_select' ? indices : indices[0],
      weights_added: indices.map(idx => (currentQuestion.options[idx] as any).symptom_weights || {})
    };

    const newSessionAnswers = [...sessionAnswers, newAnswer];
    setSessionAnswers(newSessionAnswers);
    setDiseaseScores(newScores);
    setSelectedOptions([]);

    const nextId = getNextQuestion(currentQuestionId, newAnswer.selected_option, newScores);

    if (nextId) {
      setCurrentQuestionId(nextId);
    } else {
      finalizeDiagnosis(newSessionAnswers);
    }
  };

  const handleNext = () => {
    if (selectedOptions.length > 0) {
      processAnswer(selectedOptions);
    }
  };

  const handleBack = () => {
    if (sessionAnswers.length > 0) {
      const prevAnswer = sessionAnswers[sessionAnswers.length - 1];
      setCurrentQuestionId(prevAnswer.question_id);
      setSessionAnswers(sessionAnswers.slice(0, -1));
      // Recalculate scores or keep it simple? Let's just reset scores and re-run through answers
      const reCalcScores: Record<string, number> = {};
      sessionAnswers.slice(0, -1).forEach(ans => {
        const weightsList = ans.weights_added;
        weightsList.forEach((w: any) => {
          Object.entries(w).forEach(([d, v]) => {
            reCalcScores[d] = (reCalcScores[d] || 0) + (v as number);
          });
        });
      });
      setDiseaseScores(reCalcScores);
    }
  };

  const finalizeDiagnosis = async (finalAnswers: any[]) => {
    setIsAnalyzing(true);
    
    const results = calculateDiagnosis(finalAnswers);
    const ageGroup = getAgeGroup(currentPatient.age);

    setTimeout(async () => {
      try {
        const diseaseMap = await getDiseaseMap(results.diagnosis);

        const sessionPayload = {
          patient_id: currentPatient.id!,
          timestamp: new Date().toISOString(),
          diagnosed_disease: results.diagnosis,
          confidence_score: results.confidence,
          top_alternatives: "",
          ai_used: aiResult ? 1 : 0,
          ai_result: aiResult ? JSON.stringify(aiResult) : "",
          action_taken: results.action
        };

        const sessionId = await createSession(sessionPayload);

        // Always try to create a prescription entry if we have medicine info or just generic advice
        const medicineName = diseaseMap?.medicine_name || "General Care / Consult Doctor";
        const dosage = diseaseMap ? (ageGroup === 'child' ? diseaseMap.dosage_child : 
                       ageGroup === 'adult' ? diseaseMap.dosage_adult : 
                       diseaseMap.dosage_elderly) : "As recommended by physician";

        await createPrescription({
          session_id: sessionId,
          medicine_name: medicineName,
          dosage: dosage || "Consult pharmacist",
          frequency: diseaseMap?.is_serious ? "URGENT" : "As instructed", 
          duration: diseaseMap?.is_serious ? "Immediate" : "5 days",
          compartment_number: diseaseMap?.compartment_number ?? null
        });

        setCurrentSession({ id: sessionId, ...sessionPayload });
        navigate('/prescription');
      } catch (err) {
         console.error("Failed to save diagnosis", err);
         navigate('/prescription'); 
      }
    }, 3000); // give 3 seconds for analyzing animation
  };

  const startCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera denied", err);
      setShowCamera(false);
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setIsAILoading(true);

    const context = canvasRef.current.getContext('2d');
    context?.drawImage(videoRef.current, 0, 0, 640, 480);
    const imageData = canvasRef.current.toDataURL('image/jpeg');
    const base64Data = imageData.split(',')[1];

    try {
      const response = await fetch(`/api/ai/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64Data })
      });

      const data = await response.json();
      const rawText = data.candidates[0].content.parts[0].text.trim();
      const [condition, confidence] = rawText.split('|');
      
      const res = { condition, confidence: parseInt(confidence) };
      setAIResult(res);

      if (condition.toLowerCase().includes('fungal')) {
        setDiseaseScores(prev => ({ ...prev, "Fungal Skin Infection": (prev["Fungal Skin Infection"] || 0) + 3 }));
      } else if (condition.toLowerCase().includes('allergic')) {
        setDiseaseScores(prev => ({ ...prev, "Allergic Reaction": (prev["Allergic Reaction"] || 0) + 3 }));
      }

      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setShowCamera(false);
    } catch (err) {
      console.error("AI Analysis failed", err);
      setIsAILoading(false);
    } finally {
      setIsAILoading(false);
    }
  };

  // Particles for Analysis Screen
  const particles = Array.from({ length: 15 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    duration: 2 + Math.random() * 4,
    delay: Math.random() * 2
  }));

  if (isAnalyzing) {
    const texts = [t('diagnosis.analyzing'), t('diagnosis.analyzing2'), t('diagnosis.analyzing3')];
    return (
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
        className="w-full h-full bg-brand-navy flex flex-col items-center justify-center text-white relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,188,212,0.15)_0%,_transparent_70%)]" />
        {particles.map(p => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.8, 0] }}
            transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
            className="absolute w-2 h-2 rounded-full bg-white shadow-[0_0_10px_white]"
            style={{ left: p.left, top: p.top }}
          />
        ))}

        <div className="relative mb-16 flex items-center justify-center">
          <motion.svg
            viewBox="0 0 100 100"
            className="w-48 h-48 absolute"
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          >
            <circle cx="50" cy="50" r="45" fill="none" stroke="url(#cyan-blue)" strokeWidth="4" strokeDasharray="60 120" strokeLinecap="round" />
            <defs>
              <linearGradient id="cyan-blue" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--color-brand-secondary)" />
                <stop offset="100%" stopColor="var(--color-brand-primary)" />
              </linearGradient>
            </defs>
          </motion.svg>
          <motion.svg 
            viewBox="0 0 24 24" 
            className="w-16 h-16 text-brand-secondary animate-pulse"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </motion.svg>
        </div>

        <div className="h-20 flex items-center justify-center pointer-events-none relative z-10 text-center">
          <AnimatePresence mode="wait">
            <motion.h2 
              key={analyzingTextIndex}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="text-2xl tracking-widest text-text-primary uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]"
            >
              {texts[analyzingTextIndex]}
            </motion.h2>
          </AnimatePresence>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full h-full bg-brand-navy flex flex-col font-sans overflow-y-auto text-text-primary relative scrollbar-thin scrollbar-thumb-brand-primary"
    >
      {/* Subtle Background Animation */}
      <motion.div 
        animate={{ 
          background: [
           'radial-gradient(circle at 20% 20%, rgba(33,150,243,0.15) 0%, transparent 60%)',
           'radial-gradient(circle at 80% 80%, rgba(0,188,212,0.15) 0%, transparent 60%)',
           'radial-gradient(circle at 20% 20%, rgba(33,150,243,0.15) 0%, transparent 60%)'
          ]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-0 z-0"
      />

      {/* Progress Bar */}
      <div className="w-full h-[6px] bg-white/5 relative z-20">
         <motion.div 
           className="h-full bg-gradient-to-r from-brand-secondary to-brand-primary relative shadow-[0_0_15px_rgba(0,188,212,0.5)]"
           initial={{ width: 0 }}
           animate={{ width: `${progress}%` }}
           transition={{ duration: 0.5 }}
         >
           <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-[0_0_10px_white]" />
         </motion.div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 z-10 w-full max-w-5xl mx-auto">
        
        <AnimatePresence mode="sync">
          <motion.div 
            key={currentQuestionId}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.3 }}
            className="glass-card w-full p-12 flex flex-col max-h-[85vh] overflow-y-auto scrollbar-thin scrollbar-thumb-brand-secondary"
            style={{ minHeight: '60%' }}
          >
            <div className="flex items-start justify-between mb-8">
               <div className="flex items-center gap-3 bg-[rgba(0,188,212,0.1)] px-4 py-2 rounded-full border border-brand-secondary/30 text-brand-secondary">
                  <span className="text-xs font-bold uppercase tracking-[1.5px]">
                    {t('diagnosis.question')} {sessionAnswers.length + 1}
                  </span>
               </div>
            </div>

            <h2 className="text-4xl font-bold text-text-primary mb-6 leading-tight">
              {language === 'en' ? currentQuestion?.text_en : currentQuestion?.text_hi}
            </h2>

            <div className="flex items-center gap-2 mb-10 text-text-muted italic text-sm">
               <div className="flex gap-1 mr-2">
                 {[0, 1, 2].map((i) => (
                   <motion.div 
                     key={i}
                     animate={{ opacity: [0.3, 1, 0.3] }}
                     transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                     className="w-1.5 h-1.5 rounded-full bg-brand-secondary"
                   />
                 ))}
               </div>
               {t('diagnosis.crossRef')}
            </div>

            {currentQuestion?.camera_trigger && !aiResult && (
               <motion.button 
                 whileTap={{ scale: 0.98 }}
                 onClick={startCamera}
                 className="w-full mb-10 p-8 glass-btn rounded-xl flex items-center justify-center gap-4 text-xl font-bold text-brand-secondary border-dashed border-2 hover:bg-[rgba(0,188,212,0.1)] transition-colors"
               >
                 <Camera size={28} />
                 {t('diagnosis.openCamera')}
               </motion.button>
            )}

            {aiResult && (
               <motion.div 
                 initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                 className="mb-10 p-6 bg-[rgba(0,230,118,0.1)] rounded-xl border border-brand-success flex items-center gap-6"
               >
                 <CheckCircle2 size={36} className="text-brand-success" />
                 <div>
                    <p className="text-brand-success font-bold text-xs uppercase tracking-widest mb-1">Visual Input Processed</p>
                    <p className="text-white text-lg font-medium">{aiResult.condition} ({aiResult.confidence}%)</p>
                 </div>
               </motion.div>
            )}

             <div className="grid grid-cols-1 gap-4 mt-auto">
               {currentQuestion?.options?.map((option, idx) => {
                 const isSelected = selectedOptions.includes(idx);
                 
                 return (
                   <motion.button
                      whileTap={{ scale: 0.98 }}
                      key={idx}
                      onClick={() => handleOptionToggle(idx)}
                      className={`min-h-[80px] rounded-xl text-left px-8 text-xl font-bold transition-all flex items-center justify-between border-l-4 ${
                        isSelected 
                          ? 'bg-brand-primary text-text-primary border-brand-secondary shadow-[0_8px_24px_rgba(33,150,243,0.4)]' 
                          : 'glass-btn border-transparent text-text-secondary hover:bg-[rgba(33,150,243,0.1)] hover:border-brand-primary'
                      }`}
                   >
                      {language === 'en' ? option.text_en : option.text_hi}
                      {isSelected && (
                         <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center justify-center w-6 h-6 bg-white rounded-full text-brand-primary">
                           <Check size={16} strokeWidth={4} />
                         </motion.div>
                      )}
                   </motion.button>
                 );
               })}
            </div>
            
            <div className="mt-10 flex justify-between items-center">
               <motion.button 
                 whileTap={{ scale: 0.96 }}
                 onClick={handleBack}
                 disabled={sessionAnswers.length === 0}
                 className={`flex items-center gap-3 text-sm font-bold uppercase tracking-widest transition-colors ${
                   sessionAnswers.length === 0 ? 'text-white/10' : 'text-text-muted hover:text-text-primary'
                 }`}
               >
                 <ArrowLeft size={20} />
                 {t('common.back') || 'Back'}
               </motion.button>

               {(currentQuestion?.type === 'multiple_select' || currentQuestion?.type === 'multiple_choice') && (
                 <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleNext}
                  disabled={selectedOptions.length === 0}
                  className={`h-14 px-10 bg-brand-secondary text-brand-navy rounded-full font-black text-sm uppercase tracking-widest shadow-[0_4px_15px_rgba(0,188,212,0.3)] transition-all flex items-center gap-2 ${
                    selectedOptions.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {t('common.next') || 'Next'}
                  <ArrowRight size={20} />
                </motion.button>
               )}
            </div>
          </motion.div>
        </AnimatePresence>

      </div>

      {/* Camera Modal */}
      <AnimatePresence>
        {showCamera && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-brand-navy/95 backdrop-blur-xl z-[100] flex flex-col items-center justify-center p-12"
          >
             <div className="relative w-full max-w-4xl aspect-video rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-white/10">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="w-full h-full object-cover"
                />
                
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="w-[60%] h-[80%] border-4 border-dashed border-brand-secondary/50 rounded-[100%] flex items-center justify-center pulse">
                      <p className="text-white text-xl font-bold bg-brand-card/80 px-6 py-3 rounded-full backdrop-blur-md">
                        {t('diagnosis.cameraOverlay')}
                      </p>
                   </div>
                </div>

                {isAILoading && (
                  <div className="absolute inset-0 bg-brand-card/80 backdrop-blur-md flex flex-col items-center justify-center text-white">
                    <Loader2 size={80} className="animate-spin mb-6 text-brand-secondary" />
                    <p className="text-2xl font-bold tracking-widest uppercase">Analyzing...</p>
                  </div>
                )}
             </div>

             <div className="mt-12 flex gap-10">
                <motion.button 
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                     const stream = videoRef.current?.srcObject as MediaStream;
                     stream?.getTracks().forEach(t => t.stop());
                     setShowCamera(false);
                  }}
                  className="w-20 h-20 bg-[rgba(255,82,82,0.1)] text-brand-danger border border-brand-danger/30 rounded-full flex items-center justify-center"
                >
                  <X size={32} />
                </motion.button>
                <motion.button 
                  whileTap={{ scale: 0.9 }}
                  onClick={capturePhoto}
                  className="w-24 h-24 bg-brand-primary text-white rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(33,150,243,0.5)] border border-brand-secondary"
                >
                  <Camera size={36} />
                </motion.button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} width={640} height={480} className="hidden" />
    </motion.div>
  );
};
