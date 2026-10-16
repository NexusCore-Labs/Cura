import { useState, useEffect, useCallback } from 'react';
import {
  getSchedule,
  saveSchedule,
  getMedicineById,
  getSessionThumbnail,
  clearSessionThumbnail
} from '../utils/storage.js';

export function useSchedule() {
  const [schedule, setScheduleState] = useState(() => getSchedule());
  const [thumbnail, setThumbnailState] = useState(() => getSessionThumbnail());

  const refresh = useCallback(() => {
    setScheduleState(getSchedule());
    setThumbnailState(getSessionThumbnail());
  }, []);

  useEffect(() => {
    window.addEventListener('cura-state-changed', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('cura-state-changed', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [refresh]);

  const setSchedule = useCallback((nextSchedule) => {
    saveSchedule(nextSchedule);
    setScheduleState(getSchedule());
    setThumbnailState(getSessionThumbnail());
  }, []);

  const updateMedicine = useCallback((medId, patch) => {
    const current = getSchedule() || { approvedAt: null, medicines: [] };
    const medicines = (current.medicines || []).map(med =>
      med.id === medId ? { ...med, ...patch } : med
    );
    const updated = { ...current, medicines };
    saveSchedule(updated);
    setScheduleState(updated);
  }, []);

  const confirmMedicineReview = useCallback((medId) => {
    updateMedicine(medId, { needsReview: false });
  }, [updateMedicine]);

  const addMedicine = useCallback((newMed) => {
    const current = getSchedule() || { approvedAt: null, medicines: [] };
    const medWithId = {
      id: newMed.id || `med-${Date.now()}`,
      name: newMed.name || 'Medicine',
      nameRead: newMed.nameRead || newMed.name || 'Medicine',
      strength: newMed.strength || '',
      form: newMed.form || 'tablet',
      slots: Array.isArray(newMed.slots) && newMed.slots.length > 0 ? newMed.slots : ['dawn'],
      food: newMed.food || 'After meal',
      notes: newMed.notes || 'Follow prescription instructions',
      needsReview: Boolean(newMed.needsReview)
    };
    const updated = {
      ...current,
      medicines: [...(current.medicines || []), medWithId]
    };
    saveSchedule(updated);
    setScheduleState(updated);
    return medWithId;
  }, []);

  const deleteMedicine = useCallback((medId) => {
    const current = getSchedule() || { approvedAt: null, medicines: [] };
    const updated = {
      ...current,
      medicines: (current.medicines || []).filter(m => m.id !== medId)
    };
    saveSchedule(updated);
    setScheduleState(updated);
  }, []);

  const approveSchedule = useCallback(() => {
    const current = getSchedule() || { approvedAt: null, medicines: [] };
    const hasUnreviewed = (current.medicines || []).some(m => m.needsReview);
    if (hasUnreviewed) {
      return false;
    }
    const updated = {
      ...current,
      approvedAt: new Date().toISOString(),
      medicines: (current.medicines || []).map(m => ({ ...m, needsReview: false }))
    };
    saveSchedule(updated);
    clearSessionThumbnail();
    setScheduleState(updated);
    return true;
  }, []);

  const medicines = schedule?.medicines || [];
  const hasNeedsReview = medicines.some(m => Boolean(m.needsReview));

  return {
    schedule,
    medicines,
    thumbnail,
    hasNeedsReview,
    setSchedule,
    updateMedicine,
    confirmMedicineReview,
    addMedicine,
    deleteMedicine,
    approveSchedule,
    getMedicineById
  };
}
