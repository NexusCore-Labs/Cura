import { useState, useEffect, useCallback } from 'react';
import {
  getDoseLog,
  isDoseTaken as checkDoseTaken,
  isSlotTaken as checkSlotTaken,
  toggleDose as toggleDoseStorage,
  markSlotTaken as markSlotTakenStorage
} from '../utils/storage.js';
import { playConfirmationChime } from '../utils/audio.js';

export function useDoseLog() {
  const [doseLog, setDoseLog] = useState(() => getDoseLog());

  const refresh = useCallback(() => {
    setDoseLog(getDoseLog());
  }, []);

  useEffect(() => {
    window.addEventListener('cura-state-changed', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('cura-state-changed', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [refresh]);

  const isDoseTaken = useCallback(
    (dateIso, slotId, medId) => {
      return doseLog.some(
        entry => entry.date === dateIso && entry.slot === slotId && entry.medId === medId
      );
    },
    [doseLog]
  );

  const isSlotTaken = useCallback(
    (dateIso, slotId, medicinesInSlot) => {
      if (!medicinesInSlot || medicinesInSlot.length === 0) return true;
      return medicinesInSlot.every(med => isDoseTaken(dateIso, slotId, med.id));
    },
    [isDoseTaken]
  );

  const toggleDose = useCallback((dateIso, slotId, medId) => {
    const nowTaken = toggleDoseStorage(dateIso, slotId, medId);
    if (nowTaken) {
      playConfirmationChime();
    }
    setDoseLog(getDoseLog());
    return nowTaken;
  }, []);

  const markSlotTaken = useCallback((dateIso, slotId, medicinesInSlot) => {
    const count = markSlotTakenStorage(dateIso, slotId, medicinesInSlot);
    if (count > 0) {
      playConfirmationChime();
    }
    setDoseLog(getDoseLog());
    return count;
  }, []);

  return {
    doseLog,
    isDoseTaken,
    isSlotTaken,
    toggleDose,
    markSlotTaken,
    checkDoseTaken,
    checkSlotTaken
  };
}
