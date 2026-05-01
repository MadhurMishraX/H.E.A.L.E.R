/**
 * Utility for Serial Communication with Arduino.
 * Uses Web Serial API.
 */

let port: SerialPort | null = null;
let writer: WritableStreamDefaultWriter<any> | null = null;
let reader: ReadableStreamDefaultReader<any> | null = null;
let keepReading = true;
let communicationMode: 'serial' | 'wifi' = 'serial';
let espIp = '192.168.4.1'; 
let wifiPollingInterval: NodeJS.Timeout | null = null;
let isScanning = false;

export function setCommunicationMode(mode: 'serial' | 'wifi', ip?: string) {
  communicationMode = mode;
  if (ip) espIp = ip;
  console.log(`Communication mode set to: ${mode} (${espIp})`);

  // Handle Polling Lifecycle
  if (mode === 'wifi') {
    if (!wifiPollingInterval) {
      console.log("[Comm] Starting WiFi Polling (Ultra-Fast 200ms)...");
      wifiPollingInterval = setInterval(pollWiFiMessages, 200); // Check 5 times per second
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

export async function initSerial(auto = false) {
  if (!('serial' in navigator)) {
    console.warn("Web Serial API not supported in this browser.");
    return { success: false, error: 'Not supported' };
  }

  // Safety: If there is an existing port, try to close it first
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
    startReading(); // Start async read loop
    
    // Proactively ping every second until we get a response (up to 5 times)
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
  } catch (err) {
    console.error("Failed to init serial:", err);
    return { success: false, error: err };
  }
}

let listeners = new Set<(msg: string) => void>();

export function onMessage(callback: (msg: string) => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

async function startReading() {
  if (!port || !port.readable) return;
  
  reader = port.readable.getReader();
  const decoder = new TextDecoder();

  try {
    let buffer = '';
    while (keepReading) {
      const { value, done } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      if (buffer.includes('\n')) {
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed) {
            console.log(`SERIAL RECV: ${trimmed}`);
            listeners.forEach(cb => cb(trimmed));
          }
        }
      }
    }
  } catch (err) {
    console.error("Serial Read Error:", err);
  } finally {
    reader.releaseLock();
  }
}

/**
 * Sends a command to the hardware via the selected mode (Serial or WiFi)
 */
export async function sendCommand(command: string) {
  console.log(`[Comm] Mode: ${communicationMode} | Command: ${command}`);
  
  if (communicationMode === 'wifi') {
    return sendWiFiCommand(command);
  }

  if (!writer) {
    console.error("[Comm] Error: Serial not connected");
    return;
  }
  
  const fullCommand = command.endsWith('\n') ? command : `${command}\n`;
  const encoder = new TextEncoder();
  await writer.write(encoder.encode(fullCommand));
  console.log(`[Comm] SENT (SERIAL): ${fullCommand.trim()}`);
}

/**
 * Tests if the ESP32-CAM is reachable
 */
export const checkWiFiConnection = async (): Promise<boolean> => {
  console.log(`[Comm] Testing WiFi connection to: ${espIp}`);
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 2000); // 2s timeout
    const response = await fetch(`http://${espIp}/ping`, { 
      signal: controller.signal,
      mode: 'no-cors' // Allow hitting local IPs even without full CORS
    });
    clearTimeout(id);
    console.log("[Comm] WiFi Connection Verified!");
    return true;
  } catch (err) {
    console.warn("[Comm] WiFi Connection Failed", err);
    return false;
  }
};

/**
 * Smart Discovery: Scans local network for the ESP32
 */
export const discoverHardware = async (onProgress?: (msg: string) => void): Promise<string | null> => {
  if (isScanning) return null;
  isScanning = true;
  
  const subnets = ['192.168.1', '192.168.0', '192.168.4', '10.0.0'];
  const range = Array.from({ length: 40 }, (_, i) => i + 1); // Scan first 40 IPs
  
  for (const subnet of subnets) {
    onProgress?.(`Scanning subnet ${subnet}.x...`);
    
    // Scan in batches of 10 to avoid browser throttling
    const batches = [range.slice(0, 10), range.slice(10, 20), range.slice(20, 30), range.slice(30, 40)];
    
    for (const batch of batches) {
      const results = await Promise.all(batch.map(async (num) => {
        const testIp = `${subnet}.${num}`;
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 800); // Very fast 800ms ping
          await fetch(`http://${testIp}/ping`, { signal: controller.signal, mode: 'no-cors' });
          clearTimeout(timer);
          return testIp;
        } catch {
          return null;
        }
      }));
      
      const found = results.find(r => r !== null);
      if (found) {
        console.log(`[Comm] Hardware found at: ${found}`);
        espIp = found;
        isScanning = false;
        return found;
      }
    }
  }
  
  isScanning = false;
  return null;
};

/**
 * Sends a command over WiFi to the ESP32-CAM relay
 */
async function sendWiFiCommand(command: string) {
  const url = `http://${espIp}/cmd?v=${encodeURIComponent(command)}`;
  console.log(`[Comm] Sending WiFi Request to: ${url}`);
  
  try {
    // Note: 'no-cors' is used because ESP servers often don't support CORS headers
    await fetch(url, { 
      mode: 'no-cors',
      method: 'GET',
      cache: 'no-cache'
    });
    console.log(`[Comm] WIFI REQUEST SENT (Check ESP LEDs)`);
    return true;
  } catch (err) {
    console.error("[Comm] WiFi Fetch Error:", err);
    return false;
  }
}

/**
 * NEW: Polls the ESP for incoming serial messages (RFID, etc.)
 */
async function pollWiFiMessages() {
  if (communicationMode !== 'wifi') return;
  
  try {
    const url = `http://${espIp}/getMsg`;
    const response = await fetch(url, { cache: 'no-cache' });
    if (response.ok) {
      const text = await response.text();
      const trimmed = text.trim();
      if (trimmed) {
        console.log(`[Comm] WIFI RECV: ${trimmed}`);
        listeners.forEach(cb => cb(trimmed));
      }
    }
  } catch (err) {
    // Silence errors during polling to avoid console spam if ESP is momentarily unreachable
  }
}

export async function closeSerial() {
  keepReading = false;
  if (reader) {
    await reader.cancel();
    reader = null;
  }
  if (writer) {
    writer.releaseLock();
    writer = null;
  }
  if (port) {
    await port.close();
    port = null;
  }
  console.log("Serial Closed");
}
