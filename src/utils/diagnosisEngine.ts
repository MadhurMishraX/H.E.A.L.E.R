
export interface Option {
  text_en: string;
  text_hi: string;
  symptom_weights: Record<string, number>;
  serious_flag?: boolean;
}

export interface Question {
  id: string;
  text_en: string;
  text_hi: string;
  type: 'yes_no' | 'multiple_choice' | 'multiple_select';
  options: Option[];
  camera_trigger?: boolean;
  max_weight: number;
}

export const DISEASE_PRESCRIPTION_MAP: Record<string, any> = {
  "Fever/Flu": {
    medicine: "Paracetamol 500mg",
    adult_dose: "1 tablet 3 times a day",
    child_dose: "Half tablet 2 times a day",
    advice: "Maintain hydration. If fever above 102°F or persists 3+ days, visit hospital.",
    compartment: 1,
    is_dispensable: true,
    is_serious: false
  },
  "Gastroenteritis": {
    medicine: "ORS Sachet",
    adult_dose: "1 sachet in 1 litre water",
    child_dose: "200ml after each motion",
    advice: "Avoid dairy and spicy food. BRAT diet recommended.",
    compartment: 2,
    is_dispensable: true,
    is_serious: false
  },
  "Allergic Rhinitis": {
    medicine: "Cetirizine 10mg",
    adult_dose: "1 tablet at bedtime",
    child_dose: "Half tablet at bedtime",
    advice: "Identify and avoid allergens. May cause drowsiness.",
    compartment: 3,
    is_dispensable: true,
    is_serious: false
  },
  "Fungal Skin Infection": {
    medicine: "Fluconazole 150mg",
    adult_dose: "1 tablet once a week",
    child_dose: "Consult pediatrician",
    advice: "Keep area dry. Wear cotton. Do not share towels.",
    compartment: 4,
    is_dispensable: true,
    is_serious: false
  },
  "Common Cold/URI": {
    medicine: "Vitamin C + Zinc tablet",
    adult_dose: "1 tablet daily",
    child_dose: "Consult for syrup",
    advice: "Steam inhalation 2-3 times daily. Warm saline gargles.",
    compartment: null,
    is_dispensable: false,
    is_serious: false
  },
  "Conjunctivitis": {
    medicine: "Chloramphenicol Eye Drops",
    adult_dose: "1 drop 4 times a day",
    child_dose: "1 drop twice a day",
    advice: "Do not touch or rub eyes. Use separate towels.",
    compartment: null,
    is_dispensable: false,
    is_serious: false
  },
  "Migraine/Tension Headache": {
    medicine: "Naproxen 250mg",
    adult_dose: "1 tablet twice a day after food",
    child_dose: "Do not give without doctor consultation",
    advice: "Rest in quiet dark room. Avoid caffeine triggers.",
    compartment: null,
    is_dispensable: false,
    is_serious: false
  },
  "Minor Wound/Infection": {
    medicine: "Povidone-Iodine Ointment",
    adult_dose: "Apply twice daily",
    child_dose: "Apply twice daily",
    advice: "Clean with sterile water before applying. Keep covered.",
    compartment: null,
    is_dispensable: false,
    is_serious: false
  },
  "Hypertension": {
    medicine: "URGENT MONITORING REQUIRED",
    adult_dose: "Immediate BP check",
    child_dose: "N/A",
    advice: "Reduce stress. Consult a doctor immediately.",
    compartment: null,
    is_dispensable: false,
    is_serious: true
  },
  "Acidity/GERD": {
    medicine: "Pantoprazole 40mg",
    adult_dose: "1 tablet daily on empty stomach",
    child_dose: "N/A — consult doctor",
    advice: "Avoid lying down 2 hours after meals.",
    compartment: null,
    is_dispensable: false,
    is_serious: false
  },
  "Acute Bronchitis": {
    medicine: "Guaifenesin Syrup",
    adult_dose: "10ml three times a day",
    child_dose: "5ml twice a day — consult doctor",
    advice: "Drink warm fluids. Avoid dust and smoke.",
    compartment: null,
    is_dispensable: false,
    is_serious: false
  },
  "Muscle Strain/Sprain": {
    medicine: "Etoricoxib 90mg",
    adult_dose: "1 tablet daily for 3 days",
    child_dose: "Topical gel only",
    advice: "RICE therapy: Rest, Ice, Compression, Elevation.",
    compartment: null,
    is_dispensable: false,
    is_serious: false
  },
  "Urinary Tract Infection": {
    medicine: "Nitrofurantoin 100mg",
    adult_dose: "1 tablet twice a day for 5 days",
    child_dose: "N/A — consult doctor",
    advice: "Drink 3-4 litres water daily. Do not delay urination.",
    compartment: null,
    is_dispensable: false,
    is_serious: false
  },
  "Asthma/Wheezing": {
    medicine: "Salbutamol Inhaler",
    adult_dose: "2 puffs every 4-6 hours",
    child_dose: "1 puff — consult doctor",
    advice: "Avoid triggers. Keep inhaler accessible always.",
    compartment: null,
    is_dispensable: false,
    is_serious: false
  },
  "Severe Infection/Sepsis": {
    medicine: "EMERGENCY REFERRAL",
    adult_dose: "Go to nearest hospital immediately",
    child_dose: "Go to nearest hospital immediately",
    advice: "GO TO THE NEAREST HOSPITAL IMMEDIATELY.",
    compartment: null,
    is_dispensable: false,
    is_serious: true
  }
};

export const QUESTION_TREE: Record<string, Question> = {
  'Q0': {
    id: 'Q0',
    text_en: "What is bothering you the most today? Select up to 3.",
    text_hi: "आज आपको सबसे अधिक क्या परेशान कर रहा है? अधिकतम 3 चुनें।",
    type: 'multiple_select',
    max_weight: 5,
    options: [
      { text_en: "Fever or feeling very hot", text_hi: "बुखार या बहुत गर्मी महसूस होना", symptom_weights: { "Fever/Flu": 3, "Severe Infection/Sepsis": 2, "Common Cold/URI": 1 } },
      { text_en: "Headache or head pain", text_hi: "सिरदर्द या सिर में दर्द", symptom_weights: { "Migraine/Tension Headache": 4, "Hypertension": 1, "Fever/Flu": 1 } },
      { text_en: "Runny nose, sneezing, sore throat", text_hi: "नाक बहना, छींक आना, गले में खराश", symptom_weights: { "Allergic Rhinitis": 3, "Common Cold/URI": 3, "Fever/Flu": 1 } },
      { text_en: "Stomach pain, nausea, vomiting, or loose motions", text_hi: "पेट दर्द, मतली, उल्टी, या दस्त", symptom_weights: { "Gastroenteritis": 3, "Acidity/GERD": 2 } },
      { text_en: "Skin rash, itching, or a wound", text_hi: "त्वचा पर दाने, खुजली, या घाव", symptom_weights: { "Fungal Skin Infection": 3, "Allergic Rhinitis": 1, "Minor Wound/Infection": 1 } },
      { text_en: "Eye redness, discharge, or irritation", text_hi: "आँखों में लालिमा, डिस्चार्ज, या जलन", symptom_weights: { "Conjunctivitis": 4 } },
      { text_en: "Cough or difficulty breathing", text_hi: "खांसी या सांस लेने में कठिनाई", symptom_weights: { "Acute Bronchitis": 3, "Asthma/Wheezing": 3, "Common Cold/URI": 1 } },
      { text_en: "Pain in muscles, joints, or a specific body part", text_hi: "मांसपेशियों, जोड़ों, या शरीर के किसी विशिष्ट भाग में दर्द", symptom_weights: { "Muscle Strain/Sprain": 4 } },
      { text_en: "Burning sensation while urinating or frequent urination", text_hi: "पेशाब करते समय जलन या बार-बार पेशाब आना", symptom_weights: { "Urinary Tract Infection": 5 } },
      { text_en: "Chest discomfort, dizziness, or vision changes", text_hi: "छाती में बेचैनी, चक्कर आना, या दृष्टि में बदलाव", symptom_weights: { "Hypertension": 4 }, serious_flag: true }
    ]
  },
  // TRACK A: FEVER
  'Q_F1': {
    id: 'Q_F1',
    text_en: "How high is your fever?",
    text_hi: "आपका बुखार कितना है?",
    type: 'multiple_choice',
    max_weight: 3,
    options: [
      { text_en: "Mild warmth, no thermometer reading", text_hi: "हल्की गर्मी, थर्मामीटर रीडिंग नहीं", symptom_weights: { "Fever/Flu": 1, "Common Cold/URI": 2 } },
      { text_en: "Around 100-101°F (moderate)", text_hi: "लगभग 100-101°F (मध्यम)", symptom_weights: { "Fever/Flu": 3 } },
      { text_en: "102°F or above (high)", text_hi: "102°F या उससे ऊपर (उच्च)", symptom_weights: { "Fever/Flu": 2, "Severe Infection/Sepsis": 2 } },
      { text_en: "I have not measured but feel very hot and unwell", text_hi: "मैंने मापा नहीं है लेकिन बहुत गर्मी और अस्वस्थ महसूस कर रहा हूँ", symptom_weights: { "Severe Infection/Sepsis": 2 } }
    ]
  },
  'Q_F2': {
    id: 'Q_F2',
    text_en: "Along with fever, do you have body aches and fatigue?",
    text_hi: "बुखार के साथ क्या आपको शरीर में दर्द और थकान है?",
    type: 'multiple_choice',
    max_weight: 3,
    options: [
      { text_en: "Yes, severe body aches and I feel very weak", text_hi: "हाँ, शरीर में तेज दर्द और मैं बहुत कमजोरी महसूस कर रहा हूँ", symptom_weights: { "Fever/Flu": 3, "Severe Infection/Sepsis": 2 } },
      { text_en: "Mild tiredness only", text_hi: "केवल हल्की थकान", symptom_weights: { "Fever/Flu": 1, "Common Cold/URI": 2 } },
      { text_en: "No body aches", text_hi: "शरीर में कोई दर्द नहीं", symptom_weights: { "Common Cold/URI": 2 } }
    ]
  },
  'Q_F3': {
    id: 'Q_F3',
    text_en: "Do you have a runny nose or sore throat as well?",
    text_hi: "क्या आपको नाक बहने या गले में खराश भी है?",
    type: 'multiple_choice',
    max_weight: 3,
    options: [
      { text_en: "Yes, runny nose and sneezing", text_hi: "हाँ, नाक बहना और छींक आना", symptom_weights: { "Common Cold/URI": 3, "Allergic Rhinitis": 1 } },
      { text_en: "Yes, sore throat", text_hi: "हाँ, गले में खराश", symptom_weights: { "Fever/Flu": 2, "Common Cold/URI": 1 } },
      { text_en: "No", text_hi: "नहीं", symptom_weights: { "Fever/Flu": 1, "Severe Infection/Sepsis": 1 } }
    ]
  },
  'Q_F4': {
    id: 'Q_F4',
    text_en: "How many days have you had these symptoms?",
    text_hi: "आपको ये लक्षण कितने दिनों से हैं?",
    type: 'multiple_choice',
    max_weight: 4,
    options: [
      { text_en: "Less than 2 days", text_hi: "2 दिनों से कम", symptom_weights: { "Fever/Flu": 2 } },
      { text_en: "2 to 5 days", text_hi: "2 से 5 दिन", symptom_weights: { "Fever/Flu": 1 } },
      { text_en: "More than 5 days", text_hi: "5 दिनों से अधिक", symptom_weights: { "Severe Infection/Sepsis": 3 } },
      { text_en: "More than a week", text_hi: "एक सप्ताह से अधिक", symptom_weights: { "Severe Infection/Sepsis": 4 } }
    ]
  },
  // TRACK B: HEADACHE
  'Q_H1': {
    id: 'Q_H1',
    text_en: "Where exactly is your headache?",
    text_hi: "आपका सिरदर्द वास्तव में कहाँ है?",
    type: 'multiple_choice',
    max_weight: 6,
    options: [
      { text_en: "One side of the head only", text_hi: "केवल सिर के एक तरफ", symptom_weights: { "Migraine/Tension Headache": 6 } },
      { text_en: "Both sides, like a tight band around the head", text_hi: "दोनों तरफ, जैसे सिर के चारों ओर एक तंग पट्टी", symptom_weights: { "Migraine/Tension Headache": 5 } },
      { text_en: "Back of the head and neck", text_hi: "सिर और गर्दन के पीछे", symptom_weights: { "Hypertension": 3 } },
      { text_en: "All over / cannot pinpoint", text_hi: "हर जगह / सटीक नहीं बता सकता", symptom_weights: { "Fever/Flu": 1, "Migraine/Tension Headache": 1 } }
    ]
  },
  'Q_H2': {
    id: 'Q_H2',
    text_en: "How severe is the headache on a scale?",
    text_hi: "सिरदर्द कितना गंभीर है?",
    type: 'multiple_choice',
    max_weight: 4,
    options: [
      { text_en: "Mild, manageable", text_hi: "हल्का, प्रबंधनीय", symptom_weights: { "Migraine/Tension Headache": 2 } },
      { text_en: "Moderate, affecting my daily activity", text_hi: "मध्यम, मेरी दैनिक गतिविधि को प्रभावित कर रहा है", symptom_weights: { "Migraine/Tension Headache": 4 } },
      { text_en: "Very severe, worst headache I've had", text_hi: "बहुत गंभीर, सबसे बुरा सिरदर्द जो मुझे हुआ है", symptom_weights: { "Hypertension": 3, "Severe Infection/Sepsis": 1 } }
    ]
  },
  'Q_H3': {
    id: 'Q_H3',
    text_en: "Do you also have any of these?",
    text_hi: "क्या आपको इनमें से कुछ भी है?",
    type: 'multiple_choice',
    max_weight: 6,
    options: [
      { text_en: "Nausea and sensitivity to light or sound", text_hi: "मतली और प्रकाश या ध्वनि के प्रति संवेदनशीलता", symptom_weights: { "Migraine/Tension Headache": 6 } },
      { text_en: "Dizziness or blurred vision", text_hi: "चक्कर आना या धुंधली दृष्टि", symptom_weights: { "Hypertension": 4 }, serious_flag: true },
      { text_en: "Neck stiffness and fever together", text_hi: "गर्दन में अकड़न और बुखार एक साथ", symptom_weights: { "Severe Infection/Sepsis": 4 }, serious_flag: true },
      { text_en: "None of these", text_hi: "इनमें से कोई नहीं", symptom_weights: { "Migraine/Tension Headache": 1 } }
    ]
  },
  'Q_H4': {
    id: 'Q_H4',
    text_en: "Do you have a history of high blood pressure or similar headaches before?",
    text_hi: "क्या आपको पहले कभी उच्च रक्तचाप या इसी तरह के सिरदर्द का इतिहास रहा है?",
    type: 'multiple_choice',
    max_weight: 3,
    options: [
      { text_en: "Yes, I have high BP", text_hi: "हाँ, मुझे हाई बीपी है", symptom_weights: { "Hypertension": 3 } },
      { text_en: "Yes, I get migraines sometimes", text_hi: "हाँ, मुझे कभी-कभी माइग्रेन होता है", symptom_weights: { "Migraine/Tension Headache": 3 } },
      { text_en: "No history", text_hi: "कोई इतिहास नहीं", symptom_weights: { "Migraine/Tension Headache": 1 } }
    ]
  },
  // TRACK C: NOSE / THROAT
  'Q_N1': {
    id: 'Q_N1',
    text_en: "When do your symptoms get worse?",
    text_hi: "आपके लक्षण कब खराब हो जाते हैं?",
    type: 'multiple_choice',
    max_weight: 4,
    options: [
      { text_en: "In specific places like dusty rooms, gardens, near animals", text_hi: "धूल भरे कमरे, बगीचों, जानवरों के पास जैसी विशिष्ट जगहों पर", symptom_weights: { "Allergic Rhinitis": 4 } },
      { text_en: "In cold weather or after getting wet", text_hi: "ठंड के मौसम में या भीगने के बाद", symptom_weights: { "Common Cold/URI": 4 } },
      { text_en: "All the time, no specific trigger", text_hi: "हर समय, कोई विशिष्ट ट्रिगर नहीं", symptom_weights: { "Common Cold/URI": 2, "Allergic Rhinitis": 1 } }
    ]
  },
  'Q_N2': {
    id: 'Q_N2',
    text_en: "Do your eyes also itch or water?",
    text_hi: "क्या आपकी आँखों में खुजली या पानी भी आता है?",
    type: 'yes_no',
    max_weight: 4,
    options: [
      { text_en: "Yes, eyes also itch and water", text_hi: "हाँ, आँखों में खुजली और पानी भी आता है", symptom_weights: { "Allergic Rhinitis": 4 } },
      { text_en: "No", text_hi: "नहीं", symptom_weights: { "Common Cold/URI": 3 } }
    ]
  },
  'Q_N3': {
    id: 'Q_N3',
    text_en: "Do you also have fever?",
    text_hi: "क्या आपको बुखार भी है?",
    type: 'yes_no',
    max_weight: 3,
    options: [
      { text_en: "Yes", text_hi: "हाँ", symptom_weights: { "Common Cold/URI": 3, "Fever/Flu": 2 } },
      { text_en: "No", text_hi: "नहीं", symptom_weights: { "Allergic Rhinitis": 3 } }
    ]
  },
  // TRACK D: STOMACH
  'Q_S1': {
    id: 'Q_S1',
    text_en: "What is your main stomach complaint?",
    text_hi: "आपकी पेट की मुख्य शिकायत क्या है?",
    type: 'multiple_choice',
    max_weight: 4,
    options: [
      { text_en: "Loose motions or watery stools", text_hi: "दस्त या पानी जैसा मल", symptom_weights: { "Gastroenteritis": 4 } },
      { text_en: "Vomiting", text_hi: "उल्टी", symptom_weights: { "Gastroenteritis": 3 } },
      { text_en: "Burning in chest or upper stomach, especially after eating", text_hi: "सीने या ऊपरी पेट में जलन, विशेष रूप से खाने के बाद", symptom_weights: { "Acidity/GERD": 4 } },
      { text_en: "Stomach cramps with loose motions", text_hi: "दस्त के साथ पेट में मरोड़", symptom_weights: { "Gastroenteritis": 4 } },
      { text_en: "Bloating and discomfort after meals", text_hi: "भोजन के बाद सूजन और परेशानी", symptom_weights: { "Acidity/GERD": 3 } }
    ]
  },
  'Q_S2': {
    id: 'Q_S2',
    text_en: "Did it start after eating outside food or something unusual?",
    text_hi: "क्या यह बाहर का खाना खाने या कुछ असामान्य खाने के बाद शुरू हुआ?",
    type: 'yes_no',
    max_weight: 3,
    options: [
      { text_en: "Yes", text_hi: "हाँ", symptom_weights: { "Gastroenteritis": 3 } },
      { text_en: "No", text_hi: "नहीं", symptom_weights: { "Acidity/GERD": 2 } }
    ]
  },
  'Q_S3': {
    id: 'Q_S3',
    text_en: "How many times have you passed loose stools or vomited today?",
    text_hi: "आज आपने कितनी बार दस्त किए या उल्टी की?",
    type: 'multiple_choice',
    max_weight: 4,
    options: [
      { text_en: "1-2 times", text_hi: "1-2 बार", symptom_weights: { "Gastroenteritis": 2 } },
      { text_en: "3-5 times", text_hi: "3-5 बार", symptom_weights: { "Gastroenteritis": 3 } },
      { text_en: "More than 5 times", text_hi: "5 बार से अधिक", symptom_weights: { "Gastroenteritis": 4, "Severe Infection/Sepsis": 2 } },
      { text_en: "Not applicable, my issue is burning not loose motions", text_hi: "लागू नहीं, मेरी समस्या जलन है, दस्त नहीं", symptom_weights: { "Acidity/GERD": 4 } }
    ]
  },
  'Q_S4': {
    id: 'Q_S4',
    text_en: "Do you have fever along with the stomach issue?",
    text_hi: "क्या आपको पेट की समस्या के साथ बुखार है?",
    type: 'yes_no',
    max_weight: 3,
    options: [
      { text_en: "Yes", text_hi: "हाँ", symptom_weights: { "Gastroenteritis": 3, "Severe Infection/Sepsis": 2 } },
      { text_en: "No", text_hi: "नहीं", symptom_weights: { "Acidity/GERD": 2, "Gastroenteritis": 1 } }
    ]
  },
  // TRACK E: SKIN
  'Q_SK1': {
    id: 'Q_SK1',
    text_en: "Can you describe the skin problem?",
    text_hi: "क्या आप त्वचा की समस्या का वर्णन कर सकते हैं?",
    type: 'multiple_choice',
    camera_trigger: true,
    max_weight: 5,
    options: [
      { text_en: "A circular or ring-shaped rash that is itchy", text_hi: "एक गोलाकार या अंगूठी के आकार का दाना जिसमें खुजली होती है", symptom_weights: { "Fungal Skin Infection": 5 } },
      { text_en: "Red patches that appeared suddenly, possibly after eating something or using a new product", text_hi: "लाल धब्बे जो अचानक दिखाई दिए, संभवतः कुछ खाने या नए उत्पाद का उपयोग करने के बाद", symptom_weights: { "Allergic Rhinitis": 3 } },
      { text_en: "A wound, cut, or sore that looks red, swollen, or has pus", text_hi: "एक घाव, कट, या घाव जो लाल, सूजा हुआ दिखता है, या जिसमें मवाद है", symptom_weights: { "Minor Wound/Infection": 5 } },
      { text_en: "Itchy bumps all over without a clear pattern", text_hi: "बिना किसी स्पष्ट पैटर्न के हर जगह खुजली वाले दाने", symptom_weights: { "Allergic Rhinitis": 3 } }
    ]
  },
  'Q_SK2': {
    id: 'Q_SK2',
    text_en: "How long has the skin issue been there?",
    text_hi: "त्वचा की समस्या कितने समय से है?",
    type: 'multiple_choice',
    max_weight: 3,
    options: [
      { text_en: "Less than 2 days", text_hi: "2 दिनों से कम", symptom_weights: { "Minor Wound/Infection": 1, "Allergic Rhinitis": 1 } },
      { text_en: "More than a week", text_hi: "एक सप्ताह से अधिक", symptom_weights: { "Fungal Skin Infection": 3 } },
      { text_en: "Comes and goes, recurring", text_hi: "आता और जाता है, बार-बार होने वाला", symptom_weights: { "Fungal Skin Infection": 2, "Allergic Rhinitis": 2 } }
    ]
  },
  'Q_SK3': {
    id: 'Q_SK3',
    text_en: "Is the affected area in a moist or sweaty part of the body (between toes, groin, underarms)?",
    text_hi: "क्या प्रभावित क्षेत्र शरीर के नम या पसीने वाले हिस्से (पैर की उंगलियों के बीच, कमर, बगल) में है?",
    type: 'yes_no',
    max_weight: 4,
    options: [
      { text_en: "Yes", text_hi: "हाँ", symptom_weights: { "Fungal Skin Infection": 4 } },
      { text_en: "No", text_hi: "नहीं", symptom_weights: { "Allergic Rhinitis": 2, "Minor Wound/Infection": 1 } }
    ]
  },
  // TRACK F: EYE
  'Q_E1': {
    id: 'Q_E1',
    text_en: "What does the eye problem look like?",
    text_hi: "आँख की समस्या कैसी दिखती है?",
    type: 'multiple_choice',
    max_weight: 5,
    options: [
      { text_en: "Red, sticky discharge, especially in the morning", text_hi: "लाल, चिपचिपा स्राव, विशेष रूप से सुबह में", symptom_weights: { "Conjunctivitis": 5 } },
      { text_en: "Itchy and watery with no discharge", text_hi: "बिना किसी स्राव के खुजली और पानी आना", symptom_weights: { "Allergic Rhinitis": 3 } },
      { text_en: "Blurred vision or pain inside the eye", text_hi: "धुंधली दृष्टि या आँख के अंदर दर्द", symptom_weights: { "Hypertension": 3 }, serious_flag: true }
    ]
  },
  'Q_E2': {
    id: 'Q_E2',
    text_en: "Is it one eye or both eyes?",
    text_hi: "क्या यह एक आँख है या दोनों आँखें?",
    type: 'multiple_choice',
    max_weight: 4,
    options: [
      { text_en: "Both eyes", text_hi: "दोनों आँखें", symptom_weights: { "Conjunctivitis": 3, "Allergic Rhinitis": 2 } },
      { text_en: "One eye only", text_hi: "केवल एक आँख", symptom_weights: { "Conjunctivitis": 4 } }
    ]
  },
  // TRACK G: BREATHING
  'Q_B1': {
    id: 'Q_B1',
    text_en: "What does your cough feel like?",
    text_hi: "आपकी खांसी कैसी महसूस होती है?",
    type: 'multiple_choice',
    max_weight: 5,
    options: [
      { text_en: "Wet cough with mucus or phlegm", text_hi: "बलगम या कफ के साथ गीली खांसी", symptom_weights: { "Acute Bronchitis": 4 } },
      { text_en: "Dry cough", text_hi: "सूखी खांसी", symptom_weights: { "Common Cold/URI": 2, "Asthma/Wheezing": 2 } },
      { text_en: "Wheezing sound when breathing, like a whistle", text_hi: "सांस लेते समय घरघराहट की आवाज, जैसे सीटी", symptom_weights: { "Asthma/Wheezing": 5 } },
      { text_en: "Shortness of breath even at rest", text_hi: "आराम करते समय भी सांस की तकलीफ", symptom_weights: { "Asthma/Wheezing": 4 }, serious_flag: true }
    ]
  },
  'Q_B2': {
    id: 'Q_B2',
    text_en: "Do you have a history of asthma or similar breathing episodes?",
    text_hi: "क्या आपको अस्थमा या इसी तरह के सांस लेने के प्रकरणों का इतिहास रहा है?",
    type: 'yes_no',
    max_weight: 4,
    options: [
      { text_en: "Yes", text_hi: "हाँ", symptom_weights: { "Asthma/Wheezing": 4 } },
      { text_en: "No", text_hi: "नहीं", symptom_weights: { "Acute Bronchitis": 3 } }
    ]
  },
  'Q_B3': {
    id: 'Q_B3',
    text_en: "Is there fever along with the cough?",
    text_hi: "क्या खांसी के साथ बुखार है?",
    type: 'yes_no',
    max_weight: 3,
    options: [
      { text_en: "Yes", text_hi: "हाँ", symptom_weights: { "Acute Bronchitis": 3, "Fever/Flu": 2 } },
      { text_en: "No", text_hi: "नहीं", symptom_weights: { "Asthma/Wheezing": 2 } }
    ]
  },
  // TRACK H: MUSCLE
  'Q_M1': {
    id: 'Q_M1',
    text_en: "Was there an injury, fall, or overexertion recently?",
    text_hi: "क्या हाल ही में कोई चोट, गिरना या अधिक परिश्रम हुआ था?",
    type: 'yes_no',
    max_weight: 5,
    options: [
      { text_en: "Yes, I hurt myself or exercised very hard", text_hi: "हाँ, मैंने खुद को चोट पहुँचाई या बहुत कठिन व्यायाम किया", symptom_weights: { "Muscle Strain/Sprain": 5 } },
      { text_en: "No injury, pain came on its own", text_hi: "कोई चोट नहीं, दर्द अपने आप आ गया", symptom_weights: { "Fever/Flu": 2, "Hypertension": 1 } }
    ]
  },
  'Q_M2': {
    id: 'Q_M2',
    text_en: "Where is the pain?",
    text_hi: "दर्द कहाँ है?",
    type: 'multiple_choice',
    max_weight: 3,
    options: [
      { text_en: "Specific muscle (leg, arm, back)", text_hi: "विशिष्ट मांसपेशी (पैर, हाथ, पीठ)", symptom_weights: { "Muscle Strain/Sprain": 3 } },
      { text_en: "Joints (knee, shoulder, wrist)", text_hi: "जोड़ (घुटना, कंधा, कलाई)", symptom_weights: { "Muscle Strain/Sprain": 2 } },
      { text_en: "All over the body", text_hi: "पूरे शरीर में", symptom_weights: { "Fever/Flu": 3 } }
    ]
  },
  'Q_M3': {
    id: 'Q_M3',
    text_en: "Is there any swelling or bruising at the site of pain?",
    text_hi: "क्या दर्द वाली जगह पर कोई सूजन या नीला निशान है?",
    type: 'yes_no',
    max_weight: 3,
    options: [
      { text_en: "Yes", text_hi: "हाँ", symptom_weights: { "Muscle Strain/Sprain": 3 } },
      { text_en: "No", text_hi: "नहीं", symptom_weights: { "Fever/Flu": 2 } }
    ]
  },
  // TRACK I: URINARY
  'Q_U1': {
    id: 'Q_U1',
    text_en: "Do you feel burning or pain while urinating?",
    text_hi: "क्या आपको पेशाब करते समय जलन या दर्द महसूस होता है?",
    type: 'multiple_choice',
    max_weight: 5,
    options: [
      { text_en: "Yes, strong burning sensation", text_hi: "हाँ, तेज जलन महसूस होना", symptom_weights: { "Urinary Tract Infection": 5 } },
      { text_en: "Mild discomfort only", text_hi: "केवल हल्का असहज महसूस होना", symptom_weights: { "Urinary Tract Infection": 3 } },
      { text_en: "No burning, just frequent urination", text_hi: "कोई जलन नहीं, बस बार-बार पेशाब आना", symptom_weights: { "Urinary Tract Infection": 2 } }
    ]
  },
  'Q_U2': {
    id: 'Q_U2',
    text_en: "Is your urine cloudy, dark, or has an unusual smell?",
    text_hi: "क्या आपका पेशाब धुंधला, गहरा है, या उसमें कोई असामान्य गंध है?",
    type: 'yes_no',
    max_weight: 4,
    options: [
      { text_en: "Yes", text_hi: "हाँ", symptom_weights: { "Urinary Tract Infection": 4 } },
      { text_en: "No", text_hi: "नहीं", symptom_weights: { "Urinary Tract Infection": 1 } }
    ]
  },
  'Q_U3': {
    id: 'Q_U3',
    text_en: "Do you have lower abdominal pain or pain in the back/sides?",
    text_hi: "क्या आपको निचले पेट में दर्द या पीठ/किनारों में दर्द है?",
    type: 'multiple_choice',
    max_weight: 3,
    options: [
      { text_en: "Yes, lower abdomen pain", text_hi: "हाँ, निचले पेट में दर्द", symptom_weights: { "Urinary Tract Infection": 3 } },
      { text_en: "Yes, back or side pain (flank pain)", text_hi: "हाँ, पीठ या किनारे का दर्द (फ्लैंक दर्द)", symptom_weights: { "Urinary Tract Infection": 3, "Severe Infection/Sepsis": 2 } },
      { text_en: "No", text_hi: "नहीं", symptom_weights: { "Urinary Tract Infection": 2 } }
    ]
  },
  // TRACK J: HYPERTENSION / SERIOUS
  'Q_BP1': {
    id: 'Q_BP1',
    text_en: "Are you currently experiencing any of these RIGHT NOW?",
    text_hi: "क्या आप वर्तमान में अभी इनमें से किसी का अनुभव कर रहे हैं?",
    type: 'multiple_choice',
    max_weight: 5,
    options: [
      { text_en: "Severe chest pain", text_hi: "सीने में तेज दर्द", symptom_weights: { "Hypertension": 5 }, serious_flag: true },
      { text_en: "Sudden severe headache unlike any before", text_hi: "अचानक तेज सिरदर्द जो पहले कभी नहीं हुआ", symptom_weights: { "Hypertension": 5 }, serious_flag: true },
      { text_en: "Numbness in face, arm, or leg on one side", text_hi: "चेहरे, हाथ, या पैर के एक तरफ सुन्नता", serious_flag: true, symptom_weights: { "Severe Infection/Sepsis": 5 } },
      { text_en: "I feel dizzy and my vision is blurred", text_hi: "मुझे चक्कर आ रहे हैं और मेरी दृष्टि धुंधली है", symptom_weights: { "Hypertension": 4 }, serious_flag: true }
    ]
  },
  'Q_BP2': {
    id: 'Q_BP2',
    text_en: "Do you have a known history of high blood pressure?",
    text_hi: "क्या आपको उच्च रक्तचाप का कोई ज्ञात इतिहास है?",
    type: 'multiple_choice',
    max_weight: 4,
    options: [
      { text_en: "Yes, diagnosed by a doctor", text_hi: "हाँ, डॉक्टर द्वारा निदान किया गया", symptom_weights: { "Hypertension": 4 } },
      { text_en: "No known history", text_hi: "कोई ज्ञात इतिहास नहीं", symptom_weights: { "Hypertension": 2 } },
      { text_en: "I don't know", text_hi: "मुझे नहीं पता", symptom_weights: { "Hypertension": 1 } }
    ]
  },
  // CLOSING
  'Q_CLOSE1': {
    id: 'Q_CLOSE1',
    text_en: "How long have you been experiencing these symptoms overall?",
    text_hi: "कुल मिलाकर आप इन लक्षणों का अनुभव कब से कर रहे हैं?",
    type: 'multiple_choice',
    max_weight: 3,
    options: [
      { text_en: "Started today", text_hi: "आज शुरू हुआ", symptom_weights: {} },
      { text_en: "2 to 4 days", text_hi: "2 से 4 दिन", symptom_weights: {} },
      { text_en: "5 to 7 days", text_hi: "5 से 7 दिन", symptom_weights: { "Severe Infection/Sepsis": 2 } },
      { text_en: "More than a week", text_hi: "एक सप्ताह से अधिक", symptom_weights: { "Severe Infection/Sepsis": 3 } }
    ]
  },
  'Q_CLOSE2': {
    id: 'Q_CLOSE2',
    text_en: "Do you have any of these alongside your main symptoms? (Select all that apply)",
    text_hi: "क्या आपके मुख्य लक्षणों के साथ इनमें से कोई भी है? (सभी लागू चुनें)",
    type: 'multiple_select',
    max_weight: 2,
    options: [
      { text_en: "High fever (102°F or above)", text_hi: "तेज बुखार (102°F या उससे ऊपर)", symptom_weights: { "Fever/Flu": 2, "Severe Infection/Sepsis": 2 } },
      { text_en: "Weakness or cannot get out of bed", text_hi: "कमजोरी या बिस्तर से नहीं उठ पाना", symptom_weights: { "Severe Infection/Sepsis": 2 } },
      { text_en: "Loss of appetite", text_hi: "भूख में कमी", symptom_weights: { "Gastroenteritis": 1, "Fever/Flu": 1 } },
      { text_en: "None of the above", text_hi: "उपरोक्त में से कोई नहीं", symptom_weights: {} }
    ]
  }
};

export const DISEASES = Object.keys(DISEASE_PRESCRIPTION_MAP);

export function getAgeGroup(age: number): 'child' | 'adult' | 'elderly' {
  if (age < 12) return 'child';
  if (age > 60) return 'elderly';
  return 'adult';
}

export function calculateDiagnosis(sessionAnswers: any[]) {
  const scores: Record<string, number> = {};
  DISEASES.forEach(d => scores[d] = 0);
  
  let isSeriousForced = false;
  let totalPossibleShown = 0;
  
  // Rule 5 flags
  let hasChestPain = false;
  let hasBlurredVision = false;
  let hasLongDurationHighFever = false;
  let hasQ0Serious = false;
  let hasBPHistory = false;

  const tracksTaken = new Set<string>();

  sessionAnswers.forEach(ans => {
    const question = QUESTION_TREE[ans.question_id];
    if (!question) return;

    totalPossibleShown += question.max_weight || 5;

    // Detect track
    if (ans.question_id.startsWith('Q_F')) tracksTaken.add('F');
    if (ans.question_id.startsWith('Q_H')) tracksTaken.add('H');
    if (ans.question_id.startsWith('Q_N')) tracksTaken.add('N');
    if (ans.question_id.startsWith('Q_S')) tracksTaken.add('S');
    if (ans.question_id.startsWith('Q_SK')) tracksTaken.add('SK');
    if (ans.question_id.startsWith('Q_E')) tracksTaken.add('E');
    if (ans.question_id.startsWith('Q_B')) tracksTaken.add('B');
    if (ans.question_id.startsWith('Q_M')) tracksTaken.add('M');
    if (ans.question_id.startsWith('Q_U')) tracksTaken.add('U');
    if (ans.question_id.startsWith('Q_BP')) tracksTaken.add('BP');

    const selectedOptions = Array.isArray(ans.selected_option) ? ans.selected_option : [ans.selected_option];
    
    selectedOptions.forEach((optIdx: number) => {
      const option = question.options[optIdx];
      if (!option) return;

      if (option.serious_flag) isSeriousForced = true;

      // Rule 5 specific flag checks
      if (ans.question_id === 'Q0' && optIdx === 9) hasQ0Serious = true;
      if (ans.question_id === 'Q_F4' && (optIdx === 2 || optIdx === 3)) {
          hasLongDurationHighFever = true; // Simplified durations
      }
      if (ans.question_id === 'Q_BP1') {
          if (optIdx === 0) hasChestPain = true;
          if (optIdx === 3) hasBlurredVision = true;
          if (optIdx === 1) hasChestPain = true; // Severe headache from hypertension
      }
      if (ans.question_id === 'Q_H3' && optIdx === 1) hasBlurredVision = true;
      if (ans.question_id === 'Q_E1' && optIdx === 2) hasBlurredVision = true;
      if (ans.question_id === 'Q_B1' && optIdx === 3) hasChestPain = true; // Shortness of breath
      if (ans.question_id === 'Q_BP2' && optIdx === 0) hasBPHistory = true;

      Object.entries(option.symptom_weights).forEach(([disease, weight]) => {
        if (scores[disease] !== undefined) {
          scores[disease] += weight;
        }
      });
    });
  });

  // Track winner bonuses (Rule 4)
  tracksTaken.forEach(track => {
    if (track === 'F' && !isSeriousForced) scores["Fever/Flu"] += 10;
    if (track === 'H' && !isSeriousForced) scores["Migraine/Tension Headache"] += 10;
    if (track === 'N') {
        const ar = scores["Allergic Rhinitis"] || 0;
        const cc = scores["Common Cold/URI"] || 0;
        if (ar >= cc) scores["Allergic Rhinitis"] += 10;
        else scores["Common Cold/URI"] += 10;
    }
    if (track === 'S') {
        const ge = scores["Gastroenteritis"] || 0;
        const ac = scores["Acidity/GERD"] || 0;
        if (ge >= ac) scores["Gastroenteritis"] += 10;
        else scores["Acidity/GERD"] += 10;
    }
    if (track === 'SK') {
        const hasWound = sessionAnswers.some(ans => ans.question_id === 'Q_SK1' && ans.selected_option === 2);
        if (!hasWound) scores["Fungal Skin Infection"] += 10;
    }
    if (track === 'E') scores["Conjunctivitis"] += 10;
    if (track === 'B') {
        const ab = scores["Acute Bronchitis"] || 0;
        const as = scores["Asthma/Wheezing"] || 0;
        if (ab >= as) scores["Acute Bronchitis"] += 10;
        else scores["Asthma/Wheezing"] += 10;
    }
    if (track === 'M') scores["Muscle Strain/Sprain"] += 10;
    if (track === 'U') scores["Urinary Tract Infection"] += 10;
    if (track === 'BP') {
        scores["Hypertension"] += 10;
        isSeriousForced = true;
    }
  });

  // Rule 5: Serious Condition Filter
  const canDiagnoseSerious = hasChestPain || hasBlurredVision || hasLongDurationHighFever || hasQ0Serious || hasBPHistory;

  const sortedResults = DISEASES.map(disease => {
    let score = scores[disease];
    
    // Rule 5 logic: penalize serious if not qualified
    if ((disease === 'Hypertension' || disease === 'Severe Infection/Sepsis') && !canDiagnoseSerious) {
       score = -50; // Force it out
    }

    const confidence = Math.min((score / (totalPossibleShown || 1)) * 100, 100);
    return { disease, score, confidence };
  }).sort((a, b) => b.score - a.score);

  const top = sortedResults[0];
  let diagnosis = top.disease;
  let confidence = Math.max(top.confidence, 0);
  let action: "dispense" | "refer" | "unavailable" = DISEASE_PRESCRIPTION_MAP[diagnosis]?.is_dispensable ? "dispense" : "refer";
  let is_serious = DISEASE_PRESCRIPTION_MAP[diagnosis]?.is_serious || isSeriousForced;
  let note = "";

  // Rule 2 & 6: Always produce diagnosis + labels
  let confidenceLabel = "Possible Condition — Please Consult a Doctor";
  let labelColor = "amber";

  if (confidence > 70) {
      confidenceLabel = "High Confidence Diagnosis";
      labelColor = "green";
  } else if (confidence >= 50) {
      confidenceLabel = "Good Match";
      labelColor = "blue";
  } else if (confidence >= 35) {
      confidenceLabel = "Likely Condition — Doctor Confirmation Advised";
      labelColor = "amber";
      action = "refer";
      note = "Doctor consultation recommended alongside this prescription.";
  } else {
      confidenceLabel = "Possible Condition — Please Consult a Doctor";
      labelColor = "amber";
      action = "refer";
      note = "Doctor consultation recommended alongside this prescription.";
  }

  if (is_serious) action = "refer";

  return {
    diagnosis,
    confidence,
    confidenceLabel,
    labelColor,
    top3: sortedResults.slice(0, 3),
    is_serious,
    action,
    note,
    gemini_used: false,
    gemini_result: null
  };
}

export function getNextQuestion(currentQuestionId: string | null, selectedAnswer: any, currentScores: Record<string, number>) {
  if (!currentQuestionId) return 'Q0';

  if (currentQuestionId === 'Q0') {
    // Determine track based on scores
    const topDisease = Object.entries(currentScores).sort((a, b) => b[1] - a[1])[0][0];
    
    // Check for serious flag in Q0
    const q0 = QUESTION_TREE['Q0'];
    const selectedIndices = Array.isArray(selectedAnswer) ? selectedAnswer : [selectedAnswer];
    const hasSeriousOption = selectedIndices.some((idx: number) => q0.options[idx].serious_flag);

    if (hasSeriousOption) return 'Q_BP1';

    // Track branching
    if (["Fever/Flu", "Severe Infection/Sepsis", "Common Cold/URI"].includes(topDisease)) return 'Q_F1';
    if (["Migraine/Tension Headache", "Hypertension"].includes(topDisease)) return 'Q_H1';
    if (["Allergic Rhinitis"].includes(topDisease)) return 'Q_N1';
    if (["Gastroenteritis", "Acidity/GERD"].includes(topDisease)) return 'Q_S1';
    if (["Fungal Skin Infection", "Minor Wound/Infection"].includes(topDisease)) return 'Q_SK1';
    if (["Conjunctivitis"].includes(topDisease)) return 'Q_E1';
    if (["Acute Bronchitis", "Asthma/Wheezing"].includes(topDisease)) return 'Q_B1';
    if (["Muscle Strain/Sprain"].includes(topDisease)) return 'Q_M1';
    if (["Urinary Tract Infection"].includes(topDisease)) return 'Q_U1';
    
    return 'Q_F1'; // Default
  }

  // Track sequences
  const sequences: Record<string, string[]> = {
    'F': ['Q_F1', 'Q_F2', 'Q_F3', 'Q_F4'],
    'H': ['Q_H1', 'Q_H2', 'Q_H3', 'Q_H4'],
    'N': ['Q_N1', 'Q_N2', 'Q_N3'],
    'S': ['Q_S1', 'Q_S2', 'Q_S3', 'Q_S4'],
    'SK': ['Q_SK1', 'Q_SK2', 'Q_SK3'],
    'E': ['Q_E1', 'Q_E2'],
    'B': ['Q_B1', 'Q_B2', 'Q_B3'],
    'M': ['Q_M1', 'Q_M2', 'Q_M3'],
    'U': ['Q_U1', 'Q_U2', 'Q_U3'],
    'BP': ['Q_BP1', 'Q_BP2']
  };

  // Find which track we are in
  let currentTrack: string[] | null = null;
  for (const seq of Object.values(sequences)) {
    if (seq.includes(currentQuestionId)) {
      currentTrack = seq;
      break;
    }
  }

  if (currentTrack) {
    const currentIndex = currentTrack.indexOf(currentQuestionId);
    if (currentIndex < currentTrack.length - 1) {
      // Check for serious flag during track
      const question = QUESTION_TREE[currentQuestionId];
      const selectedIndices = Array.isArray(selectedAnswer) ? selectedAnswer : [selectedAnswer];
      const hasSeriousOption = selectedIndices.some((idx: number) => question.options[idx]?.serious_flag);
      
      if (hasSeriousOption && !currentQuestionId.startsWith('Q_BP')) return 'Q_BP1';
      
      return currentTrack[currentIndex + 1];
    }
  }

  // After track, go to closing
  if (currentQuestionId === 'Q_CLOSE1') return 'Q_CLOSE2';
  if (currentQuestionId === 'Q_CLOSE2') return null; // End

  return 'Q_CLOSE1';
}
