import { useState, useEffect, useCallback } from 'react';
import { getProfile, saveProfile } from '../utils/storage.js';

export function applyTextScaleToDom(textScale = 'default') {
  if (typeof document === 'undefined') return;
  if (textScale === 'large') {
    document.documentElement.style.fontSize = '18px';
  } else if (textScale === 'extra-large') {
    document.documentElement.style.fontSize = '20px';
  } else {
    document.documentElement.style.fontSize = '16px';
  }
}

export function useTextSize() {
  const [profile, setProfileState] = useState(() => getProfile());

  const refresh = useCallback(() => {
    const p = getProfile();
    setProfileState(p);
    applyTextScaleToDom(p?.textScale);
  }, []);

  useEffect(() => {
    applyTextScaleToDom(profile?.textScale);
    window.addEventListener('cura-state-changed', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('cura-state-changed', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [profile?.textScale, refresh]);

  const updateProfile = useCallback((patch) => {
    const next = saveProfile({ ...getProfile(), ...patch });
    setProfileState(next);
    applyTextScaleToDom(next.textScale);
    return next;
  }, []);

  return {
    profile,
    textScale: profile?.textScale || 'default',
    updateProfile
  };
}
