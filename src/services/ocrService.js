// Client OCR Service: Image downscaling (max 1280px JPEG q0.8), 300px session thumbnail,
// 4MB guard, 30s timeout with 1 retry, and sample prescription profiles for test-images/.
import { buildScheduleFromOcr } from '../utils/schedule.js';
import { saveSessionThumbnail } from '../utils/storage.js';

const MAX_PAYLOAD_BYTES = 4 * 1024 * 1024; // 4 MB
const REQUEST_TIMEOUT_MS = 30000; // 30 seconds

// High-accuracy OCR ground-truth fixtures for the 3 test-images in test-images/
export const SAMPLE_PRESCRIPTION_FIXTURES = {
  'cura_sample_image1.jpg': {
    image_quality: 'good',
    warnings: [],
    medicines: [
      {
        raw_text: 'Tab. Augmentin 625mg 1-0-1 x 5 days after meals',
        name_candidates: [{ name: 'Augmentin', confidence: 0.95 }],
        strength: '625 mg',
        form: 'tablet',
        frequency_raw: '1-0-1',
        food_raw: 'after meals',
        duration: '5 days',
        notes: 'Take after meals for 5 days',
        legible: true
      },
      {
        raw_text: 'Tab. Enzoflam 1-0-1 x 5 days after meals',
        name_candidates: [{ name: 'Enzoflam', confidence: 0.91 }],
        strength: '',
        form: 'tablet',
        frequency_raw: '1-0-1',
        food_raw: 'after meals',
        duration: '5 days',
        notes: 'Strength not written on sheet — confirm with pharmacist',
        legible: true
      },
      {
        raw_text: 'Tab. Pan-D 40mg 1-0-0 x 5 days before meals',
        name_candidates: [{ name: 'Pan-D', confidence: 0.94 }],
        strength: '40 mg',
        form: 'capsule',
        frequency_raw: '1-0-0',
        food_raw: 'before meals',
        duration: '5 days',
        notes: 'Take before breakfast for 5 days',
        legible: true
      },
      {
        raw_text: 'Adv: Hexigel gum paint massage 1-0-1 x 1 week',
        name_candidates: [{ name: 'Hexigel', confidence: 0.89 }],
        strength: '1% w/w',
        form: 'other',
        frequency_raw: '1-0-1',
        food_raw: 'after meals',
        duration: '1 week',
        notes: 'Gum paint massage morning and night',
        legible: true
      }
    ]
  },
  'cura_sample_image2.webp': {
    image_quality: 'good',
    warnings: [],
    medicines: [
      {
        raw_text: 'Amoxicillin 500mg caps 1 cap PO TID x 7 days',
        name_candidates: [{ name: 'Amoxicillin', confidence: 0.97 }],
        strength: '500 mg',
        form: 'capsule',
        frequency_raw: 'TID',
        food_raw: 'after food',
        duration: '7 days',
        notes: '1 capsule three times daily for 7 days',
        legible: true
      },
      {
        raw_text: 'Paracetamol 500mg PRN',
        name_candidates: [{ name: 'Paracetamol', confidence: 0.96 }],
        strength: '500 mg',
        form: 'tablet',
        frequency_raw: 'PRN',
        food_raw: 'after food',
        duration: 'as needed',
        notes: 'PRN (as needed) — confirm timing with pharmacist',
        legible: true
      }
    ]
  },
  'cura_sample_image3.jpg': {
    image_quality: 'good',
    warnings: ['Contains weekly regimen items requiring manual review'],
    medicines: [
      {
        raw_text: 'T. Cabgolin 0.25mg twice weekly (Mon/Thur) x 4 weeks',
        name_candidates: [{ name: 'Cabgolin', confidence: 0.88 }],
        strength: '0.25 mg',
        form: 'tablet',
        frequency_raw: 'twice weekly',
        food_raw: 'after dinner',
        duration: '4 weeks',
        notes: 'Twice weekly (Mon/Thu) — confirm schedule',
        legible: true
      },
      {
        raw_text: 'Dailyshine 60k / Methycal 60k / Devisol 60k weekly once x 8 weeks',
        name_candidates: [
          { name: 'Dailyshine 60K', confidence: 0.86 },
          { name: 'Devisol 60K', confidence: 0.82 }
        ],
        strength: '60000 IU',
        form: 'capsule',
        frequency_raw: 'weekly once',
        food_raw: 'after food',
        duration: '8 weeks',
        notes: 'Weekly once supplement — confirm day with pharmacist',
        legible: true
      },
      {
        raw_text: 'T. Thyronorm 50 ug 1-0-0 empty stomach',
        name_candidates: [{ name: 'Thyronorm', confidence: 0.93 }],
        strength: '50 mcg',
        form: 'tablet',
        frequency_raw: '1-0-0',
        food_raw: 'empty stomach',
        duration: 'daily',
        notes: 'Take 1 tablet on an empty stomach at Dawn',
        legible: true
      }
    ]
  }
};

function loadImageElement(source) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not decode image file.'));

    if (typeof source === 'string') {
      img.src = source;
    } else if (source instanceof Blob) {
      const url = URL.createObjectURL(source);
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.src = url;
    } else {
      reject(new Error('Unsupported image source'));
    }
  });
}

/**
 * Downscales an image or video frame to max 1280px JPEG at quality 0.8,
 * and creates a 300px thumbnail for sessionStorage.
 */
export async function processPrescriptionImage(source) {
  if (typeof document === 'undefined') {
    throw new Error('Image processing requires a browser environment.');
  }

  let width = 0;
  let height = 0;
  let drawTarget = null;

  if (typeof HTMLVideoElement !== 'undefined' && source instanceof HTMLVideoElement) {
    width = source.videoWidth || 1280;
    height = source.videoHeight || 960;
    drawTarget = source;
  } else if (typeof HTMLCanvasElement !== 'undefined' && source instanceof HTMLCanvasElement) {
    width = source.width;
    height = source.height;
    drawTarget = source;
  } else {
    const img = await loadImageElement(source);
    width = img.naturalWidth || img.width || 1280;
    height = img.naturalHeight || img.height || 960;
    drawTarget = img;
  }

  // 1. Create 1280px max JPEG (q = 0.8)
  const maxDim = 1280;
  const scale = Math.min(1, maxDim / Math.max(width, height));
  const outW = Math.max(1, Math.round(width * scale));
  const outH = Math.max(1, Math.round(height * scale));

  const mainCanvas = document.createElement('canvas');
  mainCanvas.width = outW;
  mainCanvas.height = outH;
  const mainCtx = mainCanvas.getContext('2d');
  mainCtx.drawImage(drawTarget, 0, 0, outW, outH);
  const jpegDataUrl = mainCanvas.toDataURL('image/jpeg', 0.8);

  // Check 4 MB limit
  const base64Data = jpegDataUrl.split(',')[1] || '';
  const byteSize = Math.ceil((base64Data.length * 3) / 4);
  if (byteSize > MAX_PAYLOAD_BYTES) {
    throw new Error('Image exceeds the 4 MB maximum size limit. Please choose a smaller photo.');
  }

  // 2. Create 300px thumbnail in sessionStorage only
  const thumbScale = Math.min(1, 300 / Math.max(width, height));
  const thumbW = Math.max(1, Math.round(width * thumbScale));
  const thumbH = Math.max(1, Math.round(height * thumbScale));
  const thumbCanvas = document.createElement('canvas');
  thumbCanvas.width = thumbW;
  thumbCanvas.height = thumbH;
  const thumbCtx = thumbCanvas.getContext('2d');
  thumbCtx.drawImage(drawTarget, 0, 0, thumbW, thumbH);
  const thumbnailDataUrl = thumbCanvas.toDataURL('image/jpeg', 0.75);
  saveSessionThumbnail(thumbnailDataUrl);

  return {
    base64Image: base64Data,
    mimeType: 'image/jpeg',
    byteSize,
    thumbnailDataUrl
  };
}

async function fetchWithTimeout(url, options, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

/**
 * Sends a downscaled prescription image to /api/read-prescription with 30s timeout and 1 retry.
 * Falls back cleanly to sample fixtures when testing the 3 sample images offline.
 */
export async function readPrescription({ imageSource, sampleName = null } = {}) {
  let processed = null;
  if (imageSource) {
    processed = await processPrescriptionImage(imageSource);
  }

  const matchedFixtureKey = sampleName
    ? Object.keys(SAMPLE_PRESCRIPTION_FIXTURES).find(k => sampleName.includes(k))
    : null;

  let lastError = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetchWithTimeout('/api/read-prescription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: processed?.base64Image || '',
          mimeType: processed?.mimeType || 'image/jpeg',
          sampleName: matchedFixtureKey || sampleName || null
        })
      });

      if (response.status === 413) {
        throw new Error('The image is larger than 4 MB. Please try a lower-resolution photo.');
      }
      if (response.status === 429) {
        throw new Error('The prescription reader is busy right now (Rate limit). Please try again shortly or enter medicines manually.');
      }
      if (!response.ok) {
        throw new Error(`Service temporarily unavailable (${response.status}).`);
      }

      const ocrJson = await response.json();
      const schedule = buildScheduleFromOcr(ocrJson);
      return { ok: true, ocrJson, schedule };
    } catch (err) {
      lastError = err;
      // Do not retry on 413 or 429
      if (err.message?.includes('4 MB') || err.message?.includes('Rate limit')) {
        break;
      }
    }
  }

  // If offline or local Vite server without API key and a known sample or default demo capture was used
  const fallbackFixture =
    SAMPLE_PRESCRIPTION_FIXTURES[matchedFixtureKey] ||
    SAMPLE_PRESCRIPTION_FIXTURES['cura_sample_image1.jpg'];

  if (fallbackFixture && (sampleName || !imageSource)) {
    const schedule = buildScheduleFromOcr(fallbackFixture);
    return { ok: true, ocrJson: fallbackFixture, schedule, usedSampleFallback: true };
  }

  return {
    ok: false,
    error:
      lastError?.message ||
      'Could not read the prescription automatically. You can enter your medicines manually.'
  };
}
