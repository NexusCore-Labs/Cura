import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import {
  decodeShorthand,
  matchMedicineName,
  buildScheduleFromOcr,
  groupMedicinesBySlot,
  defaultDoseLabel,
  describeDose
} from '../src/utils/schedule.js';
import {
  SLOTS,
  toIsoDate,
  getCalendarStrip,
  getCurrentDueSlot,
  formatGreeting,
  getSlotsForProfile,
  describeMealRoutine,
  DEFAULT_MEAL_TIMES
} from '../src/utils/dates.js';
import {
  sanitizePhoneDigits,
  isValidInternationalPhone,
  buildConfirmationMessage,
  buildDoseReminderMessage,
  dispatchToContact,
  dispatchDoseReminder
} from '../src/services/dispatchService.js';
import {
  SAMPLE_PRESCRIPTION_FIXTURES,
  isPdfFile,
  isImageFile
} from '../src/services/ocrService.js';
import {
  buildProfileFromOnboarding,
  SUPPORTED_LANGUAGES,
  normalizeMealTimes,
  DEFAULT_PROFILE
} from '../src/utils/storage.js';

describe('Shorthand Decoder (src/utils/schedule.js)', () => {
  it('decodes OD, BD/BID, TDS/TID, QID, and HS accurately', () => {
    assert.deepEqual(decodeShorthand('OD', 'after food'), {
      slots: ['dawn'],
      food: 'After food',
      needsReview: false
    });

    assert.deepEqual(decodeShorthand('BD', 'PC'), {
      slots: ['dawn', 'night'],
      food: 'After food',
      needsReview: false
    });

    assert.deepEqual(decodeShorthand('TDS', 'AC'), {
      slots: ['dawn', 'midday', 'night'],
      food: 'Before food',
      needsReview: false
    });

    assert.deepEqual(decodeShorthand('TID', 'after meals'), {
      slots: ['dawn', 'midday', 'night'],
      food: 'After food',
      needsReview: false
    });

    assert.deepEqual(decodeShorthand('QID', ''), {
      slots: ['dawn', 'midday', 'dusk', 'night'],
      food: '',
      needsReview: false
    });

    assert.deepEqual(decodeShorthand('HS', 'after dinner'), {
      slots: ['night'],
      food: 'After dinner',
      needsReview: false
    });
  });

  it('decodes numeric patterns 1-0-1, 1+0+1, 1-1-1, 1-1-1-1, 1-0-0', () => {
    assert.deepEqual(decodeShorthand('1-0-1', 'after meals'), {
      slots: ['dawn', 'night'],
      food: 'After food',
      needsReview: false
    });

    assert.deepEqual(decodeShorthand('1+0+1', 'before food'), {
      slots: ['dawn', 'night'],
      food: 'Before food',
      needsReview: false
    });

    assert.deepEqual(decodeShorthand('1-1-1', ''), {
      slots: ['dawn', 'midday', 'night'],
      food: '',
      needsReview: false
    });

    assert.deepEqual(decodeShorthand('1-1-1-1', ''), {
      slots: ['dawn', 'midday', 'dusk', 'night'],
      food: '',
      needsReview: false
    });

    assert.deepEqual(decodeShorthand('1-0-0', 'empty stomach'), {
      slots: ['dawn'],
      food: 'Empty stomach',
      needsReview: false
    });
  });

  it('infers slot from meal timing when frequency is omitted', () => {
    assert.deepEqual(decodeShorthand('', 'after breakfast'), {
      slots: ['dawn'],
      food: 'After breakfast',
      needsReview: false
    });
    assert.deepEqual(decodeShorthand('', 'after lunch'), {
      slots: ['midday'],
      food: 'After lunch',
      needsReview: false
    });
    assert.deepEqual(decodeShorthand('', 'after dinner'), {
      slots: ['night'],
      food: 'After dinner',
      needsReview: false
    });
  });

  it('flags unknown, PRN, weekly, or empty shorthand as needsReview=true and never guesses', () => {
    assert.equal(decodeShorthand('PRN', '').needsReview, true);
    assert.equal(decodeShorthand('twice weekly', '').needsReview, true);
    assert.equal(decodeShorthand('weekly once', '').needsReview, true);
    assert.equal(decodeShorthand('???', '').needsReview, true);
    assert.equal(decodeShorthand('', '').needsReview, true);
  });
});

describe('Medicine Directory Fuzzy Matcher (Fuse.js + medicines.json)', () => {
  it('matches known generics and Indian brand names with high confidence', () => {
    const aug = matchMedicineName([{ name: 'Augmentin', confidence: 0.95 }]);
    assert.equal(aug.matchedName, 'Augmentin');
    assert.equal(aug.genericName, 'Amoxicillin + Clavulanic Acid');
    assert.equal(aug.needsReview, false);

    const panD = matchMedicineName([{ name: 'Pan-D', confidence: 0.92 }]);
    assert.equal(panD.genericName, 'Pantoprazole + Domperidone');
    assert.equal(panD.needsReview, false);

    const thyro = matchMedicineName([{ name: 'Thyronorm', confidence: 0.93 }]);
    assert.equal(thyro.genericName, 'Levothyroxine');
    assert.equal(thyro.needsReview, false);
  });

  it('flags low confidence (< 0.75) or empty candidates as needsReview=true', () => {
    const lowConf = matchMedicineName([{ name: 'Metformin', confidence: 0.45 }]);
    assert.equal(lowConf.needsReview, true);

    const unreadable = matchMedicineName([]);
    assert.equal(unreadable.needsReview, true);
  });
});

describe('Sample Images Verification (public/samples 1, 2, 3)', () => {
  it('verifies all 3 sample images exist and parse through buildScheduleFromOcr', () => {
    const files = [
      'cura_sample_image1.jpg',
      'cura_sample_image2.webp',
      'cura_sample_image3.jpg'
    ];

    for (const file of files) {
      const fullPath = path.join(process.cwd(), 'public', 'samples', file);
      assert.equal(fs.existsSync(fullPath), true, `Expected ${file} to exist in public/samples/`);

      const fixture = SAMPLE_PRESCRIPTION_FIXTURES[file];
      assert.ok(fixture, `Expected OCR fixture for ${file}`);

      const schedule = buildScheduleFromOcr(fixture);
      assert.ok(schedule.medicines.length >= 2, `Expected medicines parsed for ${file}`);
    }

    // Verify sample 1 flags Enzoflam (missing strength) as needsReview=true
    const sched1 = buildScheduleFromOcr(SAMPLE_PRESCRIPTION_FIXTURES['cura_sample_image1.jpg']);
    const enzoflam = sched1.medicines.find((m) => m.name.toLowerCase().includes('enzoflam'));
    assert.equal(enzoflam?.needsReview, true);

    // Verify sample 2 flags Paracetamol PRN as needsReview=true and Amoxicillin TID as [dawn, midday, night]
    const sched2 = buildScheduleFromOcr(SAMPLE_PRESCRIPTION_FIXTURES['cura_sample_image2.webp']);
    const amox = sched2.medicines.find((m) => m.name.toLowerCase().includes('amoxicillin'));
    const pcm = sched2.medicines.find((m) => m.name.toLowerCase().includes('paracetamol'));
    assert.deepEqual(amox?.slots, ['dawn', 'midday', 'night']);
    assert.equal(amox?.needsReview, false);
    assert.equal(pcm?.needsReview, true);

    // Verify sample 3 flags weekly items as needsReview=true and Thyronorm 1-0-0 empty stomach as Dawn
    const sched3 = buildScheduleFromOcr(SAMPLE_PRESCRIPTION_FIXTURES['cura_sample_image3.jpg']);
    const cab = sched3.medicines.find((m) => m.name.toLowerCase().includes('cabgolin'));
    const thy = sched3.medicines.find((m) => m.name.toLowerCase().includes('thyronorm'));
    assert.equal(cab?.needsReview, true);
    assert.deepEqual(thy?.slots, ['dawn']);
    assert.equal(thy?.food, 'Empty stomach');
    assert.equal(thy?.needsReview, false);
  });
});

describe('Onboarding profile builder (src/utils/storage.js)', () => {
  it('builds a patient profile where the user is the patient', () => {
    const p = buildProfileFromOnboarding({
      userName: '  Ramesh ',
      role: 'patient'
    });
    assert.equal(p.userName, 'Ramesh');
    assert.equal(p.role, 'patient');
    assert.equal(p.patientName, 'Ramesh');
    assert.equal(p.language, 'en');
    assert.equal(p.onboarded, true);
    // Fresh details make the scan procedure mandatory until it is approved,
    // while the untouched default profile is not gated.
    assert.equal(p.scanRequired, true);
    assert.equal(DEFAULT_PROFILE.scanRequired, false);
  });

  it('keeps the caretaker and the patient they look after separate', () => {
    const p = buildProfileFromOnboarding({
      userName: 'Neha',
      role: 'caretaker',
      patientName: 'Ramesh'
    });
    assert.equal(p.role, 'caretaker');
    assert.equal(p.userName, 'Neha');
    assert.equal(p.patientName, 'Ramesh');
  });

  it('falls back to the caretaker name and a supported language', () => {
    const p = buildProfileFromOnboarding({
      userName: 'Neha',
      role: 'caretaker',
      patientName: '   ',
      language: 'klingon'
    });
    assert.equal(p.patientName, 'Neha');
    assert.equal(p.language, 'en');
    assert.deepEqual(SUPPORTED_LANGUAGES, ['en']);
  });

  it('keeps the scan state when an existing profile is edited', () => {
    const p = buildProfileFromOnboarding({
      userName: 'Neha',
      role: 'caretaker',
      patientName: 'Ramesh',
      scanRequired: false
    });
    assert.equal(p.onboarded, true);
    assert.equal(p.scanRequired, false);
  });

  it('keeps the daily meal routine and rejects malformed times', () => {
    const p = buildProfileFromOnboarding({
      userName: 'Ramesh',
      role: 'patient',
      mealTimes: { breakfast: '09:15', lunch: 'nonsense', dinner: '21:00' }
    });
    assert.deepEqual(p.mealTimes, {
      breakfast: '09:15',
      lunch: DEFAULT_MEAL_TIMES.lunch,
      dinner: '21:00'
    });

    assert.deepEqual(normalizeMealTimes({}), DEFAULT_MEAL_TIMES);
  });
});

describe('Meal routine -> dose times (src/utils/dates.js)', () => {
  it('derives the four dose groups from the patient routine', () => {
    const slots = getSlotsForProfile({
      mealTimes: { breakfast: '09:00', lunch: '14:00', dinner: '21:00' }
    });
    assert.deepEqual(
      slots.map((s) => [s.id, s.time]),
      [
        ['dawn', '9:00 AM'],
        ['midday', '2:00 PM'],
        ['dusk', '7:00 PM'],
        ['night', '10:00 PM']
      ]
    );
  });

  it('falls back to the default routine and describes it in plain words', () => {
    const slots = getSlotsForProfile(undefined);
    assert.deepEqual(
      slots.map((s) => s.time),
      ['7:00 AM', '1:00 PM', '6:00 PM', '9:00 PM']
    );
    assert.equal(
      describeMealRoutine({ mealTimes: { breakfast: '08:00', lunch: '13:30', dinner: '20:00' } }),
      'Breakfast 8:00 AM · Lunch 1:30 PM · Dinner 8:00 PM'
    );
  });

  it('moves the "current" group with the routine', () => {
    const early = getSlotsForProfile({
      mealTimes: { breakfast: '05:00', lunch: '10:00', dinner: '16:00' }
    });
    // 06:00 is still before the breakfast/lunch midpoint (07:30)
    assert.equal(getCurrentDueSlot(new Date(2026, 9, 16, 6, 0), early), 'dawn');
    // 11:30 has passed the breakfast/lunch midpoint (07:30) but not lunch/evening (12:00)
    assert.equal(getCurrentDueSlot(new Date(2026, 9, 16, 11, 30), early), 'midday');
    // 14:30 has passed lunch/evening (12:00) but not evening/night (15:30)
    assert.equal(getCurrentDueSlot(new Date(2026, 9, 16, 14, 30), early), 'dusk');
    // 17:30 has passed the evening/night midpoint (15:30)
    assert.equal(getCurrentDueSlot(new Date(2026, 9, 16, 17, 30), early), 'night');
  });
});

describe('Dates, Timeline Grouping, and WhatsApp Dispatch Service', () => {
  it('groups medicines into Dawn (07:00), Midday (13:00), Dusk (18:00), and Night (21:00)', () => {
    assert.equal(SLOTS.length, 4);
    const meds = [
      { id: 'm1', name: 'Metformin', slots: ['dawn', 'night'] },
      { id: 'm2', name: 'Vitamin B12', slots: ['midday'] }
    ];
    const log = [{ date: '2026-10-16', slot: 'dawn', medId: 'm1', takenAt: '2026-10-16T07:05:00Z' }];
    const groups = groupMedicinesBySlot(meds, '2026-10-16', log);
    assert.equal(groups[0].id, 'dawn');
    assert.equal(groups[0].isCompleted, true);
    assert.equal(groups[2].id, 'dusk');
    assert.equal(groups[2].medicines.length, 0);
  });

  it('builds sanitized wa.me WhatsApp links from stored patient and slot data', () => {
    assert.equal(sanitizePhoneDigits('+91 98765-43210'), '919876543210');
    assert.equal(isValidInternationalPhone('+91 98765-43210'), true);

    const msg = buildConfirmationMessage({ patientName: 'Ramesh', slotTime: '7:00 AM' });
    assert.equal(msg, 'Ramesh took the 7:00 AM medicines.');

    const res = dispatchToContact({
      contact: { name: 'Neha', phone: '+91 98765-43210' },
      patientName: 'Ramesh',
      slotTime: '7:00 AM',
      openWindow: false
    });
    assert.equal(res.ok, true);
    assert.equal(
      res.url,
      'https://wa.me/919876543210?text=Ramesh%20took%20the%207%3A00%20AM%20medicines.'
    );
  });

  it('computes calendar strip and current due slot from real Date', () => {
    const sampleDate = new Date(2026, 9, 16, 13, 30);
    assert.equal(toIsoDate(sampleDate), '2026-10-16');
    assert.equal(getCurrentDueSlot(sampleDate), 'midday');
    assert.equal(formatGreeting(sampleDate, 'Ramesh'), 'Good afternoon, Ramesh');
    const strip = getCalendarStrip(sampleDate);
    assert.equal(strip.length, 7);
    assert.equal(strip[3].isToday, true);
    assert.equal(strip[0].isoDate, '2026-10-13');
  });

  it('builds SMS reminder links for the family number', () => {
    const reminder = buildDoseReminderMessage({
      patientName: 'Ramesh',
      slotLabel: 'Morning',
      slotTime: '7:00 AM',
      medicineNames: ['Metformin 500 mg']
    });
    assert.equal(
      reminder,
      "Cura reminder: Ramesh's morning medicines at 7:00 AM — Metformin 500 mg."
    );

    const res = dispatchDoseReminder({
      contact: { name: 'Neha', phone: '+91 98765-43210' },
      patientName: 'Ramesh',
      slotLabel: 'Morning',
      slotTime: '7:00 AM',
      medicineNames: ['Metformin'],
      provider: 'sms',
      openWindow: false
    });
    assert.equal(res.ok, true);
    assert.ok(res.url.startsWith('sms:919876543210?&body='));
    assert.ok(decodeURIComponent(res.url).includes('Metformin'));

    const missing = dispatchDoseReminder({
      contact: { phone: '' },
      provider: 'sms',
      openWindow: false
    });
    assert.equal(missing.ok, false);
  });
});

describe('AI reading -> user-confirmed dosage (src/utils/schedule.js)', () => {
  it('suggests a dosage amount and records it as unconfirmed until the user edits', () => {
    const schedule = buildScheduleFromOcr(SAMPLE_PRESCRIPTION_FIXTURES['cura_sample_image1.jpg']);
    const augmentin = schedule.medicines.find((m) => m.name.toLowerCase().includes('augmentin'));
    assert.equal(augmentin.dose, '1 tablet');
    assert.equal(augmentin.doseConfirmed, false);
    assert.ok(augmentin.sourceRaw.includes('Augmentin'));
  });

  it('uses the amount written on the prescription when the AI read one', () => {
    const schedule = buildScheduleFromOcr({
      medicines: [
        {
          raw_text: 'Tab. X 1-0-1',
          name_candidates: [{ name: 'Metformin', confidence: 0.95 }],
          strength: '500 mg',
          form: 'tablet',
          dose_raw: '2 tablets',
          frequency_raw: '1-0-1',
          food_raw: 'after breakfast',
          legible: true
        }
      ]
    });
    assert.equal(schedule.medicines[0].dose, '2 tablets');
  });

  it('describes how to take a medicine from the confirmed values only', () => {
    assert.equal(defaultDoseLabel('capsule'), '1 capsule');
    assert.equal(defaultDoseLabel('syrup'), '5 ml');
    assert.equal(defaultDoseLabel('other'), 'as written');

    const line = describeDose({
      dose: '1 tablet',
      food: 'After breakfast',
      slots: ['dawn', 'night']
    });
    assert.equal(line, '1 tablet, after breakfast, morning (7:00 AM), night (9:00 PM)');
  });
});

describe('Uploaded file handling (src/services/ocrService.js)', () => {
  it('recognises PDFs and images, and rejects anything else', () => {
    assert.equal(isPdfFile({ name: 'rx.pdf', type: 'application/pdf' }), true);
    assert.equal(isPdfFile({ name: 'scan.PDF', type: '' }), true);
    assert.equal(isPdfFile({ name: 'rx.jpg', type: 'image/jpeg' }), false);

    assert.equal(isImageFile({ name: 'rx.jpg', type: 'image/jpeg' }), true);
    assert.equal(isImageFile({ name: 'rx.png', type: 'image/png' }), true);
    assert.equal(isImageFile({ name: 'notes.txt', type: 'text/plain' }), false);
  });
});
