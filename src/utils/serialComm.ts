/**
 * Utility for Serial Communication with Arduino.
 * Uses Web Serial API.
 */

let port: SerialPort | null = null;
let writer: WritableStreamDefaultWriter<any> | null = null;
let reader: ReadableStreamDefaultReader<any> | null = null;
let keepReading = true;
let communicationMode: 'serial' | 'wifi' = 'serial';
let espIp = localStorage.getItem('healer_esp_ip') || 'healer.local'; 
let wifiPollingInterval: NodeJS.Timeout | null = null;
let isScanning = false;

export function setCommunicationMode(mode: 'serial' | 'wifi', ip?: string) {
  communicationMode = mode;
  if (ip) {
    espIp = ip;
    localStorage.setItem('healer_esp_ip', ip);
  }
  console.log(`[Comm] Mode: ${mode} | Target: ${espIp}`);

  // Handle Polling Lifecycle
  if (mode === 'wifi') {
    if (!wifiPollingInterval) {
      console.log("[Comm] Starting WiFi Polling (200ms)...");
      wifiPollingInterval = setInterval(pollWiFiMessages, 200); 
    }
  } else {
    if (wifiPollingInterval) {
      clearInterval(wifiPollingInterval);
      wifiPollingInterval = null;
      console.log("[Comm] Stopped WiFi Polling.");
    }
  }
}

export function isConnected() {
  return port !== null && port.readable !== null && writer !== null;
}

let isConnecting = false;

export async function initSerial(auto = false): Promise<{success: boolean, msg?: string, error?: any}> {
  if (isConnecting) return { success: false, msg: "Connection in progress..." };
  if (communicationMode === 'wifi') return { success: true }; 
  
  if (port && port.readable && writer) {
    return { success: true, msg: "Already connected" };
  }

  isConnecting = true;
  
  if (!('serial' in navigator)) {
    console.warn("Web Serial API not supported in this browser.");
    isConnecting = false;
    return { success: false, error: 'Not supported' };
  }

  if (port) {
    try {
      await closeSerial();
    } catch (e) {
      console.warn("Cleanup of old port failed:", e);
    }
  }

  try {
    if (auto) {
      const ports = await navigator.serial.getPorts();
      if (ports.length > 0) {
        port = ports[0];
      } else {
        return { success: false, error: 'No authorized ports found' };
      }
    } else {
      port = await navigator.serial.requestPort();
    }

    await port.open({ baudRate: 9600 });
    
    keepReading = true;
    writer = port.writable!.getWriter();
    startReading(); 
    
    let pings = 0;
    const pingInterval = setInterval(() => {
      if (pings >= 5 || port === null) {
        clearInterval(pingInterval);
      } else {
        sendCommand("PING");
        pings++;
      }
    }, 1000);
    
    console.log(`Serial Connected Successfully @ 9600 (Auto: ${auto})`);
    return { success: true };
  } catch (err: any) {
    if (err.name === 'NotFoundError') {
      console.warn("[Serial] User cancelled the port selection dialog.");
      return { success: false, msg: "No port selected" };
    }
    console.error("Failed to init serial:", err);
    return { success: false, msg: err.message || "Unknown error" };
  } finally {
    isConnecting = false;
  }
}

let listeners = new Set<(msg: string) => void>();

export function onMessage(callback: (msg: string) => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

let inputBuffer = '';

async function startReading() {
  if (!port || !port.readable) return;
  
  reader = port.readable.getReader();
  try {
    while (keepReading) {
      const { value, done } = await reader.read();
      if (done) break;
      
      const decoded = new TextDecoder().decode(value);
      inputBuffer += decoded;

      // Process lines (Arduino usually sends \n or \r\n)
      if (inputBuffer.includes('\n') || inputBuffer.includes('\r')) {
        const lines = inputBuffer.split(/\r?\n/);
        // The last element might be an incomplete line, keep it in buffer
        inputBuffer = lines.pop() || '';

        for (const line of lines) {
          const cleanLine = line.trim();
          if (cleanLine) {
            console.log(`[Serial RECV] ${cleanLine}`);
            listeners.forEach(cb => cb(cleanLine));
          }
        }
      }
    }
  } catch (err) {
    console.error("Read error:", err);
  } finally {
    if (reader) {
      reader.releaseLock();
      reader = null;
    }
  }
}

export async function discoverHardware(): Promise<string | null> {
  if (isScanning) return null;
  isScanning = true;
  console.log("[Radar] Starting hardware discovery...");

  const baseIP = "192.168.1."; 
  const range = Array.from({ length: 20 }, (_, i) => i + 1); 

  for (const i of range) {
    const ip = `${baseIP}${i}`;
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 100); 
      
      await fetch(`http://${ip}/ping`, { 
        mode: 'no-cors',
        signal: controller.signal 
      });
      
      clearTimeout(id);
      console.log(`[Radar] Found potential hardware at ${ip}`);
      isScanning = false;
      return ip;
    } catch (e) {}
  }

  try {
    await fetch(`http://healer.local/ping`, { mode: 'no-cors' });
    isScanning = false;
    return "healer.local";
  } catch (e) {}

  isScanning = false;
  return null;
}

export async function sendCommand(command: string) {
  const fullCommand = command.endsWith('\n') ? command : `${command}\n`;
  
  if (communicationMode === 'wifi') {
    try {
      // SYNCED WITH FIRMWARE: uses /cmd?v=
      console.log(`[WiFi] Sending: ${command} to http://${espIp}/cmd`);
      await fetch(`http://${espIp}/cmd?v=${encodeURIComponent(command.trim())}`, { 
        mode: 'no-cors',
        cache: 'no-cache'
      });
      console.log(`[WiFi] Success`);
    } catch (err) {
      console.error("[WiFi] Send failed:", err);
    }
    return;
  }

  // Serial Mode
  if (!writer) {
    console.warn("Serial not connected. Command ignored:", command);
    return;
  }
  
  try {
    const data = new TextEncoder().encode(fullCommand);
    await writer.write(data);
    console.log(`[Serial] Sent: ${fullCommand.trim()}`);
  } catch (err) {
    console.error("Failed to send command:", err);
  }
}

async function pollWiFiMessages() {
  if (communicationMode !== 'wifi') return;
  
  try {
    // SYNCED WITH FIRMWARE: uses /getMsg
    const res = await fetch(`http://${espIp}/getMsg`);
    const data = await res.text();
    if (data && data.length > 0) {
      console.log(`[WiFi RECV] ${data}`);
      listeners.forEach(cb => cb(data));
    }
  } catch (e) {}
}

export async function checkWiFiConnection(): Promise<boolean> {
  console.log(`[WiFi] Verifying connection to ${espIp}...`);
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 3000); // Increased to 3s
    
    const res = await fetch(`http://${espIp}/getMsg`, { 
      mode: 'cors', // Firmware supports CORS
      signal: controller.signal 
    });
    
    clearTimeout(id);
    if (res.ok) {
      console.log("[WiFi] Connection Verified! Machine is online.");
      return true;
    }
    console.warn(`[WiFi] Machine responded but with error code: ${res.status}`);
    return false;
  } catch (e: any) {
    if (e.name === 'AbortError') {
      console.warn("[WiFi] Connection TIMED OUT. Machine is too slow or IP is wrong.");
    } else {
      console.error("[WiFi] Connection REFUSED. Check if IP is correct and Machine is on the same WiFi.");
    }
    return false;
  }
}

export async function closeSerial() {
  keepReading = false;
  if (reader) await reader.cancel();
  if (writer) {
    writer.releaseLock();
    writer = null;
  }
  if (port) {
    await port.close();
    port = null;
  }
  console.log("Serial Connection Closed.");
}

