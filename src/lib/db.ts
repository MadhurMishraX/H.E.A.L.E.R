import Dexie, { type Table } from 'dexie';

export interface Patient {
  id?: number;
  name: string;
  age: number;
  gender: string;
  email: string;
  password: string;
  qr_code: string;
  language_preference: string;
  created_at: string;
}

export interface Session {
  id?: number;
  patient_id: number;
  timestamp: string;
  diagnosed_disease: string;
  confidence_score: number;
  top_alternatives: string;
  ai_used: number;
  ai_result: string;
  action_taken: string;
}

export interface Prescription {
  id?: number;
  session_id: number;
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  compartment_number: number | null;
}

export interface DispenseLog {
  id?: number;
  session_id: number;
  patient_id: number;
  medicine_name: string;
  compartment_number: number | null;
  quantity_dispensed: number;
  timestamp: string;
}

export interface Inventory {
  id?: number;
  compartment_number: number;
  medicine_name: string;
  current_count: number;
  low_stock_threshold: number;
  last_updated: string;
}

export interface UnavailabilityLog {
  id?: number;
  session_id: number;
  patient_id: number;
  medicine_name: string;
  compartment_number: number | null;
  timestamp: string;
  reason: string;
}

export interface AdminLog {
  id?: number;
  timestamp: string;
  message: string;
}

export interface Setting {
  id?: number;
  key: string;
  value: string;
}

export interface DiseaseCompartmentMap {
  id?: number;
  disease_name: string;
  compartment_number: number | null;
  is_dispensable: number;
  is_serious: number;
  medicine_name: string;
  dosage_adult: string;
  dosage_child: string;
  dosage_elderly: string;
  advice: string;
}

class HealerDB extends Dexie {
  patients!: Table<Patient>;
  sessions!: Table<Session>;
  prescriptions!: Table<Prescription>;
  dispense_log!: Table<DispenseLog>;
  inventory!: Table<Inventory>;
  unavailability_log!: Table<UnavailabilityLog>;
  admin_log!: Table<AdminLog>;
  settings!: Table<Setting>;
  disease_compartment_map!: Table<DiseaseCompartmentMap>;

  constructor() {
    super('HealerDB');
    this.version(1).stores({
      patients: '++id, &email, &qr_code, name',
      sessions: '++id, patient_id, diagnosed_disease',
      prescriptions: '++id, session_id',
      dispense_log: '++id, session_id, patient_id, timestamp',
      inventory: '++id, &compartment_number',
      unavailability_log: '++id, session_id, patient_id, timestamp',
      admin_log: '++id, timestamp',
      settings: '++id, &key',
      disease_compartment_map: '++id, &disease_name',
    });
  }
}

export const db = new HealerDB();
