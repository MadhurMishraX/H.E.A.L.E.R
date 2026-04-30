import Dexie, { type Table } from 'dexie';

export interface Patient {
  id?: number;
  name: string;
  age: number;
  gender: string;
  phone: string;
  email: string;
  medicalHistory: string;
  lastVisit: string;
  created_at: string;
}

export interface InventoryItem {
  id?: number;
  name: string;
  slot: number;
  count: number;
  type: string;
}

export interface LogEntry {
  id?: number;
  timestamp: string;
  type: 'dispense' | 'system' | 'admin' | 'error';
  message: string;
}

export interface Session {
  id?: number;
  patient_id: number;
  timestamp: string;
  diagnosed_disease: string;
  confidence_score: number;
  top_alternatives: string;
  ai_used: number;
  ai_result?: string;
  action_taken: string;
}

export interface Prescription {
  id?: number;
  session_id: number;
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  compartment_number: number;
}

export interface Setting {
  id?: number;
  key: string;
  value: any;
}

export class HealerDatabase extends Dexie {
  patients!: Table<Patient>;
  inventory!: Table<InventoryItem>;
  logs!: Table<LogEntry>;
  sessions!: Table<Session>;
  prescriptions!: Table<Prescription>;
  settings!: Table<Setting>;

  constructor() {
    super('HealerDB');
    this.version(3).stores({
      patients: '++id, name, phone, email',
      inventory: '++id, name, slot',
      logs: '++id, timestamp, type',
      sessions: '++id, patient_id, timestamp',
      prescriptions: '++id, session_id',
      settings: '++id, key'
    });
  }
}

export const db = new HealerDatabase();

// Helper to seed initial data if empty
export async function seedDatabase() {
  const invCount = await db.inventory.count();
  if (invCount === 0) {
    await db.inventory.bulkAdd([
      { name: 'Paracetamol', slot: 1, count: 10, type: 'Tablet' },
      { name: 'Ibuprofen', slot: 2, count: 8, type: 'Tablet' },
      { name: 'Amoxicillin', slot: 3, count: 12, type: 'Capsule' },
      { name: 'Cetirizine', slot: 4, count: 15, type: 'Tablet' }
    ]);
  }

  const settingsCount = await db.settings.count();
  if (settingsCount === 0) {
    await db.settings.add({ key: 'admin_pin', value: '1234' });
  }
}
