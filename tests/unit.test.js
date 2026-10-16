import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import {
  decodeShorthand,
  matchMedicineName,
  buildScheduleFromOcr,
  groupMedicinesBySlot
} from '../src/utils/schedule.js';
import {
  SLOTS,
  toIsoDate,
  getCalendarStrip,
  getCurrentDueSlot,
  formatGreeting
} from '../src/utils/dates.js';
import {
  sanitizePhoneDigits,
  isValidInternationalPhone,
  buildConfirmationMessage,
  dispatchToContact
} from '../src/services/dispatchService.js';
import { SAMPLE_PRESCRIPTION_FIXTURES } from '../src/services/ocrService.js';

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

describe('Test Images Verification (test-images/ 1, 2, 3)', () => {
  it('verifies all 3 test-images exist and parse through buildScheduleFromOcr', () => {
    const files = [
      'cura_sample_image1.jpg',
      'cura_sample_image2.webp',
      'cura_sample_image3.jpg'
    ];

    for (const file of files) {
      const fullPath = path.join(process.cwd(), 'test-images', file);
      assert.equal(fs.existsSync(fullPath), true, `Expected ${file} to exist in test-images/`);

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
    assert.equal(strip.length, 5);
    assert.equal(strip[2].isToday, true);
  });
});
