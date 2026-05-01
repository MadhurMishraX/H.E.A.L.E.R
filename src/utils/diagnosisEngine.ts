// Redesigned Diagnosis Engine
export interface Option {
  text_en: string;
  text_hi: string;
}

export interface Question {
  id: string;
  text_en: string;
  text_hi: string;
  type: 'yes_no' | 'multiple_choice' | 'multiple_select';
  options: Option[];
  camera_trigger?: boolean;
}

export const QUESTION_TREE: Record<string, Question> = {
  // OPENING
  'Q1': {
    id: 'Q1',
    text_en: "What is bothering you the most today?",
    text_hi: "आज आपको सबसे ज्यादा क्या परेशान कर रहा है?",
    type: 'multiple_choice',
    options: [
      { text_en: "Fever / Body aches / Cold", text_hi: "बुखार / शरीर में दर्द / सर्दी" },
      { text_en: "Headache", text_hi: "सिरदर्द" },
      { text_en: "Stomach pain / Loose motions / Vomiting", text_hi: "पेट दर्द / दस्त / उल्टी" },
      { text_en: "Skin rash / Itching / Infection", text_hi: "त्वचा पर दाने / खुजली / संक्रमण" },
      { text_en: "Something else", text_hi: "कुछ और" }
    ]
  },

  // TRACK A - FLU / FEVER
  'Q_A2': {
    id: 'Q_A2',
    text_en: "How high is your fever?",
    text_hi: "आपका बुखार कितना है?",
    type: 'multiple_choice',
    options: [
      { text_en: "Mild warmth / Below 100°F", text_hi: "हल्की गर्मी / 100°F से नीचे" },
      { text_en: "100–102°F", text_hi: "100–102°F" },
      { text_en: "Above 102°F", text_hi: "102°F से ऊपर" }
    ]
  },
  'Q_A3': {
    id: 'Q_A3',
    text_en: "Do you have body aches and fatigue along with fever?",
    text_hi: "क्या आपको बुखार के साथ शरीर में दर्द और थकान है?",
    type: 'multiple_choice',
    options: [
      { text_en: "Yes, significant", text_hi: "हाँ, बहुत अधिक" },
      { text_en: "Mild", text_hi: "हल्का" },
      { text_en: "No", text_hi: "नहीं" }
    ]
  },
  'Q_A4': {
    id: 'Q_A4',
    text_en: "Do you have runny nose, sore throat, or dry cough?",
    text_hi: "क्या आपको नाक बहना, गले में खराश या सूखी खांसी है?",
    type: 'yes_no',
    options: [
      { text_en: "Yes", text_hi: "हाँ" },
      { text_en: "No", text_hi: "नहीं" }
    ]
  },
  'Q_A5': {
    id: 'Q_A5',
    text_en: "How many days have you had these symptoms?",
    text_hi: "आपको ये लक्षण कितने दिनों से हैं?",
    type: 'multiple_choice',
    options: [
      { text_en: "1–2 days", text_hi: "1–2 दिन" },
      { text_en: "3–5 days", text_hi: "3–5 दिन" },
      { text_en: "More than 5 days", text_hi: "5 दिनों से अधिक" }
    ]
  },

  // TRACK B - HEADACHE
  'Q_B2': {
    id: 'Q_B2',
    text_en: "Where is your headache located?",
    text_hi: "आपका सिरदर्द कहाँ है?",
    type: 'multiple_choice',
    options: [
      { text_en: "Forehead / Behind the eyes", text_hi: "माथे / आंखों के पीछे" },
      { text_en: "One side of the head", text_hi: "सिर के एक तरफ" },
      { text_en: "Back of head / Neck area", text_hi: "सिर के पीछे / गर्दन के क्षेत्र में" },
      { text_en: "All over / Generalized", text_hi: "हर जगह / पूरे सिर में" }
    ]
  },
  'Q_B3': {
    id: 'Q_B3',
    text_en: "How severe is the pain?",
    text_hi: "दर्द कितना गंभीर है?",
    type: 'multiple_choice',
    options: [
      { text_en: "Mild (1–4 out of 10)", text_hi: "हल्का (10 में से 1-4)" },
      { text_en: "Moderate (5–7 out of 10)", text_hi: "मध्यम (10 में से 5-7)" },
      { text_en: "Severe (8–10 out of 10)", text_hi: "गंभीर (10 में से 8-10)" }
    ]
  },
  'Q_B4': {
    id: 'Q_B4',
    text_en: "Do you also have any of these?",
    text_hi: "क्या आपको इनमें से कुछ और भी है?",
    type: 'multiple_choice',
    options: [
      { text_en: "Nausea or vomiting", text_hi: "मतली या उल्टी" },
      { text_en: "Sensitivity to light or sound", text_hi: "प्रकाश या ध्वनि के प्रति संवेदनशीलता" },
      { text_en: "Neck stiffness", text_hi: "गर्दन में अकड़न" },
      { text_en: "None of these", text_hi: "इनमें से कोई नहीं" }
    ]
  },
  'Q_B5': {
    id: 'Q_B5',
    text_en: "Do you have fever along with the headache?",
    text_hi: "क्या आपको सिरदर्द के साथ बुखार भी है?",
    type: 'yes_no',
    options: [
      { text_en: "Yes", text_hi: "हाँ" },
      { text_en: "No", text_hi: "नहीं" }
    ]
  },

  // TRACK C - STOMACH
  'Q_C2': {
    id: 'Q_C2',
    text_en: "What is your main stomach complaint?",
    text_hi: "आपकी पेट की मुख्य शिकायत क्या है?",
    type: 'multiple_choice',
    options: [
      { text_en: "Loose motions / Diarrhea", text_hi: "दस्त / पानी जैसा मल" },
      { text_en: "Vomiting", text_hi: "उल्टी" },
      { text_en: "Burning / Acidity", text_hi: "जलन / एसिडिटी" },
      { text_en: "Stomach cramps / Pain", text_hi: "पेट में मरोड़ / दर्द" },
      { text_en: "Bloating / Gas", text_hi: "सूजन / गैस" }
    ]
  },
  'Q_C3': {
    id: 'Q_C3',
    text_en: "Did it start after eating outside food or something unusual?",
    text_hi: "क्या यह बाहर का खाना या कुछ असामान्य खाने के बाद शुरू हुआ?",
    type: 'yes_no',
    options: [
      { text_en: "Yes", text_hi: "हाँ" },
      { text_en: "No", text_hi: "नहीं" }
    ]
  },
  'Q_C4': {
    id: 'Q_C4',
    text_en: "How many times today?",
    text_hi: "आज कितनी बार?",
    type: 'multiple_choice',
    options: [
      { text_en: "1–2 times", text_hi: "1-2 बार" },
      { text_en: "3–5 times", text_hi: "3-5 बार" },
      { text_en: "More than 5 times", text_hi: "5 बार से अधिक" }
    ]
  },
  'Q_C5': {
    id: 'Q_C5',
    text_en: "Do you have fever along with stomach symptoms?",
    text_hi: "क्या आपको पेट के लक्षणों के साथ बुखार है?",
    type: 'yes_no',
    options: [
      { text_en: "Yes", text_hi: "हाँ" },
      { text_en: "No", text_hi: "नहीं" }
    ]
  },

  // TRACK D - SKIN INFECTION
  'Q_D2': {
    id: 'Q_D2',
    text_en: "How would you describe the skin problem?",
    text_hi: "आप त्वचा की समस्या का वर्णन कैसे करेंगे?",
    type: 'multiple_choice',
    camera_trigger: true,
    options: [
      { text_en: "Red rash with itching", text_hi: "खुजली के साथ लाल दाने" },
      { text_en: "Peeling / Flaking / Cracking skin", text_hi: "छिलती / परतदार / फटी त्वचा" },
      { text_en: "Pus-filled or oozing area", text_hi: "मवाद से भरा या रिसने वाला क्षेत्र" },
      { text_en: "Dry patches / White or brown spots", text_hi: "सूखे धब्बे / सफेद या भूरे रंग के धब्बे" }
    ]
  },
  'Q_D3': {
    id: 'Q_D3',
    text_en: "Where is it located?",
    text_hi: "यह कहाँ स्थित है?",
    type: 'multiple_choice',
    options: [
      { text_en: "Between toes / Feet", text_hi: "पैर की उंगलियों के बीच / पैर" },
      { text_en: "Groin / Inner thighs / Buttocks", text_hi: "कमर / जांघों के अंदरूनी हिस्से / नितंब" },
      { text_en: "Underarms / Neck folds / Under breasts", text_hi: "बगल / गर्दन की सिलवटें / स्तनों के नीचे" },
      { text_en: "Face / Scalp", text_hi: "चेहरा / खोपड़ी" },
      { text_en: "Arms / Legs / Open body areas", text_hi: "कंधे / पैर / खुले शरीर के अंग" }
    ]
  },
  'Q_D4': {
    id: 'Q_D4',
    text_en: "How long has it been there?",
    text_hi: "यह कितने समय से है?",
    type: 'multiple_choice',
    options: [
      { text_en: "Less than 3 days", text_hi: "3 दिनों से कम" },
      { text_en: "3–7 days", text_hi: "3-7 दिन" },
      { text_en: "More than 1 week", text_hi: "1 सप्ताह से अधिक" }
    ]
  },
  'Q_D5': {
    id: 'Q_D5',
    text_en: "Does it get worse in heat, sweat, or at night?",
    text_hi: "क्या यह गर्मी, पसीने में या रात में खराब हो जाता है?",
    type: 'multiple_choice',
    options: [
      { text_en: "Yes, significantly worse", text_hi: "हाँ, बहुत खराब" },
      { text_en: "Mild", text_hi: "हल्का" },
      { text_en: "No difference", text_hi: "कोई फर्क नहीं" }
    ]
  },

  // CLOSING CHECK
  'Q_CLOSE1': {
    id: 'Q_CLOSE1',
    text_en: "How long have you had symptoms overall?",
    text_hi: "कुल मिलाकर आपको लक्षण कितने समय से हैं?",
    type: 'multiple_choice',
    options: [
      { text_en: "Less than 2 days", text_hi: "2 दिनों से कम" },
      { text_en: "2–5 days", text_hi: "2-5 दिन" },
      { text_en: "More than 5 days", text_hi: "5 दिनों से अधिक" }
    ]
  },
  'Q_CLOSE2': {
    id: 'Q_CLOSE2',
    text_en: "Do you also have any of these right now?",
    text_hi: "क्या आपको अभी इनमें से कोई भी है?",
    type: 'multiple_choice',
    options: [
      { text_en: "High fever above 102°F", text_hi: "102°F से ऊपर तेज बुखार" },
      { text_en: "Extreme weakness / Cannot get up", text_hi: "अत्यधिक कमजोरी / उठ नहीं पा रहा" },
      { text_en: "No food or water intake since yesterday", text_hi: "कल से खाना या पानी नहीं लिया" },
      { text_en: "Chest pain or difficulty breathing", text_hi: "सीने में दर्द या सांस लेने में कठिनाई" },
      { text_en: "None of these", text_hi: "इनमें से कोई नहीं" }
    ]
  }
};

export function getNextQuestion(currentQuestionId: string | null, selectedAnswer: any, currentScores: any) {
  if (!currentQuestionId) return 'Q1';

  if (currentQuestionId === 'Q1') {
    const sel = Array.isArray(selectedAnswer) ? selectedAnswer[0] : selectedAnswer;
    if (sel === 0) return 'Q_A2';
    if (sel === 1) return 'Q_B2';
    if (sel === 2) return 'Q_C2';
    if (sel === 3) return 'Q_D2';
    return 'Q_CLOSE1'; // Something else
  }

  const sequences: Record<string, string[]> = {
    'A': ['Q_A2', 'Q_A3', 'Q_A4', 'Q_A5'],
    'B': ['Q_B2', 'Q_B3', 'Q_B4', 'Q_B5'],
    'C': ['Q_C2', 'Q_C3', 'Q_C4', 'Q_C5'],
    'D': ['Q_D2', 'Q_D3', 'Q_D4', 'Q_D5']
  };

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
      return currentTrack[currentIndex + 1];
    }
    return 'Q_CLOSE1';
  }

  if (currentQuestionId === 'Q_CLOSE1') return 'Q_CLOSE2';
  
  return null;
}

export function calculateDiagnosis(sessionAnswers: any[]) {
  const getAns = (qId: string) => {
    const ans = sessionAnswers.find(a => a.question_id === qId);
    if (!ans) return -1;
    return Array.isArray(ans.selected_option) ? ans.selected_option[0] : ans.selected_option;
  };

  const close1 = getAns('Q_CLOSE1');
  const close2 = getAns('Q_CLOSE2');
  
  if (close2 !== -1 && close2 !== 4) {
    return {
      diagnosis: 'OTHER — URGENT',
      confidence: 100,
      confidenceLabel: "Emergency Setup Required",
      labelColor: "red",
      is_serious: true,
      action: "refer",
      note: "Red flag symptoms detected. Immediate medical attention required."
    };
  }

  if (close1 === 2) {
    return {
      diagnosis: 'OTHER',
      confidence: 90,
      confidenceLabel: "Prolonged Symptoms",
      labelColor: "red",
      is_serious: true,
      action: "refer",
      note: "Symptoms lasting over 5 days require a doctor's evaluation."
    };
  }

  const q1 = getAns('Q1');

  if (q1 === 0) {
    const a2 = getAns('Q_A2');
    const a3 = getAns('Q_A3');
    const a4 = getAns('Q_A4');
    const a5 = getAns('Q_A5');
    
    if (a5 === 2) return { diagnosis: 'OTHER', confidence: 95, confidenceLabel: "Requires Doctor", labelColor: "red", is_serious: true, action: "refer", note: "Symptoms >5 days" };
    
    if (a2 === 1) { // 100-102
      if ((a3 === 0 || a3 === 1) && a4 === 0) {
        return { diagnosis: 'FLU', confidence: 95, confidenceLabel: "High Confidence", labelColor: "green", action: "dispense", is_serious: false };
      }
    }
    if (a2 === 2) { // > 102
      if ((a3 === 0 || a3 === 1) && a4 === 1) {
         return { diagnosis: 'VIRAL FEVER', confidence: 90, confidenceLabel: "High Confidence", labelColor: "green", action: "dispense", is_serious: false };
      }
    }
    if (a2 === 0 && a3 === 2 && a4 === 1) {
      return { diagnosis: 'OTHER', confidence: 100, confidenceLabel: "Doctor Consultation Required", labelColor: "amber", action: "refer", is_serious: true, note: "Mild warmth without other clear symptoms." };
    }
    
    return { diagnosis: 'FLU', confidence: 75, confidenceLabel: "Likely Flu", labelColor: "green", action: "dispense", is_serious: false };
  }

  if (q1 === 1) {
    const b2 = getAns('Q_B2');
    const b3 = getAns('Q_B3');
    const b4 = getAns('Q_B4');
    const b5 = getAns('Q_B5');

    if (b3 === 2 && b4 === 2 && b5 === 0) { 
       return { diagnosis: 'OTHER — URGENT', confidence: 100, confidenceLabel: "Emergency!", labelColor: "red", action: "refer", is_serious: true, note: "Possible meningitis." };
    }

    if (b2 === 2) { 
       return { diagnosis: 'OTHER', confidence: 85, confidenceLabel: "Blood Pressure Check Recommended", labelColor: "amber", action: "refer", is_serious: true, note: "History of BP needs checking." };
    }

    if (b2 === 0 && (b3 === 0 || b3 === 1) && b5 === 1 && (b4 === 3 || b4 === 1)) {
        return { diagnosis: 'TENSION HEADACHE', confidence: 90, confidenceLabel: "High Confidence", labelColor: "green", action: "dispense", is_serious: false };
    }

    if (b2 === 1 && (b3 === 1 || b3 === 2) && b4 === 0 && b5 === 1) {
        return { diagnosis: 'MIGRAINE', confidence: 95, confidenceLabel: "High Confidence", labelColor: "green", action: "dispense", is_serious: false };
    }

    if (b2 === 3 && b5 === 0) {
        return { diagnosis: 'FLU', confidence: 85, confidenceLabel: "Likely Flu-Related", labelColor: "green", action: "dispense", is_serious: false };
    }

    return { diagnosis: 'TENSION HEADACHE', confidence: 70, confidenceLabel: "Likely Tension Headache", labelColor: "green", action: "dispense", is_serious: false, note: "If pain persists, please see a doctor." };
  }

  if (q1 === 2) {
    const c2 = getAns('Q_C2');
    const c3 = getAns('Q_C3');
    const c4 = getAns('Q_C4');
    const c5 = getAns('Q_C5');

    if (c2 === 0 && c4 === 2 && c5 === 0) {
       return { diagnosis: 'OTHER — URGENT', confidence: 100, confidenceLabel: "Require Immediate Help", labelColor: "red", action: "refer", is_serious: true, note: "Loose motions >5 times + high fever." };
    }

    if (c2 === 0 && c3 === 0 && c5 === 1 && (c4 === 0 || c4 === 1)) {
       return { diagnosis: 'FOOD POISONING / GASTROENTERITIS', confidence: 90, confidenceLabel: "High Confidence", labelColor: "green", action: "dispense", is_serious: false };
    }
    
    if (c2 === 1 && c3 === 0 && c5 === 1) {
       return { diagnosis: 'FOOD POISONING', confidence: 90, confidenceLabel: "High Confidence", labelColor: "green", action: "dispense", is_serious: false };
    }
    
    if (c2 === 2 && c3 === 1 && c5 === 1) {
       return { diagnosis: 'ACIDITY / GASTRITIS', confidence: 95, confidenceLabel: "High Confidence", labelColor: "blue", action: "dispense", is_serious: false };
    }

    if (c2 === 4 && c5 === 1) {
       return { diagnosis: 'GAS / IBS', confidence: 90, confidenceLabel: "High Confidence", labelColor: "blue", action: "dispense", is_serious: false };
    }

    if (c2 === 0 || c2 === 1) {
       return { diagnosis: 'FOOD POISONING / GASTROENTERITIS', confidence: 75, confidenceLabel: "Likely Infection", labelColor: "green", action: "dispense", is_serious: false };
    }
    return { diagnosis: 'ACIDITY / GASTRITIS', confidence: 75, confidenceLabel: "Likely Acidity", labelColor: "blue", action: "dispense", is_serious: false };
  }

  if (q1 === 3) {
    const d2 = getAns('Q_D2');
    const d3 = getAns('Q_D3');
    const d4 = getAns('Q_D4');
    const d5 = getAns('Q_D5');

    if (d2 === 0 && d5 === 2) {
       return { diagnosis: 'OTHER — URGENT', confidence: 100, confidenceLabel: "Consult Doctor Immediately", labelColor: "red", action: "refer", is_serious: true, note: "Rash with high fever." };
    }

    if ((d2 === 1 || d2 === 0) && (d3 === 0 || d3 === 1 || d3 === 2) && d5 === 0) {
       return { diagnosis: 'FUNGAL INFECTION', confidence: 95, confidenceLabel: "High Confidence", labelColor: "green", action: "dispense", is_serious: false };
    }
    
    if (d2 === 0 && (d5 === 1 || d5 === 2)) {
       return { diagnosis: 'ALLERGIC RASH / URTICARIA', confidence: 90, confidenceLabel: "High Confidence", labelColor: "green", action: "dispense", is_serious: false };
    }
    
    if (d2 === 2 && (d4 === 0 || d4 === 1)) {
       return { diagnosis: 'BACTERIAL SKIN INFECTION', confidence: 90, confidenceLabel: "High Confidence", labelColor: "green", action: "dispense", is_serious: false };
    }

    if (d2 === 3 && d3 !== 0 && d3 !== 1 && d3 !== 2) {
       return { diagnosis: 'FUNGAL (Tinea Versicolor)', confidence: 90, confidenceLabel: "High Confidence", labelColor: "green", action: "dispense", is_serious: false };
    }

    if (d2 === 0 || d2 === 3) {
        return { diagnosis: 'ALLERGIC RASH / URTICARIA', confidence: 80, confidenceLabel: "Likely Allergy", labelColor: "green", action: "dispense", is_serious: false };
    }
    return { diagnosis: 'FUNGAL INFECTION', confidence: 80, confidenceLabel: "Likely Fungal", labelColor: "green", action: "dispense", is_serious: false };
  }

  return {
    diagnosis: 'OTHER',
    confidence: 100,
    confidenceLabel: "Doctor Referral Required",
    labelColor: "amber",
    is_serious: true,
    action: "refer",
    note: "Symptom combination requires clinical evaluation."
  };
}
