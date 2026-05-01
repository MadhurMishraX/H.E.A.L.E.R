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
  const diseaseCount = await db.get('SELECT COUNT(*) as count FROM disease_compartment_map');
    if (diseaseCount.count <= 18) { // Allow updating if we have the old list or less
      await db.run('DELETE FROM disease_compartment_map'); // Clear to overwrite with new 15
      const initialDiseases = [
        ['Fever/Flu', 1, 1, 0, 'Paracetamol 500mg', '1 tablet 3 times a day', 'Half tablet 2 times a day', '1 tablet 3 times a day', 'Maintain hydration. If fever above 102°F or persists 3+ days, visit hospital.'],
        ['Gastroenteritis', 2, 1, 0, 'ORS Sachet', '1 sachet in 1 litre water', '200ml after each motion', 'Sip throughput the day', 'Avoid dairy and spicy food. BRAT diet recommended.'],
        ['Allergic Rhinitis', 3, 1, 0, 'Cetirizine 10mg', '1 tablet at bedtime', 'Half tablet at bedtime', '1 tablet at bedtime', 'Identify and avoid allergens. May cause drowsiness.'],
        ['Fungal Skin Infection', 4, 1, 0, 'Fluconazole 150mg', '1 tablet once a week', 'Consult pediatrician', '1 tablet once a week', 'Keep area dry. Wear cotton. Do not share towels.'],
        ['Common Cold/URI', null, 0, 0, 'Vitamin C + Zinc tablet', '1 tablet daily', 'Consult for syrup', '1 tablet daily', 'Steam inhalation 2-3 times daily. Warm saline gargles.'],
        ['Conjunctivitis', null, 0, 0, 'Chloramphenicol Eye Drops', '1 drop 4 times a day', '1 drop twice a day', '1 drop 4 times a day', 'Do not touch or rub eyes. Use separate towels.'],
        ['Migraine/Tension Headache', null, 0, 0, 'Naproxen 250mg', '1 tablet twice a day after food', 'Do not give without doctor consultation', '1 tablet daily', 'Rest in quiet dark room. Avoid caffeine triggers.'],
        ['Minor Wound/Infection', null, 0, 0, 'Povidone-Iodine Ointment', 'Apply twice daily', 'Apply twice daily', 'Apply twice daily', 'Clean with sterile water before applying. Keep covered.'],
        ['Hypertension', null, 0, 1, 'URGENT MONITORING REQUIRED', 'Immediate BP check', 'N/A', 'Immediate BP check', 'Reduce stress. Consult a doctor immediately.'],
        ['Acidity/GERD', null, 0, 0, 'Pantoprazole 40mg', '1 tablet daily on empty stomach', 'N/A — consult doctor', '1 tablet daily', 'Avoid lying down 2 hours after meals.'],
        ['Acute Bronchitis', null, 0, 0, 'Guaifenesin Syrup', '10ml three times a day', '5ml twice a day — consult doctor', '10ml three times a day', 'Drink warm fluids. Avoid dust and smoke.'],
        ['Muscle Strain/Sprain', null, 0, 0, 'Etoricoxib 90mg', '1 tablet daily for 3 days', 'Topical gel only', '1 tablet daily', 'RICE therapy: Rest, Ice, Compression, Elevation.'],
        ['Urinary Tract Infection', null, 0, 0, 'Nitrofurantoin 100mg', '1 tablet twice a day for 5 days', 'N/A — consult doctor', '1 tablet twice a day', 'Drink 3-4 litres water daily. Do not delay urination.'],
        ['Asthma/Wheezing', null, 0, 0, 'Salbutamol Inhaler', '2 puffs every 4-6 hours', '1 puff — consult doctor', '2 puffs every 4-6 hours', 'Avoid triggers. Keep inhaler accessible always.'],
        ['Severe Infection/Sepsis', null, 0, 1, 'EMERGENCY REFERRAL', 'Go to nearest hospital immediately', 'Go to nearest hospital immediately', 'Go to nearest hospital immediately', 'GO TO THE NEAREST HOSPITAL IMMEDIATELY.'],
        ['Inconclusive — Doctor Referral Required', null, 0, 1, 'Clinical Examination Required', 'Professional Consult Required', 'Pedaetric Consult', 'Geriatric Consult', 'Symptoms do not match simple algorithm. Requires professional physical exam.']
      ];
      
      for (const [name, comp, disp, serious, med, adult, child, elderly, adv] of initialDiseases) {
        await db.run(
          'INSERT INTO disease_compartment_map (disease_name, compartment_number, is_dispensable, is_serious, medicine_name, dosage_adult, dosage_child, dosage_elderly, advice) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [name, comp, disp, serious, med, adult, child, elderly, adv]
        );
      }
    }

  // Pre-insert inventory if empty
  const inventoryCount = await db.get('SELECT COUNT(*) as count FROM inventory');
  if (inventoryCount.count === 0) {
    for (let i = 1; i <= 4; i++) {
      await db.run(
        'INSERT INTO inventory (compartment_number, medicine_name, current_count, last_updated) VALUES (?, ?, ?, ?)',
        [i, '', 0, new Date().toISOString()]
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
