// Shared server-side Gemini helper and environment loader for /api/* routes.
// Loads variables from process.env, api/.env.local, .env.local, and .env.
// Never imported by client code.
import fs from 'node:fs';
import path from 'node:path';

const rateBuckets = new Map();

function parseEnvFile(filePath) {
  const result = {};
  try {
    if (!fs.existsSync(filePath)) return result;
    const raw = fs.readFileSync(filePath, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx <= 0) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1).trim();
      }
      result[key] = val;
    }
  } catch (_) {
    // Ignore file read errors in serverless environments without local disk
  }
  return result;
}

export function getServerConfig() {
  const cwd = process.cwd();
  const envRoot = parseEnvFile(path.join(cwd, '.env'));
  const envLocalRoot = parseEnvFile(path.join(cwd, '.env.local'));
  const envLocalApi = parseEnvFile(path.join(cwd, 'api', '.env.local'));

  const merged = {
    ...envRoot,
    ...envLocalRoot,
    ...envLocalApi,
    ...process.env
  };

  const rawKey = String(
    merged.GEMINI_API_KEY || merged.GOOGLE_API_KEY || merged.VITE_GEMINI_API_KEY || ''
  )
    .replace(/^['"]|['"]$/g, '')
    .trim();

  const apiKey = rawKey && rawKey !== 'your_gemini_api_key_here' ? rawKey : '';

  return {
    apiKey,
    modelRead: String(merged.GEMINI_MODEL_READ || merged.GEMINI_MODEL || 'gemini-3.8-flash').trim(),
    modelExplain: String(
      merged.GEMINI_MODEL_EXPLAIN || merged.GEMINI_MODEL || 'gemini-3.5-flash-lite'
    ).trim(),
    modelFallback: String(merged.GEMINI_MODEL_FALLBACK || 'gemini-3.5-flash-lite').trim(),
    maxImageBytes: Number(merged.MAX_IMAGE_BYTES) || 4000000,
    requestTimeoutMs: Number(merged.REQUEST_TIMEOUT_MS) || 30000,
    rateLimitPerMinute: Number(merged.RATE_LIMIT_PER_MINUTE) || 10,
    allowedOrigin: String(merged.ALLOWED_ORIGIN || '*').trim()
  };
}

export function checkRateLimit(req, limitPerMinute = 10) {
  const forwarded = req?.headers?.['x-forwarded-for'];
  const ip =
    (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : '') ||
    req?.socket?.remoteAddress ||
    'local';
  const now = Date.now();
  const windowMs = 60 * 1000;
  const timestamps = (rateBuckets.get(ip) || []).filter((t) => now - t < windowMs);
  if (timestamps.length >= limitPerMinute) {
    return false;
  }
  timestamps.push(now);
  rateBuckets.set(ip, timestamps);
  return true;
}

export function extractJsonFromText(rawText = '') {
  const trimmed = String(rawText || '').trim();
  if (!trimmed) return {};
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenceMatch ? fenceMatch[1].trim() : trimmed;
  try {
    return JSON.parse(candidate);
  } catch (_) {
    const firstBrace = candidate.indexOf('{');
    const lastBrace = candidate.lastIndexOf('}');
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      return JSON.parse(candidate.slice(firstBrace, lastBrace + 1));
    }
    throw new Error('Invalid JSON returned by Gemini');
  }
}

export async function callGeminiJson({
  apiKey,
  models = [],
  systemInstruction = '',
  userParts = [],
  temperature = 0.1,
  timeoutMs = 30000
}) {
  const uniqueModels = [...new Set(models.filter(Boolean))];
  let lastError = null;
  let hitRateLimit = false;

  for (const modelName of uniqueModels) {
    const cleanModel = modelName.replace(/^models\//, '');
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      cleanModel
    )}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          systemInstruction: systemInstruction
            ? { parts: [{ text: systemInstruction }] }
            : undefined,
          contents: [
            {
              role: 'user',
              parts: userParts
            }
          ],
          generationConfig: {
            temperature,
            responseMimeType: 'application/json'
          }
        })
      });

      if (response.status === 429) {
        hitRateLimit = true;
        lastError = new Error(`Gemini rate limit (429) on ${cleanModel}`);
        continue;
      }

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        lastError = new Error(`Gemini ${cleanModel} HTTP ${response.status}: ${errText.slice(0, 200)}`);
        continue;
      }

      const data = await response.json();
      const parts = data?.candidates?.[0]?.content?.parts || [];
      const textPart = parts.map((p) => p.text || '').join('\n').trim();
      if (!textPart) {
        lastError = new Error(`Empty response from Gemini model ${cleanModel}`);
        continue;
      }

      const parsed = extractJsonFromText(textPart);
      return { ok: true, model: cleanModel, data: parsed };
    } catch (err) {
      lastError = err;
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    ok: false,
    rateLimited: hitRateLimit,
    error: lastError?.message || 'All Gemini models failed'
  };
}
