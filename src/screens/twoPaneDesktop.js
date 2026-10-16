// Screen 07: Desktop Two-Pane App (1440px / >=1024px responsive shell)
import { getProfile, getSchedule, getDoseLog, isDoseTaken, toggleDose, markSlotTaken, isSlotTaken } from '../utils/storage.js';
import { formatGreeting, formatHeaderDate, getCalendarStrip, toIsoDate, getCurrentDueSlot, SLOTS } from '../utils/dates.js';
import { renderDesktopHeader } from '../components/navigation.js';

export function renderTwoPaneDesktop(selectedMedId = null) {
  const profile = getProfile();
  const schedule = getSchedule();
  const today = new Date();
  const todayIso = toIsoDate(today);
  const calendarStrip = getCalendarStrip(today);
  const currentSlotId = getCurrentDueSlot(today);

  const medicines = schedule?.medicines || [];
  // Selected medicine for right pane (default to first or active med)
  const activeMed = medicines.find(m => m.id === selectedMedId) || medicines[0] || {
    id: 'med-3',
    name: 'Amlodipine',
    strength: '5 mg',
    form: 'tablet',
    food: 'After dinner',
    notes: '1 tablet after dinner, from your prescription.'
  };

  // Group medicines by slot
  const slotGroups = SLOTS.map(slot => {
    const medsInSlot = medicines.filter(m => m.slots && m.slots.includes(slot.id));
    return {
      ...slot,
      medicines: medsInSlot,
      isCompleted: medsInSlot.length > 0 && isSlotTaken(todayIso, slot.id, medsInSlot)
    };
  });

  const dueGroup = slotGroups.find(g => g.id === currentSlotId);
  const isDueGroupCompleted = !dueGroup || dueGroup.medicines.length === 0 || dueGroup.isCompleted;

  return `
    <div class="bg-background font-body text-body text-on-surface min-h-screen">
      <!-- Desktop Header -->
      ${renderDesktopHeader(profile.patientName || 'Ramesh', 'today')}

      <main class="w-full pt-24 bg-background">
        <div class="w-full max-w-[1440px] mx-auto px-margin py-space-md">
          <div class="flex flex-col lg:flex-row gap-space-lg items-start">
            <!-- Left Pane (420px Fixed on Desktop) -->
            <section class="w-full lg:w-[420px] lg:flex-shrink-0 flex flex-col gap-space-lg" aria-label="Today medication schedule">
              <!-- Header & Date Subtitle -->
              <div class="flex flex-col gap-space-xs">
                <span class="font-headline-1 text-headline-1 text-on-surface tracking-tight">Today</span>
                <span class="font-body text-body text-on-surface-variant">${formatHeaderDate(today)}</span>
              </div>

              <!-- 5-Day Horizontal Calendar Strip -->
              <div class="grid grid-cols-5 gap-space-xs w-full">
                ${calendarStrip.map(day => `
                  <button type="button" 
                          class="flex flex-col items-center justify-center py-3 rounded-2xl transition-colors ${
                            day.isToday 
                              ? 'bg-primary-container text-on-lime shadow-sm font-bold' 
                              : 'bg-surface-container-lowest border border-card-border text-on-surface hover:bg-surface-container'
                          }">
                    <span class="font-caption text-caption ${day.isToday ? 'text-on-lime font-bold' : 'text-secondary'}">${day.dayName}</span>
                    <span class="font-body-semibold text-body-semibold">${day.dayNumber}</span>
                  </button>
                `).join('')}
              </div>

              <!-- Medication Timeline Groups -->
              <div class="flex flex-col gap-space-md w-full">
                ${slotGroups.map(group => {
                  const isCurrentSlot = group.id === currentSlotId;
                  return `
                    <div class="flex flex-col gap-space-xs">
                      <div class="flex items-center gap-space-xs px-1">
                        <span class="material-symbols-outlined text-[22px] ${isCurrentSlot ? 'text-primary' : 'text-secondary'}">${group.icon}</span>
                        <span class="font-body-semibold text-body-semibold text-on-surface">${group.label}</span>
                        <span class="font-caption text-caption text-secondary ml-auto">${group.time}</span>
                      </div>

                      ${group.medicines.length === 0 ? `
                        <div class="bg-surface-container-low rounded-3xl p-space-md flex items-center border border-card-border/50">
                          <span class="font-body text-body text-secondary">Nothing to take</span>
                        </div>
                      ` : `
                        <div class="flex flex-col gap-2">
                          ${group.medicines.map(med => {
                            const taken = isDoseTaken(todayIso, group.id, med.id);
                            const isSelected = med.id === activeMed.id;

                            return `
                              <div class="rounded-3xl p-space-md border transition-all cursor-pointer flex items-center justify-between gap-space-sm ${
                                isSelected 
                                  ? 'bg-surface-container-lowest border-2 border-primary shadow-md' 
                                  : 'bg-surface-container-lowest border-card-border hover:bg-surface-container-low shadow-sm'
                              }" data-select-med="${med.id}">
                                <div class="flex flex-col min-w-0">
                                  <span class="font-body-semibold text-body-semibold text-on-surface truncate ${taken ? 'line-through opacity-70' : ''}">${med.name} ${med.strength}</span>
                                  <span class="font-caption text-caption text-secondary">${med.food || 'Prescription dose'}</span>
                                </div>
                                <button type="button" 
                                        aria-label="Toggle ${med.name}" 
                                        class="desktop-med-check w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                                          taken 
                                            ? 'bg-primary-container text-on-lime' 
                                            : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
                                        }"
                                        data-slot="${group.id}"
                                        data-med="${med.id}">
                                  <span class="material-symbols-outlined text-[20px] ${taken ? 'font-bold' : ''}">check</span>
                                </button>
                              </div>
                            `;
                          }).join('')}
                        </div>
                      `}
                    </div>
                  `;
                }).join('')}
              </div>

              <!-- Left Pane Action Button (Mark current slot) -->
              <button type="button" 
                      id="desktop-take-slot-btn" 
                      ${isDueGroupCompleted ? 'disabled' : ''}
                      class="w-full h-14 rounded-2xl ${
                        isDueGroupCompleted 
                          ? 'bg-surface-container text-secondary cursor-not-allowed' 
                          : 'bg-primary-container text-on-lime hover:opacity-95 shadow-sm'
                      } font-body-semibold text-body-semibold flex items-center justify-center gap-space-xs transition-all focus-visible:ring-2 focus-visible:ring-primary">
                <span class="material-symbols-outlined text-[20px]">done_all</span>
                <span>${isDueGroupCompleted ? 'All done for now' : 'I took it'}</span>
              </button>
            </section>

            <!-- Right Pane (Medicine Detail View) -->
            <section class="flex-1 w-full flex flex-col gap-space-md" aria-label="Selected medicine detail profile">
              <!-- Top Utility Bar -->
              <div class="flex items-center justify-between w-full h-10 px-1">
                <div class="flex items-center gap-space-xs">
                  <span class="font-caption-bold text-caption-bold text-secondary uppercase tracking-wider">Medication Profile</span>
                </div>
                <div class="flex items-center gap-space-xs">
                  <a href="#/review" title="Review prescription schedule" aria-label="Review prescription schedule" class="w-10 h-10 rounded-full bg-surface-container-lowest border border-card-border flex items-center justify-center shadow-sm text-on-surface hover:bg-surface-container transition-colors focus-visible:ring-2 focus-visible:ring-primary">
                    <span class="material-symbols-outlined text-[20px]">fact_check</span>
                  </a>
                  <a href="#/app" aria-label="Refresh view" class="w-10 h-10 rounded-full bg-surface-container-lowest border border-card-border flex items-center justify-center shadow-sm text-on-surface hover:bg-surface-container transition-colors focus-visible:ring-2 focus-visible:ring-primary">
                    <span class="material-symbols-outlined text-[20px]">refresh</span>
                  </a>
                </div>
              </div>

              <!-- Dark Contrast Header Card -->
              <div class="w-full bg-card-dark rounded-3xl p-space-lg text-surface-container-lowest shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
                <div class="flex flex-col gap-1">
                  <span class="font-caption text-caption text-surface-variant uppercase tracking-wider">Prescribed Daily</span>
                  <h1 class="font-headline-1 text-headline-1 text-surface-container-lowest">${activeMed.name} ${activeMed.strength}</h1>
                  <span class="font-body text-body text-surface-variant">${activeMed.food || 'Follow prescription guidelines'}</span>
                </div>
                <div class="w-16 h-16 rounded-2xl bg-surface-variant/20 flex items-center justify-center flex-shrink-0 text-primary-container">
                  <span class="material-symbols-outlined text-[36px]">medication_liquid</span>
                </div>
              </div>

              <!-- Two-Option Segmented Control -->
              <div class="inline-flex p-1 bg-surface-container rounded-2xl self-start border border-card-border">
                <button id="desktop-tab-overview" class="px-space-md py-2 rounded-xl bg-surface-container-lowest text-on-surface font-body-semibold text-body-semibold shadow-sm focus-visible:ring-2 focus-visible:ring-primary" type="button">
                  Overview
                </button>
                <button id="desktop-tab-stats" class="px-space-md py-2 rounded-xl text-secondary font-body-semibold text-body-semibold hover:text-on-surface transition-colors focus-visible:ring-2 focus-visible:ring-primary" type="button">
                  Stats
                </button>
              </div>

              <!-- Stacked Detail Cards -->
              <div id="desktop-overview-panel" class="flex flex-col gap-space-sm w-full">
                <!-- Card 1: What it's for -->
                <div class="w-full bg-surface-container-lowest border border-card-border rounded-3xl p-space-md shadow-sm flex flex-col gap-space-xs">
                  <div class="flex items-center gap-space-xs text-primary">
                    <span class="material-symbols-outlined text-[20px]">help_outline</span>
                    <span class="font-body-semibold text-body-semibold text-on-surface">What it's for</span>
                  </div>
                  <p class="font-body text-body text-on-surface">
                    Commonly used to support your health routine as directed by your physician. Your doctor can confirm why it was prescribed for you.
                  </p>
                </div>

                <!-- Card 2: How it helps -->
                <div class="w-full bg-surface-container-lowest border border-card-border rounded-3xl p-space-md shadow-sm flex flex-col gap-space-xs">
                  <div class="flex items-center gap-space-xs text-primary">
                    <span class="material-symbols-outlined text-[20px]">favorite</span>
                    <span class="font-body-semibold text-body-semibold text-on-surface">How it helps</span>
                  </div>
                  <p class="font-body text-body text-on-surface">
                    Prescribed for regular daily adherence according to your doctor's clinical instructions.
                  </p>
                </div>

                <!-- Card 3: How to take it -->
                <div class="w-full bg-surface-container-lowest border border-card-border rounded-3xl p-space-md shadow-sm flex flex-col gap-space-xs">
                  <div class="flex items-center gap-space-xs text-primary">
                    <span class="material-symbols-outlined text-[20px]">schedule</span>
                    <span class="font-body-semibold text-body-semibold text-on-surface">How to take it</span>
                  </div>
                  <p class="font-body text-body text-on-surface">
                    ${activeMed.notes || `1 ${activeMed.form || 'tablet'} ${activeMed.food || 'as prescribed'}, from your prescription.`}
                  </p>
                </div>

                <!-- Collapsed Card: Ask your pharmacist if... -->
                <details class="w-full bg-surface-container-lowest border border-card-border rounded-3xl p-space-md shadow-sm group cursor-pointer transition-all">
                  <summary class="flex items-center justify-between list-none focus:outline-none">
                    <div class="flex items-center gap-space-xs text-on-surface">
                      <span class="material-symbols-outlined text-tertiary text-[20px]">contact_support</span>
                      <span class="font-body-semibold text-body-semibold">Ask your pharmacist if...</span>
                    </div>
                    <span class="material-symbols-outlined text-secondary transition-transform group-open:rotate-180 text-[24px]">expand_more</span>
                  </summary>
                  <div class="pt-space-sm mt-space-sm bg-surface-container-low rounded-xl p-space-sm flex flex-col gap-space-xs">
                    <p class="font-body text-body text-on-surface">
                      • Ask your pharmacist what to do if you miss a dose.
                    </p>
                    <p class="font-body text-body text-on-surface">
                      • Ask your pharmacist if you feel unwell or have questions about timing.
                    </p>
                  </div>
                </details>
              </div>

              <div id="desktop-stats-panel" class="hidden flex-col items-center justify-center py-12 text-center bg-surface-container-lowest border border-card-border rounded-3xl p-6">
                <span class="material-symbols-outlined text-[48px] text-secondary mb-2">analytics</span>
                <h3 class="font-headline-2 text-headline-2 text-on-surface mb-1">Adherence History</h3>
                <p class="font-body text-body text-secondary">Historical analytics and charts will appear here.</p>
              </div>

              <!-- AI Disclaimer Caption -->
              <div class="flex items-center gap-space-xs px-2">
                <span class="material-symbols-outlined text-secondary text-[16px]">info</span>
                <span class="font-caption text-caption text-secondary">AI-generated general information. Confirm with your pharmacist.</span>
              </div>

              <!-- Primary Lime Read Aloud Button -->
              <button type="button" 
                      id="desktop-read-aloud-btn" 
                      class="w-full h-14 rounded-2xl bg-primary-container text-on-lime font-body-semibold text-body-semibold shadow-sm hover:opacity-95 active:scale-[0.99] flex items-center justify-center gap-space-xs transition-all focus-visible:ring-2 focus-visible:ring-primary">
                <span class="material-symbols-outlined text-[24px]">volume_up</span>
                <span id="desktop-read-text">Read aloud</span>
              </button>
            </section>
          </div>
        </div>
      </main>
    </div>
  `;
}

export function attachTwoPaneListeners() {
  const todayIso = toIsoDate(new Date());

  // Medicine Selection in left list
  const medRows = document.querySelectorAll('[data-select-med]');
  medRows.forEach(row => {
    row.addEventListener('click', (e) => {
      // If clicked the checkbox itself, let checkbox handler run
      if (e.target.closest('.desktop-med-check')) return;
      const medId = row.getAttribute('data-select-med');
      window.location.hash = `#/app?med=${medId}`;
    });
  });

  // Dose toggles
  const checks = document.querySelectorAll('.desktop-med-check');
  checks.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const slotId = btn.getAttribute('data-slot');
      const medId = btn.getAttribute('data-med');
      toggleDose(todayIso, slotId, medId);
      window.dispatchEvent(new CustomEvent('cura-state-changed'));
    });
  });

  // Take current slot action
  const takeSlotBtn = document.getElementById('desktop-take-slot-btn');
  if (takeSlotBtn && !takeSlotBtn.disabled) {
    takeSlotBtn.addEventListener('click', () => {
      const schedule = getSchedule();
      const currentSlotId = getCurrentDueSlot(new Date());
      const medsInSlot = (schedule?.medicines || []).filter(m => m.slots && m.slots.includes(currentSlotId));
      markSlotTaken(todayIso, currentSlotId, medsInSlot);
      window.location.hash = `#/confirmed?slot=${currentSlotId}`;
    });
  }

  // Tabs
  const tabOverview = document.getElementById('desktop-tab-overview');
  const tabStats = document.getElementById('desktop-tab-stats');
  const overviewPanel = document.getElementById('desktop-overview-panel');
  const statsPanel = document.getElementById('desktop-stats-panel');

  if (tabOverview && tabStats) {
    tabOverview.addEventListener('click', () => {
      tabOverview.classList.add('bg-surface-container-lowest', 'text-on-surface', 'shadow-sm');
      tabOverview.classList.remove('text-secondary');
      tabStats.classList.remove('bg-surface-container-lowest', 'text-on-surface', 'shadow-sm');
      tabStats.classList.add('text-secondary');
      overviewPanel?.classList.remove('hidden');
      statsPanel?.classList.add('hidden');
    });

    tabStats.addEventListener('click', () => {
      tabStats.classList.add('bg-surface-container-lowest', 'text-on-surface', 'shadow-sm');
      tabStats.classList.remove('text-secondary');
      tabOverview.classList.remove('bg-surface-container-lowest', 'text-on-surface', 'shadow-sm');
      tabOverview.classList.add('text-secondary');
      overviewPanel?.classList.add('hidden');
      statsPanel?.classList.remove('hidden');
    });
  }

  // Read aloud toggle
  const readBtn = document.getElementById('desktop-read-aloud-btn');
  const readText = document.getElementById('desktop-read-text');
  if (readBtn) {
    let isReading = false;
    readBtn.addEventListener('click', () => {
      isReading = !isReading;
      const icon = readBtn.querySelector('.material-symbols-outlined');
      if (isReading) {
        if (icon) icon.textContent = 'pause';
        if (readText) readText.textContent = 'Reading now...';
        readBtn.classList.add('bg-primary-fixed-dim');
      } else {
        if (icon) icon.textContent = 'volume_up';
        if (readText) readText.textContent = 'Read aloud';
        readBtn.classList.remove('bg-primary-fixed-dim');
      }
    });
  }
}
