import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToday, useTextSize } from '../hooks/index.js';
import { describeMealRoutine, getSlotsForProfile } from '../utils/dates.js';
import UserInfoDialog from '../components/UserInfoDialog.jsx';

export default function LandingDesktopScreen() {
  const navigate = useNavigate();
  const { profile } = useTextSize();
  const { headerDate, getGreeting } = useToday();

  // HashRouter owns the URL hash, so in-page jumps are done in script instead of with href="#id".
  const scrollToSection = (sectionId) => {
    const target = typeof document !== 'undefined' ? document.getElementById(sectionId) : null;
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const slots = getSlotsForProfile(profile);
  const morningSlot = slots[0];
  const nightSlot = slots[3];

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('edit');

  const isOnboarded = Boolean(profile?.onboarded);
  const displayName = profile?.patientName || 'Ramesh';
  const userInitial = (profile?.userName || profile?.patientName || 'C').trim().charAt(0).toUpperCase();

  const openOnboarding = () => {
    setDialogMode('onboarding');
    setDialogOpen(true);
  };

  const openDetails = () => {
    setDialogMode('edit');
    setDialogOpen(true);
  };

  // First-time visitors complete the short form; returning users can pick up where they left off.
  const handleStart = () => {
    if (isOnboarded) navigate('/app');
    else openOnboarding();
  };

  const handleScan = () => {
    if (isOnboarded) navigate('/scan');
    else openOnboarding();
  };

  return (
    <div className="bg-background font-body text-body text-on-surface min-h-screen flex flex-col justify-between selection:bg-primary-container selection:text-on-lime">
      {/* Top Navigation Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-xl border-b border-card-border/60 shadow-sm">
        <div className="h-20 max-w-7xl mx-auto px-margin flex items-center justify-between">
          <div className="flex items-center gap-space-sm">
            <div className="w-10 h-10 rounded-2xl bg-primary-container flex items-center justify-center text-on-lime">
              <span className="material-symbols-outlined text-[24px]">medication</span>
            </div>
            <span className="font-headline-2 text-headline-2 text-on-surface font-bold tracking-tight">
              Cura
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-space-xl" aria-label="Landing page sections">
            <button
              type="button"
              onClick={() => scrollToSection('how-it-works')}
              className="text-muted-text hover:text-primary transition-colors font-body-semibold text-body-semibold"
            >
              How it works
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('safety')}
              className="text-muted-text hover:text-primary transition-colors font-body-semibold text-body-semibold"
            >
              Safety
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('about')}
              className="text-muted-text hover:text-primary transition-colors font-body-semibold text-body-semibold"
            >
              About
            </button>
          </nav>

          <div className="flex items-center gap-space-md">
            <button
              type="button"
              onClick={handleScan}
              className="h-12 sm:h-14 px-space-lg rounded-2xl bg-primary-container text-on-lime font-body-semibold text-body-semibold inline-flex items-center justify-center hover:opacity-90 active:scale-[0.99] transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-primary"
            >
              {isOnboarded ? 'Scan a prescription' : 'Try Cura'}
            </button>
            <button
              type="button"
              onClick={openDetails}
              aria-label="Your details"
              title="Your details"
              className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-on-primary font-caption-bold text-caption hover:opacity-90 transition-opacity"
            >
              {isOnboarded && profile?.userName ? (
                userInitial
              ) : (
                <span className="material-symbols-outlined text-[18px]">person</span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full pt-20 bg-background flex-1">
        <div className="flex flex-col w-full">
          {/* HERO SECTION */}
          <section className="w-full pt-16 pb-24">
            <div className="max-w-[1200px] mx-auto px-margin">
              <div className="grid grid-cols-12 gap-gutter items-center">
                {/* Hero Copy */}
                <div className="col-span-12 lg:col-span-7 flex flex-col items-start pr-0 lg:pr-space-lg">
                  <div className="inline-flex items-center gap-space-xs px-3.5 py-1.5 rounded-full bg-surface-container-high border border-card-border mb-6">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary-container" />
                    <span className="font-caption-bold text-caption text-on-surface">
                      Medication companion for seniors &amp; families
                    </span>
                  </div>

                  <h1 className="font-headline-1 text-headline-1 text-[40px] sm:text-[48px] leading-[48px] sm:leading-[56px] text-on-surface font-bold tracking-tight mb-6">
                    Every dose, understood.
                  </h1>

                  <p className="font-body text-body text-muted-text text-lg sm:text-xl leading-relaxed mb-8 max-w-xl">
                    A calm, senior-friendly medication companion for older adults and their
                    families. Reads photographed prescriptions and keeps daily schedules clear.
                  </p>

                  <div className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                    <button
                      type="button"
                      onClick={handleStart}
                      className="h-14 px-8 rounded-2xl bg-primary-container text-on-lime font-body-semibold text-body-semibold inline-flex items-center justify-center transition-all hover:opacity-95 shadow-sm w-full sm:w-auto focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      {isOnboarded ? 'Continue to Cura' : 'Get started'}
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollToSection('how-it-works')}
                      className="h-14 px-7 rounded-2xl border-2 border-primary/30 bg-surface-container-lowest text-on-surface font-body-semibold text-body-semibold inline-flex items-center justify-center gap-2 transition-colors hover:bg-surface-container hover:border-primary/60 w-full sm:w-auto focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      See features
                      <span className="material-symbols-outlined text-[20px]">
                        keyboard_arrow_down
                      </span>
                    </button>
                  </div>

                  <div className="flex items-center gap-space-sm mt-8">
                    <span className="material-symbols-outlined text-primary text-[20px]">
                      check_circle
                    </span>
                    <span className="font-caption text-caption text-muted-text">
                      Simple to use. No account or password needed.
                    </span>
                  </div>
                </div>

                {/* Hero Phone Mockup */}
                <div className="col-span-12 lg:col-span-5 flex justify-center mt-12 lg:mt-0">
                  <div className="relative w-[340px] bg-inverse-surface rounded-[40px] p-3 shadow-[0_20px_48px_rgba(23,29,24,0.12)] border border-card-border/20">
                    <div className="w-full bg-background rounded-[32px] overflow-hidden p-5 flex flex-col space-y-4">
                      {/* Mock Status Bar */}
                      <div className="flex justify-between items-center px-1">
                        <span className="font-caption-bold text-caption text-on-surface">9:41</span>
                        <div className="flex items-center gap-1.5 text-on-surface">
                          <span className="material-symbols-outlined text-[16px]">
                            signal_cellular_4_bar
                          </span>
                          <span className="material-symbols-outlined text-[16px]">wifi</span>
                          <span className="material-symbols-outlined text-[16px]">
                            battery_full
                          </span>
                        </div>
                      </div>

                      {/* Header in Mockup with Real Date */}                        <div className="pt-2">
                          <p className="font-caption text-caption text-muted-text">{headerDate}</p>
                        <h2 className="font-headline-2 text-headline-2 text-on-surface font-semibold">
                          {getGreeting(displayName)}
                        </h2>
                      </div>

                      {/* Main Medicine Card inside Phone */}
                      <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm space-y-3.5 border border-card-border">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-space-xs">
                            <div className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-primary">
                              <span className="material-symbols-outlined text-[24px]">pill</span>
                            </div>
                            <div>
                              <h3 className="font-body-semibold text-body-semibold text-on-surface">
                                Metformin
                              </h3>
                              <p className="font-caption text-caption text-muted-text">
                                500 mg • {morningSlot.label} dose
                              </p>
                            </div>
                          </div>
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-surface-container-low text-on-surface-variant font-caption text-caption">
                            {morningSlot.time}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 py-1 px-2.5 rounded-lg bg-surface-container-low">
                          <span className="material-symbols-outlined text-[18px] text-muted-text">
                            restaurant
                          </span>
                          <span className="font-caption text-caption text-muted-text">
                            After breakfast
                          </span>
                        </div>
                        <div className="w-full h-12 rounded-xl bg-primary-container text-on-lime font-body-semibold text-[16px] flex items-center justify-center gap-2">
                          <span className="material-symbols-outlined text-[20px]">done</span>I took
                          it
                        </div>
                      </div>

                      {/* Secondary Card */}
                      <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm opacity-90 space-y-2 border border-card-border">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-body-semibold text-body-semibold text-on-surface">
                              Amlodipine
                            </h4>
                            <p className="font-caption text-caption text-muted-text">
                              5 mg • {nightSlot.label} dose
                            </p>
                          </div>
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-surface-container-low text-muted-text font-caption text-caption">
                            {nightSlot.time}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* THREE STEPS SECTION: SNAP, REVIEW, UNDERSTAND */}
          <section
            id="how-it-works"
            className="scroll-mt-24 w-full py-24 bg-surface-container-low border-y border-card-border/60"
          >
            <div className="max-w-[1200px] mx-auto px-margin">
              <div className="max-w-xl mb-16">
                <span className="font-caption-bold text-caption text-primary tracking-wide uppercase">
                  How it works
                </span>
                <h2 className="font-headline-1 text-headline-1 text-on-surface font-bold mt-2">
                  Three simple steps to peace of mind.
                </h2>
              </div>

              <div className="grid grid-cols-12 gap-gutter">
                {/* Step 1: Snap */}
                <div className="col-span-12 md:col-span-4 bg-surface-container-lowest rounded-3xl p-space-md shadow-sm border border-card-border flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-surface-container-high flex items-center justify-center text-on-surface mb-6">
                      <span className="material-symbols-outlined text-[28px]">photo_camera</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-caption-bold text-caption text-muted-text">Step 01</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-container" />
                      <h3 className="font-headline-2 text-headline-2 text-on-surface font-bold">
                        Snap
                      </h3>
                    </div>
                    <p className="font-body text-body text-muted-text mt-3">
                      Capture your prescription paper in bright daylight with one tap. Cura helps
                      frame the page clearly.
                    </p>
                  </div>
                  <div className="mt-8 pt-6">
                    <div className="h-32 w-full rounded-2xl bg-surface-container flex items-center justify-center p-4">
                      <div className="flex items-center gap-3 bg-surface-container-lowest px-4 py-3 rounded-xl shadow-sm border border-card-border">
                        <span className="material-symbols-outlined text-primary text-[24px]">
                          document_scanner
                        </span>
                        <span className="font-caption-bold text-caption text-on-surface">
                          Prescription Sheet
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 2: Review */}
                <div className="col-span-12 md:col-span-4 bg-surface-container-lowest rounded-3xl p-space-md shadow-sm border border-card-border flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-surface-container-high flex items-center justify-center text-on-surface mb-6">
                      <span className="material-symbols-outlined text-[28px]">fact_check</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-caption-bold text-caption text-muted-text">Step 02</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-container" />
                      <h3 className="font-headline-2 text-headline-2 text-on-surface font-bold">
                        Review
                      </h3>
                    </div>
                    <p className="font-body text-body text-muted-text mt-3">
                      The AI shows what it read. You change the dosage amount and the timings, then
                      approve the schedule — nothing is saved without your sign-off.
                    </p>
                  </div>
                  <div className="mt-8 pt-6">
                    <div className="h-32 w-full rounded-2xl bg-surface-container flex items-center justify-center p-4">
                      <div className="flex items-center gap-3 bg-surface-container-lowest px-4 py-3 rounded-xl shadow-sm border border-card-border">
                        <span className="material-symbols-outlined text-primary text-[24px]">
                          check_box
                        </span>
                        <span className="font-caption-bold text-caption text-on-surface">
                          Caregiver Verified
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 3: Understand */}
                <div className="col-span-12 md:col-span-4 bg-surface-container-lowest rounded-3xl p-space-md shadow-sm border border-card-border flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-surface-container-high flex items-center justify-center text-on-surface mb-6">
                      <span className="material-symbols-outlined text-[28px]">hearing</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-caption-bold text-caption text-muted-text">Step 03</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-container" />
                      <h3 className="font-headline-2 text-headline-2 text-on-surface font-bold">
                        Understand
                      </h3>
                    </div>
                    <p className="font-body text-body text-muted-text mt-3">
                      Plain-language explanations, spoken reminders, and WhatsApp or SMS alerts on
                      the dose times that match your daily routine.
                    </p>
                  </div>
                  <div className="mt-8 pt-6">
                    <div className="h-32 w-full rounded-2xl bg-surface-container flex items-center justify-center p-4">
                      <div className="flex items-center gap-3 bg-surface-container-lowest px-4 py-3 rounded-xl shadow-sm border border-card-border">
                        <span className="material-symbols-outlined text-primary text-[24px]">
                          volume_up
                        </span>
                        <span className="font-caption-bold text-caption text-on-surface">
                          Read aloud
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="material-symbols-outlined text-muted-text text-[18px]">
                        sms
                      </span>
                      <span className="font-caption text-caption text-muted-text">
                        WhatsApp &amp; SMS reminders
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SAFETY STRIP SECTION */}
          <section id="safety" className="w-full py-20 bg-surface">
            <div className="max-w-[1200px] mx-auto px-margin">
              <div className="bg-surface-container-lowest rounded-3xl p-8 md:p-12 border border-card-border shadow-sm">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center text-primary shrink-0">
                    <span className="material-symbols-outlined text-[36px]">
                      health_and_safety
                    </span>
                  </div>
                  <div className="space-y-2 flex-1">
                    <h2 className="font-headline-2 text-headline-2 text-on-surface font-bold">
                      Cura organises and explains. It never diagnoses or changes your doses.
                    </h2>
                    <p className="font-body text-body text-muted-text leading-relaxed">
                      Always consult your doctor or registered pharmacist before starting, stopping,
                      or modifying any medication routine. Cura is an assistive reminder companion
                      designed solely to support adherence.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* GET STARTED / YOUR DETAILS SECTION */}
      <section id="get-started" className="w-full py-20 bg-background">
        <div className="max-w-[1200px] mx-auto px-margin">
          <div className="bg-surface-container-lowest rounded-3xl p-8 md:p-12 border border-card-border shadow-sm grid grid-cols-12 gap-gutter items-center">
            <div className="col-span-12 lg:col-span-7 space-y-3">
              <span className="font-caption-bold text-caption text-primary tracking-wide uppercase">
                Get started
              </span>
              <h2 className="font-headline-1 text-headline-1 text-on-surface font-bold">
                Set up in under a minute.
              </h2>
              <p className="font-body text-body text-muted-text leading-relaxed max-w-2xl">
                Tell us your name and whether you take the medicines yourself or look after
                someone. Family members add a phone number for WhatsApp and SMS reminders, and we
                ask for the patient&apos;s breakfast, lunch and dinner times so dose reminders follow
                their real day. Everything stays on this device.
              </p>
              <ul className="flex flex-col gap-2 pt-1">
                {[
                  { icon: 'badge', text: 'Your name and role (patient or family)' },
                  { icon: 'chat', text: 'WhatsApp and SMS reminders for family' },
                  { icon: 'schedule', text: 'Daily meal times so reminders fit the routine' }
                ].map((item) => (
                  <li key={item.icon} className="flex items-center gap-space-sm">
                    <span className="material-symbols-outlined text-primary text-[20px]">
                      {item.icon}
                    </span>
                    <span className="font-body text-[16px] text-muted-text">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="col-span-12 lg:col-span-5 flex flex-col items-stretch lg:items-end gap-4 mt-8 lg:mt-0">
              {isOnboarded ? (
                <div className="w-full max-w-sm bg-surface-container-low rounded-2xl p-5 border border-card-border/60 space-y-1">
                  <p className="font-caption text-caption text-muted-text">Saved on this device</p>
                  <p className="font-headline-2 text-headline-2 text-on-surface">
                    {profile?.userName || displayName}
                  </p>
                  <p className="font-caption text-caption text-muted-text">
                    {profile?.role === 'caretaker'
                      ? `Family caretaker for ${displayName}`
                      : 'Patient'}
                  </p>
                  <p className="font-caption text-caption text-muted-text">
                    {describeMealRoutine(profile)}
                  </p>
                </div>
              ) : null}

              <button
                type="button"
                id="your-details-btn"
                onClick={isOnboarded ? openDetails : openOnboarding}
                className="h-14 px-8 rounded-2xl bg-primary-container text-on-lime font-body-semibold text-body-semibold inline-flex items-center justify-center gap-2 transition-all hover:opacity-95 shadow-sm w-full max-w-sm focus-visible:ring-2 focus-visible:ring-primary"
              >
                <span className="material-symbols-outlined text-[22px]">
                  {isOnboarded ? 'edit' : 'person_add'}
                </span>
                {isOnboarded ? 'Edit my details' : 'Add my details'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer with Brief-Approved Disclaimer */}
      <footer
        id="about"
        className="w-full bg-surface-container-low py-space-lg border-t border-card-border"
      >
        <div className="max-w-7xl mx-auto px-margin flex flex-col md:flex-row items-center justify-between gap-space-md">
          <div className="flex items-center gap-space-xs">
            <span className="font-headline-2 text-headline-2 text-on-surface font-semibold">
              Cura
            </span>
            <span className="font-caption text-caption text-muted-text">
              — Simple, safe daily medicine companion.
            </span>
          </div>
          <div className="flex items-center gap-space-lg">
            <Link to="/app" className="font-caption text-caption text-muted-text hover:text-on-surface">
              Today
            </Link>
            <Link to="/scan" className="font-caption text-caption text-muted-text hover:text-on-surface">
              Scan
            </Link>
            <Link
              to="/settings"
              className="font-caption text-caption text-muted-text hover:text-on-surface"
            >
              Settings
            </Link>
          </div>
          <p className="font-caption text-caption text-muted-text">
            A hackathon project. Not medical advice.
          </p>
        </div>
      </footer>

      <UserInfoDialog
        isOpen={dialogOpen}
        mode={dialogMode}
        onClose={() => setDialogOpen(false)}
        onSaved={() => {
          if (dialogMode === 'onboarding') navigate('/scan');
        }}
      />
    </div>
  );
}
