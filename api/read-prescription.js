// Vercel Serverless Function: /api/read-prescription
// Reads GEMINI_API_KEY and GEMINI_MODEL_READ / GEMINI_MODEL_FALLBACK from server environment (.env.local / api/.env.local).
// Extracts medicine names, dosages, timings, AND plain-language medicine info from prescription images/PDFs.
import { getServerConfig, checkRateLimit, callGeminiJson } from './_gemini.js';

const SYSTEM_INSTRUCTION = `You read photographed or scanned medical prescriptions (often handwritten or printed) and return ONLY valid JSON matching this schema:
{
  "medicines": [
    {
      "raw_text": "exact line copied from the prescription",
      "name_candidates": [{"name": "Medicine name as written", "confidence": 0.95}],
      "generic_name": "Active ingredient / generic name (e.g. Amoxicillin + Clavulanic Acid)",
      "drug_class": "Short therapeutic class (e.g. Antibiotic, Antidiabetic, Pain reliever)",
      "strength": "Strength as written (e.g. 500 mg, 625 mg, 40 mg, 5 ml) or empty string if not written",
      "form": "tablet|capsule|syrup|drops|injection|other|unknown",
      "dose_raw": "Amount per intake as written (e.g. 1 tablet, 1 capsule, 5 ml) or empty string",
      "frequency_raw": "Frequency exactly as written (e.g. 1-0-1, BD, OD, TID, HS, weekly once)",
      "food_raw": "Meal instruction as written (e.g. after meals, before breakfast, empty stomach)",
      "duration": "Duration as written (e.g. 5 days, 1 week) or empty string",
      "notes": "Short plain note of the written instruction on the prescription",
      "commonly_used_for": "Simple, kind explanation (age-12 reading level, under 28 words) starting with 'Commonly used to...'",
      "how_it_helps": "Simple, kind explanation (age-12 reading level, under 28 words) of how this medicine helps the body",
      "good_to_know": "One widely accepted general tip for taking this medicine (under 25 words), or empty string",
      "ask_pharmacist_if": "Generic safety reminder on when to ask the pharmacist (e.g. missed dose, feeling unwell, or taking other medicines)",
      "legible": true
    }
  ],
  "image_quality": "good|poor",
  "warnings": []
}
Rules:
1. Extract every medicine listed on the prescription. Never invent medicines that are not on the prescription.
2. If a medicine name is completely unreadable, set legible=false and name_candidates=[]. Otherwise provide up to 3 name_candidates, best first, with confidence between 0.0 and 1.0.
3. Copy frequency_raw, food_raw, strength, dose_raw, and duration faithfully from the prescription. Never calculate, adjust, or invent a dose.
4. For each legible medicine, fill generic_name, drug_class, commonly_used_for, how_it_helps, good_to_know, and ask_pharmacist_if using safe general medical education ("Commonly used to..."). Never diagnose the patient or tell them to stop/change their dose.
5. Do NOT output patient names, doctor names, or phone numbers.
6. If the uploaded image/PDF is not a medical prescription or medicine list, return {"medicines":[],"image_quality":"poor","warnings":["not_a_prescription"]}.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const config = getServerConfig();

  if (!checkRateLimit(req, config.rateLimitPerMinute)) {
    return res.status(429).json({ error: 'Rate limit exceeded. Please wait a moment and try again.' });
  }

  const body = req.body || {};
  const { imageBase64 = '', mimeType = 'image/jpeg' } = body;

  if (!imageBase64) {
    return res.status(400).json({ error: 'Missing prescription image or PDF payload.' });
  }

  const maxBytes = Number(process.env.MAX_IMAGE_BYTES) || config.maxImageBytes || 4 * 1024 * 1024;
  const estimatedBytes = Math.ceil((String(imageBase64).length * 3) / 4);
  if (estimatedBytes > maxBytes) {
    return res.status(413).json({ error: 'Payload exceeds 4 MB limit' });
  }

  if (!config.apiKey) {
    return res.status(500).json({
      error: 'GEMINI_API_KEY is not configured in .env.local or api/.env.local.'
    });
  }

  const supportedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  const safeMimeType = supportedMimeTypes.includes(String(mimeType))
    ? String(mimeType)
    : 'image/jpeg';

  const modelsToTry = [
    config.modelRead,
    'gemini-3.5-flash',
    config.modelFallback,
    'gemini-3.5-flash-lite'
  ];

  const promptText =
    safeMimeType === 'application/pdf'
      ? 'Read every page of this prescription PDF and extract all medicines and their plain-language explanations as JSON.'
      : 'Read this prescription image and extract all medicines and their plain-language explanations as JSON.';

  const result = await callGeminiJson({
    apiKey: config.apiKey,
    models: modelsToTry,
    systemInstruction: SYSTEM_INSTRUCTION,
    userParts: [
      {
        inlineData: {
          mimeType: safeMimeType,
          data: imageBase64
        }
      },
      {
        text: promptText
      }
    ],
    temperature: 0.1,
    timeoutMs: config.requestTimeoutMs
  });

  if (!result.ok) {
    if (result.rateLimited) {
      return res.status(429).json({ error: 'Gemini API rate limit exceeded. Please try again shortly.' });
    }
    return res.status(502).json({
      error: result.error || 'Failed to read prescription with Gemini API.'
    });
  }

  const payload = result.data || {};
  const medicines = Array.isArray(payload.medicines) ? payload.medicines : [];

  return res.status(200).json({
    medicines,
    image_quality: payload.image_quality || 'good',
    warnings: Array.isArray(payload.warnings) ? payload.warnings : [],
    model_used: result.model
  });
}
