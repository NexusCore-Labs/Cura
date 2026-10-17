import { formatTimeString } from '../utils/dates.js';

// Provider-based Caregiver Dispatch Service (WhatsApp wa.me and SMS hand-off)

/**
 * Strips +, spaces, dashes, and parentheses, keeping digits only.
 * Validates that a country code + number is present (at least 10 digits).
 */
export function sanitizePhoneDigits(rawPhone = '') {
  const digits = String(rawPhone || '').replace(/\D/g, '');
  return digits;
}

export function isValidInternationalPhone(rawPhone = '') {
  const digits = sanitizePhoneDigits(rawPhone);
  return digits.length >= 10 && digits.length <= 15;
}

/**
 * Resolves the registered caregiver/person mobile contact from stored contacts or profile.
 */
export function getRegisteredContact(contacts = [], profile = null) {
  const list = Array.isArray(contacts) ? contacts : [];
  const validFromList = list.find((c) => isValidInternationalPhone(c?.phone));
  if (validFromList) {
    return validFromList;
  }
  if (profile?.phone && isValidInternationalPhone(profile.phone)) {
    return {
      id: 'profile-contact',
      name: profile.userName || profile.patientName || 'Caregiver',
      relation: profile.role === 'caretaker' ? 'Caregiver' : 'Self',
      phone: sanitizePhoneDigits(profile.phone)
    };
  }
  return list[0] || null;
}

/**
 * Builds the exact confirmation message from stored profile and slot time:
 * 💊 *CURA Update*
 * • <patientName> took the <slotTime> dose.
 * • Verified at <verifiedTime> ✅
 */
export function buildConfirmationMessage({
  patientName = 'Ramesh',
  slotTime = '7:00 AM',
  verifiedTime = ''
} = {}) {
  const cleanName = String(patientName || 'Patient').trim();
  const cleanTime = String(slotTime || '7:00 AM').trim();
  const verified = String(verifiedTime || formatTimeString(new Date())).trim();

  return [
    '💊 *CURA Update*',
    `• ${cleanName} took the ${cleanTime} dose.`,
    `• Verified at ${verified} ✅`
  ].join('\n');
}

/**
 * Builds the WhatsApp confirmation message when a medicine dose is verified/taken:
 * 💊 *CURA Update*
 * • <patientName> took the <slotTime> dose.
 * • Verified at <verifiedTime> ✅
 */
export function buildMedicineTakenMessage({
  patientName = 'Ramesh',
  medicine = null,
  slot = null,
  slotTime = '',
  verifiedTime = ''
} = {}) {
  const cleanPatient = String(patientName || 'Patient').trim();
  const timeLabel = String(slot?.time || slotTime || '7:00 AM').trim();
  const verified = String(verifiedTime || formatTimeString(new Date())).trim();

  return [
    '💊 *CURA Update*',
    `• ${cleanPatient} took the ${timeLabel} dose.`,
    `• Verified at ${verified} ✅`
  ].join('\n');
}

/**
 * Reminder text sent to the family number — used for both WhatsApp and SMS so the
 * patient's routine (and the medicines due) is clear at a glance.
 */
export function buildDoseReminderMessage({
  patientName = 'Ramesh',
  slotLabel = 'Morning',
  slotTime = '7:00 AM',
  medicineNames = []
} = {}) {
  const cleanName = String(patientName || 'Patient').trim();
  const cleanLabel = String(slotLabel || 'dose').toLowerCase();
  const cleanTime = String(slotTime || '').trim();
  const names = (medicineNames || []).filter(Boolean).join(', ');
  const when = cleanTime ? `${cleanLabel} medicines at ${cleanTime}` : `${cleanLabel} medicines`;
  return `Cura reminder: ${cleanName}'s ${when}${names ? ` — ${names}` : ''}.`;
}

const providers = {
  whatsapp: {
    label: 'WhatsApp',
    buildUrl({ phone, message }) {
      const digits = sanitizePhoneDigits(phone);
      const encoded = encodeURIComponent(message || '');
      return `https://api.whatsapp.com/send?phone=${digits}&text=${encoded}`;
    },
    send({ phone, message, openWindow = true }) {
      const digits = sanitizePhoneDigits(phone);
      if (!digits || digits.length < 10) {
        return { ok: false, reason: 'missing_or_invalid_phone', url: null };
      }
      const url = this.buildUrl({ phone: digits, message });
      if (openWindow && typeof window !== 'undefined') {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
      return { ok: true, url, message };
    }
  },
  sms: {
    label: 'SMS',
    buildUrl({ phone, message }) {
      const digits = sanitizePhoneDigits(phone);
      // "?&body=" is the only form both Android and iOS accept for a prefilled SMS.
      return `sms:${digits}?&body=${encodeURIComponent(message || '')}`;
    },
    send({ phone, message, openWindow = true }) {
      const digits = sanitizePhoneDigits(phone);
      if (!digits || digits.length < 10) {
        return { ok: false, reason: 'missing_or_invalid_phone', url: null };
      }
      const url = this.buildUrl({ phone: digits, message });
      if (openWindow && typeof window !== 'undefined') {
        // Opening the SMS app replaces the current tab, so this is a navigation.
        window.location.href = url;
      }
      return { ok: true, url, message };
    }
  }
};

export function getDispatchProviders() {
  return Object.keys(providers);
}

export function registerDispatchProvider(name, handler) {
  if (name && handler && typeof handler.send === 'function') {
    providers[name] = handler;
  }
}

export function dispatchToContact({
  contact,
  patientName,
  slotTime,
  verifiedTime = '',
  provider = 'whatsapp',
  openWindow = true
} = {}) {
  const activeProvider = providers[provider] || providers.whatsapp;
  const message = buildConfirmationMessage({ patientName, slotTime, verifiedTime });
  return activeProvider.send({
    phone: contact?.phone || '',
    message,
    openWindow
  });
}

/**
 * Dispatches a WhatsApp (or SMS) confirmation to the registered caregiver/person
 * immediately when a medicine checkbox is ticked as taken.
 */
export function dispatchMedicineTaken({
  contact,
  patientName,
  medicine,
  slot,
  slotTime = '',
  verifiedTime = '',
  provider = 'whatsapp',
  openWindow = true
} = {}) {
  const activeProvider = providers[provider] || providers.whatsapp;
  const message = buildMedicineTakenMessage({ patientName, medicine, slot, slotTime, verifiedTime });
  return activeProvider.send({
    phone: contact?.phone || '',
    message,
    openWindow
  });
}

/**
 * Sends the same dose reminder over the chosen channel (WhatsApp or SMS).
 */
export function dispatchDoseReminder({
  contact,
  patientName,
  slotLabel,
  slotTime,
  medicineNames = [],
  provider = 'whatsapp',
  openWindow = true
} = {}) {
  const activeProvider = providers[provider] || providers.whatsapp;
  const message = buildDoseReminderMessage({ patientName, slotLabel, slotTime, medicineNames });
  return activeProvider.send({
    phone: contact?.phone || '',
    message,
    openWindow
  });
}
