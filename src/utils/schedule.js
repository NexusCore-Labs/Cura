// Shorthand Decoder, Medicine Directory Fuzzy Matcher (Fuse.js), and Schedule Builder
import Fuse from 'fuse.js';
import medicinesCatalog from '../data/medicines.json' with { type: 'json' };
import { SLOTS } from './dates.js';

const catalogEntries = medicinesCatalog?.medicines || [];

// Flatten catalog for Fuse.js searching across generic and brand names
const searchIndex = [];
catalogEntries.forEach(entry => {
  searchIndex.push({
    searchTerm: entry.generic,
    generic: entry.generic,
    drug_class: entry.drug_class,
    default_form: entry.default_form,
    common_strengths: entry.common_strengths || [],
    isBrand: false
  });
  (entry.brands || []).forEach(brand => {
    searchIndex.push({
      searchTerm: brand,
      generic: entry.generic,
      brandName: brand,
      drug_class: entry.drug_class,
      default_form: entry.default_form,
      common_strengths: entry.common_strengths || [],
      isBrand: true
    });
  });
});

const fuse = new Fuse(searchIndex, {
  keys: ['searchTerm', 'generic'],
  includeScore: true,
  threshold: 0.42,
  ignoreLocation: true
});

/**
 * Decodes prescription frequency and meal shorthand into Cura's 4 daily slots
 * and food instructions. Never guesses unknown shorthand (sets needsReview: true).
 *
 * Supported frequency patterns:
 * - "1-0-1" / "1+0+1" -> ['dawn', 'night']
 * - "1-1-1" / "1+1+1" -> ['dawn', 'midday', 'night']
 * - "1-1-1-1" / "1+1+1+1" -> ['dawn', 'midday', 'dusk', 'night']
 * - "1-0-0" -> ['dawn'], "0-1-0" -> ['midday'], "0-0-1" -> ['night']
 * - "1-1-0" -> ['dawn', 'midday'], "0-1-1" -> ['midday', 'night']
 * - "OD" / "QD" / "once daily" -> ['dawn']
 * - "BD" / "BID" / "twice daily" -> ['dawn', 'night']
 * - "TDS" / "TID" / "thrice daily" -> ['dawn', 'midday', 'night']
 * - "QID" / "four times daily" -> ['dawn', 'midday', 'dusk', 'night']
 * - "HS" / "at bedtime" / "bedtime" -> ['night']
 *
 * Supported food patterns:
 * - "AC" / "before food" / "before meals" / "empty stomach" -> "Before food" / "Empty stomach"
 * - "PC" / "after food" / "after meals" -> "After food"
 * - "after breakfast/lunch/dinner", "before breakfast/lunch/dinner" -> also implies slot if no explicit frequency
 */
export function decodeShorthand(frequencyRaw = '', foodRaw = '') {
  const freqText = String(frequencyRaw || '').trim();
  const foodText = String(foodRaw || '').trim();
  const combined = `${freqText} ${foodText}`.toLowerCase();

  let slots = [];
  let food = '';
  let recognizedFrequency = false;
  let ambiguousFrequency = false;

  // Flag explicit non-daily or as-needed frequencies as needing review
  if (/\b(prn|sos|as needed|weekly|twice weekly|once a week|alternate days|stat)\b/i.test(combined)) {
    ambiguousFrequency = true;
  }

  // 1. Check 4-part numeric pattern: e.g., 1-1-1-1 or 1+1+1+1
  const fourPartMatch = freqText.match(/(\d+)\s*[-+/]\s*(\d+)\s*[-+/]\s*(\d+)\s*[-+/]\s*(\d+)/);
  // 2. Check 3-part numeric pattern: e.g., 1-0-1, 1 - 0 - 0, 1+0+1
  const threePartMatch = !fourPartMatch && freqText.match(/(\d+)\s*[-+/]\s*(\d+)\s*[-+/]\s*(\d+)/);

  if (fourPartMatch) {
    const [_, d, m, du, n] = fourPartMatch.map(Number);
    if (d > 0) slots.push('dawn');
    if (m > 0) slots.push('midday');
    if (du > 0) slots.push('dusk');
    if (n > 0) slots.push('night');
    recognizedFrequency = slots.length > 0;
  } else if (threePartMatch) {
    const [_, d, m, n] = threePartMatch.map(Number);
    if (d > 0) slots.push('dawn');
    if (m > 0) slots.push('midday');
    if (n > 0) slots.push('night');
    recognizedFrequency = slots.length > 0;
  } else if (!ambiguousFrequency) {
    // Latin / standard medical abbreviations
    if (/\b(qid|q\.i\.d\.|four times a day|4 times a day)\b/i.test(freqText)) {
      slots = ['dawn', 'midday', 'dusk', 'night'];
      recognizedFrequency = true;
    } else if (/\b(tds|t\.d\.s\.|tid|t\.i\.d\.|thrice daily|three times a day|3 times a day)\b/i.test(freqText)) {
      slots = ['dawn', 'midday', 'night'];
      recognizedFrequency = true;
    } else if (/\b(bd|b\.d\.|bid|b\.i\.d\.|twice daily|twice a day|2 times a day)\b/i.test(freqText)) {
      slots = ['dawn', 'night'];
      recognizedFrequency = true;
    } else if (/\b(hs|h\.s\.|bedtime|at bedtime|at night|qhs)\b/i.test(freqText)) {
      slots = ['night'];
      recognizedFrequency = true;
    } else if (/\b(od|o\.d\.|qd|q\.d\.|once daily|once a day|morning)\b/i.test(freqText)) {
      slots = ['dawn'];
      recognizedFrequency = true;
    }
  }

  // Decode meal / food timing
  if (/\b(empty stomach)\b/i.test(combined)) {
    food = 'Empty stomach';
  } else if (/\b(before breakfast)\b/i.test(combined)) {
    food = 'Before breakfast';
    if (!recognizedFrequency && !ambiguousFrequency) {
      slots = ['dawn'];
      recognizedFrequency = true;
    }
  } else if (/\b(after breakfast|with breakfast)\b/i.test(combined)) {
    food = 'After breakfast';
    if (!recognizedFrequency && !ambiguousFrequency) {
      slots = ['dawn'];
      recognizedFrequency = true;
    }
  } else if (/\b(before lunch)\b/i.test(combined)) {
    food = 'Before lunch';
    if (!recognizedFrequency && !ambiguousFrequency) {
      slots = ['midday'];
      recognizedFrequency = true;
    }
  } else if (/\b(after lunch|with lunch)\b/i.test(combined)) {
    food = 'After lunch';
    if (!recognizedFrequency && !ambiguousFrequency) {
      slots = ['midday'];
      recognizedFrequency = true;
    }
  } else if (/\b(before dinner)\b/i.test(combined)) {
    food = 'Before dinner';
    if (!recognizedFrequency && !ambiguousFrequency) {
      slots = ['night'];
      recognizedFrequency = true;
    }
  } else if (/\b(after dinner|with dinner)\b/i.test(combined)) {
    food = 'After dinner';
    if (!recognizedFrequency && !ambiguousFrequency) {
      slots = ['night'];
      recognizedFrequency = true;
    }
  } else if (/\b(ac|a\.c\.|before food|before meals|before meal)\b/i.test(combined)) {
    food = 'Before food';
  } else if (/\b(pc|p\.c\.|after food|after meals|after meal|with food|with meals)\b/i.test(combined)) {
    food = 'After food';
  }

  const needsReview = !recognizedFrequency || ambiguousFrequency || slots.length === 0;

  return {
    slots,
    food,
    needsReview
  };
}

/**
 * Fuzzy-matches an array of OCR name_candidates (or a single string) against medicines.json.
 * Flags low confidence (< 0.75) as needing review.
 */
export function matchMedicineName(candidatesOrName) {
  const candidates = Array.isArray(candidatesOrName)
    ? candidatesOrName
    : typeof candidatesOrName === 'string' && candidatesOrName.trim()
      ? [{ name: candidatesOrName.trim(), confidence: 0.85 }]
      : [];

  if (candidates.length === 0) {
    return {
      matchedName: '',
      genericName: '',
      drugClass: '',
      confidence: 0,
      needsReview: true
    };
  }

  let bestResult = null;
  let bestCombinedConfidence = 0;
  let bestRawCandidate = candidates[0];

  for (const cand of candidates.slice(0, 3)) {
    const rawName = String(cand.name || '')
      .replace(/^(tab\.?|cap\.?|syp\.?|inj\.?|t\.|c\.)\s*/i, '')
      .trim();
    if (!rawName) continue;

    const ocrConf = typeof cand.confidence === 'number' ? cand.confidence : 0.8;
    const hits = fuse.search(rawName);

    if (hits.length > 0) {
      const topHit = hits[0];
      const fuseSimilarity = 1 - (topHit.score ?? 0.5);
      const combined = Number((ocrConf * 0.6 + fuseSimilarity * 0.4).toFixed(2));
      if (combined > bestCombinedConfidence) {
        bestCombinedConfidence = combined;
        bestResult = topHit.item;
        bestRawCandidate = { ...cand, cleanedName: rawName };
      }
    } else if (ocrConf * 0.5 > bestCombinedConfidence) {
      bestCombinedConfidence = Number((ocrConf * 0.5).toFixed(2));
      bestRawCandidate = { ...cand, cleanedName: rawName };
    }
  }

  const displayName = bestResult
    ? bestResult.isBrand
      ? bestResult.brandName
      : bestResult.generic
    : bestRawCandidate?.cleanedName || bestRawCandidate?.name || 'Unknown medicine';

  return {
    matchedName: displayName,
    genericName: bestResult?.generic || displayName,
    drugClass: bestResult?.drug_class || '',
    defaultForm: bestResult?.default_form || 'tablet',
    confidence: bestCombinedConfidence,
    needsReview: bestCombinedConfidence < 0.75
  };
}

/**
 * Autocomplete search helper for the Review editor.
 */
export function searchMedicinesCatalog(query = '') {
  const q = String(query || '').trim();
  if (!q) {
    return catalogEntries.slice(0, 12).map(e => ({
      name: e.generic,
      generic: e.generic,
      drug_class: e.drug_class,
      default_form: e.default_form,
      common_strengths: e.common_strengths
    }));
  }
  return fuse.search(q, { limit: 8 }).map(r => ({
    name: r.item.isBrand ? `${r.item.brandName} (${r.item.generic})` : r.item.generic,
    displayName: r.item.isBrand ? r.item.brandName : r.item.generic,
    generic: r.item.generic,
    drug_class: r.item.drug_class,
    default_form: r.item.default_form,
    common_strengths: r.item.common_strengths
  }));
}

/**
 * Fallback dosage wording when the AI did not read an explicit amount.
 */
export function defaultDoseLabel(form = 'tablet') {
  switch (String(form || '').toLowerCase()) {
    case 'tablet':
      return '1 tablet';
    case 'capsule':
      return '1 capsule';
    case 'syrup':
      return '5 ml';
    case 'drops':
      return 'as written';
    default:
      return 'as written';
  }
}

/**
 * Converts the raw JSON from /api/read-prescription into a Cura schedule object.
 * Applies shorthand decoding, Fuse.js matching, and strict needsReview rules.
 *
 * The medicine name and description come from the AI; `dose`, `slots` and `food`
 * are the fields the user confirms or corrects on the review screen.
 */
export function buildScheduleFromOcr(ocrData) {
  const rawMeds = Array.isArray(ocrData?.medicines) ? ocrData.medicines : [];

  const medicines = rawMeds.map((item, idx) => {
    const match = matchMedicineName(item.name_candidates || item.raw_text || '');
    const decoded = decodeShorthand(item.frequency_raw, item.food_raw);
    const strength = String(item.strength || '').trim();
    const form =
      item.form && item.form !== 'unknown'
        ? item.form
        : match.defaultForm || 'tablet';

    const notLegible = item.legible === false || (item.name_candidates || []).length === 0;
    const missingStrength = !strength;
    const needsReview =
      Boolean(notLegible) ||
      Boolean(match.needsReview) ||
      Boolean(decoded.needsReview) ||
      Boolean(missingStrength);

    const foodLabel = decoded.food || item.food_raw || '';
    const notesParts = [];
    if (item.notes) notesParts.push(item.notes);
    else if (foodLabel) notesParts.push(`Take ${foodLabel.toLowerCase()}`);
    if (item.duration) notesParts.push(`for ${item.duration}`);

    const doseRaw = String(item.dose_raw || '').trim();

    return {
      id: `med-${Date.now()}-${idx + 1}`,
      name: match.matchedName || 'Unreadable medicine',
      nameRead: item.name_candidates?.[0]?.name || item.raw_text || match.matchedName,
      genericName: match.genericName || match.matchedName,
      drugClass: match.drugClass || '',
      strength: strength || '',
      form,
      /** Amount taken each time — the AI suggests it, the user confirms it. */
      dose: doseRaw || defaultDoseLabel(form),
      /** True once the AI-proposed dose/timings were reviewed by the user. */
      doseConfirmed: false,
      slots: decoded.slots.length > 0 ? decoded.slots : ['dawn'],
      food: foodLabel || 'As directed',
      notes: notesParts.join(' • ') || 'Follow your prescription sheet',
      /** Exactly what the AI saw on the sheet, shown back for verification. */
      sourceRaw: String(item.raw_text || '').trim(),
      confidence: match.confidence,
      needsReview
    };
  });

  return {
    approvedAt: null,
    imageQuality: ocrData?.image_quality || 'good',
    warnings: ocrData?.warnings || [],
    medicines
  };
}

/**
 * Groups schedule medicines into the four daily dose groups.
 * Pass `slots` (from getSlotsForProfile) to use the patient's own meal-time routine.
 */
export function groupMedicinesBySlot(medicines = [], dateIso, doseLog = [], slots = SLOTS) {
  const activeSlots = Array.isArray(slots) && slots.length > 0 ? slots : SLOTS;
  return activeSlots.map(slot => {
    const medsInSlot = (medicines || []).filter(
      m => Array.isArray(m.slots) && m.slots.includes(slot.id)
    );
    const isCompleted =
      medsInSlot.length > 0 &&
      medsInSlot.every(med =>
        doseLog.some(
          entry => entry.date === dateIso && entry.slot === slot.id && entry.medId === med.id
        )
      );
    return {
      ...slot,
      medicines: medsInSlot,
      isCompleted
    };
  });
}

/**
 * Builds the plain-language "how to take it" sentence from the values the user
 * confirmed on the review screen (never from AI guesses).
 */
export function describeDose(med, slots = SLOTS) {
  if (!med) return '';
  const parts = [];
  if (med.dose) parts.push(med.dose);
  if (med.food) parts.push(String(med.food).toLowerCase());
  const times = (med.slots || [])
    .map(id => {
      const slot = slots.find(s => s.id === id);
      return slot ? `${slot.label.toLowerCase()} (${slot.time})` : id;
    })
    .join(', ');
  if (times) parts.push(times);
  return parts.join(', ');
}
