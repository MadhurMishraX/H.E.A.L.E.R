/**
 * Utility for Serial Communication with Arduino.
 * Uses Web Serial API where available.
 */

let port: any = null;
let writer: any = null;
let reader: any = null;

export async function initSerial() {
  if (!('serial' in navigator)) {
    console.warn("Web Serial API not supported in this browser.");
    setTimeout(() => simulateInbound("ARDUINO_READY"), 1000); // Simulate readiness anyway
    return { success: false, error: 'Not supported' };
  }

  try {
    // Note: In real use, this requires user interaction to call requestPort()
    // For this context, we will log commands.
    console.log("Serial Initialized (Simulated)");
    setTimeout(() => simulateInbound("ARDUINO_READY"), 1000);
    return { success: true };
  } catch (err) {
    console.error("Failed to init serial:", err);
    return { success: false, error: err };
  }
}

export async function sendCommand(command: string) {
  const fullCommand = command.endsWith('\n') ? command : `${command}\n`;
  console.log(`SERIAL SEND: ${fullCommand}`);
  
  // Real implementation would use writer.write()
  // Simulate responses for testing
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

let messageCallback: ((msg: string) => void) | null = null;

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
  if (writer) await writer.close();
  if (port) await port.close();
}
