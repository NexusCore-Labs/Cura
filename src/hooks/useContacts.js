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

  return {
    contacts,
    maxReached: contacts.length >= 3,
    addContact,
    updateContact,
    deleteContact
  };
}
