/**
 * H.E.A.L.E.R - Dual Mode Serial Communication (USB & Bluetooth)
 * -------------------------------------------------------------
 */

export type ConnectionType = 'usb' | 'bluetooth' | 'none';
export type HardwareStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

let port: any = null;
let reader: any = null;
let writer: any = null;
let bleDevice: BluetoothDevice | null = null;
let bleCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;

let keepReading = true;
let _connType: ConnectionType = 'none';
let _status: HardwareStatus = 'disconnected';

// BLE UUIDs (Must match ESP32)
const SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const RX_UUID = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';
const TX_UUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';

/**
 * Initialize Hardware Connection (Auto-reconnect for USB)
 */
export async function initHardware(type: ConnectionType): Promise<{ success: boolean; error?: string }> {
  _connType = type;
  updateStatus('connecting');
  
  if (type === 'usb') {
    return await initWebSerial();
  } else if (type === 'bluetooth') {
    return await initWebBluetooth();
  }
  
  updateStatus('disconnected');
  return { success: false, error: 'INVALID_TYPE' };
}

async function initWebSerial() {
  if (!('serial' in navigator)) return { success: false, error: 'Not supported' };
  try {
    const ports = await (navigator as any).serial.getPorts();
    if (ports.length > 0) {
      port = ports[0];
      await port.open({ baudRate: 9600 });
      await port.setSignals({ dataTerminalReady: true, requestToSend: true });
      await new Promise(r => setTimeout(r, 2000));
      if (port.writable) writer = port.writable.getWriter();
      startReading();
      updateStatus('connected');
      return { success: true };
    }
    updateStatus('disconnected');
    return { success: false, error: 'NEEDS_USER_GESTURE' };
  } catch (err: any) {
    updateStatus('error', err.message);
    return { success: false, error: err.message };
  }
}

async function initWebBluetooth() {
  if (!('bluetooth' in navigator)) return { success: false, error: 'Not supported' };
  if (!bleDevice) {
    updateStatus('disconnected');
    return { success: false, error: 'NEEDS_USER_GESTURE' };
  }
  try {
    const server = await bleDevice.gatt?.connect();
    const service = await server?.getPrimaryService(SERVICE_UUID);
    bleCharacteristic = await service?.getCharacteristic(RX_UUID) || null;
    
    const txChar = await service?.getCharacteristic(TX_UUID);
    await txChar?.startNotifications();
    txChar?.addEventListener('characteristicvaluechanged', (event: any) => {
      const value = new TextDecoder().decode(event.target.value).trim();
      if (value) dispatchMessage(value);
    });

    updateStatus('connected');
    return { success: true };
  } catch (err: any) {
    updateStatus('error', err.message);
    return { success: false, error: err.message };
  }
}

export async function requestBluetoothDevice() {
  try {
    bleDevice = await navigator.bluetooth.requestDevice({
      filters: [{ name: 'HEALER-ROBOT' }],
      optionalServices: [SERVICE_UUID]
    });
    _connType = 'bluetooth'; // Update mode here
    return await initWebBluetooth();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function requestWebSerialPort() {
  try {
    port = await (navigator as any).serial.requestPort();
    _connType = 'usb'; // Update mode here
    return await initWebSerial();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

let isProcessingQueue = false;
const commandQueue: string[] = [];

export async function sendCommand(command: string) {
  const fullCommand = command.endsWith('\n') ? command : `${command}\n`;
  commandQueue.push(fullCommand);
  processQueue();
}

async function processQueue() {
  if (isProcessingQueue || commandQueue.length === 0) return;
  
  isProcessingQueue = true;
  while (commandQueue.length > 0) {
    const nextCommand = commandQueue.shift();
    if (!nextCommand) continue;

    try {
      if (_connType === 'usb' && writer) {
        await writer.ready;
        await writer.write(new TextEncoder().encode(nextCommand));
      } else if (_connType === 'bluetooth' && bleCharacteristic) {
        // Use standard writeValue (which selects best method) and wait
        await bleCharacteristic.writeValue(new TextEncoder().encode(nextCommand));
        // Safety delay for the BLE-to-Serial bridge on the ESP32
        await new Promise(r => setTimeout(r, 600));
      }
      console.log(`[QUEUE]: Sent ${nextCommand.trim()}`);
    } catch (err) {
      console.error("Failed to send command:", err);
    }
  }
  isProcessingQueue = false;
}

function startReading() {
  keepReading = true;
  (async () => {
    while (port && port.readable && keepReading) {
      try {
        reader = port.readable.getReader();
        let buffer = "";
        while (keepReading) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += new TextDecoder().decode(value);
          let nl = buffer.indexOf('\n');
          while (nl >= 0) {
            const msg = buffer.slice(0, nl).trim();
            buffer = buffer.slice(nl + 1);
            if (msg) dispatchMessage(msg);
            nl = buffer.indexOf('\n');
          }
          newlineIndex = buffer.indexOf('\n');
        }
      } catch (e) {
        console.error("Serial read error:", e);
      } finally {
        if (reader) {
          reader.releaseLock();
          reader = null;
        }
      }
    }
  })();
}

function updateStatus(status: HardwareStatus, error?: string) {
  _status = status;
  window.dispatchEvent(new CustomEvent('hardware-status', { detail: { status, error } }));
}

function dispatchMessage(msg: string) {
  const cleanMsg = msg.trim();
  if (cleanMsg) {
    window.dispatchEvent(new CustomEvent('hardware-message', { detail: cleanMsg }));
  }
}

// Helpers for React components
export const onConnectionStatus = (callback: (status: HardwareStatus, error?: string) => void) => {
  const handler = (e: any) => callback(e.detail.status, e.detail.error);
  window.addEventListener('hardware-status', handler);
  return () => window.removeEventListener('hardware-status', handler);
};

export const onMessage = (callback: (msg: string) => void) => {
  const handler = (e: any) => callback(e.detail);
  window.addEventListener('hardware-message', handler);
  return () => window.removeEventListener('hardware-message', handler);
};

export const getConnectionStatus = () => _status;
export const getHardwareConfig = () => ({ type: _connType });

export const closeHardware = async () => {
  keepReading = false;
  
  if (writer) {
    try {
      await writer.close();
    } catch (e) {}
    writer.releaseLock();
    writer = null;
  }

  if (reader) {
    try {
      await reader.cancel();
    } catch (e) {}
    // reader.releaseLock() is handled in the startReading finally block
    reader = null;
  }

  if (port) {
    try {
      await port.close();
    } catch (e) {
      console.error("Error closing port:", e);
    }
    port = null;
  }

  if (bleDevice) {
    if (bleDevice.gatt?.connected) {
      bleDevice.gatt.disconnect();
    }
    bleDevice = null;
  }
  
  updateStatus('disconnected');
};
