import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { 
  Shield, 
  LogOut, 
  Box, 
  ClipboardList, 
  Users, 
  BarChart4, 
  Settings as SettingsIcon,
  ChevronRight,
  Package,
  Search,
  Mail,
  AlertCircle,
  Save,
  CheckCircle2,
  Trash2,
  Send,
  Loader2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Activity,
  User as UserIcon,
  Plus,
  Minus,
  Wifi,
  Usb,
  Cpu,
  RefreshCw,
  X
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  LineChart, Line
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { 
  getAllPatients,
  getPatientFullHistory,
  getAnalyticsDiseases,
  getAnalyticsDailyVolume,
  getAnalyticsTopMedicines,
  getAnalyticsUnavailability,
  updateInventoryItem,
  getUnavailabilityLogs,
  addAdminLog,
  getInventory
} from '../services/dbService';
import { getAllSettings, setSetting } from '../services/settingsService';
import { sendCommand, onMessage, initSerial, updateHardwareConfig, getHardwareConfig, requestWebSerialPort } from '../utils/serialComm';
import { sendQRCodeEmail } from '../services/emailService';
import QRCode from 'qrcode';

// --- Hardware Connection Modal ---
const HardwareModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const { hwStatus, setIsHardwareConnected, setHwError } = useAppContext();
  const [config, setConfig] = useState(getHardwareConfig());
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>(getConnectionStatus() === 'connected' ? 'connected' : 'idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [wifiUrl, setWifiUrl] = useState(config.url);

  useEffect(() => {
    // Sync with global status in case it changes externally
    const unlisten = onConnectionStatus((newStatus, error) => {
      if (newStatus === 'connected') {
        setStatus('connected');
        setIsHardwareConnected(true);
        setHwError(null);
        setTimeout(() => onClose(), 1500);
      } else if (newStatus === 'error') {
        setStatus('error');
        setErrorMsg(error || 'Connection failed');
        setIsHardwareConnected(false);
        setHwError(error || 'Connection failed');
      } else if (newStatus === 'connecting') {
        setStatus('connecting');
      } else {
        setStatus('idle');
      }
    });

    return () => unlisten();
  }, [setIsHardwareConnected, setHwError, onClose]);

  const handleUSBConnect = async () => {
    setStatus('connecting');
    setErrorMsg(null);
    setHwError(null);
    const res = await requestWebSerialPort();
    if (res.success) {
      updateHardwareConfig('usb');
      setConfig(getHardwareConfig());
      await initSerial();
    } else {
      setIsHardwareConnected(false);
      setStatus('error');
      setErrorMsg(res.error);
      setHwError(res.error);
    }
  };

  const handleConnect = async (type: 'wifi' | 'simulated') => {
    setStatus('connecting');
    setErrorMsg(null);
    setHwError(null);
    updateHardwareConfig(type, type === 'wifi' ? wifiUrl : undefined);
    setConfig(getHardwareConfig());
    await initSerial();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={status === 'connecting' ? undefined : onClose}
        className="absolute inset-0 bg-brand-navy/95 backdrop-blur-xl"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-xl bg-[#0F1D32] border border-white/10 rounded-[32px] overflow-hidden shadow-[0_32px_64px_rgba(0,0,0,0.6)]"
      >
        <div className="p-10">
          <div className="flex justify-between items-start mb-10">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Connect Hardware</h2>
              <p className="text-text-muted">Link the medical kiosk to the motor controllers</p>
            </div>
            <button 
              onClick={onClose} 
              disabled={status === 'connecting'}
              className="p-2 hover:bg-white/5 rounded-full text-text-muted transition-colors disabled:opacity-0"
            >
              <X size={24} />
            </button>
          </div>

          {status === 'error' && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
              className="mb-8 p-4 bg-brand-danger/10 border border-brand-danger/20 rounded-2xl flex items-center gap-4 text-brand-danger text-sm font-bold uppercase tracking-wider"
            >
              <AlertCircle size={20} className="shrink-0" />
              <span className="flex-1">{errorMsg}</span>
            </motion.div>
          )}

          {status === 'connected' && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
              className="mb-8 p-4 bg-brand-success/10 border border-brand-success/20 rounded-2xl flex items-center gap-4 text-brand-success text-sm font-bold uppercase tracking-wider"
            >
              <CheckCircle2 size={20} className="shrink-0" />
              Connected Successfully! Closing...
            </motion.div>
          )}

          <div className="grid grid-cols-1 gap-5">
            {/* USB Option */}
            <button 
              onClick={handleUSBConnect}
              disabled={status === 'connecting' || status === 'connected'}
              className={`group p-6 rounded-2xl border flex items-center gap-6 transition-all ${config.type === 'usb' && status === 'connected' ? 'bg-brand-primary/10 border-brand-primary' : 'bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/[0.08] disabled:hover:bg-white/5'}`}
            >
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all ${config.type === 'usb' && status === 'connected' ? 'bg-brand-primary text-white' : 'bg-brand-navy text-text-muted group-hover:text-white'}`}>
                <Usb size={28} />
              </div>
              <div className="text-left flex-1">
                <h4 className="text-xl font-bold text-white mb-0.5">🔌 USB Connection</h4>
                <p className="text-xs text-text-muted font-medium">Connect via USB cable to Arduino Mega</p>
              </div>
              {status === 'connecting' && config.type === 'usb' ? (
                <Loader2 className="animate-spin text-brand-primary" size={20} />
              ) : config.type === 'usb' && status === 'connected' ? (
                <CheckCircle2 className="text-brand-success" size={20} />
              ) : (
                <ChevronRight size={20} className="text-white/10 group-hover:text-white/30" />
              )}
            </button>

            {/* WiFi Option */}
            <div className={`p-6 rounded-2xl border transition-all ${config.type === 'wifi' && status === 'connected' ? 'bg-brand-secondary/10 border-brand-secondary' : 'bg-white/5 border-white/5 hover:border-white/10'}`}>
              <div className="flex items-center gap-6 mb-6">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all ${config.type === 'wifi' && status === 'connected' ? 'bg-brand-secondary text-brand-navy' : 'bg-brand-navy text-text-muted'}`}>
                  <Wifi size={28} />
                </div>
                <div className="text-left flex-1">
                  <h4 className="text-xl font-bold text-white mb-0.5">📡 WiFi Network</h4>
                  <p className="text-xs text-text-muted font-medium">Connect to ESP32 over WiFi</p>
                </div>
                {status === 'connecting' && config.type === 'wifi' ? (
                  <Loader2 className="animate-spin text-brand-secondary" size={20} />
                ) : config.type === 'wifi' && status === 'connected' ? (
                  <CheckCircle2 className="text-brand-success" size={20} />
                ) : null}
              </div>
              
              <div className="flex gap-3">
                <input 
                  type="text" 
                  value={wifiUrl}
                  onChange={(e) => setWifiUrl(e.target.value)}
                  placeholder="http://192.168.1.x"
                  disabled={status === 'connecting' || status === 'connected'}
                  className="flex-1 h-12 bg-brand-navy border border-white/10 rounded-xl px-4 text-white text-sm font-mono placeholder:text-white/20 focus:outline-none focus:border-brand-secondary transition-colors disabled:opacity-50"
                />
                <button 
                  onClick={() => handleConnect('wifi')}
                  disabled={status === 'connecting' || status === 'connected'}
                  className="px-6 bg-brand-secondary text-brand-navy rounded-xl font-bold uppercase tracking-widest text-xs flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                >
                  {status === 'connecting' && config.type === 'wifi' ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
                  Connect
                </button>
              </div>
            </div>

            {/* Simulation Option */}
            <button 
              onClick={() => handleConnect('simulated')}
              disabled={status === 'connecting' || status === 'connected'}
              className={`group p-6 rounded-2xl border flex items-center gap-6 transition-all ${config.type === 'simulated' && status === 'connected' ? 'bg-white/10 border-white/30' : 'bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/[0.08] disabled:hover:bg-white/5'}`}
            >
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all ${config.type === 'simulated' && status === 'connected' ? 'bg-white/20 text-white' : 'bg-brand-navy text-text-muted group-hover:text-white'}`}>
                <Cpu size={28} />
              </div>
              <div className="text-left flex-1">
                <h4 className="text-xl font-bold text-white mb-0.5">🖥️ Simulation</h4>
                <p className="text-xs text-text-muted font-medium">Run without hardware (demo mode)</p>
              </div>
              {status === 'connecting' && config.type === 'simulated' ? (
                <Loader2 className="animate-spin text-white" size={20} />
              ) : config.type === 'simulated' && status === 'connected' ? (
                <CheckCircle2 className="text-brand-success" size={20} />
              ) : (
                <ChevronRight size={20} className="text-white/10 group-hover:text-white/30" />
              )}
            </button>
          </div>
        </div>
        
        {status === 'connecting' ? (
          <div className="bg-brand-navy/50 p-6 flex items-center justify-center gap-3 text-xs font-bold text-brand-secondary uppercase tracking-[0.2em] border-t border-white/5">
            <Loader2 className="animate-spin" size={14} />
            Establishing Handshake...
          </div>
        ) : (
          <div className="bg-white/5 p-6 text-center text-[10px] text-text-muted font-bold uppercase tracking-[0.2em] border-t border-white/5">
            Hardware handshake required for dispensing
          </div>
        )}
      </motion.div>
    </div>
  );
};

// --- Tab Sub-Components ---

const CompartmentsTab = ({ inventory, setInventory, serialLog, setSerialLog }: any) => {
  const { t } = useAppContext();
  const [statuses, setStatuses] = useState<Record<string, string>>({ 1: 'Closed', 2: 'Closed', 3: 'Closed', 4: 'Closed', 'FA': 'Closed' });
  const [debugOpen, setDebugOpen] = useState(false);
  const [testCmd, setTestCmd] = useState('');

  useEffect(() => {
    const unlisten = onMessage((msg) => {
      const timestamp = new Date().toLocaleTimeString();
      setSerialLog((prev: any) => [{ timestamp, type: 'IN', msg }, ...prev].slice(0, 20));
      
      if (msg.includes('ACK_OPEN')) {
        const parts = msg.split('_');
        const key = parts[2] === 'FA' ? 'FA' : parseInt(parts[2]);
        setStatuses(prev => ({ ...prev, [key]: 'Open' }));
      }
      if (msg.includes('ACK_CLOSE')) {
        const parts = msg.split('_');
        const key = parts[2] === 'FA' ? 'FA' : parseInt(parts[2]);
        setStatuses(prev => ({ ...prev, [key]: 'Closed' }));
      }
    });

    return () => {
      unlisten();
    };
  }, []);

  const handleOpen = (n: number) => {
    const cmd = `OPEN_${n}`;
    sendCommand(cmd);
    const timestamp = new Date().toLocaleTimeString();
    setSerialLog((prev: any) => [{ timestamp, type: 'OUT', msg: cmd }, ...prev].slice(0, 20));
  };

  const handleClose = (n: number) => {
    const cmd = `CLOSE_${n}`;
    sendCommand(cmd);
    const timestamp = new Date().toLocaleTimeString();
    setSerialLog((prev: any) => [{ timestamp, type: 'OUT', msg: cmd }, ...prev].slice(0, 20));
  };

  const handleOpenAll = async () => {
    for (let i = 1; i <= 4; i++) {
      handleOpen(i);
      await new Promise(r => setTimeout(r, 200));
    }
    addAdminLog("Admin opened all compartments for refill").catch(() => {});
  };

  const handleCloseAll = async () => {
    for (let i = 1; i <= 4; i++) {
      handleClose(i);
      await new Promise(r => setTimeout(r, 200));
    }
    handleCloseFA();
    addAdminLog("Admin closed all compartments").catch(() => {});
  };

  const handleOpenFA = () => {
    const cmd = `OPEN_FA`;
    sendCommand(cmd);
    const timestamp = new Date().toLocaleTimeString();
    setSerialLog((prev: any) => [{ timestamp, type: 'OUT', msg: cmd }, ...prev].slice(0, 20));
  };

  const handleCloseFA = () => {
    const cmd = `CLOSE_FA`;
    sendCommand(cmd);
    const timestamp = new Date().toLocaleTimeString();
    setSerialLog((prev: any) => [{ timestamp, type: 'OUT', msg: cmd }, ...prev].slice(0, 20));
  };

  const isFAOpen = statuses['FA'] === 'Open';

  return (
    <div className="flex-1 flex flex-col gap-8 overflow-y-auto pr-2 pb-8">
      <div className="grid grid-cols-2 gap-8">
        {[1, 2, 3, 4].map(n => {
          const inv = inventory.find((i: any) => i.compartment_number === n);
          const isOpen = statuses[n] === 'Open';
          const isLowStock = inv && inv.current_count <= 5;
          
          let borderColor = 'border-t-brand-success';
          if (isOpen) borderColor = 'border-t-brand-danger';
          else if (isLowStock) borderColor = 'border-t-brand-warning';

          return (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: n * 0.1 }}
              key={n} 
              className={`glass-card p-10 flex flex-col gap-8 relative overflow-hidden border-t-4 ${borderColor}`}
            >
              <div className="absolute right-4 bottom-4 text-[120px] font-black text-white/[0.03] leading-none pointer-events-none select-none z-0">
                0{n}
              </div>

              <div className="flex justify-between items-start relative z-10">
                <div>
                  <h3 className="text-[28px] font-bold text-white mb-2">{inv?.medicine_name || 'Empty Compartment'}</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-text-muted uppercase tracking-widest">Stock:</span>
                    <span className={`text-xl font-mono font-bold ${isLowStock ? 'text-brand-warning' : 'text-text-primary'}`}>
                      {inv?.current_count || 0}
                    </span>
                  </div>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border ${
                  isOpen ? 'bg-[rgba(255,82,82,0.1)] text-brand-danger border-brand-danger/30' : 
                  'bg-[rgba(0,230,118,0.1)] text-brand-success border-brand-success/30'
                }`}>
                  {statuses[n]}
                </div>
              </div>

              <div className="flex gap-4 relative z-10 mt-auto">
                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleOpen(n)}
                  className="flex-1 h-14 bg-brand-primary hover:bg-[#1E88E5] text-white rounded-full font-bold text-sm uppercase tracking-widest transition-colors shadow-[0_0_15px_rgba(33,150,243,0.3)]"
                >
                  Open
                </motion.button>
                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleClose(n)}
                  className="flex-1 h-14 border border-white/20 hover:bg-white/10 text-white rounded-full font-bold text-sm uppercase tracking-widest transition-colors"
                >
                  Close
                </motion.button>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="flex gap-6 mt-4">
        <motion.button 
          whileTap={{ scale: 0.98 }}
          onClick={handleOpenAll}
          className="flex-1 h-20 glass-card border border-brand-primary/30 text-brand-primary hover:bg-[rgba(33,150,243,0.1)] rounded-2xl text-lg font-bold flex items-center justify-center gap-4 transition-colors"
        >
          <Box size={24} />
          Open All (Refill Mode)
        </motion.button>
        <motion.button 
          whileTap={{ scale: 0.98 }}
          onClick={handleCloseAll}
          className="flex-1 h-20 bg-[rgba(255,255,255,0.05)] border border-white/10 text-text-primary hover:bg-[rgba(255,255,255,0.1)] rounded-2xl text-lg font-bold flex items-center justify-center gap-4 transition-colors"
        >
          <LogOut size={24} className="rotate-180" />
          Close All Compartments
        </motion.button>
      </div>

      {/* First Aid Emergency Control */}
      <div className="glass-card p-8 border border-brand-danger/20 flex items-center justify-between bg-[rgba(255,82,82,0.05)]">
        <div className="flex items-center gap-6">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${isFAOpen ? 'bg-brand-danger text-white' : 'bg-[rgba(255,82,82,0.1)] text-brand-danger'}`}>
            <Activity size={32} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white uppercase tracking-widest">First Aid Emergency Control</h3>
            <p className="text-sm text-text-muted">Direct hardware override for first aid compartment</p>
          </div>
        </div>
        <div className="flex gap-4">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleOpenFA}
            disabled={isFAOpen}
            className={`h-14 px-10 rounded-full font-bold uppercase tracking-widest text-sm transition-all ${isFAOpen ? 'bg-white/5 text-text-muted cursor-not-allowed' : 'bg-brand-danger text-white shadow-[0_0_20px_rgba(255,82,82,0.4)]'}`}
          >
            Emergency Open
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleCloseFA}
            disabled={!isFAOpen}
            className={`h-14 px-10 rounded-full font-bold uppercase tracking-widest text-sm transition-all border-2 border-brand-danger text-brand-danger ${!isFAOpen ? 'opacity-30 cursor-not-allowed' : 'hover:bg-brand-danger hover:text-white'}`}
          >
            Close Now
          </motion.button>
        </div>
      </div>

      {/* Debug Panel */}
      <div className="mt-auto glass-card flex flex-col border border-white/10">
        <button 
          onClick={() => setDebugOpen(!debugOpen)}
          className="p-6 flex justify-between items-center hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3 text-text-secondary">
            <Activity size={20} />
            <span className="font-bold text-sm uppercase tracking-[0.15em]">Hardware Debug Log</span>
          </div>
          <div className="text-text-muted">
            {debugOpen ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
          </div>
        </button>
        
        <AnimatePresence>
          {debugOpen && (
            <motion.div 
              initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-6 pt-0 flex flex-col gap-6">
                <div className="h-48 overflow-y-auto bg-brand-navy rounded-xl p-4 font-mono text-[13px] border border-white/5">
                  {serialLog.length === 0 ? (
                    <div className="text-text-muted italic">No activity yet...</div>
                  ) : (
                    serialLog.map((log: any, i: number) => (
                      <div key={i} className="mb-2 flex gap-4 border-b border-white/5 pb-2 last:border-b-0">
                        <span className="text-text-muted w-24 shrink-0">[{log.timestamp}]</span>
                        <span className={`w-20 shrink-0 font-bold ${log.type === 'OUT' ? 'text-brand-secondary' : 'text-brand-success'}`}>
                          {log.type === 'OUT' ? '→ SENT' : '← RECV'}
                        </span>
                        <span className="text-text-primary">{log.msg}</span>
                      </div>
                    ))
                  )}
                </div>
                <div className="flex gap-4">
                  <input 
                    type="text" 
                    value={testCmd}
                    onChange={(e) => setTestCmd(e.target.value)}
                    placeholder="Type COMMAND..."
                    className="flex-1 h-14 bg-brand-navy border border-white/10 rounded-full px-6 font-mono text-white focus:outline-none focus:border-brand-secondary"
                  />
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      if (!testCmd) return;
                      sendCommand(testCmd);
                      const timestamp = new Date().toLocaleTimeString();
                      setSerialLog((prev: any) => [{ timestamp, type: 'OUT', msg: testCmd }, ...prev].slice(0, 20));
                      setTestCmd('');
                    }}
                    className="h-14 px-8 bg-brand-secondary hover:bg-[#00ACC1] text-brand-navy rounded-full font-bold flex items-center gap-2 uppercase tracking-widest text-sm transition-colors"
                  >
                    <Send size={18} />
                    Send
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const InventoryTab = ({ inventory, refreshInventory }: any) => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [unavailLogs, setUnavailLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getUnavailabilityLogs().then(setUnavailLogs);
  }, []);

  const handleSave = async (n: number) => {
    setLoading(true);
    const item = formData[n] || inventory.find((i: any) => i.compartment_number === n);
    
    await updateInventoryItem(item.compartment_number, item.medicine_name, item.current_count);

    await addAdminLog(`Admin updated inventory: compartment ${n} set to ${item.current_count} units`);

    setEditingId(null);
    setFormData((prev: any) => {
      const { [n]: _, ...rest } = prev;
      return rest;
    });
    refreshInventory();
    setLoading(false);
  };

  const lowStockThreshold = 5;

  return (
    <div className="flex-1 flex flex-col gap-8 overflow-y-auto pr-2 pb-8">
      
      {inventory.some((i: any) => i.current_count <= lowStockThreshold) && (
        <div className="bg-[rgba(255,179,0,0.1)] p-6 rounded-2xl border border-brand-warning/30 flex items-center gap-6">
          <AlertCircle className="text-brand-warning" size={32} />
          <p className="text-brand-warning font-bold text-sm tracking-widest uppercase">
            Low Stock Warning: Compartments {inventory.filter((i: any) => i.current_count <= lowStockThreshold).map((i: any) => i.compartment_number).join(', ')} are running low!
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-8">
        {[1, 2, 3, 4].map(n => {
          const inv = inventory.find((i: any) => i.compartment_number === n);
          const currentData = formData[n] || inv || { compartment_number: n, medicine_name: '', current_count: 0 };
          const isEditing = editingId === n;

          return (
            <div key={n} className="glass-card p-10 flex flex-col gap-6 relative">
              <span className="absolute top-8 right-8 text-6xl font-black text-white/5 select-none">0{n}</span>
              
              <div>
                <p className="text-xs font-bold text-text-muted uppercase tracking-[0.15em] mb-2">Medicine Name</p>
                {isEditing ? (
                  <input 
                    type="text" 
                    value={currentData.medicine_name}
                    onChange={(e) => setFormData({ ...formData, [n]: { ...currentData, medicine_name: e.target.value } })}
                    className="w-full h-12 bg-brand-navy border border-brand-secondary/30 rounded-xl px-4 font-bold text-white focus:outline-none focus:border-brand-secondary"
                  />
                ) : (
                  <h3 className="text-2xl font-bold text-white cursor-pointer hover:text-brand-secondary transition-colors" onClick={() => setEditingId(n)}>
                    {inv?.medicine_name || 'Tap to assign'}
                  </h3>
                )}
              </div>

              <div className="flex gap-8">
                <div className="flex-1">
                  <p className="text-xs font-bold text-text-muted uppercase tracking-[0.15em] mb-2">Stock Count</p>
                  {isEditing ? (
                    <div className="flex items-center gap-3">
                      <motion.button 
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setFormData({ ...formData, [n]: { ...currentData, current_count: Math.max(0, currentData.current_count - 1) } })}
                        className="w-12 h-12 bg-brand-navy border border-white/10 rounded-xl flex items-center justify-center text-text-primary hover:bg-white/5"
                      ><Minus size={20} /></motion.button>
                      <input 
                        type="number" 
                        value={currentData.current_count}
                        onChange={(e) => setFormData({ ...formData, [n]: { ...currentData, current_count: parseInt(e.target.value) || 0 } })}
                        className="w-20 h-12 bg-brand-navy border border-brand-secondary/30 rounded-xl px-2 text-center font-mono font-bold text-white focus:outline-none"
                      />
                      <motion.button 
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setFormData({ ...formData, [n]: { ...currentData, current_count: currentData.current_count + 1 } })}
                        className="w-12 h-12 bg-brand-navy border border-white/10 rounded-xl flex items-center justify-center text-text-primary hover:bg-white/5"
                      ><Plus size={20} /></motion.button>
                    </div>
                  ) : (
                    <div className={`text-4xl font-mono font-bold ${inv?.current_count <= lowStockThreshold ? 'text-brand-warning' : 'text-brand-secondary'}`}>
                      {inv?.current_count || 0}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-text-muted uppercase tracking-[0.15em] mb-2">Threshold</p>
                  <p className="text-4xl font-mono font-bold text-text-muted/50">{lowStockThreshold}</p>
                </div>
              </div>

              {isEditing && (
                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSave(n)}
                  disabled={loading}
                  className="h-14 mt-4 bg-brand-primary text-white rounded-full text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(33,150,243,0.3)] disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                  Save Changes
                </motion.button>
              )}
            </div>
          );
        })}
      </div>

      <div className="glass-card overflow-hidden flex flex-col mt-8">
        <div className="p-8 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
          <h3 className="text-xl font-bold text-text-primary uppercase tracking-widest">Unavailability Log</h3>
          <ClipboardList className="text-brand-secondary" size={24} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#0A1628] text-text-muted text-xs font-bold uppercase tracking-[0.15em]">
              <tr>
                <th className="px-8 py-6">Date</th>
                <th className="px-8 py-6">Patient</th>
                <th className="px-8 py-6">Disease</th>
                <th className="px-8 py-6">Medicine</th>
                <th className="px-8 py-6">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {unavailLogs.map((log: any, i) => (
                <tr key={i} className="hover:bg-white/5 transition-colors">
                  <td className="px-8 py-5 text-text-secondary text-sm font-mono">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="px-8 py-5 font-bold text-white">{log.patient_name || 'Unknown'}</td>
                  <td className="px-8 py-5 text-text-primary">{log.diagnosed_disease || '—'}</td>
                  <td className="px-8 py-5 text-brand-secondary font-bold">{log.medicine_name || '—'}</td>
                  <td className="px-8 py-5">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                      log.reason === 'out_of_stock' ? 'bg-[rgba(255,179,0,0.1)] text-brand-warning border-brand-warning/30' :
                      log.reason === 'not_dispensable' ? 'bg-[rgba(255,82,82,0.1)] text-brand-danger border-brand-danger/30' :
                      'bg-white/5 text-text-secondary border-white/10'
                    }`}>
                      {log.reason.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const PatientsTab = () => {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedSession, setExpandedSession] = useState<number | null>(null);

  useEffect(() => {
    getAllPatients().then(setPatients as any);
  }, []);

  const selectPatient = async (id: number) => {
    setLoading(true);
    const data = await getPatientFullHistory(id);
    setSelectedPatient(data);
    setLoading(false);
    setExpandedSession(null);
  };

  const filteredPatients = patients.filter((p: any) => p.name.toLowerCase().includes(search.toLowerCase()));

  const handleEmailQR = async () => {
    if (!selectedPatient) return;
    try {
      const qrDataUrl = await QRCode.toDataURL(`HEALER_PATIENT_${selectedPatient.id}`);
      await sendQRCodeEmail(selectedPatient, qrDataUrl);
      alert("QR Code emailed successfully");
    } catch (err) {
      alert("Failed to email QR Code");
    }
  };

  return (
    <div className="flex-1 flex gap-8 overflow-hidden pb-8">
      {/* Left List */}
      <div className="w-[400px] flex flex-col gap-6">
        <div className="relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
          <input 
            type="text" 
            placeholder="Search patients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-14 bg-brand-navy border border-white/10 rounded-full pl-14 pr-6 font-bold text-white focus:outline-none focus:border-brand-secondary focus:shadow-[0_0_15px_rgba(0,188,212,0.2)] transition-all"
          />
        </div>
        <div className="flex-1 glass-card overflow-y-auto p-2">
          {filteredPatients.map((p: any) => (
            <button 
              key={p.id}
              onClick={() => selectPatient(p.id)}
              className={`w-full p-4 mb-2 text-left rounded-2xl flex items-center gap-4 transition-all ${selectedPatient?.id === p.id ? 'bg-[rgba(33,150,243,0.15)] border border-brand-primary/30' : 'hover:bg-white/5 border border-transparent'}`}
            >
              <div className="w-12 h-12 bg-brand-navy rounded-full border border-white/10 flex items-center justify-center text-brand-secondary">
                <UserIcon size={20} />
              </div>
              <div className="flex-1">
                <p className={`font-bold ${selectedPatient?.id === p.id ? 'text-white' : 'text-text-primary'}`}>{p.name}</p>
                <div className="flex justify-between text-[10px] font-bold text-text-muted uppercase tracking-[0.1em] mt-1">
                  <span>{p.age} Y • {p.gender}</span>
                  <span>{new Date(p.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right Detail */}
      <div className="flex-1 glass-card overflow-hidden flex flex-col">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="animate-spin text-brand-secondary" size={48} />
          </div>
        ) : selectedPatient ? (
          <div className="flex-1 flex flex-col p-10 overflow-hidden">
            <div className="flex justify-between items-start mb-12 border-b border-white/5 pb-10">
              <div className="flex items-center gap-8">
                <div className="w-28 h-28 bg-[rgba(33,150,243,0.1)] border border-brand-primary/20 rounded-[32px] flex items-center justify-center text-brand-primary">
                  <UserIcon size={48} />
                </div>
                <div>
                  <h2 className="text-4xl font-bold text-white mb-4">{selectedPatient.name}</h2>
                  <div className="flex gap-3">
                    <span className="px-4 py-1.5 border border-white/10 text-text-secondary rounded-full text-xs font-bold uppercase tracking-widest">{selectedPatient.age} Years</span>
                    <span className="px-4 py-1.5 border border-white/10 text-text-secondary rounded-full text-xs font-bold uppercase tracking-widest">{selectedPatient.gender}</span>
                    <span className="px-4 py-1.5 border border-brand-secondary/30 bg-[rgba(0,188,212,0.1)] text-brand-secondary rounded-full text-xs font-bold uppercase tracking-widest">{selectedPatient.email}</span>
                  </div>
                </div>
              </div>
              <motion.button 
                whileTap={{ scale: 0.95 }}
                onClick={handleEmailQR}
                className="h-14 px-6 border border-brand-secondary hover:bg-[rgba(0,188,212,0.1)] text-brand-secondary rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-3 transition-colors"
              >
                <Mail size={18} />
                Email QR Code
              </motion.button>
            </div>

            <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-4 pb-4">
              <h3 className="text-sm font-bold text-text-muted uppercase tracking-[0.2em] mb-2">Medical History & Sessions</h3>
              {selectedPatient.sessions.map((s: any) => (
                <div key={s.id} className="border border-white/10 bg-brand-navy/50 rounded-3xl overflow-hidden">
                  <button 
                    onClick={() => setExpandedSession(expandedSession === s.id ? null : s.id)}
                    className={`w-full p-6 flex justify-between items-center transition-colors hover:bg-white/5 ${expandedSession === s.id ? 'bg-white/5' : ''}`}
                  >
                    <div className="flex items-center gap-8 text-left">
                      <div className="min-w-[100px] border-r border-white/10 pr-6">
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">{new Date(s.timestamp).toLocaleDateString()}</p>
                        <p className="text-xl font-mono font-bold text-white">{new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-brand-secondary mb-1">{s.diagnosed_disease}</h4>
                        <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">
                          Confidence: <span className={s.confidence_score >= 70 ? 'text-brand-success' : s.confidence_score >= 50 ? 'text-brand-primary' : 'text-brand-warning'}>
                            {s.confidence_score >= 70 ? 'High' : s.confidence_score >= 50 ? 'Moderate' : 'Review'}
                          </span> <span className="mx-2 opacity-30">•</span> Action: <span className="text-brand-primary">{s.action_taken}</span>
                        </p>
                      </div>
                    </div>
                    {expandedSession === s.id ? <ChevronUp size={24} className="text-text-muted" /> : <ChevronDown size={24} className="text-text-muted" />}
                  </button>

                  <AnimatePresence>
                    {expandedSession === s.id && (
                      <motion.div 
                        initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                        className="overflow-hidden bg-[#0A1628] border-t border-white/10"
                      >
                        <div className="p-8 grid grid-cols-2 gap-12">
                          <div className="flex flex-col gap-6">
                            <h5 className="font-bold text-text-muted text-[10px] uppercase tracking-[0.2em] flex items-center gap-2"><Package size={14}/> Prescriptions & Dispensing</h5>
                            <div className="flex flex-col gap-3">
                              {s.prescriptions.map((p: any, i: number) => {
                                const disp = s.dispenses.find((d: any) => d.medicine_name === p.medicine_name);
                                return (
                                  <div key={i} className="glass-card !bg-white/5 !border-white/5 p-4 flex justify-between items-center">
                                    <div>
                                      <p className="font-bold text-white text-sm">{p.medicine_name}</p>
                                      <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-1">{p.dosage} • {p.frequency}</p>
                                    </div>
                                    {disp ? (
                                      <span className="text-brand-success text-[10px] font-bold uppercase tracking-widest border border-brand-success/30 bg-[rgba(0,230,118,0.1)] px-3 py-1 rounded-full">Dispensed</span>
                                    ) : (
                                      <span className="text-text-secondary text-[10px] font-bold uppercase tracking-widest border border-white/10 bg-white/5 px-3 py-1 rounded-full">Pending</span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-6">
                            <h5 className="font-bold text-text-muted text-[10px] uppercase tracking-[0.2em]">AI & Alternatives Detail</h5>
                            <div className="glass-card !bg-white/5 !border-white/5 p-6">
                              <p className="text-xs font-bold text-text-primary mb-6 flex justify-between items-center uppercase tracking-widest border-b border-white/5 pb-4">
                                AI Analysis Used <span className={s.ai_used ? 'text-brand-success' : 'text-text-muted'}>{s.ai_used ? 'YES' : 'NO'}</span>
                              </p>
                              <div className="flex flex-col gap-4">
                                {JSON.parse(s.top_alternatives || '[]').map((alt: any, i: number) => (
                                  <div key={i} className="flex flex-col gap-2">
                                    <div className="flex justify-between text-[10px] font-bold text-text-secondary uppercase tracking-widest">
                                      <span>{alt.disease}</span>
                                      <span className="text-brand-secondary">{alt.score}%</span>
                                    </div>
                                    <div className="w-full h-1 bg-brand-navy rounded-full overflow-hidden">
                                      <div className={`h-full ${i === 0 ? 'bg-brand-primary glow' : 'bg-brand-secondary'}`} style={{ width: `${alt.score}%` }} />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-20 text-center text-text-muted">
            <Users size={80} strokeWidth={1} className="mb-6 opacity-30" />
            <h3 className="text-2xl font-bold mb-2 tracking-wide text-white">Select a Patient</h3>
            <p className="text-sm font-medium tracking-wide">To view their full medical history and session details.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const AnalyticsTab = () => {
  const [diseaseData, setDiseaseData] = useState([]);
  const [dailyVolume, setDailyVolume] = useState([]);
  const [topMeds, setTopMeds] = useState([]);
  const [unavailData, setUnavailData] = useState([]);

  useEffect(() => {
    getAnalyticsDiseases().then(setDiseaseData as any);
    getAnalyticsDailyVolume().then(setDailyVolume as any);
    getAnalyticsTopMedicines().then(setTopMeds as any);
    getAnalyticsUnavailability().then(setUnavailData as any);
  }, []);

  const COLORS = ['#2196F3', '#00BCD4', '#0288D1', '#0097A7', '#1E88E5'];

  return (
    <div className="flex-1 grid grid-cols-2 gap-8 overflow-y-auto pr-2 pb-8">
      
      <div className="glass-card p-8 flex flex-col min-h-[400px]">
        <h3 className="text-sm font-bold text-text-muted mb-8 uppercase tracking-[0.15em]">Disease Distribution</h3>
        <div className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={diseaseData}
                innerRadius={60} outerRadius={110} paddingAngle={2}
                dataKey="value" stroke="none"
              >
                {diseaseData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#0F2040', borderColor: 'rgba(33,150,243,0.3)', color: '#fff', borderRadius: '12px' }} itemStyle={{ color: '#00BCD4' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-card p-8 flex flex-col min-h-[400px]">
        <h3 className="text-sm font-bold text-text-muted mb-8 uppercase tracking-[0.15em]">Daily Dispense Volume</h3>
        <div className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyVolume}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" stroke="#546E7A" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#546E7A" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#0F2040', borderColor: 'rgba(33,150,243,0.3)', color: '#fff', borderRadius: '12px' }} />
              <Line type="monotone" dataKey="value" stroke="#00BCD4" strokeWidth={3} dot={{ r: 4, fill: '#00BCD4', strokeWidth: 2, stroke: '#0F2040' }} activeDot={{ r: 6, fill: '#fff' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-card p-8 flex flex-col min-h-[400px]">
        <h3 className="text-sm font-bold text-text-muted mb-8 uppercase tracking-[0.15em]">Most Dispensed Medicines</h3>
        <div className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topMeds} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" stroke="#90CAF9" fontSize={12} width={120} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#0F2040', borderColor: 'rgba(33,150,243,0.3)', color: '#fff', borderRadius: '12px' }} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
              <Bar dataKey="value" fill="#2196F3" radius={[0, 6, 6, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-card p-8 flex flex-col min-h-[400px]">
        <h3 className="text-sm font-bold text-text-muted mb-8 uppercase tracking-[0.15em]">Unavailability Reasons</h3>
        <div className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={unavailData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" stroke="#546E7A" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#546E7A" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#0F2040', borderColor: 'rgba(255,82,82,0.3)', color: '#fff', borderRadius: '12px' }} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
              <Bar dataKey="value" fill="#FF5252" radius={[6, 6, 0, 0]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};

const SettingsTab = () => {
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    getAllSettings().then(setFormData);
  }, []);

  const handleSave = async () => {
    setLoading(true);
    setSaveStatus('saving');
    const entries = Object.entries(formData);
    for (const [key, value] of entries) {
      await setSetting(key, value as string);
    }
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 3000);
    setLoading(false);
  };

  return (
    <div className="flex-1 flex flex-col glass-card p-12 overflow-y-auto w-full max-w-5xl mx-auto mb-8">
      <h3 className="text-3xl font-bold text-text-primary mb-12 flex justify-between items-center border-b border-white/10 pb-6">
        System Configuration
        <SettingsIcon size={32} className="text-brand-secondary" />
      </h3>

      <div className="grid grid-cols-2 gap-x-12 gap-y-10">
        {[
          { key: 'clinic_name', label: 'Clinic Name', type: 'text', icon: <Box size={18} /> },
          { key: 'doctor_email', label: 'Doctor Email', type: 'email', icon: <Mail size={18} /> },
          { key: 'doctor_phone', label: 'Doctor WhatsApp Phone', type: 'tel', icon: <ExternalLink size={18} /> },
          { key: 'admin_pin', label: 'Admin PIN', type: 'password', icon: <Shield size={18} /> },
          { key: 'low_stock_threshold', label: 'Low Stock Threshold', type: 'number', icon: <AlertCircle size={18} /> },
          { key: 'ai_api_key', label: 'AI API Key', type: 'password', icon: <Shield size={18} /> },
        ].map((field) => (
          <div key={field.key} className="flex flex-col gap-3 relative group">
            <label className="text-xs font-bold text-text-muted uppercase tracking-[0.15em] flex items-center gap-2 group-focus-within:text-brand-secondary transition-colors">
              {field.icon}
              {field.label}
            </label>
            <input 
              type={field.type}
              value={formData[field.key] || ''}
              onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
              className="h-14 bg-brand-navy border border-white/10 rounded-xl px-5 font-mono text-white focus:outline-none focus:border-brand-secondary focus:shadow-[0_0_15px_rgba(0,188,212,0.2)] transition-all"
            />
          </div>
        ))}
      </div>

      <div className="mt-16 pt-10 border-t border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-4 h-10">
          <AnimatePresence>
            {saveStatus === 'saved' && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2 text-brand-success font-bold text-sm uppercase tracking-widest"
              >
                <CheckCircle2 size={20} />
                Saved successfully
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={handleSave}
          disabled={loading}
          className="h-16 px-12 bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded-full text-sm uppercase tracking-widest font-bold shadow-[0_4px_20px_rgba(33,150,243,0.4)] flex items-center gap-3 disabled:opacity-50 transition-all hover:shadow-[0_8px_30px_rgba(33,150,243,0.6)]"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
          Save Configuration
        </motion.button>
      </div>
    </div>
  );
};

export const AdminDashboardScreen = () => {
  const navigate = useNavigate();
  const { hwStatus, hwMode, hwError } = useAppContext();
  const [activeTab, setActiveTab] = useState<'compartments'|'inventory'|'patients'|'analytics'|'settings'>('compartments');
  const [inventory, setInventory] = useState([]);
  const [serialLog, setSerialLog] = useState<{ timestamp: string; type: 'IN' | 'OUT'; msg: string }[]>([]);
  const [showHwModal, setShowHwModal] = useState(false);

  const refreshInventory = () => {
    getInventory().then(setInventory as any);
  };

  useEffect(() => {
    refreshInventory();
  }, []);

  const handleLogout = () => {
    addAdminLog(`Admin logout [${new Date().toISOString()}]`).catch(() => {});
    navigate('/');
  };

  const tabs = [
    { id: 'compartments', label: 'Hardware', icon: <Box size={20} /> },
    { id: 'inventory', label: 'Inventory', icon: <ClipboardList size={20} /> },
    { id: 'patients', label: 'Patients', icon: <Users size={20} /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart4 size={20} /> },
    { id: 'settings', label: 'Settings', icon: <SettingsIcon size={20} /> },
  ] as const;

  return (
    <div className="w-full h-full bg-brand-navy flex flex-col overflow-y-auto font-sans text-text-primary pl-8 pr-8 pb-8 pt-6 scrollbar-thin scrollbar-thumb-brand-primary">
      <AnimatePresence>
        {showHwModal && <HardwareModal isOpen={showHwModal} onClose={() => setShowHwModal(false)} />}
      </AnimatePresence>

      {/* Top Bar */}
      <div className="flex justify-between items-center mb-8 z-30">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-brand-primary/20 rounded-xl flex items-center justify-center text-brand-primary border border-brand-primary/30">
            <Shield size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-wide leading-none mb-1">Admin Dashboard</h1>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">H.E.A.L.E.R OS Core</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowHwModal(true)}
            className={`h-12 px-6 rounded-full flex items-center gap-3 border transition-all ${
              hwStatus === 'connected' ? 'bg-brand-success/10 border-brand-success text-brand-success' : 
              hwStatus === 'connecting' ? 'bg-brand-warning/10 border-brand-warning text-brand-warning shadow-[0_0_15px_rgba(255,179,0,0.2)] animate-pulse' :
              'bg-brand-danger/10 border-brand-danger text-brand-danger shadow-[0_0_15px_rgba(255,82,82,0.2)]'
            }`}
          >
            <Activity size={18} />
            <span className="text-xs font-bold uppercase tracking-widest whitespace-nowrap">
              Hardware {hwStatus === 'connected' ? 'Online' : hwStatus === 'connecting' ? 'Connecting...' : 'Offline'}
              <span className="ml-2 opacity-60 font-medium lowercase">({hwMode})</span>
            </span>
          </motion.button>

          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="h-12 px-6 bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-text-muted border border-white/10 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all"
          >
            <LogOut size={16} />
            Logout
          </motion.button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-8 z-20 flex justify-center">
        <div className="bg-[rgba(15,32,64,0.5)] p-1.5 rounded-full flex gap-1 border border-white/5 relative shadow-inner">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`relative h-12 px-8 rounded-full flex items-center gap-2 transition-colors font-bold text-sm tracking-wide z-10 ${
                activeTab === tab.id ? 'text-white' : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {activeTab === tab.id && (
                <motion.div 
                  layoutId="activeTabIndicator"
                  className="absolute inset-0 bg-brand-primary rounded-full shadow-[0_0_15px_rgba(33,150,243,0.5)]"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  style={{ zIndex: -1 }}
                />
              )}
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col pt-2 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col h-full overflow-hidden"
          >
            {activeTab === 'compartments' && (
              <CompartmentsTab 
                inventory={inventory} 
                setInventory={setInventory} 
                serialLog={serialLog} 
                setSerialLog={setSerialLog} 
              />
            )}
            {activeTab === 'inventory' && (
              <InventoryTab 
                inventory={inventory} 
                refreshInventory={refreshInventory} 
              />
            )}
            {activeTab === 'patients' && <PatientsTab />}
            {activeTab === 'analytics' && <AnalyticsTab />}
            {activeTab === 'settings' && <SettingsTab />}
          </motion.div>
        </AnimatePresence>
      </div>

    </div>
  );
};
