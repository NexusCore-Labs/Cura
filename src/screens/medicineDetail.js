// Screen 02: Medicine Detail (Normalized to Nunito Sans, Tailwind tokens, safe copy)
import { getMedicineById, getSchedule } from '../utils/storage.js';

export function renderMedicineDetail(medId = 'med-3') {
  const medicine = getMedicineById(medId) || getSchedule()?.medicines?.[0] || {
    id: 'med-3',
    name: 'Amlodipine',
    strength: '5 mg',
    form: 'tablet',
    food: 'After dinner',
    notes: '1 tablet after dinner, from your prescription'
  };

  const doseInstruction = medicine.notes || `1 ${medicine.form || 'dose'} ${medicine.food || 'as prescribed'}, from your prescription.`;

  return `
    <div class="w-full max-w-[390px] mx-auto min-h-screen bg-surface flex flex-col pt-safe pb-8 px-margin">
      <!-- Top Bar Navigation -->
      <header class="h-14 flex items-center justify-between w-full">
        <a href="#/app" aria-label="Go back to Today" class="w-11 h-11 rounded-xl flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors focus-visible:ring-2 focus-visible:ring-primary">
          <span class="material-symbols-outlined text-[24px]">arrow_back</span>
        </a>
        <h2 class="font-headline-2 text-[20px] text-on-surface font-semibold truncate px-2">Medication Info</h2>
        <a href="#/app" aria-label="Close detail view" class="w-11 h-11 rounded-xl flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors focus-visible:ring-2 focus-visible:ring-primary">
          <span class="material-symbols-outlined text-[24px]">close</span>
        </a>
      </header>

      <!-- Main Content Stream -->
      <main class="flex flex-col gap-4 mt-2">
        <!-- Dark Contrast Header Card -->
        <section class="bg-card-dark rounded-3xl p-5 shadow-sm text-surface-container-lowest">
          <h1 class="font-headline-1 text-[28px] leading-[36px] font-bold text-surface-container-lowest">
            ${medicine.name} ${medicine.strength}
          </h1>
          <p class="font-caption text-caption text-surface-variant mt-2">
            ${medicine.food ? `${medicine.food} • ` : ''}From your prescription
          </p>
        </section>

        <!-- Overview | Stats Toggle (Overview selected) -->
        <div class="bg-card-border/60 rounded-2xl p-1 flex gap-1 h-[52px]" role="tablist" aria-label="Medicine information tabs">
          <button id="tab-overview" class="flex-1 rounded-xl font-body-semibold text-body-semibold bg-surface-container-lowest text-on-surface shadow-sm flex items-center justify-center transition-all focus-visible:ring-2 focus-visible:ring-primary" role="tab" aria-selected="true">
            Overview
          </button>
          <button id="tab-stats" class="flex-1 rounded-xl font-body text-body text-secondary hover:text-on-surface flex items-center justify-center transition-all focus-visible:ring-2 focus-visible:ring-primary" role="tab" aria-selected="false">
            Stats
          </button>
        </div>

        <div id="overview-panel" class="flex flex-col gap-4">
          <!-- Overview Cards (3 stacked white cards) -->
          <section class="bg-surface-container-lowest border border-card-border rounded-3xl p-5 shadow-sm">
            <h2 class="font-headline-2 text-headline-2 text-on-surface mb-2">What it's for</h2>
            <p class="font-body text-body text-on-surface">
              Commonly used to help support your routine as prescribed by your doctor. Your physician can confirm why it was prescribed for you.
            </p>
          </section>

          <section class="bg-surface-container-lowest border border-card-border rounded-3xl p-5 shadow-sm">
            <h2 class="font-headline-2 text-headline-2 text-on-surface mb-2">How it helps</h2>
            <p class="font-body text-body text-on-surface">
              Prescribed for daily health maintenance. Follow the directions provided on your original prescription sheet.
            </p>
          </section>

          <section class="bg-surface-container-lowest border border-card-border rounded-3xl p-5 shadow-sm">
            <h2 class="font-headline-2 text-headline-2 text-on-surface mb-2">How to take it</h2>
            <p class="font-body text-body text-on-surface">
              ${doseInstruction}
            </p>
          </section>

          <!-- Collapsed Card: Ask your pharmacist if... -->
          <details class="bg-surface-container-lowest border border-card-border rounded-3xl p-5 shadow-sm group cursor-pointer transition-all">
            <summary class="flex items-center justify-between list-none font-headline-2 text-headline-2 text-on-surface focus-visible:ring-2 focus-visible:ring-primary rounded-xl">
              <span>Ask your pharmacist if...</span>
              <span class="material-symbols-outlined text-secondary transition-transform group-open:rotate-180 text-[24px]">expand_more</span>
            </summary>
            <div class="pt-4 mt-3 border-t border-card-border/60 flex flex-col gap-2 font-body text-body text-on-surface">
              <p>• Ask your pharmacist what to do if you miss a dose.</p>
              <p>• Ask your pharmacist if you feel unwell or have questions about your schedule.</p>
            </div>
          </details>

          <!-- AI Disclaimer -->
          <p class="font-caption text-caption text-secondary text-center my-1">
            AI-generated general information. Confirm with your pharmacist.
          </p>

          <!-- Exactly ONE Primary Lime Button with Dark Text -->
          <button type="button" id="read-aloud-btn" class="w-full h-14 rounded-2xl bg-primary-container text-on-lime font-body-semibold text-body-semibold flex items-center justify-center gap-2 shadow-sm hover:opacity-95 active:scale-[0.99] transition-all focus-visible:ring-2 focus-visible:ring-primary">
            <span class="material-symbols-outlined text-[24px]">volume_up</span>
            <span id="read-btn-text">Read aloud</span>
          </button>
        </div>

        <div id="stats-panel" class="hidden flex-col items-center justify-center py-12 text-center bg-surface-container-lowest border border-card-border rounded-3xl p-6">
          <span class="material-symbols-outlined text-[48px] text-secondary mb-2">analytics</span>
          <h3 class="font-headline-2 text-headline-2 text-on-surface mb-1">Adherence Stats</h3>
          <p class="font-body text-body text-secondary">Stats tracking is coming soon in an upcoming update.</p>
        </div>
      </main>
    </div>
  `;
}

export function attachMedicineDetailListeners() {
  const tabOverview = document.getElementById('tab-overview');
  const tabStats = document.getElementById('tab-stats');
  const overviewPanel = document.getElementById('overview-panel');
  const statsPanel = document.getElementById('stats-panel');

  if (tabOverview && tabStats) {
    tabOverview.addEventListener('click', () => {
      tabOverview.classList.add('bg-surface-container-lowest', 'text-on-surface', 'shadow-sm', 'font-body-semibold');
      tabOverview.classList.remove('text-secondary', 'font-body');
      tabOverview.setAttribute('aria-selected', 'true');

      tabStats.classList.remove('bg-surface-container-lowest', 'text-on-surface', 'shadow-sm', 'font-body-semibold');
      tabStats.classList.add('text-secondary', 'font-body');
      tabStats.setAttribute('aria-selected', 'false');

      overviewPanel?.classList.remove('hidden');
      statsPanel?.classList.add('hidden');
    });

    tabStats.addEventListener('click', () => {
      tabStats.classList.add('bg-surface-container-lowest', 'text-on-surface', 'shadow-sm', 'font-body-semibold');
      tabStats.classList.remove('text-secondary', 'font-body');
      tabStats.setAttribute('aria-selected', 'true');

      tabOverview.classList.remove('bg-surface-container-lowest', 'text-on-surface', 'shadow-sm', 'font-body-semibold');
      tabOverview.classList.add('text-secondary', 'font-body');
      tabOverview.setAttribute('aria-selected', 'false');

      overviewPanel?.classList.add('hidden');
      statsPanel?.classList.remove('hidden');
    });
  }

  const readAloudBtn = document.getElementById('read-aloud-btn');
  const readBtnText = document.getElementById('read-btn-text');
  if (readAloudBtn) {
    let isSpeaking = false;
    readAloudBtn.addEventListener('click', () => {
      isSpeaking = !isSpeaking;
      const icon = readAloudBtn.querySelector('.material-symbols-outlined');
      if (isSpeaking) {
        if (icon) icon.textContent = 'stop';
        if (readBtnText) readBtnText.textContent = 'Stop reading';
        readAloudBtn.classList.add('bg-primary-fixed-dim');
      } else {
        if (icon) icon.textContent = 'volume_up';
        if (readBtnText) readBtnText.textContent = 'Read aloud';
        readAloudBtn.classList.remove('bg-primary-fixed-dim');
      }
    });
  }
}
