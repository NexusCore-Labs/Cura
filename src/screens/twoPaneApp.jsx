import React, { useState, useMemo } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useSchedule, useDoseLog, useToday, useSpeech, useTextSize } from '../hooks/index.js';
import { groupMedicinesBySlot } from '../utils/schedule.js';
import TopBar from '../components/TopBar.jsx';
import Timeline from '../components/Timeline.jsx';
import EmptyState from '../components/EmptyState.jsx';

export default function TwoPaneAppScreen() {
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { profile } = useTextSize();
  const { medicines } = useSchedule();
  const { doseLog, isDoseTaken, toggleDose, markSlotTaken } = useDoseLog();
  const { todayIso, headerDate, calendarStrip, currentSlotId } = useToday();
  const { isSpeaking, speechError, toggleSpeak } = useSpeech();

  const [selectedDateIso, setSelectedDateIso] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const activeDateIso = selectedDateIso || todayIso;
  const selectedMedId = params.id || searchParams.get('med') || null;

  const activeMed = useMemo(() => {
    return (
      medicines.find((m) => m.id === selectedMedId) ||
      medicines[0] || {
        id: 'med-3',
        name: 'Amlodipine',
        strength: '5 mg',
        form: 'tablet',
        food: 'After dinner',
        notes: '1 tablet after dinner, from your prescription.'
      }
    );
  }, [medicines, selectedMedId]);

  const slotGroups = useMemo(
    () => groupMedicinesBySlot(medicines, activeDateIso, doseLog),
    [medicines, activeDateIso, doseLog]
  );

  const dueGroup = slotGroups.find((g) => g.id === currentSlotId);
  const isDueGroupCompleted =
    !dueGroup || dueGroup.medicines.length === 0 || dueGroup.isCompleted;

  const handleSelectMed = (medId) => {
    setSearchParams({ med: medId });
  };

  const handleToggleDose = (slotId, medId) => {
    toggleDose(activeDateIso, slotId, medId);
  };

  const handleTakeCurrentSlot = () => {
    if (isDueGroupCompleted || !dueGroup) return;
    markSlotTaken(activeDateIso, currentSlotId, dueGroup.medicines);
    navigate(`/confirmed?slot=${currentSlotId}`);
  };

  const doseInstruction =
    activeMed.notes ||
    `1 ${activeMed.form || 'tablet'} ${activeMed.food || 'as prescribed'}, from your prescription.`;

  const handleReadAloud = () => {
    const script = `${activeMed.name} ${activeMed.strength || ''}. ${doseInstruction}. Commonly used to support your health routine as directed by your physician. Confirm with your pharmacist.`;
    toggleSpeak(script, profile?.language || 'en');
  };

  return (
    <div className="bg-background font-body text-body text-on-surface min-h-screen">
      {/* Desktop Header */}
      <TopBar patientName={profile?.patientName || 'Ramesh'} activeSection="today" />

      <main className="w-full pt-24 bg-background">
        <div className="w-full max-w-[1440px] mx-auto px-margin py-space-md">
          {medicines.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="flex flex-col lg:flex-row gap-space-lg items-start">
              {/* Left Pane (420px Fixed on Desktop) */}
              <section
                className="w-full lg:w-[420px] lg:flex-shrink-0 flex flex-col gap-space-lg"
                aria-label="Today medication schedule"
              >
                {/* Header & Date Subtitle */}
                <div className="flex flex-col gap-space-xs">
                  <span className="font-headline-1 text-headline-1 text-on-surface tracking-tight">
                    Today
                  </span>
                  <span className="font-body text-body text-on-surface-variant">
                    {headerDate}
                  </span>
                </div>

                {/* 5-Day Horizontal Calendar Strip */}
                <div className="grid grid-cols-5 gap-space-xs w-full">
                  {calendarStrip.map((day) => {
                    const isSelected = activeDateIso
                      ? day.isoDate === activeDateIso
                      : day.isToday;
                    return (
                      <button
                        key={day.isoDate}
                        type="button"
                        onClick={() => setSelectedDateIso(day.isoDate)}
                        aria-pressed={isSelected}
                        className={`flex flex-col items-center justify-center py-3 rounded-2xl transition-colors ${
                          isSelected
                            ? 'bg-primary-container text-on-lime shadow-sm font-bold'
                            : 'bg-surface-container-lowest border border-card-border text-on-surface hover:bg-surface-container'
                        }`}
                      >
                        <span
                          className={`font-caption text-caption ${
                            isSelected ? 'text-on-lime font-bold' : 'text-secondary'
                          }`}
                        >
                          {day.dayName}
                        </span>
                        <span className="font-body-semibold text-body-semibold">
                          {day.dayNumber}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Medication Timeline Groups */}
                <Timeline
                  slotGroups={slotGroups}
                  currentSlotId={currentSlotId}
                  dateIso={activeDateIso}
                  isDoseTaken={isDoseTaken}
                  onToggleDose={handleToggleDose}
                  variant="desktop"
                  selectedMedId={activeMed.id}
                  onSelectMed={handleSelectMed}
                />

                {/* Left Pane Action Button (Mark current slot) */}
                <button
                  type="button"
                  id="desktop-take-slot-btn"
                  disabled={isDueGroupCompleted}
                  onClick={handleTakeCurrentSlot}
                  className={`w-full h-14 rounded-2xl ${
                    isDueGroupCompleted
                      ? 'bg-surface-container text-secondary cursor-not-allowed'
                      : 'bg-primary-container text-on-lime hover:opacity-95 shadow-sm'
                  } font-body-semibold text-body-semibold flex items-center justify-center gap-space-xs transition-all focus-visible:ring-2 focus-visible:ring-primary`}
                >
                  <span className="material-symbols-outlined text-[20px]">done_all</span>
                  <span>{isDueGroupCompleted ? 'All done for now' : 'I took it'}</span>
                </button>
              </section>

              {/* Right Pane (Medicine Detail View) */}
              <section
                className="flex-1 w-full flex flex-col gap-space-md"
                aria-label="Selected medicine detail profile"
              >
                {/* Top Utility Bar */}
                <div className="flex items-center justify-between w-full h-10 px-1">
                  <div className="flex items-center gap-space-xs">
                    <span className="font-caption-bold text-caption-bold text-secondary uppercase tracking-wider">
                      Medication Profile
                    </span>
                  </div>
                  <div className="flex items-center gap-space-xs">
                    <Link
                      to="/review"
                      title="Review prescription schedule"
                      aria-label="Review prescription schedule"
                      className="w-10 h-10 rounded-full bg-surface-container-lowest border border-card-border flex items-center justify-center shadow-sm text-on-surface hover:bg-surface-container transition-colors focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <span className="material-symbols-outlined text-[20px]">fact_check</span>
                    </Link>
                    <Link
                      to="/app"
                      aria-label="Refresh view"
                      className="w-10 h-10 rounded-full bg-surface-container-lowest border border-card-border flex items-center justify-center shadow-sm text-on-surface hover:bg-surface-container transition-colors focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <span className="material-symbols-outlined text-[20px]">refresh</span>
                    </Link>
                  </div>
                </div>

                {/* Dark Contrast Header Card */}
                <div className="w-full bg-card-dark rounded-3xl p-space-lg text-surface-container-lowest shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
                  <div className="flex flex-col gap-1">
                    <span className="font-caption text-caption text-surface-variant uppercase tracking-wider">
                      Prescribed Daily
                    </span>
                    <h1 className="font-headline-1 text-headline-1 text-surface-container-lowest">
                      {activeMed.name} {activeMed.strength}
                    </h1>
                    <span className="font-body text-body text-surface-variant">
                      {activeMed.food || 'Follow prescription guidelines'}
                    </span>
                  </div>
                  <div className="w-16 h-16 rounded-2xl bg-surface-variant/20 flex items-center justify-center flex-shrink-0 text-primary-container">
                    <span className="material-symbols-outlined text-[36px]">
                      medication_liquid
                    </span>
                  </div>
                </div>

                {/* Two-Option Segmented Control */}
                <div className="inline-flex p-1 bg-surface-container rounded-2xl self-start border border-card-border">
                  <button
                    id="desktop-tab-overview"
                    type="button"
                    onClick={() => setActiveTab('overview')}
                    className={`px-space-md py-2 rounded-xl font-body-semibold text-body-semibold transition-colors focus-visible:ring-2 focus-visible:ring-primary ${
                      activeTab === 'overview'
                        ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                        : 'text-secondary hover:text-on-surface'
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    id="desktop-tab-stats"
                    type="button"
                    onClick={() => setActiveTab('stats')}
                    className={`px-space-md py-2 rounded-xl font-body-semibold text-body-semibold transition-colors focus-visible:ring-2 focus-visible:ring-primary ${
                      activeTab === 'stats'
                        ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                        : 'text-secondary hover:text-on-surface'
                    }`}
                  >
                    Stats
                  </button>
                </div>

                {activeTab === 'overview' ? (
                  <div id="desktop-overview-panel" className="flex flex-col gap-space-sm w-full">
                    {/* Card 1: What it's for */}
                    <div className="w-full bg-surface-container-lowest border border-card-border rounded-3xl p-space-md shadow-sm flex flex-col gap-space-xs">
                      <div className="flex items-center gap-space-xs text-primary">
                        <span className="material-symbols-outlined text-[20px]">help_outline</span>
                        <span className="font-body-semibold text-body-semibold text-on-surface">
                          What it&apos;s for
                        </span>
                      </div>
                      <p className="font-body text-body text-on-surface">
                        Commonly used to support your health routine as directed by your physician.
                        Your doctor can confirm why it was prescribed for you.
                      </p>
                    </div>

                    {/* Card 2: How it helps */}
                    <div className="w-full bg-surface-container-lowest border border-card-border rounded-3xl p-space-md shadow-sm flex flex-col gap-space-xs">
                      <div className="flex items-center gap-space-xs text-primary">
                        <span className="material-symbols-outlined text-[20px]">favorite</span>
                        <span className="font-body-semibold text-body-semibold text-on-surface">
                          How it helps
                        </span>
                      </div>
                      <p className="font-body text-body text-on-surface">
                        Prescribed for regular daily adherence according to your doctor&apos;s
                        clinical instructions.
                      </p>
                    </div>

                    {/* Card 3: How to take it */}
                    <div className="w-full bg-surface-container-lowest border border-card-border rounded-3xl p-space-md shadow-sm flex flex-col gap-space-xs">
                      <div className="flex items-center gap-space-xs text-primary">
                        <span className="material-symbols-outlined text-[20px]">schedule</span>
                        <span className="font-body-semibold text-body-semibold text-on-surface">
                          How to take it
                        </span>
                      </div>
                      <p className="font-body text-body text-on-surface">{doseInstruction}</p>
                    </div>

                    {/* Collapsed Card: Ask your pharmacist if... */}
                    <details className="w-full bg-surface-container-lowest border border-card-border rounded-3xl p-space-md shadow-sm group cursor-pointer transition-all">
                      <summary className="flex items-center justify-between list-none focus:outline-none">
                        <div className="flex items-center gap-space-xs text-on-surface">
                          <span className="material-symbols-outlined text-tertiary text-[20px]">
                            contact_support
                          </span>
                          <span className="font-body-semibold text-body-semibold">
                            Ask your pharmacist if...
                          </span>
                        </div>
                        <span className="material-symbols-outlined text-secondary transition-transform group-open:rotate-180 text-[24px]">
                          expand_more
                        </span>
                      </summary>
                      <div className="pt-space-sm mt-space-sm bg-surface-container-low rounded-xl p-space-sm flex flex-col gap-space-xs">
                        <p className="font-body text-body text-on-surface">
                          • Ask your pharmacist what to do if you miss a dose.
                        </p>
                        <p className="font-body text-body text-on-surface">
                          • Ask your pharmacist if you feel unwell or have questions about timing.
                        </p>
                      </div>
                    </details>
                  </div>
                ) : (
                  <div
                    id="desktop-stats-panel"
                    className="flex flex-col items-center justify-center py-12 text-center bg-surface-container-lowest border border-card-border rounded-3xl p-6"
                  >
                    <span className="material-symbols-outlined text-[48px] text-secondary mb-2">
                      analytics
                    </span>
                    <h3 className="font-headline-2 text-headline-2 text-on-surface mb-1">
                      Adherence History
                    </h3>
                    <p className="font-body text-body text-secondary">
                      Historical analytics and charts will appear here.
                    </p>
                  </div>
                )}

                {/* AI Disclaimer Caption */}
                <div className="flex items-center gap-space-xs px-2">
                  <span className="material-symbols-outlined text-secondary text-[16px]">
                    info
                  </span>
                  <span className="font-caption text-caption text-secondary">
                    AI-generated general information. Confirm with your pharmacist.
                  </span>
                </div>

                {speechError && (
                  <p role="status" className="font-caption text-caption text-tertiary px-2">
                    {speechError}
                  </p>
                )}

                {/* Primary Lime Read Aloud Button */}
                <button
                  type="button"
                  id="desktop-read-aloud-btn"
                  onClick={handleReadAloud}
                  className={`w-full h-14 rounded-2xl ${
                    isSpeaking ? 'bg-primary-fixed-dim' : 'bg-primary-container'
                  } text-on-lime font-body-semibold text-body-semibold shadow-sm hover:opacity-95 active:scale-[0.99] flex items-center justify-center gap-space-xs transition-all focus-visible:ring-2 focus-visible:ring-primary`}
                >
                  <span className="material-symbols-outlined text-[24px]">
                    {isSpeaking ? 'pause' : 'volume_up'}
                  </span>
                  <span id="desktop-read-text">
                    {isSpeaking ? 'Reading now...' : 'Read aloud'}
                  </span>
                </button>
              </section>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
