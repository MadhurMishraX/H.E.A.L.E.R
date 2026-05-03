import { db } from './db';

export async function seedDatabase(): Promise<void> {
  const settingCount = await db.settings.count();
  if (settingCount > 0) return;

  await db.settings.bulkAdd([
    { key: 'doctor_email', value: 'doctor@clinic.com' },
    { key: 'doctor_phone', value: '+910000000000' },
    { key: 'clinic_name', value: 'H.E.A.L.E.R Clinic' },
    { key: 'admin_pin', value: '1234' },
    { key: 'low_stock_threshold', value: '5' },
  ]);

  await db.disease_compartment_map.bulkAdd([
    { disease_name: 'FLU', compartment_number: 1, is_dispensable: 1, is_serious: 0, medicine_name: 'Paracetamol', dosage_adult: '1 tablet every 6–8 hours', dosage_child: '5–10ml every 6 hours', dosage_elderly: '1 tablet every 8 hours', advice: 'Rest. Take Sinarest for nose / Ascoril for cough.' },
    { disease_name: 'VIRAL FEVER', compartment_number: 1, is_dispensable: 1, is_serious: 0, medicine_name: 'Paracetamol', dosage_adult: '1 tablet every 6–8 hours', dosage_child: '5–10ml every 6 hours', dosage_elderly: '1 tablet every 8 hours', advice: 'Combiflam if pain is severe. ORS to prevent dehydration.' },
    { disease_name: 'TENSION HEADACHE', compartment_number: 1, is_dispensable: 1, is_serious: 0, medicine_name: 'Paracetamol', dosage_adult: '1 tablet every 6–8 hours', dosage_child: '5–10ml every 6 hours', dosage_elderly: '1 tablet every 8 hours', advice: 'Saridon if no relief in 1 hour. Get some sleep.' },
    { disease_name: 'MIGRAINE', compartment_number: 1, is_dispensable: 1, is_serious: 0, medicine_name: 'Paracetamol', dosage_adult: '1 tablet every 6–8 hours', dosage_child: '5–10ml every 6 hours', dosage_elderly: '1 tablet every 8 hours', advice: 'Saridon. Domstal 10mg for nausea. Dark room rest.' },
    { disease_name: 'ALLERGIC RASH / URTICARIA', compartment_number: 2, is_dispensable: 1, is_serious: 0, medicine_name: 'Cetirizine 10mg', dosage_adult: '1 tablet once daily at night', dosage_child: '5mg syrup / Half tablet daily', dosage_elderly: '5mg once daily at night', advice: 'Apply Calamine lotion. Avoid allergens.' },
    { disease_name: 'BACTERIAL SKIN INFECTION', compartment_number: 2, is_dispensable: 1, is_serious: 0, medicine_name: 'Cetirizine 10mg', dosage_adult: '1 tablet once daily at night', dosage_child: '5mg syrup / Half tablet daily', dosage_elderly: '5mg once daily at night', advice: 'Mupirocin 2% cream (T-Bact) applied locally.' },
    { disease_name: 'FOOD POISONING / GASTROENTERITIS', compartment_number: 3, is_dispensable: 1, is_serious: 0, medicine_name: 'ORS Electral', dosage_adult: '200–400ml after every loose stool', dosage_child: '100–200ml after every loose stool', dosage_elderly: 'Small continuous sips', advice: 'Racecadotril 100mg for adults. Domstal for vomiting.' },
    { disease_name: 'FOOD POISONING', compartment_number: 3, is_dispensable: 1, is_serious: 0, medicine_name: 'ORS Electral', dosage_adult: '200–400ml after every loose stool', dosage_child: '100–200ml after every loose stool', dosage_elderly: 'Small continuous sips', advice: 'Domperidone 10mg (Domstal). Small sips of ORS.' },
    { disease_name: 'FUNGAL INFECTION', compartment_number: 4, is_dispensable: 1, is_serious: 0, medicine_name: 'Clotrimazole 1% Cream', dosage_adult: 'Apply thin layer twice daily', dosage_child: 'Consult doctor before use', dosage_elderly: 'Apply thin layer twice daily', advice: 'Keep area clean and dry. Wear loose cotton clothes.' },
    { disease_name: 'FUNGAL (Tinea Versicolor)', compartment_number: 4, is_dispensable: 1, is_serious: 0, medicine_name: 'Clotrimazole 1% Cream', dosage_adult: 'Apply thin layer twice daily', dosage_child: 'Consult doctor before use', dosage_elderly: 'Apply thin layer twice daily', advice: 'Selenium sulfide shampoo (Selsun) applied to spots.' },
    { disease_name: 'ACIDITY / GASTRITIS', compartment_number: null, is_dispensable: 0, is_serious: 0, medicine_name: 'Pantoprazole 40mg', dosage_adult: '1 tablet before breakfast', dosage_child: 'Consult Doctor', dosage_elderly: '1 tablet before breakfast', advice: 'Gelusil / Digene after meals.' },
    { disease_name: 'GAS / IBS', compartment_number: null, is_dispensable: 0, is_serious: 0, medicine_name: 'Simethicone', dosage_adult: '1 tablet after meals', dosage_child: 'Consult Doctor', dosage_elderly: '1 tablet after meals', advice: 'Meftal Spas for cramps.' },
    { disease_name: 'OTHER — URGENT', compartment_number: null, is_dispensable: 0, is_serious: 1, medicine_name: 'EMERGENCY REFERRAL', dosage_adult: 'Immediate Doctor Consult', dosage_child: 'Immediate Doctor Consult', dosage_elderly: 'Immediate Doctor Consult', advice: 'GO TO HOSPITAL IMMEDIATELY.' },
    { disease_name: 'OTHER', compartment_number: null, is_dispensable: 0, is_serious: 1, medicine_name: 'Doctor Referral Required', dosage_adult: 'Consult Doctor', dosage_child: 'Consult Doctor', dosage_elderly: 'Consult Doctor', advice: 'Symptoms need professional medical evaluation.' },
  ]);

  await db.inventory.bulkAdd([
    { compartment_number: 1, medicine_name: 'Paracetamol', current_count: 50, low_stock_threshold: 5, last_updated: new Date().toISOString() },
    { compartment_number: 2, medicine_name: 'Cetirizine 10mg', current_count: 50, low_stock_threshold: 5, last_updated: new Date().toISOString() },
    { compartment_number: 3, medicine_name: 'ORS Electral', current_count: 50, low_stock_threshold: 5, last_updated: new Date().toISOString() },
    { compartment_number: 4, medicine_name: 'Clotrimazole 1% Cream', current_count: 50, low_stock_threshold: 5, last_updated: new Date().toISOString() },
  ]);
}
