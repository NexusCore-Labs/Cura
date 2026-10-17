// Vercel Serverless Function: /api/explain-medicine
// Receives ONLY generic_name, strength, form, and language. Never receives images or patient PII.
import { getServerConfig, checkRateLimit, callGeminiJson } from './_gemini.js';

function buildSystemInstruction(language = 'en') {
  return `You explain medicines to older adults and their families in simple, kind language (reading level: age 12).
You receive ONLY a medicine name, strength, and form. Return ONLY valid JSON matching this schema:
{
  "generic_name": "Active ingredient / generic name",
  "drug_class": "Short therapeutic class",
  "commonly_used_for": "Simple explanation under 30 words starting with 'Commonly used to...'",
  "how_it_helps": "Simple explanation under 30 words of how it helps the body",
  "good_to_know": "One widely accepted general tip under 25 words, or empty string",
  "ask_pharmacist_if": "Generic safety reminder (missed dose, feeling unwell after taking it, or taking other medicines/supplements)",
  "confidence": 0.92,
  "unsure": false,
  "translated": {
    "commonly_used_for": "",
    "how_it_helps": "",
    "good_to_know": "",
    "ask_pharmacist_if": ""
  }
}
with translated fields in ${language}.
Rules:
1. Always use "Commonly used to..." wording. Never say what condition the patient has.
2. Never give or change doses, never say to stop or skip a medicine, never judge drug interactions, never diagnose.
3. If you do not recognize the medicine name with confidence, set unsure=true and leave the explanation fields empty.`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const config = getServerConfig();

  if (!checkRateLimit(req, config.rateLimitPerMinute * 2)) {
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }

  const { generic_name = '', strength = '', form = 'tablet', language = 'en' } = req.body || {};
  const cleanName = String(generic_name || '').trim();
  if (!cleanName) {
    return res.status(400).json({ unsure: true });
  }

  if (!config.apiKey) {
    return res.status(500).json({
      error: 'GEMINI_API_KEY is not configured in .env.local or api/.env.local.',
      unsure: true
    });
  }

  const modelsToTry = [
    config.modelExplain,
    config.modelFallback,
    'gemini-3.5-flash-lite',
    'gemini-3.5-flash',
    config.modelRead
  ];

  const result = await callGeminiJson({
    apiKey: config.apiKey,
    models: modelsToTry,
    systemInstruction: buildSystemInstruction(language),
    userParts: [
      {
        text: JSON.stringify({
          medicine_name: cleanName,
          strength: String(strength || '').trim(),
          form: String(form || 'tablet').trim(),
          language: String(language || 'en').trim()
        })
      }
    ],
    temperature: 0.2,
    timeoutMs: config.requestTimeoutMs
  });

  if (!result.ok) {
    return res.status(502).json({
      generic_name: cleanName,
      unsure: true,
      error: result.error
    });
  }

  return res.status(200).json({
    ...result.data,
    model_used: result.model
  });
}
