// Guarded Medicine Explanation Service (/api/explain-medicine)
// Sends ONLY generic_name, strength, form, and language. Never sends images or patient PII.
import { getExplanationCache, saveExplanationCache } from '../utils/storage.js';

const SAFE_FALLBACK_EXPLANATIONS = {
  metformin: {
    generic_name: 'Metformin',
    drug_class: 'Antidiabetic (Biguanide)',
    commonly_used_for: 'Commonly used to help manage blood sugar levels as part of a daily routine.',
    how_it_helps: 'Helps the body respond smoothly to insulin and supports steady glucose balance after meals.',
    good_to_know: 'Usually taken with a meal to feel gentle on the stomach.',
    ask_pharmacist_if: 'Ask your pharmacist if you feel unwell after taking it, are unsure about a missed dose, or take other medicines.',
    confidence: 0.95,
    unsure: false
  },
  amlodipine: {
    generic_name: 'Amlodipine',
    drug_class: 'Calcium channel blocker',
    commonly_used_for: 'Commonly used to support healthy blood flow and cardiovascular comfort.',
    how_it_helps: 'Helps blood vessels relax gently so blood can circulate smoothly throughout the day.',
    good_to_know: 'Taking it at the same time each day helps maintain a steady routine.',
    ask_pharmacist_if: 'Ask your pharmacist if you feel lightheaded, are unsure about timing or a missed dose, or take other supplements.',
    confidence: 0.95,
    unsure: false
  },
  'vitamin b12': {
    generic_name: 'Methylcobalamin (Vitamin B12)',
    drug_class: 'Essential Vitamin Supplement',
    commonly_used_for: 'Commonly used to support healthy nerves and red blood cell formation.',
    how_it_helps: 'Replenishes daily Vitamin B12 stores that help maintain energy and nerve comfort.',
    good_to_know: 'Follow the timing written on your prescription sheet.',
    ask_pharmacist_if: 'Ask your pharmacist if you are unsure about timing, a missed dose, or taking other supplements together.',
    confidence: 0.95,
    unsure: false
  },
  augmentin: {
    generic_name: 'Amoxicillin + Clavulanic Acid',
    drug_class: 'Antibiotic combination',
    commonly_used_for: 'Commonly used to treat bacterial infections as prescribed by a doctor or dentist.',
    how_it_helps: 'Works to stop bacteria from growing while protecting the active antibiotic.',
    good_to_know: 'Often taken with food for stomach comfort across the full prescribed course.',
    ask_pharmacist_if: 'Ask your pharmacist if you notice a rash or stomach upset, or if you are unsure about a missed dose.',
    confidence: 0.95,
    unsure: false
  },
  amoxicillin: {
    generic_name: 'Amoxicillin',
    drug_class: 'Penicillin antibiotic',
    commonly_used_for: 'Commonly used to help clear bacterial infections under a doctor’s care.',
    how_it_helps: 'Helps prevent bacteria from building their protective cell walls.',
    good_to_know: 'Spacing doses evenly through the day helps it work steadily.',
    ask_pharmacist_if: 'Ask your pharmacist if you have any allergy history, feel unwell, or miss a scheduled dose.',
    confidence: 0.95,
    unsure: false
  },
  paracetamol: {
    generic_name: 'Paracetamol',
    drug_class: 'Analgesic and antipyretic',
    commonly_used_for: 'Commonly used to help ease mild aches or fever when prescribed.',
    how_it_helps: 'Helps calm pain signals and supports normal body temperature regulation.',
    good_to_know: 'Check with your pharmacist before combining with other pain or cold products.',
    ask_pharmacist_if: 'Ask your pharmacist if you are unsure about timing, a missed dose, or taking other medicines.',
    confidence: 0.95,
    unsure: false
  }
};

function validateExplanationPayload(data) {
  if (!data || typeof data !== 'object') return null;
  if (data.unsure === true) {
    return {
      generic_name: data.generic_name || '',
      drug_class: '',
      commonly_used_for: '',
      how_it_helps: '',
      good_to_know: '',
      ask_pharmacist_if: 'Ask your pharmacist what to do if you miss a dose, feel unwell, or take other medicines.',
      confidence: Number(data.confidence || 0),
      unsure: true
    };
  }
  return {
    generic_name: String(data.generic_name || ''),
    drug_class: String(data.drug_class || ''),
    commonly_used_for: String(data.commonly_used_for || ''),
    how_it_helps: String(data.how_it_helps || ''),
    good_to_know: String(data.good_to_know || ''),
    ask_pharmacist_if: String(
      data.ask_pharmacist_if ||
        'Ask your pharmacist what to do if you miss a dose, feel unwell, or take other medicines.'
    ),
    translated: data.translated || null,
    confidence: Number(data.confidence ?? 0.9),
    unsure: Boolean(data.unsure)
  };
}

export async function explainMedicine({
  genericName = '',
  strength = '',
  form = 'tablet',
  language = 'en'
} = {}) {
  const cleanGeneric = String(genericName || '').trim();
  const cleanStrength = String(strength || '').trim();
  const cleanLang = String(language || 'en').trim();

  if (!cleanGeneric) {
    return validateExplanationPayload({ unsure: true });
  }

  const cacheKey = `${cleanGeneric.toLowerCase()}|${cleanStrength.toLowerCase()}|${cleanLang}`;
  const cached = getExplanationCache(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const res = await fetch('/api/explain-medicine', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        generic_name: cleanGeneric,
        strength: cleanStrength,
        form: String(form || 'tablet'),
        language: cleanLang
      })
    });

    if (res.ok) {
      const json = await res.json();
      const validated = validateExplanationPayload(json);
      if (validated) {
        saveExplanationCache(cacheKey, validated);
        return validated;
      }
    }
  } catch (_) {
    // Fall through to safe local dictionary
  }

  const keyLower = cleanGeneric.toLowerCase();
  const localMatch = Object.keys(SAFE_FALLBACK_EXPLANATIONS).find(k => keyLower.includes(k));
  if (localMatch) {
    const result = validateExplanationPayload(SAFE_FALLBACK_EXPLANATIONS[localMatch]);
    saveExplanationCache(cacheKey, result);
    return result;
  }

  return {
    generic_name: cleanGeneric,
    drug_class: 'Prescribed medication',
    commonly_used_for: 'Commonly used to support your health routine as directed by your physician. Your doctor can confirm why it was prescribed for you.',
    how_it_helps: 'Prescribed for regular daily adherence according to your doctor’s clinical instructions.',
    good_to_know: '',
    ask_pharmacist_if: 'Ask your pharmacist what to do if you miss a dose, feel unwell, or take other medicines.',
    confidence: 0.8,
    unsure: false
  };
}
