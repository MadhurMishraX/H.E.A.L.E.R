import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

let db: Database | null = null;

export async function initDatabase() {
  if (db) return;

  const dbPath = path.resolve(process.cwd(), 'healer.sqlite');
  
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      age INTEGER,
      gender TEXT,
      email TEXT,
      qr_code TEXT,
      language_preference TEXT,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER,
      timestamp TEXT,
      diagnosed_disease TEXT,
      confidence_score REAL,
      top_alternatives TEXT,
      ai_used INTEGER,
      ai_result TEXT,
      action_taken TEXT,
      FOREIGN KEY(patient_id) REFERENCES patients(id)
    );

    CREATE TABLE IF NOT EXISTS prescriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER,
      medicine_name TEXT,
      dosage TEXT,
      frequency TEXT,
      duration TEXT,
      compartment_number INTEGER,
      FOREIGN KEY(session_id) REFERENCES sessions(id)
    );

    CREATE TABLE IF NOT EXISTS dispense_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER,
      patient_id INTEGER,
      medicine_name TEXT,
      compartment_number INTEGER,
      quantity_dispensed INTEGER,
      timestamp TEXT
    );

    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      compartment_number INTEGER UNIQUE,
      medicine_name TEXT,
      current_count INTEGER,
      low_stock_threshold INTEGER DEFAULT 5,
      last_updated TEXT
    );

    CREATE TABLE IF NOT EXISTS unavailability_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER,
      patient_id INTEGER,
      medicine_name TEXT,
      compartment_number INTEGER,
      timestamp TEXT,
      reason TEXT
    );

    CREATE TABLE IF NOT EXISTS admin_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT,
      message TEXT
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS disease_compartment_map (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      disease_name TEXT,
      compartment_number INTEGER,
      is_dispensable INTEGER,
      is_serious INTEGER,
      medicine_name TEXT,
      dosage_adult TEXT,
      dosage_child TEXT,
      dosage_elderly TEXT
    );
  `);

  // Pre-insert settings if empty
  const settingsCount = await db.get('SELECT COUNT(*) as count FROM settings');
  if (settingsCount.count === 0) {
    const defaultSettings = [
      ['doctor_email', 'doctor@clinic.com'],
      ['doctor_phone', '+910000000000'],
      ['clinic_name', 'H.E.A.L.E.R Clinic'],
      ['admin_pin', '1234'],
      ['low_stock_threshold', '5']
    ];
    for (const [key, value] of defaultSettings) {
      await db.run('INSERT INTO settings (key, value) VALUES (?, ?)', [key, value]);
    }
  }

  // Pre-insert disease_compartment_map if empty
  const diseaseCount = await db.get('SELECT COUNT(*) as count FROM disease_compartment_map');
  if (diseaseCount.count === 0) {
    const initialDiseases = [
      ['Fever/Flu', 1, 1, 0, 'Paracetamol 500mg', '2 tablets', '1 tablet', '1 tablet'],
      ['Gastroenteritis', 2, 1, 0, 'ORS Sachet', '2 sachets', '1 sachet', '1 sachet'],
      ['Allergic Reaction', 3, 1, 0, 'Cetirizine 10mg', '1 tablet', 'half tablet', '1 tablet'],
      ['Fungal Skin Infection', 4, 1, 0, 'Clotrimazole tablet', '1 tablet', 'refer doctor', '1 tablet'],
      ['Common Cold', null, 0, 0, null, null, null, null],
      ['Conjunctivitis', null, 0, 0, null, null, null, null],
      ['Mild Headache', null, 0, 0, null, null, null, null],
      ['Minor Wound/Infection', null, 0, 0, null, null, null, null],
      ['Hypertension Symptoms', null, 0, 1, null, null, null, null],
      ['Severe Infection/High Fever with complications', null, 0, 1, null, null, null, null]
    ];
    
    for (const [name, comp, disp, serious, med, adult, child, elderly] of initialDiseases) {
      await db.run(
        'INSERT INTO disease_compartment_map (disease_name, compartment_number, is_dispensable, is_serious, medicine_name, dosage_adult, dosage_child, dosage_elderly) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [name, comp, disp, serious, med, adult, child, elderly]
      );
    }
  }

  console.log('Database initialized successfully.');
}

export function getDB(): Database {
  if (!db) {
    throw new Error("Database not initialized. Call initDatabase() first.");
  }
  return db;
}
