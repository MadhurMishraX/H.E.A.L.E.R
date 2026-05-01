import { db } from '../lib/db';
import type { Patient, Session, Prescription, Inventory, DiseaseCompartmentMap } from '../lib/db';

// --- SETTINGS ---

export async function getAllSettings(): Promise<Record<string, string>> {
  const rows = await db.settings.toArray();
  return Object.fromEntries(rows.map(r => [r.key, r.value]));
}

export async function getSetting(key: string): Promise<string | null> {
  const row = await db.settings.where('key').equals(key).first();
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const existing = await db.settings.where('key').equals(key).first();
  if (existing?.id) {
    await db.settings.update(existing.id, { value });
  } else {
    await db.settings.add({ key, value });
  }
}

// --- PATIENTS ---

export async function loginPatient(email: string, password: string): Promise<Patient | null> {
  return await db.patients.where('email').equals(email).filter(p => p.password === password).first() ?? null;
}

export async function loginPatientByQR(qr_code: string): Promise<Patient | null> {
  return await db.patients.where('qr_code').equals(qr_code).first() ?? null;
}

export async function getPatientById(id: number): Promise<Patient | null> {
  return await db.patients.get(id) ?? null;
}

export async function registerPatient(data: Omit<Patient, 'id'>): Promise<Patient> {
  const id = await db.patients.add(data);
  return { ...data, id: id as number };
}

export async function updatePatientQR(id: number, qr_code: string): Promise<Patient | null> {
  await db.patients.update(id, { qr_code });
  return await db.patients.get(id) ?? null;
}

export async function getAllPatients(): Promise<Patient[]> {
  return await db.patients.orderBy('name').toArray();
}

export async function getPatientFullHistory(id: number) {
  const patient = await db.patients.get(id);
  if (!patient) return null;
  const sessions = await db.sessions.where('patient_id').equals(id).toArray();
  const result = [];
  for (const session of sessions) {
    const prescriptions = await db.prescriptions.where('session_id').equals(session.id!).toArray();
    const dispenses = await db.dispense_log.where('session_id').equals(session.id!).toArray();
    result.push({ ...session, prescriptions, dispenses });
  }
  return { ...patient, sessions: result };
}

// --- SESSIONS ---

export async function createSession(data: Omit<Session, 'id'>): Promise<number> {
  return (await db.sessions.add(data)) as number;
}

// --- PRESCRIPTIONS ---

export async function createPrescription(data: Omit<Prescription, 'id'>): Promise<void> {
  await db.prescriptions.add(data);
}

export async function getPrescriptionsBySession(session_id: number): Promise<Prescription[]> {
  return await db.prescriptions.where('session_id').equals(session_id).toArray();
}

// --- INVENTORY ---

export async function getInventory(): Promise<Inventory[]> {
  return await db.inventory.toArray();
}

export async function updateInventoryItem(compartment_number: number, medicine_name: string, current_count: number): Promise<void> {
  const item = await db.inventory.where('compartment_number').equals(compartment_number).first();
  if (item?.id) {
    await db.inventory.update(item.id, {
      medicine_name,
      current_count,
      last_updated: new Date().toISOString(),
    });
  }
}

// --- DISPENSE ---

export async function checkDispensed(session_id: number, medicine_name: string): Promise<boolean> {
  const record = await db.dispense_log
    .where('session_id')
    .equals(session_id)
    .filter(r => r.medicine_name === medicine_name)
    .first();
  return !!record;
}

export async function dispense(
  session_id: number,
  patient_id: number,
  medicine_name: string,
  compartment_number: number,
  quantity: number
): Promise<number> {
  let new_count = 0;
  await db.transaction('rw', [db.inventory, db.dispense_log, db.admin_log], async () => {
    const item = await db.inventory.where('compartment_number').equals(compartment_number).first();
    if (!item || item.current_count < quantity) {
      throw new Error('Insufficient stock');
    }
    new_count = item.current_count - quantity;
    await db.inventory.update(item.id!, {
      current_count: new_count,
      last_updated: new Date().toISOString(),
    });
    await db.dispense_log.add({
      session_id,
      patient_id,
      medicine_name,
      compartment_number,
      quantity_dispensed: quantity,
      timestamp: new Date().toISOString(),
    });
    await db.admin_log.add({
      timestamp: new Date().toISOString(),
      message: `Dispensed ${quantity} unit(s) of ${medicine_name} from compartment ${compartment_number} for patient ${patient_id}.`,
    });
  });
  return new_count;
}

// --- LOGS ---

export async function addAdminLog(message: string): Promise<void> {
  await db.admin_log.add({
    timestamp: new Date().toISOString(),
    message,
  });
}

export async function addUnavailabilityLog(
  session_id: number,
  patient_id: number,
  medicine_name: string,
  compartment_number: number | null,
  reason: string
): Promise<void> {
  await db.unavailability_log.add({
    session_id,
    patient_id,
    medicine_name,
    compartment_number,
    timestamp: new Date().toISOString(),
    reason,
  });
}

export async function getUnavailabilityLogs() {
  const logs = await db.unavailability_log.toArray();
  const enriched = [];
  for (const log of logs) {
    const patient = await db.patients.get(log.patient_id);
    const session = await db.sessions.get(log.session_id);
    enriched.push({
      ...log,
      patient_name: patient?.name ?? 'Unknown',
      diagnosed_disease: session?.diagnosed_disease ?? 'Unknown',
    });
  }
  return enriched;
}

// --- DISEASE MAP ---

export async function getDiseaseMap(disease_name: string): Promise<DiseaseCompartmentMap | null> {
  return await db.disease_compartment_map.where('disease_name').equals(disease_name).first() ?? null;
}

// --- ANALYTICS ---

export async function getAnalyticsDiseases() {
  const sessions = await db.sessions.toArray();
  const map = new Map<string, number>();
  sessions.forEach(s => map.set(s.diagnosed_disease, (map.get(s.diagnosed_disease) ?? 0) + 1));
  return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
}

export async function getAnalyticsDailyVolume() {
  const logs = await db.dispense_log.toArray();
  const map = new Map<string, number>();
  logs.forEach(l => {
    const day = l.timestamp.slice(0, 10);
    map.set(day, (map.get(day) ?? 0) + 1);
  });
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getAnalyticsTopMedicines() {
  const logs = await db.dispense_log.toArray();
  const map = new Map<string, number>();
  logs.forEach(l => map.set(l.medicine_name, (map.get(l.medicine_name) ?? 0) + l.quantity_dispensed));
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
}

export async function getAnalyticsUnavailability() {
  const logs = await db.unavailability_log.toArray();
  const map = new Map<string, number>();
  logs.forEach(l => map.set(l.reason, (map.get(l.reason) ?? 0) + 1));
  return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
}
