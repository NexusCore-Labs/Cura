import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { readPrescription } from '../services/ocrService.js';
import { saveSchedule } from '../utils/storage.js';
import ErrorState from '../components/ErrorState.jsx';

export default function ReadingScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sampleName = searchParams.get('sample') || null;
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function processScan() {
      const minWait = new Promise((r) => setTimeout(r, 900));
      const [result] = await Promise.all([
        readPrescription({ sampleName }),
        minWait
      ]);

      if (cancelled) return;

      if (result.ok && result.schedule) {
        if (sampleName) {
          saveSchedule(result.schedule);
        }
        navigate('/review', { replace: true });
      } else {
        setErrorMessage(result.error || 'Could not read the prescription automatically.');
      }
    }

    processScan();
    return () => {
      cancelled = true;
    };
  }, [navigate, sampleName]);

  if (errorMessage) {
    return (
      <div className="flex flex-col relative w-full min-h-screen bg-surface items-center justify-center px-margin text-center">
        <ErrorState
          message={errorMessage}
          onRetry={() => navigate('/scan')}
          onManualEntry={() => navigate('/review')}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col relative w-full min-h-screen bg-surface items-center justify-center px-margin text-center">
      <div className="w-28 h-28 rounded-3xl bg-surface-container flex items-center justify-center text-primary mb-6 relative">
        <span className="material-symbols-outlined text-[54px] animate-pulse">
          document_scanner
        </span>
        <div className="absolute inset-0 rounded-3xl border-2 border-primary-container animate-ping opacity-30 pointer-events-none" />
      </div>

      <h1 className="font-headline-1 text-headline-1 text-on-surface mb-3">
        Reading prescription...
      </h1>
      <p className="font-body text-body text-secondary max-w-xs mb-8">
        Detecting medications, dosages, and schedules from your scanned sheet.
      </p>

      <Link
        to="/scan"
        className="h-12 px-8 rounded-2xl border border-card-border text-secondary hover:text-on-surface font-body-semibold inline-flex items-center justify-center transition-colors"
      >
        Cancel
      </Link>
    </div>
  );
}
