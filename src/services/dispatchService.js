// Provider-based Caregiver Dispatch Service (WhatsApp wa.me default)

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
 * Builds the exact confirmation message from stored profile and slot time:
 * "<patientName> took the <slot time> medicines."
 */
export function buildConfirmationMessage({ patientName = 'Ramesh', slotTime = '7:00 AM' } = {}) {
  const cleanName = String(patientName || 'Patient').trim();
  const cleanTime = String(slotTime || '7:00 AM').trim();
  return `${cleanName} took the ${cleanTime} medicines.`;
}

const providers = {
  whatsapp: {
    buildUrl({ phone, message }) {
      const digits = sanitizePhoneDigits(phone);
      const encoded = encodeURIComponent(message || '');
      return `https://wa.me/${digits}?text=${encoded}`;
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
      return { ok: true, url };
    }
  }
};

export function registerDispatchProvider(name, handler) {
  if (name && handler && typeof handler.send === 'function') {
    providers[name] = handler;
  }
}

export function dispatchToContact({
  contact,
  patientName,
  slotTime,
  provider = 'whatsapp',
  openWindow = true
} = {}) {
  const activeProvider = providers[provider] || providers.whatsapp;
  const message = buildConfirmationMessage({ patientName, slotTime });
  return activeProvider.send({
    phone: contact?.phone || '',
    message,
    openWindow
  });
}
