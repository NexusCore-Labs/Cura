import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { readPrescription } from '../services/ocrService.js';
import { getPendingScan, saveSchedule, clearPendingScan } from '../utils/storage.js';
import ErrorState from '../components/ErrorState.jsx';

export default function ReadingScreen() {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function processScan() {
      const scan = getPendingScan();
      const minWait = new Promise((r) => setTimeout(r, 900));
      const [result] = await Promise.all([readPrescription({ scan }), minWait]);

      if (cancelled) return;

      if (result.ok && result.schedule) {
        saveSchedule({
          ...result.schedule,
          sourceKind: scan?.kind || 'sample',
          sourceFileName: scan?.fileName || null,
          aiReadAt: new Date().toISOString()
        });
        clearPendingScan();
        navigate('/review', { replace: true });
      } else {
        setErrorMessage(result.error || 'Could not read the prescription automatically.');
      }
    }

    processScan();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

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
      <p className="font-body text-body text-muted-text max-w-xs mb-4">
        AI is detecting medicine names, dosages and timings from your sheet.
      </p>
      <p className="font-caption text-caption text-muted-text max-w-xs mb-8">
        You will review and correct everything before it is saved.
      </p>

      <Link
        to="/scan"
        className="h-12 px-8 rounded-2xl border border-card-border text-muted-text hover:text-on-surface font-body-semibold inline-flex items-center justify-center transition-colors"
      >
        Cancel
      </Link>
    </div>
  );
}
