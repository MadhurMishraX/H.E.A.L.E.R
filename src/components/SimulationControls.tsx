import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cpu, Fingerprint, Activity, Zap } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export const SimulationControls = () => {
  const { simulateRFID, hwMode } = useAppContext();
  const [isOpen, setIsOpen] = React.useState(false);

  // We show it if in simulated mode OR if we just want it always for testing
  const isSimulated = hwMode === 'simulated';

  const testTags = [
    { id: "45 8B 1F 2D", label: "Patient: John Doe" },
    { id: "A1 B2 C3 D4", label: "Patient: Jane Smith" },
    { id: "00 00 00 00", label: "Unknown Tag" },
  ];

  return (
    <div className="fixed bottom-6 left-6 z-[200]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="mb-4 glass-card p-6 border border-brand-primary/30 min-w-[280px] shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
          >
            <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
              <Cpu className="text-brand-secondary" size={20} />
              <h3 className="text-sm font-bold uppercase tracking-widest text-text-primary">
                Simulation Panel
              </h3>
            </div>

            <div className="flex flex-col gap-3">
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Trigger RFID Event</p>
              {testTags.map((tag) => (
                <motion.button
                  key={tag.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    simulateRFID(tag.id);
                    setIsOpen(false);
                  }}
                  className="w-full p-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-brand-primary/40 rounded-xl text-left transition-all group"
                >
                  <p className="text-xs font-bold text-text-primary group-hover:text-brand-primary transition-colors">{tag.label}</p>
                  <p className="text-[10px] font-mono text-text-muted mt-1">{tag.id}</p>
                </motion.button>
              ))}

              <div className="h-px bg-white/10 my-2" />

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  simulateRFID();
                  setIsOpen(false);
                }}
                className="w-full p-4 bg-brand-primary/10 hover:bg-brand-primary/20 border border-brand-primary/30 rounded-xl flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-3">
                  <Fingerprint size={18} className="text-brand-primary" />
                  <span className="text-xs font-bold text-brand-primary">Quick Scan Default</span>
                </div>
                <Zap size={14} className="text-brand-primary animate-pulse" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all ${
          isOpen ? 'bg-brand-danger text-white' : 'bg-brand-card border border-brand-primary/30 text-brand-primary hover:bg-brand-primary/10'
        }`}
      >
        <Activity size={32} />
        {!isOpen && !isSimulated && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-brand-primary"></span>
          </span>
        )}
      </motion.button>
    </div>
  );
};
