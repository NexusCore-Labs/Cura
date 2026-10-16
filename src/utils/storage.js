// Storage layer for Cura using localStorage and sessionStorage (for temporary 300px Rx thumbnail)
import { toIsoDate, DEFAULT_MEAL_TIMES } from './dates.js';

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
  onboarded: false
};

/**
 * Pure helper: keeps a meal-time object to the known keys and "HH:MM" values.
 */
export function normalizeMealTimes(mealTimes = {}) {
  const clean = { ...DEFAULT_MEAL_TIMES };
  Object.keys(DEFAULT_MEAL_TIMES).forEach(key => {
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
export function buildProfileFromOnboarding({ userName, role, patientName, language, mealTimes } = {}) {
  const cleanUser = String(userName || '').trim();
  const isCaretaker = role === 'caretaker';
  const cleanPatient = String(patientName || '').trim();
  return {
    userName: cleanUser,
    role: isCaretaker ? 'caretaker' : 'patient',
    patientName: isCaretaker ? cleanPatient || cleanUser : cleanUser,
    language: SUPPORTED_LANGUAGES.includes(language) ? language : 'en',
    mealTimes: normalizeMealTimes(mealTimes),
    onboarded: true
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

export const DEFAULT_SCHEDULE = {
  approvedAt: new Date().toISOString(),
  thumbnail: '/samples/cura_sample_image1.jpg',
  medicines: [
    {
      id: 'med-1',
      name: 'Metformin',
      nameRead: 'Metformin',
      strength: '500 mg',
      form: 'tablet',
      slots: ['dawn'],
      food: 'After breakfast',
      notes: 'Take with breakfast',
      needsReview: false
    },
    {
      id: 'med-2',
      name: 'Vitamin B12',
      nameRead: 'Vit B12',
      strength: '1500 mcg',
      form: 'capsule',
      slots: ['midday'],
      food: 'After lunch',
      notes: 'Take after lunch',
      needsReview: false
    },
    {
      id: 'med-3',
      name: 'Amlodipine',
      nameRead: 'Amlodipine',
      strength: '5 mg',
      form: 'tablet',
      slots: ['night'],
      food: 'After dinner',
      notes: 'Take after dinner',
      needsReview: true
    }
  ]
};

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
  if (!localStorage.getItem(STORAGE_KEYS.SCHEDULE)) {
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
  return readKey(STORAGE_KEYS.SCHEDULE, DEFAULT_SCHEDULE);
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
  return sched?.thumbnail || '/samples/cura_sample_image1.jpg';
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
    entry => entry.date === dateIso && entry.slot === slotId && entry.medId === medId
  );
}

export function isSlotTaken(dateIso, slotId, medicinesInSlot) {
  if (!medicinesInSlot || medicinesInSlot.length === 0) return true;
  return medicinesInSlot.every(med => isDoseTaken(dateIso, slotId, med.id));
}

export function toggleDose(dateIso, slotId, medId) {
  const log = getDoseLog();
  const existingIdx = log.findIndex(
    entry => entry.date === dateIso && entry.slot === slotId && entry.medId === medId
  );
  if (existingIdx >= 0) {
    log.splice(existingIdx, 1);
  } else {
    log.push({
      date: dateIso,
      slot: slotId,
      medId: medId,
      takenAt: new Date().toISOString()
    });
  }
  writeKey(STORAGE_KEYS.DOSE_LOG, log);
  return existingIdx < 0;
}

export function markSlotTaken(dateIso, slotId, medicinesInSlot) {
  const log = getDoseLog();
  const now = new Date().toISOString();
  let markedCount = 0;

  (medicinesInSlot || []).forEach(med => {
    const exists = log.some(
      entry => entry.date === dateIso && entry.slot === slotId && entry.medId === med.id
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
  return schedule.medicines.find(m => m.id === medId) || null;
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
