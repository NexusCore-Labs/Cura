// Audio utilities for Cura: Web Speech API (en-IN, hi-IN, mr-IN) and WebAudio confirmation chime
import { getProfile } from './storage.js';

const LANG_MAP = {
  en: 'en-IN',
  hi: 'hi-IN',
  mr: 'mr-IN'
};

export function isSpeechSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

export function getBestVoiceForLang(langCode = 'en') {
  if (!isSpeechSupported()) return null;
  const targetBcp47 = LANG_MAP[langCode] || langCode || 'en-IN';
  const langPrefix = targetBcp47.split('-')[0].toLowerCase();
  const voices = window.speechSynthesis.getVoices() || [];

  // 1. Exact locale match (e.g., en-IN, hi-IN, mr-IN)
  const exact = voices.find(v => v.lang && v.lang.toLowerCase() === targetBcp47.toLowerCase());
  if (exact) return exact;

  // 2. Language prefix match (e.g., en-GB, en-US, hi, mr)
  const prefixMatch = voices.find(v => v.lang && v.lang.toLowerCase().startsWith(langPrefix));
  if (prefixMatch) return prefixMatch;

  return null;
}

export function stopSpeech() {
  if (!isSpeechSupported()) return;
  try {
    window.speechSynthesis.cancel();
  } catch (_) {}
}

/**
 * Speaks prescription-sourced or guarded explanation text aloud.
 * @param {string} text
 * @param {object} options - { lang, onStart, onEnd, onError }
 * @returns {{ started: boolean, reason?: string }}
 */
export function speakText(text, options = {}) {
  if (!isSpeechSupported()) {
    const msg = 'Voice readout is not supported in this browser.';
    options.onError?.(msg);
    return { started: false, reason: msg };
  }

  const cleanText = String(text || '').trim();
  if (!cleanText) {
    return { started: false, reason: 'Nothing to read aloud.' };
  }

  try {
    window.speechSynthesis.cancel();
    const profile = getProfile();
    const langKey = options.lang || profile?.language || 'en';
    const targetBcp47 = LANG_MAP[langKey] || 'en-IN';

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = targetBcp47;
    utterance.rate = 0.92;
    utterance.pitch = 1.0;

    const voice = getBestVoiceForLang(langKey);
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onstart = () => options.onStart?.();
    utterance.onend = () => options.onEnd?.();
    utterance.onerror = (e) => {
      // Ignore 'canceled' or 'interrupted' events triggered when stopping intentionally
      if (e?.error === 'canceled' || e?.error === 'interrupted') {
        options.onEnd?.();
        return;
      }
      options.onError?.('Voice playback encountered an issue on this device.');
    };

    window.speechSynthesis.speak(utterance);
    return { started: true };
  } catch (err) {
    const msg = 'Unable to start voice readout on this device.';
    options.onError?.(msg);
    return { started: false, reason: msg };
  }
}

/**
 * Plays a gentle two-note WebAudio chime on dose confirmation (muteable).
 */
export function playConfirmationChime() {
  if (typeof window === 'undefined') return false;
  const profile = getProfile();
  if (profile?.muteChime) return false;

  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return false;

  try {
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const notes = [523.25, 659.25]; // C5 -> E5 gentle major third chime
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);

      gain.gain.setValueAtTime(0.001, now + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.14, now + idx * 0.12 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 0.42);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.45);
    });

    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 900);
    return true;
  } catch (_) {
    return false;
  }
}
