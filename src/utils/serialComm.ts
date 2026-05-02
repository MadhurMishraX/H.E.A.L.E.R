/**
 * Utility for Serial Communication with Arduino.
 * Supports Web Serial API and Wi-Fi (via ESP32).
 */

type ConnectionType = 'usb' | 'wifi' | 'simulated';

let port: any = null;
let writer: any = null;
let reader: any = null;
let keepReading = true;
let readPromise: Promise<void> | null = null;
let wifiPollInterval: number | null = null;

let _connType: ConnectionType = (localStorage.getItem('hw_conn_type') as ConnectionType) || 'simulated';
let _wifiUrl: string = localStorage.getItem('hw_conn_url') || 'http://healer-esp32.local';
let messageCallback: ((msg: string) => void) | null = null;

export function updateHardwareConfig(type: ConnectionType, url?: string) {
  _connType = type;
  localStorage.setItem('hw_conn_type', type);
  if (url) {
    _wifiUrl = url;
    localStorage.setItem('hw_conn_url', url);
  }
}

export function getHardwareConfig() {
  return { type: _connType, url: _wifiUrl };
}

export async function initSerial() {
  if (_connType === 'wifi') {
    return await initWifi();
  } else if (_connType === 'usb') {
    return await initWebSerial();
  } else {
    console.log("Serial Initialized (Simulated)");
    setTimeout(() => simulateInbound("ARDUINO_READY"), 1000);
    return { success: true };
  }
}

async function initWifi() {
  try {
    const res = await fetch(`${_wifiUrl}/ping`, { method: 'GET', mode: 'cors' });
    if (res.ok) {
      startWifiPolling();
      return { success: true };
    }
    return { success: false, error: 'Ping failed' };
  } catch (err: any) {
    console.error("WiFi init failed:", err);
    return { success: false, error: err.message || 'Connection refused' };
  }
}

function startWifiPolling() {
  if (wifiPollInterval) clearInterval(wifiPollInterval);
  wifiPollInterval = window.setInterval(async () => {
    try {
      const res = await fetch(`${_wifiUrl}/messages`, { method: 'GET', mode: 'cors' });
      const msgs = await res.json();
      if (Array.isArray(msgs)) {
        msgs.forEach(msg => {
          if (msg && messageCallback) messageCallback(msg);
        });
      }
    } catch(e) {
      // ignore poll errors
    }
  }, 1000); // poll every 1s
}

async function initWebSerial() {
  if (!('serial' in navigator)) {
    console.warn("Web Serial API not supported in this browser.");
    return { success: false, error: 'Not supported' };
  }
  try {
    const requestOptions = {
        filters: [{ usbVendorId: 0x2341 }] // Arduino vendor ID
    };
    // If not already authorized, this might fail without user gesture.
    // Assuming the user already authorized or we are auto-connecting
    const ports = await (navigator as any).serial.getPorts();
    if (ports.length > 0) {
      port = ports[0];
      await port.open({ baudRate: 9600 });
      writer = port.writable.getWriter();
      keepReading = true;
      readPromise = readUntilClosed();
      return { success: true };
    }
    return { success: false, error: 'No authorized port found. Click connect in settings.' };
  } catch (err: any) {
    console.error("Failed to init Web Serial:", err);
    return { success: false, error: err.message };
  }
}

export async function requestWebSerialPort() {
  try {
    port = await (navigator as any).serial.requestPort();
    await port.open({ baudRate: 9600 });
    writer = port.writable.getWriter();
    keepReading = true;
    readPromise = readUntilClosed();
    return { success: true };
  } catch(err: any) {
    return { success: false, error: err.message };
  }
}

async function readUntilClosed() {
  while (port && port.readable && keepReading) {
    reader = port.readable.getReader();
    try {
      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += new TextDecoder().decode(value);
        let newlineIndex = buffer.indexOf('\n');
        while (newlineIndex >= 0) {
          const msg = buffer.slice(0, newlineIndex).trim();
          buffer = buffer.slice(newlineIndex + 1);
          if (msg && messageCallback) {
            console.log(`SERIAL RECV [USB]: ${msg}`);
            messageCallback(msg);
          }
          newlineIndex = buffer.indexOf('\n');
        }
      }
    } catch (error) {
      console.error("Read error:", error);
    } finally {
      reader.releaseLock();
    }
  }
}

export async function sendCommand(command: string) {
  const fullCommand = command.endsWith('\n') ? command : `${command}\n`;
  console.log(`SERIAL SEND [${_connType}]: ${command}`);

  if (_connType === 'wifi') {
    try {
      await fetch(`${_wifiUrl}/command?cmd=${encodeURIComponent(command)}`, { mode: 'cors' });
    } catch(err) {
      console.error("Failed to send command over wifi", err);
    }
  } else if (_connType === 'usb') {
    if (writer) {
      await writer.write(new TextEncoder().encode(fullCommand));
    }
  } else {
    // Simulated
    if (command.includes("OPEN_FA")) {
      setTimeout(() => simulateInbound(`ACK_OPEN_FA`), 500);
    } else if (command.includes("CLOSE_FA")) {
      setTimeout(() => simulateInbound(`ACK_CLOSE_FA`), 500);
    } else if (command.includes("OPEN")) {
      const num = command.split('_')[1]?.trim();
      setTimeout(() => simulateInbound(`ACK_OPEN_${num}`), 500);
    } else if (command.includes("CLOSE")) {
      const num = command.split('_')[1]?.trim();
      setTimeout(() => simulateInbound(`ACK_CLOSE_${num}`), 500);
    } else if (command.includes("CAM_ON")) {
      setTimeout(() => simulateInbound(`ACK_CAM_ON`), 200);
    } else if (command.includes("CAM_OFF")) {
      setTimeout(() => simulateInbound(`ACK_CAM_OFF`), 200);
    }
  }
}

export function onMessage(callback: (msg: string) => void) {
  messageCallback = callback;
}

function simulateInbound(msg: string) {
  console.log(`SERIAL RECV: ${msg}`);
  if (messageCallback) {
    messageCallback(msg);
  }
}

export async function closeSerial() {
  console.log("Serial Closed");
  if (wifiPollInterval) {
    clearInterval(wifiPollInterval);
    wifiPollInterval = null;
  }
  keepReading = false;
  if (reader) {
    await reader.cancel();
  }
  if (readPromise) {
    await readPromise;
  }
  if (writer) {
    await writer.close();
    writer = null;
  }
  if (port) {
    await port.close();
    port = null;
  }
}
