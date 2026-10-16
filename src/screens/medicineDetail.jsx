import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSchedule, useSpeech, useTextSize } from '../hooks/index.js';
import { explainMedicine } from '../services/explainService.js';
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

  const doseInstruction =
    medicine.notes ||
    `1 ${medicine.form || 'dose'} ${medicine.food || 'as prescribed'}, from your prescription.`;

  useEffect(() => {
    let cancelled = false;
    explainMedicine({
      genericName: medicine.genericName || medicine.name,
      strength: medicine.strength,
      form: medicine.form,
      language: profile?.language || 'en'
    }).then((res) => {
      if (!cancelled) setExplanation(res);
    });
    return () => {
      cancelled = true;
    };
  }, [medicine.name, medicine.genericName, medicine.strength, medicine.form, profile?.language]);

  const whatItIsFor =
    'Commonly used to help support your routine as prescribed by your doctor. Your physician can confirm why it was prescribed for you.';
  const howItHelps =
    'Prescribed for daily health maintenance. Follow the directions provided on your original prescription sheet.';

  const handleReadAloud = () => {
    const speechScript = `${medicine.name} ${medicine.strength || ''}. How to take it: ${doseInstruction}. ${
      explanation?.commonly_used_for || whatItIsFor
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
        {/* Dark Contrast Header Card */}
        <section className="bg-card-dark rounded-3xl p-5 shadow-sm text-surface-container-lowest">
          <h1 className="font-headline-1 text-[28px] leading-[36px] font-bold text-surface-container-lowest">
            {medicine.name} {medicine.strength}
          </h1>
          <p className="font-caption text-caption text-surface-variant mt-2">
            {medicine.food ? `${medicine.food} • ` : ''}From your prescription
          </p>
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
                : 'font-body text-body text-secondary hover:text-on-surface'
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
                : 'font-body text-body text-secondary hover:text-on-surface'
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
                    {profile?.language && profile.language !== 'en' && (
                      <span className="font-caption text-caption text-secondary">
                        AI-translated
                      </span>
                    )}
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
                <span className="material-symbols-outlined text-secondary transition-transform group-open:rotate-180 text-[24px]">
                  expand_more
                </span>
              </summary>
              <div className="pt-4 mt-3 border-t border-card-border/60 flex flex-col gap-2 font-body text-body text-on-surface">
                <p>• Ask your pharmacist what to do if you miss a dose.</p>
                <p>• Ask your pharmacist if you feel unwell or have questions about your schedule.</p>
              </div>
            </details>

            {/* AI Disclaimer */}
            <p className="font-caption text-caption text-secondary text-center my-1">
              AI-generated general information. Confirm with your pharmacist.
            </p>

            {speechError && (
              <p role="status" className="font-caption text-caption text-tertiary text-center">
                {speechError}
              </p>
            )}

            {/* Exactly ONE Primary Lime Button with Dark Text */}
            <button
              type="button"
              id="read-aloud-btn"
              onClick={handleReadAloud}
              className={`w-full h-14 rounded-2xl ${
                isSpeaking ? 'bg-primary-fixed-dim' : 'bg-primary-container'
              } text-on-lime font-body-semibold text-body-semibold flex items-center justify-center gap-2 shadow-sm hover:opacity-95 active:scale-[0.99] transition-all focus-visible:ring-2 focus-visible:ring-primary`}
            >
              <span className="material-symbols-outlined text-[24px]">
                {isSpeaking ? 'stop' : 'volume_up'}
              </span>
              <span id="read-btn-text">{isSpeaking ? 'Stop reading' : 'Read aloud'}</span>
            </button>
          </div>
        ) : (
          <div
            id="stats-panel"
            className="flex flex-col items-center justify-center py-12 text-center bg-surface-container-lowest border border-card-border rounded-3xl p-6"
          >
            <span className="material-symbols-outlined text-[48px] text-secondary mb-2">
              analytics
            </span>
            <h3 className="font-headline-2 text-headline-2 text-on-surface mb-1">
              Adherence Stats
            </h3>
            <p className="font-body text-body text-secondary">
              Stats tracking is coming soon in an upcoming update.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
