import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  SLOTS,
  toIsoDate,
  formatHeaderDate,
  formatGreeting,
  getCalendarStrip,
  getCurrentDueSlot,
  formatTimeString
} from '../utils/dates.js';

export function useToday() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    // Schedule an exact midnight refresh plus a 30-second tick to keep due slots and midnight transitions accurate
    const interval = setInterval(() => {
      setNow(new Date());
    }, 30000);

    const current = new Date();
    const nextMidnight = new Date(
      current.getFullYear(),
      current.getMonth(),
      current.getDate() + 1,
      0,
      0,
      1
    );
    const msUntilMidnight = Math.max(1000, nextMidnight.getTime() - current.getTime());
    const midnightTimer = setTimeout(() => {
      setNow(new Date());
    }, msUntilMidnight);

    return () => {
      clearInterval(interval);
      clearTimeout(midnightTimer);
    };
  }, [now.toDateString()]);

  const todayIso = useMemo(() => toIsoDate(now), [now]);
  const headerDate = useMemo(() => formatHeaderDate(now), [now]);
  const calendarStrip = useMemo(() => getCalendarStrip(now), [now]);
  const currentSlotId = useMemo(() => getCurrentDueSlot(now), [now]);
  const timeString = useMemo(() => formatTimeString(now), [now]);

  const getGreeting = useCallback(
    (patientName = 'Ramesh') => formatGreeting(now, patientName),
    [now]
  );

  return {
    today: now,
    todayIso,
    headerDate,
    calendarStrip,
    currentSlotId,
    timeString,
    slots: SLOTS,
    getGreeting
  };
}
