import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSchedule, useSpeech, useTextSize } from '../hooks/index.js';
import { explainMedicine } from '../services/explainService.js';
import { describeDose } from '../utils/schedule.js';
import { getSlotsForProfile, describeMealRoutine } from '../utils/dates.js';
import TopBar from '../components/TopBar.jsx';

export default function MedicineDetailScreen({ medIdProp = null }) {
  const params = useParams();
  const medId = medIdProp || params.id || 'med-3';
  const { medicines, getMedicineById } = useSchedule();
  const { profile } = useTextSize();
  const { isSpeaking, speechError, toggleSpeak } = useSpeech();
  const [activeTab, setActiveTab] = useState('overview');
  const [explanation, setExplanation] = useState(null);

  const medicine = getMedicineById(medId) ||
    medicines[0] || {
      id: 'med-3',
      name: 'Amlodipine',
      strength: '5 mg',
      form: 'tablet',
      food: 'After dinner',
      notes: '1 tablet after dinner, from your prescription'
    };

  const slots = getSlotsForProfile(profile);

  // Built only from the dosage and timings the user confirmed on the review screen.
  const doseInstruction = describeDose(medicine, slots) || medicine.notes || 'As confirmed on your reviewed schedule.';

  useEffect(() => {
    let cancelled = false;
    setExplanation(medicine.explanation || null);
    explainMedicine({
      genericName: medicine.genericName || medicine.name,
      strength: medicine.strength,
      form: medicine.form,
      language: profile?.language || 'en',
      preloadedExplanation: medicine.explanation || null
    }).then((res) => {
      if (!cancelled) setExplanation(res);
    });
    return () => {
      cancelled = true;
    };
  }, [
    medicine.id,
    medicine.name,
    medicine.genericName,
    medicine.strength,
    medicine.form,
    medicine.explanation,
    profile?.language
  ]);

  const whatItIsFor =
    explanation?.commonly_used_for ||
    'Loading the AI explanation for this medicine. Confirm anything unclear with your pharmacist.';
  const howItHelps =
    explanation?.how_it_helps ||
    'Loading the AI explanation for this medicine. Confirm anything unclear with your pharmacist.';

  const handleReadAloud = () => {
    const speechScript = `${medicine.name} ${medicine.strength || ''}. How to take it: ${doseInstruction}. ${
      explanation?.commonly_used_for || ''
    } Confirm with your pharmacist.`;
    toggleSpeak(speechScript, profile?.language || 'en');
  };

  return (
    <div className="w-full max-w-[390px] mx-auto min-h-screen bg-surface flex flex-col pt-safe pb-8 px-margin">
      {/* Top Bar Navigation */}
      <TopBar
        variant="mobile-detail"
        title="Medication Info"
        backTo="/app"
        closeTo="/app"
      />

      {/* Main Content Stream */}
      <main className="flex flex-col gap-4 mt-2">
        {/* Dark contrast header card with the read-aloud action */}
        <section className="cura-dark-panel rounded-3xl p-5 shadow-sm text-surface-container-lowest">
          <span className="font-caption text-caption text-primary-fixed/90 uppercase tracking-wider">
            Prescribed daily
          </span>
          <h1 className="font-headline-1 text-[28px] leading-[36px] font-bold text-surface-container-lowest mt-1">
            {medicine.name} {medicine.strength}
          </h1>
          <p className="font-body text-[16px] text-surface-container-lowest/85 mt-2">
            {medicine.dose ? `${medicine.dose} · ` : ''}
            {medicine.food || 'As confirmed on your schedule'}
          </p>
          <button
            type="button"
            id="read-aloud-btn"
            onClick={handleReadAloud}
            className={`mt-4 h-12 px-5 rounded-full font-body-semibold text-[16px] shadow-sm flex items-center gap-2 transition-all focus-visible:ring-2 focus-visible:ring-primary-fixed ${
              isSpeaking
                ? 'bg-primary-fixed-dim text-on-lime'
                : 'bg-primary-container text-on-lime hover:opacity-95'
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">
              {isSpeaking ? 'pause' : 'volume_up'}
            </span>
            <span id="read-btn-text">{isSpeaking ? 'Reading now...' : 'Read aloud'}</span>
          </button>
        </section>

        {/* Overview | Stats Toggle */}
        <div
          className="bg-card-border/60 rounded-2xl p-1 flex gap-1 h-[52px]"
          role="tablist"
          aria-label="Medicine information tabs"
        >
          <button
            id="tab-overview"
            type="button"
            role="tab"
            aria-selected={activeTab === 'overview'}
            onClick={() => setActiveTab('overview')}
            className={`flex-1 rounded-xl ${
              activeTab === 'overview'
                ? 'font-body-semibold text-body-semibold bg-surface-container-lowest text-on-surface shadow-sm'
                : 'font-body text-body text-muted-text hover:text-on-surface'
            } flex items-center justify-center transition-all focus-visible:ring-2 focus-visible:ring-primary`}
          >
            Overview
          </button>
          <button
            id="tab-stats"
            type="button"
            role="tab"
            aria-selected={activeTab === 'stats'}
            onClick={() => setActiveTab('stats')}
            className={`flex-1 rounded-xl ${
              activeTab === 'stats'
                ? 'font-body-semibold text-body-semibold bg-surface-container-lowest text-on-surface shadow-sm'
                : 'font-body text-body text-muted-text hover:text-on-surface'
            } flex items-center justify-center transition-all focus-visible:ring-2 focus-visible:ring-primary`}
          >
            Stats
          </button>
        </div>

        {activeTab === 'overview' ? (
          <div id="overview-panel" className="flex flex-col gap-4">
            {explanation?.unsure ? (
              <section className="bg-surface-container-lowest border border-card-border rounded-3xl p-5 shadow-sm">
                <h2 className="font-headline-2 text-headline-2 text-on-surface mb-2">
                  General Information
                </h2>
                <p className="font-body text-body text-on-surface">
                  We&apos;re not sure about this one. Please ask your pharmacist.
                </p>
              </section>
            ) : (
              <>
                <section className="bg-surface-container-lowest border border-card-border rounded-3xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="font-headline-2 text-headline-2 text-on-surface">
                      What it&apos;s for
                    </h2>
                    <span className="font-caption text-caption text-muted-text">AI</span>
                  </div>
                  <p className="font-body text-body text-on-surface">{whatItIsFor}</p>
                </section>

                <section className="bg-surface-container-lowest border border-card-border rounded-3xl p-5 shadow-sm">
                  <h2 className="font-headline-2 text-headline-2 text-on-surface mb-2">
                    How it helps
                  </h2>
                  <p className="font-body text-body text-on-surface">{howItHelps}</p>
                </section>
              </>
            )}

            <section className="bg-surface-container-lowest border border-card-border rounded-3xl p-5 shadow-sm">
              <h2 className="font-headline-2 text-headline-2 text-on-surface mb-2">
                How to take it
              </h2>
              <p className="font-body text-body text-on-surface">{doseInstruction}</p>
            </section>

            {/* Collapsed Card: Ask your pharmacist if... */}
            <details className="bg-surface-container-lowest border border-card-border rounded-3xl p-5 shadow-sm group cursor-pointer transition-all">
              <summary className="flex items-center justify-between list-none font-headline-2 text-headline-2 text-on-surface focus-visible:ring-2 focus-visible:ring-primary rounded-xl">
                <span>Ask your pharmacist if...</span>
                <span className="material-symbols-outlined text-muted-text transition-transform group-open:rotate-180 text-[24px]">
                  expand_more
                </span>
              </summary>
              <div className="pt-4 mt-3 border-t border-card-border/60 flex flex-col gap-2 font-body text-body text-on-surface">
                <p>• Ask your pharmacist what to do if you miss a dose.</p>
                <p>• Ask your pharmacist if you feel unwell or have questions about your schedule.</p>
              </div>
            </details>

            {/* Source caption */}
            <p className="font-caption text-caption text-muted-text text-center my-1">
              Name and description: AI-generated general information. Dosage and timings: as you
              confirmed. Confirm with your pharmacist.
            </p>

            <p className="font-caption text-caption text-muted-text text-center">
              {describeMealRoutine(profile)}
            </p>

            {speechError && (
              <p role="status" className="font-caption text-caption text-tertiary text-center">
                {speechError}
              </p>
            )}
          </div>
        ) : (
          <div
            id="stats-panel"
            className="flex flex-col items-center justify-center py-12 text-center bg-surface-container-lowest border border-card-border rounded-3xl p-6"
          >
            <span className="material-symbols-outlined text-[48px] text-muted-text mb-2">
              analytics
            </span>
            <h3 className="font-headline-2 text-headline-2 text-on-surface mb-1">
              Adherence Stats
            </h3>
            <p className="font-body text-body text-muted-text">
              Stats tracking is coming soon in an upcoming update.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
