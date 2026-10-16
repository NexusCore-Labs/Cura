import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { speakText, stopSpeech, isSpeechSupported } from '../utils/audio.js';

export function useSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechError, setSpeechError] = useState(null);
  const location = useLocation();

  // Cancel speechSynthesis on route change and on unmount
  useEffect(() => {
    stopSpeech();
    setIsSpeaking(false);
    return () => {
      stopSpeech();
    };
  }, [location.pathname, location.search]);

  const stop = useCallback(() => {
    stopSpeech();
    setIsSpeaking(false);
  }, []);

  const toggleSpeak = useCallback(
    (text, lang) => {
      setSpeechError(null);
      if (isSpeaking) {
        stopSpeech();
        setIsSpeaking(false);
        return;
      }

      const result = speakText(text, {
        lang,
        onStart: () => setIsSpeaking(true),
        onEnd: () => setIsSpeaking(false),
        onError: (errMsg) => {
          setIsSpeaking(false);
          setSpeechError(errMsg);
        }
      });

      if (result.started) {
        setIsSpeaking(true);
      } else if (result.reason) {
        setSpeechError(result.reason);
      }
    },
    [isSpeaking]
  );

  return {
    isSpeaking,
    speechError,
    supported: isSpeechSupported(),
    toggleSpeak,
    stop
  };
}
