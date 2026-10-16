// Date, slot and meal-routine utilities for Cura (single source of truth for dose times)

/**
 * The four daily dose groups.
 * `label` matches the reference design (Morning / Afternoon / Evening / Night) and
 * each group is anchored to the patient's own daily routine via `mealTimes`.
 */
export const SLOTS = [
  { id: 'dawn', label: 'Morning', time: '7:00 AM', time24: '07:00', hour: 7, icon: 'wb_twilight', meal: 'breakfast' },
  { id: 'midday', label: 'Afternoon', time: '1:00 PM', time24: '13:00', hour: 13, icon: 'wb_sunny', meal: 'lunch' },
  { id: 'dusk', label: 'Evening', time: '6:00 PM', time24: '18:00', hour: 18, icon: 'nightlight_round', meal: 'evening' },
  { id: 'night', label: 'Night', time: '9:00 PM', time24: '21:00', hour: 21, icon: 'bedtime', meal: 'dinner' }
];

/** Default daily routine used until the user tells us their own meal timings. */
export const DEFAULT_MEAL_TIMES = {
  breakfast: '07:00',
  lunch: '13:00',
  dinner: '20:00'
};

export const MEAL_LABELS = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner'
};

export function getSlotById(slotId) {
  return SLOTS.find(s => s.id === slotId) || SLOTS[0];
}

/** Friendly "after breakfast" style reminder text for a slot. */
export function getSlotMealPhrase(slotId) {
  const slot = getSlotById(slotId);
  if (slot.meal === 'evening') return 'evening';
  return slot.meal;
}

function parseClockToMinutes(clock, fallbackMinutes) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(clock || '').trim());
  if (!match) return fallbackMinutes;
  const hours = Math.min(23, Math.max(0, Number(match[1])));
  const minutes = Math.min(59, Math.max(0, Number(match[2])));
  return hours * 60 + minutes;
}

function normalizeMinutes(totalMinutes) {
  const day = 24 * 60;
  return ((Math.round(totalMinutes) % day) + day) % day;
}

export function formatMinutesToClock(totalMinutes) {
  const total = normalizeMinutes(totalMinutes);
  const hours24 = Math.floor(total / 60);
  const minutes = total % 60;
  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`;
}

export function formatMinutesTo24(totalMinutes) {
  const total = normalizeMinutes(totalMinutes);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

/** Converts a stored "HH:MM" meal time into 12-hour display text ("7:00 AM"). */
export function formatMealTime(clock, fallbackClock) {
  const fallback = fallbackClock || '07:00';
  return formatMinutesToClock(parseClockToMinutes(clock, parseClockToMinutes(fallback, 7 * 60)));
}

/**
 * Builds the four dose groups with times derived from the patient's meal routine:
 * Morning = breakfast, Afternoon = lunch, Evening = two hours before dinner,
 * Night = one hour after dinner.
 */
export function getSlotsForProfile(profile) {
  const mealTimes = { ...DEFAULT_MEAL_TIMES, ...(profile?.mealTimes || {}) };
  const breakfast = parseClockToMinutes(mealTimes.breakfast, 7 * 60);
  const lunch = parseClockToMinutes(mealTimes.lunch, 13 * 60);
  const dinner = parseClockToMinutes(mealTimes.dinner, 20 * 60);

  const minutesById = {
    dawn: breakfast,
    midday: lunch,
    dusk: dinner - 120,
    night: dinner + 60
  };

  return SLOTS.map(slot => {
    const total = normalizeMinutes(minutesById[slot.id]);
    return {
      ...slot,
      hour: total / 60,
      time: formatMinutesToClock(total),
      time24: formatMinutesTo24(total)
    };
  });
}

/** Human summary of the routine, e.g. "Breakfast 7:00 AM · Lunch 1:00 PM · Dinner 8:00 PM". */
export function describeMealRoutine(profile) {
  const mealTimes = { ...DEFAULT_MEAL_TIMES, ...(profile?.mealTimes || {}) };
  return (['breakfast', 'lunch', 'dinner'])
    .map(key => `${MEAL_LABELS[key]} ${formatMealTime(mealTimes[key], DEFAULT_MEAL_TIMES[key])}`)
    .join(' · ');
}

export function getTodayDate() {
  return new Date();
}

export function toIsoDate(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatHeaderDate(date = new Date()) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });
}

export function formatGreeting(date = new Date(), patientName = 'Ramesh') {
  const hour = date.getHours();
  let timeGreeting = 'Good morning';
  if (hour >= 12 && hour < 17) {
    timeGreeting = 'Good afternoon';
  } else if (hour >= 17) {
    timeGreeting = 'Good evening';
  }
  return `${timeGreeting}, ${patientName}`;
}

/**
 * Returns a full week of days centred on today: [today - 3 ... today + 3].
 */
export function getCalendarStrip(currentDate = new Date()) {
  const strip = [];
  const base = new Date(currentDate);
  base.setHours(0, 0, 0, 0);

  for (let offset = -3; offset <= 3; offset++) {
    const d = new Date(base);
    d.setDate(base.getDate() + offset);
    strip.push({
      date: d,
      isoDate: toIsoDate(d),
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
      dayNumber: d.getDate(),
      isToday: offset === 0
    });
  }
  return strip;
}

/**
 * Determines which dose group is currently due.
 * Boundaries sit at the midpoint between consecutive group times, so the answer
 * follows the patient's own routine rather than fixed clock hours.
 */
export function getCurrentDueSlot(date = new Date(), slots = SLOTS) {
  const hours = date.getHours() + date.getMinutes() / 60;
  const ordered = Array.isArray(slots) && slots.length > 0 ? slots : SLOTS;
  let index = 0;
  for (let i = 1; i < ordered.length; i++) {
    const midpoint = (ordered[i - 1].hour + ordered[i].hour) / 2;
    if (hours >= midpoint) index = i;
  }
  return ordered[index].id;
}

export function formatTimeString(date = new Date()) {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}
