import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useSchedule, useDoseLog, useToday, useSpeech, useTextSize, useContacts } from '../hooks/index.js';
import { groupMedicinesBySlot, describeDose, countDailyDoses } from '../utils/schedule.js';
import { getSlotsForProfile, describeMealRoutine } from '../utils/dates.js';
import { explainMedicine } from '../services/explainService.js';
import { getRegisteredContact, dispatchMedicineTaken } from '../services/dispatchService.js';
import TopBar from '../components/TopBar.jsx';
import Timeline from '../components/Timeline.jsx';
import EmptyState from '../components/EmptyState.jsx';
import DoseProgressRing from '../components/DoseProgressRing.jsx';

export default function TwoPaneAppScreen() {
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { profile } = useTextSize();
  const { medicines } = useSchedule();
  const { contacts } = useContacts();
  const { doseLog, isDoseTaken, toggleDose, markSlotTaken } = useDoseLog();
  const { todayIso, headerDate, calendarStrip, currentSlotId } = useToday();
  const { isSpeaking, speechError, toggleSpeak } = useSpeech();

  const [selectedDateIso, setSelectedDateIso] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [explanation, setExplanation] = useState(null);
  const [whatsappBanner, setWhatsappBanner] = useState(null);

  const slots = useMemo(() => getSlotsForProfile(profile), [profile]);

  const activeDateIso = selectedDateIso || todayIso;
  const selectedMedId = params.id || searchParams.get('med') || null;

  const activeMed = useMemo(() => {
    return (
      medicines.find((m) => m.id === selectedMedId) ||
      medicines[0] || {
        id: 'med-empty',
        name: 'No medicine selected',
        strength: '',
        form: 'tablet',
        food: '',
        notes: ''
      }
    );
  }, [medicines, selectedMedId]);

  const slotGroups = useMemo(
    () => groupMedicinesBySlot(medicines, activeDateIso, doseLog, slots),
    [medicines, activeDateIso, doseLog, slots]
  );

  const { taken: dosesToday, total: totalDoses, remaining: dosesLeft } = useMemo(
    () => countDailyDoses(slotGroups, activeDateIso, doseLog),
    [slotGroups, activeDateIso, doseLog]
  );

  const registeredContact = useMemo(
    () => getRegisteredContact(contacts, profile),
    [contacts, profile]
  );

  // Name and description come from the guarded Gemini explain flow; dosage and
  // timings always come from what the user confirmed on the review screen.
  useEffect(() => {
    if (!activeMed || activeMed.id === 'med-empty') return undefined;
    let cancelled = false;
    setExplanation(activeMed.explanation || null);
    explainMedicine({
      genericName: activeMed.genericName || activeMed.name,
      strength: activeMed.strength || '',
      form: activeMed.form || 'tablet',
      language: profile?.language || 'en',
      preloadedExplanation: activeMed.explanation || null
    }).then((res) => {
      if (!cancelled) setExplanation(res);
    });
    return () => {
      cancelled = true;
    };
  }, [
    activeMed.id,
    activeMed.name,
    activeMed.genericName,
    activeMed.strength,
    activeMed.form,
    activeMed.explanation,
    profile?.language
  ]);

  const dueGroup = slotGroups.find((g) => g.id === currentSlotId);
  const isDueGroupCompleted =
    !dueGroup || dueGroup.medicines.length === 0 || dueGroup.isCompleted;

  const handleSelectMed = (medId) => {
    setSearchParams({ med: medId });
  };

  const handleToggleDose = (slotId, medId) => {
    const nowTaken = toggleDose(activeDateIso, slotId, medId);
    if (!nowTaken) {
      setWhatsappBanner(null);
      return;
    }

    if (profile?.whatsappAlerts === false) {
      return;
    }

    const medicine = medicines.find((m) => m.id === medId);
    const slotDef = slots.find((s) => s.id === slotId);
    const patientName = profile?.patientName || profile?.userName || 'Ramesh';

    if (registeredContact) {
      const result = dispatchMedicineTaken({
        contact: registeredContact,
        patientName,
        medicine,
        slot: slotDef || slotId,
        openWindow: true
      });
      if (result.ok) {
        setWhatsappBanner({
          type: 'sent',
          contactName: registeredContact.name || 'Caregiver',
          phone: registeredContact.phone,
          medName: `${medicine?.name || 'Medicine'}${medicine?.strength ? ` ${medicine.strength}` : ''}`,
          url: result.url
        });
      }
    } else {
      setWhatsappBanner({
        type: 'missing-contact',
        medName: `${medicine?.name || 'Medicine'}${medicine?.strength ? ` ${medicine.strength}` : ''}`
      });
    }
  };

  const handleTakeCurrentSlot = () => {
    if (isDueGroupCompleted || !dueGroup) return;
    markSlotTaken(activeDateIso, currentSlotId, dueGroup.medicines);
    navigate(`/confirmed?slot=${currentSlotId}`);
  };

  // Built only from the values the user confirmed: dosage amount, meal timing, slots.
  const doseInstruction = describeDose(activeMed, slots) || activeMed.notes || 'As confirmed on your reviewed schedule.';

  const handleReadAloud = () => {
    const script = `${activeMed.name} ${activeMed.strength || ''}. How to take it: ${doseInstruction}. ${
      explanation?.commonly_used_for || ''
    } Confirm with your pharmacist.`;
    toggleSpeak(script, profile?.language || 'en');
  };

  return (
    <div className="bg-background font-body text-body text-on-surface min-h-screen">
      {/* Desktop Header */}
      <TopBar
        patientName={profile?.patientName || 'Ramesh'}
        role={profile?.role}
        activeSection="today"
      />

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
                {/* Header, progress and routine */}
                <div className="flex flex-col gap-space-xs">
                  <span className="font-caption-bold text-caption-bold text-muted-text uppercase tracking-wide">
                    {headerDate}
                  </span>
                  <div className="flex items-center justify-between gap-space-sm">
                    <span className="font-headline-1 text-headline-1 text-on-surface tracking-tight">
                      Today
                    </span>
                    <DoseProgressRing taken={dosesToday} total={totalDoses} />
                  </div>
                  <span className="font-caption text-caption text-muted-text">
                    <strong className="text-primary">{dosesLeft}</strong> of {totalDoses} doses left today ·{' '}
                    {describeMealRoutine(profile)}
                  </span>
                </div>

                {/* WhatsApp dispatch status banner */}
                {whatsappBanner && (
                  <div
                    role="status"
                    className="rounded-2xl border border-primary/30 bg-surface-container-lowest p-3.5 shadow-sm flex items-center justify-between gap-3"
                  >
                    {whatsappBanner.type === 'sent' ? (
                      <>
                        <div className="min-w-0 flex-1">
                          <p className="font-caption-bold text-caption-bold text-on-surface truncate">
                            WhatsApp update ready for {whatsappBanner.contactName}
                          </p>
                          <p className="font-caption text-[12px] text-muted-text truncate">
                            Marked {whatsappBanner.medName} as taken (+{whatsappBanner.phone})
                          </p>
                        </div>
                        <a
                          href={whatsappBanner.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-9 px-3 rounded-xl bg-primary-container text-on-lime font-caption-bold text-caption-bold flex items-center gap-1 flex-shrink-0"
                        >
                          <span>Send on WhatsApp</span>
                        </a>
                      </>
                    ) : (
                      <>
                        <div className="min-w-0 flex-1">
                          <p className="font-caption-bold text-caption-bold text-on-surface">
                            Add a WhatsApp number for dose alerts
                          </p>
                          <p className="font-caption text-[12px] text-muted-text">
                            Register a caregiver or personal mobile number to send automatic WhatsApp updates.
                          </p>
                        </div>
                        <Link
                          to="/contacts"
                          className="h-9 px-3 rounded-xl bg-primary-container text-on-lime font-caption-bold text-caption-bold flex items-center flex-shrink-0"
                        >
                          Add number
                        </Link>
                      </>
                    )}
                  </div>
                )}

                {/* Full week calendar strip */}
                <div className="grid grid-cols-7 gap-1.5 w-full">
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
                            ? 'bg-card-dark text-surface-container-lowest shadow-sm font-bold'
                            : 'text-on-surface hover:bg-surface-container'
                        }`}
                      >
                        <span
                          className={`font-caption text-[12px] tracking-wide ${
                            isSelected
                              ? 'text-surface-container-lowest/80'
                              : 'text-muted-text'
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
                      ? 'bg-surface-container text-muted-text cursor-not-allowed'
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
                    <span className="font-caption-bold text-caption-bold text-muted-text uppercase tracking-wider">
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

                {/* Dark contrast header card with the read-aloud action */}
                <div className="cura-dark-panel w-full rounded-3xl p-space-lg text-surface-container-lowest shadow-md flex flex-col gap-space-md">
                  <div className="flex flex-col gap-1">
                    <span className="font-caption text-caption text-primary-fixed/90 uppercase tracking-wider">
                      Prescribed daily
                    </span>
                    <h1 className="font-headline-1 text-headline-1 text-surface-container-lowest">
                      {activeMed.name} {activeMed.strength}
                    </h1>
                    <span className="font-body text-body text-surface-container-lowest/80">
                      {activeMed.dose ? `${activeMed.dose} · ` : ''}
                      {activeMed.food || 'As confirmed on your schedule'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-space-xs">
                    <button
                      type="button"
                      id="desktop-read-aloud-btn"
                      onClick={handleReadAloud}
                      className="h-12 px-5 rounded-full bg-primary-container text-on-lime font-body-semibold text-[16px] shadow-sm hover:opacity-95 active:scale-[0.99] flex items-center gap-2 transition-all focus-visible:ring-2 focus-visible:ring-primary-fixed"
                    >
                      <span className="material-symbols-outlined text-[22px]">
                        {isSpeaking ? 'pause' : 'volume_up'}
                      </span>
                      <span id="desktop-read-text">
                        {isSpeaking ? 'Reading now...' : 'Read aloud'}
                      </span>
                    </button>
                    <span className="font-caption text-caption text-surface-container-lowest/70">
                      {describeMealRoutine(profile)}
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
                        : 'text-muted-text hover:text-on-surface'
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
                        : 'text-muted-text hover:text-on-surface'
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
                        {explanation?.commonly_used_for ||
                          'Loading AI explanation… Commonly used as directed by your physician.'}
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
                        {explanation?.how_it_helps ||
                          'Loading AI explanation… Prescribed for regular daily adherence.'}
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
                        <span className="material-symbols-outlined text-muted-text transition-transform group-open:rotate-180 text-[24px]">
                          expand_more
                        </span>
                      </summary>
                      <div className="pt-space-sm mt-space-sm bg-surface-container-low rounded-xl p-space-sm flex flex-col gap-space-xs">
                        <p className="font-body text-body text-on-surface">
                          •{' '}
                          {explanation?.ask_pharmacist_if ||
                            'Ask your pharmacist what to do if you miss a dose, feel unwell, or take other medicines.'}
                        </p>
                        {explanation?.good_to_know ? (
                          <p className="font-body text-body text-on-surface">
                            • {explanation.good_to_know}
                          </p>
                        ) : null}
                      </div>
                    </details>
                  </div>
                ) : (
                  <div
                    id="desktop-stats-panel"
                    className="flex flex-col items-center justify-center py-12 text-center bg-surface-container-lowest border border-card-border rounded-3xl p-6"
                  >
                    <span className="material-symbols-outlined text-[48px] text-muted-text mb-2">
                      analytics
                    </span>
                    <h3 className="font-headline-2 text-headline-2 text-on-surface mb-1">
                      Adherence History
                    </h3>
                    <p className="font-body text-body text-muted-text">
                      Historical analytics and charts will appear here.
                    </p>
                  </div>
                )}

                {/* Source caption */}
                <div className="flex items-start gap-space-xs px-2">
                  <span className="material-symbols-outlined text-muted-text text-[16px] mt-0.5">
                    info
                  </span>
                  <span className="font-caption text-caption text-muted-text">
                    Name and description: AI-generated general information. Dosage and timings: as
                    you confirmed on the reviewed schedule. Confirm with your pharmacist.
                  </span>
                </div>

                {speechError && (
                  <p role="status" className="font-caption text-caption text-tertiary px-2">
                    {speechError}
                  </p>
                )}
              </section>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
