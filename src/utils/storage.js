// Storage layer for Cura using localStorage and sessionStorage (for temporary 300px Rx thumbnail)
import { DEFAULT_MEAL_TIMES } from './dates.js';

export const STORAGE_KEYS = {
  PROFILE: 'cura.profile',
  CONTACTS: 'cura.contacts',
  SCHEDULE: 'cura.schedule',
  DOSE_LOG: 'cura.doseLog',
  EXPLANATIONS: 'cura.explanations',
  SESSION_THUMBNAIL: 'cura.sessionThumbnail',
  PENDING_SCAN: 'cura.pendingScan',
  PENDING_REVIEW: 'cura.pendingReview'
};

/** Only English is offered for now. */
export const SUPPORTED_LANGUAGES = ['en'];

export const DEFAULT_PROFILE = {
  userName: '',
  role: 'patient', // patient | caretaker
  patientName: 'Ramesh',
  language: 'en',
  textScale: 'default', // default | large | extra-large
  muteChime: false,
  /** The patient's daily routine; dose reminders are scheduled around these times. */
  mealTimes: { ...DEFAULT_MEAL_TIMES },
  /** Alert channels used for dose reminders. */
  whatsappAlerts: true,
  smsAlerts: true,
  onboarded: false,
  /**
   * True between finishing the details form and approving a scanned schedule.
   * While it is set, every app route sends the user back to #/scan so the
   * scan -> review -> approve procedure cannot be skipped.
   */
  scanRequired: false
};

/**
 * Pure helper: keeps a meal-time object to the known keys and "HH:MM" values.
 */
export function normalizeMealTimes(mealTimes = {}) {
  const clean = { ...DEFAULT_MEAL_TIMES };
  Object.keys(DEFAULT_MEAL_TIMES).forEach((key) => {
    const value = String(mealTimes?.[key] || '').trim();
    if (/^\d{1,2}:\d{2}$/.test(value)) clean[key] = value;
  });
  return clean;
}

/**
 * Pure helper: normalises the raw onboarding form into a stored profile.
 * Kept free of browser APIs so it can be unit-tested.
 * - A patient's own name becomes the patient name.
 * - A caretaker keeps their own name plus the patient they look after.
 */
export function buildProfileFromOnboarding({
  userName,
  role,
  patientName,
  language,
  mealTimes,
  scanRequired
} = {}) {
  const cleanUser = String(userName || '').trim();
  const isCaretaker = role === 'caretaker';
  const cleanPatient = String(patientName || '').trim();
  return {
    userName: cleanUser,
    role: isCaretaker ? 'caretaker' : 'patient',
    patientName: isCaretaker ? cleanPatient || cleanUser : cleanUser,
    language: SUPPORTED_LANGUAGES.includes(language) ? language : 'en',
    mealTimes: normalizeMealTimes(mealTimes),
    onboarded: true,
    // Fresh details mean the prescription still has to be scanned and approved
    // before the dose schedule can be used. Callers editing an existing profile
    // pass its current scanRequired so returning users are not re-gated.
    scanRequired: scanRequired === undefined ? true : Boolean(scanRequired)
  };
}

export const DEFAULT_CONTACTS = [
  {
    id: 'c1',
    name: 'Neha',
    relation: 'Daughter',
    phone: '919876543210'
  }
];

/**
 * Empty initial schedule — actual medicines are populated when a prescription
 * is uploaded and extracted by Gemini (or added manually by the user).
 */
export const DEFAULT_SCHEDULE = {
  approvedAt: null,
  thumbnail: null,
  medicines: []
};

/**
 * Detects the legacy static mock schedule (Metformin / Vitamin B12 / Amlodipine)
 * that was previously seeded into localStorage before Gemini extraction was wired.
 */
function isLegacyMockSchedule(sched) {
  if (!sched || !Array.isArray(sched.medicines)) return false;
  if (sched.aiReadAt || sched.userModified) return false;
  const ids = sched.medicines.map((m) => m.id).join(',');
  return ids === 'med-1,med-2,med-3' && sched.medicines[0]?.name === 'Metformin';
}

function notifyStateChange() {
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent('cura-state-changed'));
  }
}

function readKey(key, fallback) {
  try {
    if (typeof localStorage === 'undefined') return fallback;
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Failed to read ${key} from storage:`, err);
    return fallback;
  }
}

function writeKey(key, value) {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
    notifyStateChange();
  } catch (err) {
    console.error(`Failed to write ${key} to storage:`, err);
  }
}

export function initStorage() {
  if (typeof localStorage === 'undefined') return;
  if (!localStorage.getItem(STORAGE_KEYS.PROFILE)) {
    writeKey(STORAGE_KEYS.PROFILE, DEFAULT_PROFILE);
  }
  if (!localStorage.getItem(STORAGE_KEYS.CONTACTS)) {
    writeKey(STORAGE_KEYS.CONTACTS, DEFAULT_CONTACTS);
  }
  const existingSchedule = readKey(STORAGE_KEYS.SCHEDULE, null);
  if (!existingSchedule || isLegacyMockSchedule(existingSchedule)) {
    writeKey(STORAGE_KEYS.SCHEDULE, DEFAULT_SCHEDULE);
  }
  if (!localStorage.getItem(STORAGE_KEYS.DOSE_LOG)) {
    writeKey(STORAGE_KEYS.DOSE_LOG, []);
  }
  if (!localStorage.getItem(STORAGE_KEYS.EXPLANATIONS)) {
    writeKey(STORAGE_KEYS.EXPLANATIONS, {});
  }
}

export function getProfile() {
  const stored = readKey(STORAGE_KEYS.PROFILE, DEFAULT_PROFILE);
  return {
    ...DEFAULT_PROFILE,
    ...stored,
    mealTimes: normalizeMealTimes(stored?.mealTimes)
  };
}

export function saveProfile(profile) {
  const merged = { ...DEFAULT_PROFILE, ...profile };
  writeKey(STORAGE_KEYS.PROFILE, merged);
  return merged;
}

export function getContacts() {
  const list = readKey(STORAGE_KEYS.CONTACTS, DEFAULT_CONTACTS);
  return Array.isArray(list) ? list.slice(0, 3) : DEFAULT_CONTACTS;
}

export function saveContacts(contacts) {
  const sanitized = (Array.isArray(contacts) ? contacts : []).slice(0, 3);
  writeKey(STORAGE_KEYS.CONTACTS, sanitized);
  return sanitized;
}

export function getSchedule() {
  const sched = readKey(STORAGE_KEYS.SCHEDULE, DEFAULT_SCHEDULE);
  if (isLegacyMockSchedule(sched)) {
    writeKey(STORAGE_KEYS.SCHEDULE, DEFAULT_SCHEDULE);
    return DEFAULT_SCHEDULE;
  }
  return sched;
}

export function saveSchedule(schedule) {
  if (!schedule) {
    writeKey(STORAGE_KEYS.SCHEDULE, { approvedAt: null, medicines: [] });
    return;
  }
  // Never persist full base64 prescription photos in localStorage
  const copy = { ...schedule };
  if (copy.thumbnail && copy.thumbnail.startsWith('data:image/')) {
    saveSessionThumbnail(copy.thumbnail);
    delete copy.thumbnail;
  }

  // Prune any orphaned doseLog entries whose (medId, slot) no longer belong to the active schedule
  if (Array.isArray(copy.medicines) && typeof localStorage !== 'undefined') {
    const validPairs = new Set();
    for (const med of copy.medicines) {
      for (const slotId of med?.slots || []) {
        validPairs.add(`${med.id}::${slotId}`);
      }
    }
    const currentLog = readKey(STORAGE_KEYS.DOSE_LOG, []);
    if (Array.isArray(currentLog) && currentLog.length > 0) {
      const seen = new Set();
      const cleanedLog = currentLog.filter((entry) => {
        if (!entry || !validPairs.has(`${entry.medId}::${entry.slot}`)) return false;
        const uniqueKey = `${entry.date}::${entry.slot}::${entry.medId}`;
        if (seen.has(uniqueKey)) return false;
        seen.add(uniqueKey);
        return true;
      });
      if (cleanedLog.length !== currentLog.length) {
        try {
          localStorage.setItem(STORAGE_KEYS.DOSE_LOG, JSON.stringify(cleanedLog));
        } catch (_) {}
      }
    }
  }

  // Also cache any Gemini-extracted explanations carried on the medicines
  if (Array.isArray(copy.medicines)) {
    const allExplanations = readKey(STORAGE_KEYS.EXPLANATIONS, {});
    let updatedExplanations = false;
    for (const med of copy.medicines) {
      if (med?.explanation && (med.explanation.commonly_used_for || med.explanation.how_it_helps)) {
        const genericKey = String(med.genericName || med.name || '')
          .trim()
          .toLowerCase();
        const nameKey = String(med.name || '')
          .trim()
          .toLowerCase();
        const strengthKey = String(med.strength || '')
          .trim()
          .toLowerCase();
        if (genericKey) {
          allExplanations[`${genericKey}|${strengthKey}|en`] = med.explanation;
          updatedExplanations = true;
        }
        if (nameKey && nameKey !== genericKey) {
          allExplanations[`${nameKey}|${strengthKey}|en`] = med.explanation;
          updatedExplanations = true;
        }
      }
    }
    if (updatedExplanations && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEYS.EXPLANATIONS, JSON.stringify(allExplanations));
      } catch (_) {}
    }
  }

  writeKey(STORAGE_KEYS.SCHEDULE, copy);
}

export function saveSessionThumbnail(dataUrl) {
  try {
    if (typeof sessionStorage !== 'undefined' && dataUrl) {
      sessionStorage.setItem(STORAGE_KEYS.SESSION_THUMBNAIL, dataUrl);
    }
  } catch (_) {
    // Ignore quota errors in sessionStorage
  }
}

export function getSessionThumbnail() {
  try {
    if (typeof sessionStorage !== 'undefined') {
      const thumb = sessionStorage.getItem(STORAGE_KEYS.SESSION_THUMBNAIL);
      if (thumb) return thumb;
    }
  } catch (_) {}
  const sched = getSchedule();
  return sched?.thumbnail || null;
}

export function clearSessionThumbnail() {
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(STORAGE_KEYS.SESSION_THUMBNAIL);
    }
  } catch (_) {}
}

/**
 * Holds the scanned prescription (downscaled JPEG or PDF) between the scanner and
 * the reading screen. Session-scoped only, never persisted to localStorage.
 */
export function savePendingScan(payload) {
  try {
    if (typeof sessionStorage === 'undefined' || !payload) return;
    sessionStorage.setItem(STORAGE_KEYS.PENDING_SCAN, JSON.stringify(payload));
  } catch (_) {
    // Ignore quota errors
  }
}

export function getPendingScan() {
  try {
    if (typeof sessionStorage === 'undefined') return null;
    const raw = sessionStorage.getItem(STORAGE_KEYS.PENDING_SCAN);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

export function clearPendingScan() {
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(STORAGE_KEYS.PENDING_SCAN);
    }
  } catch (_) {}
}

export function getDoseLog() {
  return readKey(STORAGE_KEYS.DOSE_LOG, []);
}

export function saveDoseLog(log) {
  writeKey(STORAGE_KEYS.DOSE_LOG, Array.isArray(log) ? log : []);
}

export function isDoseTaken(dateIso, slotId, medId) {
  const log = getDoseLog();
  return log.some(
    (entry) => entry.date === dateIso && entry.slot === slotId && entry.medId === medId
  );
}

export function isSlotTaken(dateIso, slotId, medicinesInSlot) {
  if (!medicinesInSlot || medicinesInSlot.length === 0) return true;
  return medicinesInSlot.every((med) => isDoseTaken(dateIso, slotId, med.id));
}

export function toggleDose(dateIso, slotId, medId) {
  const log = getDoseLog();
  const alreadyTaken = log.some(
    (entry) => entry.date === dateIso && entry.slot === slotId && entry.medId === medId
  );
  const filtered = log.filter(
    (entry) => !(entry.date === dateIso && entry.slot === slotId && entry.medId === medId)
  );
  if (!alreadyTaken) {
    filtered.push({
      date: dateIso,
      slot: slotId,
      medId: medId,
      takenAt: new Date().toISOString()
    });
  }
  writeKey(STORAGE_KEYS.DOSE_LOG, filtered);
  return !alreadyTaken;
}

export function markSlotTaken(dateIso, slotId, medicinesInSlot) {
  const log = getDoseLog();
  const now = new Date().toISOString();
  let markedCount = 0;

  (medicinesInSlot || []).forEach((med) => {
    const exists = log.some(
      (entry) => entry.date === dateIso && entry.slot === slotId && entry.medId === med.id
    );
    if (!exists) {
      log.push({
        date: dateIso,
        slot: slotId,
        medId: med.id,
        takenAt: now
      });
      markedCount++;
    }
  });

  writeKey(STORAGE_KEYS.DOSE_LOG, log);
  return markedCount;
}

export function getMedicineById(medId) {
  const schedule = getSchedule();
  if (!schedule || !schedule.medicines) return null;
  return schedule.medicines.find((m) => m.id === medId) || null;
}

export function getExplanationCache(cacheKey) {
  const all = readKey(STORAGE_KEYS.EXPLANATIONS, {});
  return all[cacheKey] || null;
}

export function saveExplanationCache(cacheKey, explanation) {
  const all = readKey(STORAGE_KEYS.EXPLANATIONS, {});
  all[cacheKey] = explanation;
  writeKey(STORAGE_KEYS.EXPLANATIONS, all);
}

export function clearAllData() {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(
      STORAGE_KEYS.SCHEDULE,
      JSON.stringify({ approvedAt: null, medicines: [] })
    );
    localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.DOSE_LOG, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.EXPLANATIONS, JSON.stringify({}));
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(DEFAULT_PROFILE));
  }
  clearSessionThumbnail();
  clearPendingScan();
  notifyStateChange();
}

export function resetMockData() {
  writeKey(STORAGE_KEYS.PROFILE, DEFAULT_PROFILE);
  writeKey(STORAGE_KEYS.CONTACTS, DEFAULT_CONTACTS);
  writeKey(STORAGE_KEYS.SCHEDULE, DEFAULT_SCHEDULE);
  writeKey(STORAGE_KEYS.DOSE_LOG, []);
  writeKey(STORAGE_KEYS.EXPLANATIONS, {});
}
