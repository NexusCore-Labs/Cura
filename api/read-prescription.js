// Vercel Serverless Function: /api/read-prescription
// Reads GEMINI_API_KEY from server environment only. Never logs request bodies.

const SYSTEM_INSTRUCTION = `You read photographed or scanned medical prescriptions (often handwritten) and return ONLY JSON:
{"medicines":[{"raw_text":"","name_candidates":[{"name":"","confidence":0.0}],
"strength":"","form":"tablet|capsule|syrup|drops|injection|other|unknown",
"dose_raw":"","frequency_raw":"","food_raw":"","duration":"","notes":"","legible":true}],
"image_quality":"good|poor","warnings":[]}
Rules: never guess an unreadable word (set legible=false, empty name_candidates). At most 3
candidates, best first. Copy frequency and food text exactly as written (e.g. "1-0-1","BD",
"after food"). Copy the amount per intake exactly as written into dose_raw (e.g. "1 tab",
"2 capsules", "5 ml", "1 puff"); leave dose_raw empty when the sheet does not state an amount.
Never calculate, adjust or infer a dose, and do not add any dosing advice. Do not infer
diagnoses. Do NOT output patient or doctor names or phone numbers. If it is not a prescription
return {"medicines":[],"image_quality":"poor","warnings":["not_a_prescription"]}.`;

const SAMPLE_FIXTURES = {
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
        notes: 'Strength missing on prescription',
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
        notes: 'Take before meals for 5 days',
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
        notes: 'Gum paint massage',
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
        notes: '1 cap three times daily for 7 days',
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
        notes: 'PRN as needed',
        legible: true
      }
    ]
  },
  'cura_sample_image3.jpg': {
    image_quality: 'good',
    warnings: ['Weekly regimen items detected'],
    medicines: [
      {
        raw_text: 'T. Cabgolin 0.25mg twice weekly (Mon/Thur) x 4 weeks',
        name_candidates: [{ name: 'Cabgolin', confidence: 0.88 }],
        strength: '0.25 mg',
        form: 'tablet',
        frequency_raw: 'twice weekly',
        food_raw: 'after dinner',
        duration: '4 weeks',
        notes: 'Twice weekly (Mon/Thu)',
        legible: true
      },
      {
        raw_text: 'Dailyshine 60k / Methycal 60k / Devisol 60k weekly once x 8 weeks',
        name_candidates: [{ name: 'Dailyshine 60K', confidence: 0.86 }],
        strength: '60000 IU',
        form: 'capsule',
        frequency_raw: 'weekly once',
        food_raw: 'after food',
        duration: '8 weeks',
        notes: 'Weekly once for 8 weeks',
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
        notes: 'Empty stomach in the morning',
        legible: true
      }
    ]
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body || {};
  const { imageBase64 = '', mimeType = 'image/jpeg', sampleName = null } = body;

  // Reject payloads over the configured limit (4 MB by default)
  const maxBytes = Number(process.env.MAX_IMAGE_BYTES) || 4 * 1024 * 1024;
  const estimatedBytes = Math.ceil((String(imageBase64).length * 3) / 4);
  if (estimatedBytes > maxBytes) {
    return res.status(413).json({ error: 'Payload exceeds 4 MB limit' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL_READ || process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  // Gemini reads PDF pages natively; images are sent as JPEG/PNG inline data.
  const supportedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  const safeMimeType = supportedMimeTypes.includes(String(mimeType))
    ? String(mimeType)
    : 'image/jpeg';

  // If no live API key is configured, return the matching sample fixture for local testing
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    const key =
      sampleName && SAMPLE_FIXTURES[sampleName]
        ? sampleName
        : 'cura_sample_image1.jpg';
    return res.status(200).json(SAMPLE_FIXTURES[key]);
  }

  if (!imageBase64) {
    return res.status(400).json({ error: 'Missing imageBase64 payload' });
  }

  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model
    )}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const geminiRes = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: SYSTEM_INSTRUCTION }]
        },
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: safeMimeType,
                  data: imageBase64
                }
              },
              {
                text:
                  safeMimeType === 'application/pdf'
                    ? 'Read every page of this prescription PDF and return the structured JSON.'
                    : 'Read this prescription and return the structured JSON.'
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json'
        }
      })
    });

    if (geminiRes.status === 429) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }
    if (!geminiRes.ok) {
      return res.status(502).json({ error: 'Upstream vision model error' });
    }

    const data = await geminiRes.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const parsed = JSON.parse(rawText);
    return res.status(200).json(parsed);
  } catch (_) {
    return res.status(500).json({ error: 'Failed to process prescription image' });
  }
}
