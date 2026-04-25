export interface Option {
  text_en: string;
  text_hi: string;
  symptom_weights: Record<string, number>;
  next_question_id?: string;
}

export interface Question {
  id: string;
  text_en: string;
  text_hi: string;
  type: 'yes_no' | 'multiple_choice';
  options: Option[];
  camera_trigger?: boolean;
}

export const DISEASES = [
  "Fever/Flu",
  "Gastroenteritis",
  "Allergic Reaction",
  "Fungal Skin Infection",
  "Common Cold",
  "Conjunctivitis",
  "Mild Headache",
  "Minor Wound/Infection",
  "Hypertension Symptoms",
  "Severe Infection/High Fever with complications"
];

export const QUESTIONS: Question[] = [
  {
    id: 'q1',
    text_en: "Do you have a fever?",
    text_hi: "क्या आपको बुखार है?",
    type: 'yes_no',
    options: [
      { 
        text_en: "Yes", text_hi: "हाँ", 
        symptom_weights: { "Fever/Flu": 2, "Gastroenteritis": 1, "Severe Infection/High Fever with complications": 2 } 
      },
      { text_en: "No", text_hi: "नहीं", symptom_weights: {} }
    ]
  },
  {
    id: 'q2',
    text_en: "How long have you had these symptoms?",
    text_hi: "आपको ये लक्षण कब से हैं?",
    type: 'multiple_choice',
    options: [
      { text_en: "Less than 2 days", text_hi: "2 दिनों से कम", symptom_weights: { "Fever/Flu": 1, "Common Cold": 1 } },
      { text_en: "2 to 5 days", text_hi: "2 से 5 दिन", symptom_weights: { "Fever/Flu": 2, "Gastroenteritis": 2 } },
      { text_en: "More than 5 days", text_hi: "5 दिनों से अधिक", symptom_weights: { "Severe Infection/High Fever with complications": 3 } }
    ]
  },
  {
    id: 'q3',
    text_en: "Do you have a runny nose or sore throat?",
    text_hi: "क्या आपकी नाक बह रही है या गले में खराश है?",
    type: 'yes_no',
    options: [
      { text_en: "Yes", text_hi: "हाँ", symptom_weights: { "Common Cold": 3, "Fever/Flu": 1 } },
      { text_en: "No", text_hi: "नहीं", symptom_weights: {} }
    ]
  },
  {
    id: 'q4',
    text_en: "Do you have nausea, vomiting, or diarrhea?",
    text_hi: "क्या आपको मतली, उल्टी या दस्त है?",
    type: 'yes_no',
    options: [
      { text_en: "Yes", text_hi: "हाँ", symptom_weights: { "Gastroenteritis": 3 } },
      { text_en: "No", text_hi: "नहीं", symptom_weights: {} }
    ]
  },
  {
    id: 'q5',
    text_en: "Do you have a headache?",
    text_hi: "क्या आपको सिरदर्द है?",
    type: 'yes_no',
    options: [
      { text_en: "Yes", text_hi: "हाँ", symptom_weights: { "Mild Headache": 2, "Fever/Flu": 1, "Hypertension Symptoms": 1 } },
      { text_en: "No", text_hi: "नहीं", symptom_weights: {} }
    ]
  },
  {
    id: 'q6',
    text_en: "Is the headache severe and persistent?",
    text_hi: "क्या सिरदर्द गंभीर और लगातार है?",
    type: 'yes_no',
    options: [
      { text_en: "Yes", text_hi: "हाँ", symptom_weights: { "Hypertension Symptoms": 3, "Mild Headache": -1 } },
      { text_en: "No", text_hi: "नहीं", symptom_weights: {} }
    ]
  },
  {
    id: 'q7',
    text_en: "Do you have skin redness, rash, or itching?",
    text_hi: "क्या आपको त्वचा में लालिमा, दाने या खुजली है?",
    type: 'yes_no',
    camera_trigger: true,
    options: [
      { text_en: "Yes", text_hi: "हाँ", symptom_weights: { "Allergic Reaction": 2, "Fungal Skin Infection": 2 } },
      { text_en: "No", text_hi: "नहीं", symptom_weights: {} }
    ]
  },
  {
    id: 'q8',
    text_en: "Is the rash in a circular or ring pattern?",
    text_hi: "क्या दाने गोलाकार या रिंग पैटर्न में हैं?",
    type: 'yes_no',
    options: [
      { text_en: "Yes", text_hi: "हाँ", symptom_weights: { "Fungal Skin Infection": 3 } },
      { text_en: "No", text_hi: "नहीं", symptom_weights: {} }
    ]
  },
  {
    id: 'q9',
    text_en: "Did the rash appear after eating something new or using a new product?",
    text_hi: "क्या दाने कुछ नया खाने या नया उत्पाद उपयोग करने के बाद दिखाई दिए?",
    type: 'yes_no',
    options: [
      { text_en: "Yes", text_hi: "हाँ", symptom_weights: { "Allergic Reaction": 3 } },
      { text_en: "No", text_hi: "नहीं", symptom_weights: {} }
    ]
  },
  {
    id: 'q10',
    text_en: "Do you have eye redness, discharge, or irritation?",
    text_hi: "क्या आपकी आँखें लाल हैं, पानी आ रहा है या जलन है?",
    type: 'yes_no',
    options: [
      { text_en: "Yes", text_hi: "हाँ", symptom_weights: { "Conjunctivitis": 3 } },
      { text_en: "No", text_hi: "नहीं", symptom_weights: {} }
    ]
  },
  {
    id: 'q11',
    text_en: "Do you have a wound or cut that looks infected (swollen, pus, warm)?",
    text_hi: "क्या आपको कोई घाव या कट है जो संक्रमित लग रहा है (सूजा हुआ, मवाद, गर्म)?",
    type: 'yes_no',
    options: [
      { text_en: "Yes", text_hi: "हाँ", symptom_weights: { "Minor Wound/Infection": 3 } },
      { text_en: "No", text_hi: "नहीं", symptom_weights: {} }
    ]
  },
  {
    id: 'q12',
    text_en: "Do you feel dizzy, have chest pressure, or vision changes?",
    text_hi: "क्या आपको चक्कर आते हैं, छाती में दबाव महसूस होता है या दृष्टि में बदलाव आया है?",
    type: 'yes_no',
    options: [
      { text_en: "Yes", text_hi: "हाँ", symptom_weights: { "Hypertension Symptoms": 4 } },
      { text_en: "No", text_hi: "नहीं", symptom_weights: {} }
    ]
  },
  {
    id: 'q13',
    text_en: "Do you have body aches and fatigue along with fever?",
    text_hi: "क्या आपको बुखार के साथ शरीर में दर्द और थकान है?",
    type: 'yes_no',
    options: [
      { text_en: "Yes", text_hi: "हाँ", symptom_weights: { "Fever/Flu": 2, "Severe Infection/High Fever with complications": 2 } },
      { text_en: "No", text_hi: "नहीं", symptom_weights: {} }
    ]
  },
  {
    id: 'q14',
    text_en: "Have you been in contact with someone who was recently sick?",
    text_hi: "क्या आप हाल ही में किसी बीमार व्यक्ति के संपर्क में आए हैं?",
    type: 'yes_no',
    options: [
      { text_en: "Yes", text_hi: "हाँ", symptom_weights: { "Common Cold": 1, "Conjunctivitis": 1, "Fever/Flu": 1 } },
      { text_en: "No", text_hi: "नहीं", symptom_weights: {} }
    ]
  }
];

export function calculateDiagnosis(scores: Record<string, number>) {
  const maxScores: Record<string, number> = {};
  
  // Estimate max possible scores (simplification)
  QUESTIONS.forEach(q => {
    q.options.forEach(o => {
      Object.entries(o.symptom_weights).forEach(([disease, weight]) => {
        if (weight > 0) {
          maxScores[disease] = (maxScores[disease] || 0) + weight;
        }
      });
    });
  });

  const results = DISEASES.map(disease => {
    const score = scores[disease] || 0;
    const maxPossible = maxScores[disease] || 5; // Fallback max
    const percentage = Math.min((score / maxPossible) * 100, 100);
    return { disease, score, percentage };
  }).sort((a, b) => b.percentage - a.percentage);

  const top = results[0];
  let diagnosis = top.disease;
  let action = "dispensed";

  if (top.percentage < 60) {
    diagnosis = "Inconclusive — Doctor Referral Required";
    action = "auto_referred";
  }

  // Check for serious diseases
  if (diagnosis === "Hypertension Symptoms" || diagnosis === "Severe Infection/High Fever with complications") {
    action = "serious_referred";
  }

  return {
    diagnosis,
    confidence: top.percentage,
    action,
    topAlternatives: results.slice(0, 3)
  };
}
