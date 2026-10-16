import { useState, useEffect, useCallback } from 'react';
import { getContacts, saveContacts } from '../utils/storage.js';
import { sanitizePhoneDigits, isValidInternationalPhone } from '../services/dispatchService.js';

export function useContacts() {
  const [contacts, setContactsState] = useState(() => getContacts());

  const refresh = useCallback(() => {
    setContactsState(getContacts());
  }, []);

  useEffect(() => {
    window.addEventListener('cura-state-changed', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('cura-state-changed', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [refresh]);

  const addContact = useCallback(({ name, relation, phone }) => {
    const current = getContacts();
    if (current.length >= 3) {
      return { ok: false, error: 'Maximum of 3 contacts allowed.' };
    }
    const cleanName = String(name || '').trim();
    const cleanRelation = String(relation || 'Family').trim();
    const cleanPhone = sanitizePhoneDigits(phone);

    if (!cleanName) {
      return { ok: false, error: 'Please enter a contact name.' };
    }
    if (!isValidInternationalPhone(cleanPhone)) {
      return { ok: false, error: 'Enter a valid phone number with country code (10–15 digits).' };
    }

    const next = [
      ...current,
      {
        id: `c-${Date.now()}`,
        name: cleanName,
        relation: cleanRelation || 'Family',
        phone: cleanPhone
      }
    ];
    saveContacts(next);
    setContactsState(next);
    return { ok: true };
  }, []);

  const updateContact = useCallback((id, { name, relation, phone }) => {
    const current = getContacts();
    const cleanName = String(name || '').trim();
    const cleanRelation = String(relation || 'Family').trim();
    const cleanPhone = sanitizePhoneDigits(phone);

    if (!cleanName) {
      return { ok: false, error: 'Please enter a contact name.' };
    }
    if (!isValidInternationalPhone(cleanPhone)) {
      return { ok: false, error: 'Enter a valid phone number with country code (10–15 digits).' };
    }

    const next = current.map(c =>
      c.id === id ? { ...c, name: cleanName, relation: cleanRelation, phone: cleanPhone } : c
    );
    saveContacts(next);
    setContactsState(next);
    return { ok: true };
  }, []);

  const deleteContact = useCallback((id) => {
    const current = getContacts();
    const next = current.filter(c => c.id !== id);
    saveContacts(next);
    setContactsState(next);
  }, []);

  /**
   * Adds a contact, or updates the existing one when the same number is already
   * saved. Used by onboarding so re-entering the same WhatsApp number does not
   * create duplicates or hit the 3-contact limit.
   */
  const upsertContact = useCallback(
    ({ name, relation, phone }) => {
      const cleanPhone = sanitizePhoneDigits(phone);
      const existing = getContacts().find(c => c.phone === cleanPhone);
      if (existing) {
        return updateContact(existing.id, { name, relation, phone });
      }
      return addContact({ name, relation, phone });
    },
    [addContact, updateContact]
  );

  return {
    contacts,
    maxReached: contacts.length >= 3,
    addContact,
    updateContact,
    deleteContact,
    upsertContact
  };
}
