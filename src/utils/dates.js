// Date and slot utilities for Cura

export const SLOTS = [
  { id: 'dawn', label: 'Dawn', time: '7:00 AM', hour: 7, icon: 'wb_twilight' },
  { id: 'midday', label: 'Midday', time: '1:00 PM', hour: 13, icon: 'wb_sunny' },
  { id: 'dusk', label: 'Dusk', time: '6:00 PM', hour: 18, icon: 'nightlight_round' },
  { id: 'night', label: 'Night', time: '9:00 PM', hour: 21, icon: 'bedtime' }
];

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
 * Returns a 5-day strip centered on today: [today - 2, today - 1, today, today + 1, today + 2]
 */
export function getCalendarStrip(currentDate = new Date()) {
  const strip = [];
  const base = new Date(currentDate);
  base.setHours(0, 0, 0, 0);

  for (let offset = -2; offset <= 2; offset++) {
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
 * Determines which time-of-day group is currently due based on current hour
 * Dawn: until 10:00
 * Midday: 10:00 to 15:00
 * Dusk: 15:00 to 19:30
 * Night: after 19:30
 */
export function getCurrentDueSlot(date = new Date()) {
  const hours = date.getHours() + date.getMinutes() / 60;
  if (hours < 10.5) return 'dawn';
  if (hours < 15.5) return 'midday';
  if (hours < 19.5) return 'dusk';
  return 'night';
}

export function formatTimeString(date = new Date()) {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}
