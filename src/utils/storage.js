// Storage layer for Cura using localStorage
import { toIsoDate } from './dates.js';

const STORAGE_KEYS = {
  PROFILE: 'cura.profile',
  CONTACTS: 'cura.contacts',
  SCHEDULE: 'cura.schedule',
  DOSE_LOG: 'cura.doseLog',
  EXPLANATIONS: 'cura.explanations'
};

const DEFAULT_PROFILE = {
  patientName: 'Ramesh',
  language: 'en',
  textScale: 'default' // small | default | large | extra-large
};

const DEFAULT_CONTACTS = [
  {
    id: 'c1',
    name: 'Neha',
    relation: 'Daughter',
    phone: '919876543210'
  }
];

const DEFAULT_SCHEDULE = {
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
      needsReview: true // Used for demonstrating "Check this" state in review
    }
  ]
};

function readKey(key, fallback) {
  try {
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
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Failed to write ${key} to storage:`, err);
  }
}

export function initStorage() {
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
}

export function getProfile() {
  return readKey(STORAGE_KEYS.PROFILE, DEFAULT_PROFILE);
}

export function saveProfile(profile) {
  writeKey(STORAGE_KEYS.PROFILE, profile);
}

export function getContacts() {
  return readKey(STORAGE_KEYS.CONTACTS, DEFAULT_CONTACTS);
}

export function saveContacts(contacts) {
  writeKey(STORAGE_KEYS.CONTACTS, contacts);
}

export function getSchedule() {
  return readKey(STORAGE_KEYS.SCHEDULE, DEFAULT_SCHEDULE);
}

export function saveSchedule(schedule) {
  writeKey(STORAGE_KEYS.SCHEDULE, schedule);
}

export function getDoseLog() {
  return readKey(STORAGE_KEYS.DOSE_LOG, []);
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
  return existingIdx < 0; // returns true if now taken
}

export function markSlotTaken(dateIso, slotId, medicinesInSlot) {
  const log = getDoseLog();
  const now = new Date().toISOString();
  let markedCount = 0;

  medicinesInSlot.forEach(med => {
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

export function clearAllData() {
  localStorage.removeItem(STORAGE_KEYS.PROFILE);
  localStorage.removeItem(STORAGE_KEYS.CONTACTS);
  localStorage.removeItem(STORAGE_KEYS.SCHEDULE);
  localStorage.removeItem(STORAGE_KEYS.DOSE_LOG);
  localStorage.removeItem(STORAGE_KEYS.EXPLANATIONS);
}

export function resetMockData() {
  writeKey(STORAGE_KEYS.PROFILE, DEFAULT_PROFILE);
  writeKey(STORAGE_KEYS.CONTACTS, DEFAULT_CONTACTS);
  writeKey(STORAGE_KEYS.SCHEDULE, DEFAULT_SCHEDULE);
  writeKey(STORAGE_KEYS.DOSE_LOG, []);
}
