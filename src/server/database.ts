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
      password TEXT,
      qr_code TEXT,
      language_preference TEXT,
      created_at TEXT
    );
  `);

  try { await db.exec('ALTER TABLE patients ADD COLUMN password TEXT'); } catch(e) {}

  await db.exec(`
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
      dosage_elderly TEXT,
      advice TEXT
    );
  `);

  try { await db.exec('ALTER TABLE disease_compartment_map ADD COLUMN dosage_adult TEXT'); } catch(e) {}
  try { await db.exec('ALTER TABLE disease_compartment_map ADD COLUMN dosage_child TEXT'); } catch(e) {}
  try { await db.exec('ALTER TABLE disease_compartment_map ADD COLUMN dosage_elderly TEXT'); } catch(e) {}
  try { await db.exec('ALTER TABLE disease_compartment_map ADD COLUMN advice TEXT'); } catch(e) {}

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
  await db.run('DELETE FROM disease_compartment_map'); // Always reset to new 16 for this overhaul
  const initialDiseases = [
    // Track A & B
    ['FLU', 1, 1, 0, 'Paracetamol', '1 tablet every 6–8 hours', '5–10ml every 6 hours', '1 tablet every 8 hours', 'Rest. Take Sinarest for nose / Ascoril for cough.'],
    ['VIRAL FEVER', 1, 1, 0, 'Paracetamol', '1 tablet every 6–8 hours', '5–10ml every 6 hours', '1 tablet every 8 hours', 'Combiflam if pain is severe. ORS to prevent dehydration.'],
    ['TENSION HEADACHE', 1, 1, 0, 'Paracetamol', '1 tablet every 6–8 hours', '5–10ml every 6 hours', '1 tablet every 8 hours', 'Saridon if no relief in 1 hour. Get some sleep.'],
    ['MIGRAINE', 1, 1, 0, 'Paracetamol', '1 tablet every 6–8 hours', '5–10ml every 6 hours', '1 tablet every 8 hours', 'Saridon. Domstal 10mg for nausea. Dark room rest.'],
    
    // Track D
    ['ALLERGIC RASH / URTICARIA', 2, 1, 0, 'Cetirizine 10mg', '1 tablet once daily at night', '5mg syrup / Half tablet daily', '5mg once daily at night', 'Apply Calamine lotion. Avoid allergens.'],
    ['BACTERIAL SKIN INFECTION', 2, 1, 0, 'Cetirizine 10mg', '1 tablet once daily at night', '5mg syrup / Half tablet daily', '5mg once daily at night', 'Mupirocin 2% cream (T-Bact) applied locally.'],
    
    // Track C
    ['FOOD POISONING / GASTROENTERITIS', 3, 1, 0, 'ORS Electral', '200–400ml after every loose stool', '100–200ml after every loose stool', 'Small continuous sips', 'Racecadotril 100mg for adults. Domstal for vomiting.'],
    ['FOOD POISONING', 3, 1, 0, 'ORS Electral', '200–400ml after every loose stool', '100–200ml after every loose stool', 'Small continuous sips', 'Domperidone 10mg (Domstal). Small sips of ORS.'],
    
    // Track D again
    ['FUNGAL INFECTION', 4, 1, 0, 'Clotrimazole 1% Cream', 'Apply thin layer twice daily', 'Consult doctor before use', 'Apply thin layer twice daily', 'Keep area clean and dry. Wear loose cotton clothes.'],
    ['FUNGAL (Tinea Versicolor)', 4, 1, 0, 'Clotrimazole 1% Cream', 'Apply thin layer twice daily', 'Consult doctor before use', 'Apply thin layer twice daily', 'Selenium sulfide shampoo (Selsun) applied to spots.'],
    
    // Non-dispensable Tracks
    ['ACIDITY / GASTRITIS', null, 0, 0, 'Pantoprazole 40mg', '1 tablet before breakfast', 'Consult Doctor', '1 tablet before breakfast', 'Gelusil / Digene after meals.'],
    ['GAS / IBS', null, 0, 0, 'Simethicone', '1 tablet after meals', 'Consult Doctor', '1 tablet after meals', 'Meftal Spas for cramps.'],
    
    // Others
    ['OTHER — URGENT', null, 0, 1, 'EMERGENCY REFERRAL', 'Immediate Doctor Consult', 'Immediate Doctor Consult', 'Immediate Doctor Consult', 'GO TO HOSPITAL IMMEDIATELY.'],
    ['OTHER', null, 0, 1, 'Doctor Referral Required', 'Consult Doctor', 'Consult Doctor', 'Consult Doctor', 'Symptoms need professional medical evaluation.']
  ];
  
  for (const [name, comp, disp, serious, med, adult, child, elderly, adv] of initialDiseases) {
    await db.run(
      'INSERT INTO disease_compartment_map (disease_name, compartment_number, is_dispensable, is_serious, medicine_name, dosage_adult, dosage_child, dosage_elderly, advice) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name, comp, disp, serious, med, adult, child, elderly, adv]
    );
  }

  // Pre-insert inventory if empty
  const inventoryCount = await db.get('SELECT COUNT(*) as count FROM inventory');
  if (inventoryCount.count === 0) {
    const meds = ['Paracetamol', 'Cetirizine 10mg', 'ORS Electral', 'Clotrimazole 1%'];
    for (let i = 1; i <= 4; i++) {
      await db.run(
        'INSERT INTO inventory (compartment_number, medicine_name, current_count, last_updated) VALUES (?, ?, ?, ?)',
        [i, meds[i-1], 0, new Date().toISOString()]
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
