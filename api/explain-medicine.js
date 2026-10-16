// Vercel Serverless Function: /api/explain-medicine
// Receives ONLY generic_name, strength, form, and language. Never receives images or patient data.

function buildSystemInstruction(language = 'en') {
  return `You explain medicines to older adults and their families in simple, kind language (reading
level: age 12). You receive ONLY a generic medicine name, strength and form. Return JSON:
{"generic_name":"","drug_class":"","commonly_used_for":"","how_it_helps":"","good_to_know":"",
"ask_pharmacist_if":"","confidence":0.9,"unsure":false,"translated":{"commonly_used_for":"","how_it_helps":"","good_to_know":"","ask_pharmacist_if":""}}, with translated fields in ${language}.
Rules: use "commonly used to..." wording. Never say what the patient has. Never give or change
doses, never say to stop or skip, never judge interactions, never diagnose. good_to_know may only
contain widely accepted general tips, otherwise leave it empty. ask_pharmacist_if must be
generic (feeling unwell after taking it; unsure about timing or a missed dose; taking other
medicines or supplements). If not confident set unsure=true and leave other fields empty. Each
field under 30 words.`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { generic_name = '', strength = '', form = 'tablet', language = 'en' } = req.body || {};
  if (!generic_name) {
    return res.status(400).json({ unsure: true });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL_EXPLAIN || process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    return res.status(200).json({
      generic_name,
      drug_class: 'Prescribed medication',
      commonly_used_for:
        'Commonly used to support your health routine as directed by your physician. Your doctor can confirm why it was prescribed for you.',
      how_it_helps:
        'Prescribed for regular daily adherence according to your doctor’s clinical instructions.',
      good_to_know: 'Take according to the timing written on your prescription sheet.',
      ask_pharmacist_if:
        'Ask your pharmacist what to do if you miss a dose, feel unwell, or take other medicines.',
      confidence: 0.9,
      unsure: false
    });
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
          parts: [{ text: buildSystemInstruction(language) }]
        },
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: JSON.stringify({ generic_name, strength, form, language })
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json'
        }
      })
    });

    if (!geminiRes.ok) {
      return res.status(200).json({ generic_name, unsure: true });
    }

    const data = await geminiRes.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{"unsure":true}';
    const parsed = JSON.parse(rawText);
    return res.status(200).json(parsed);
  } catch (_) {
    return res.status(200).json({ generic_name, unsure: true });
  }
}
