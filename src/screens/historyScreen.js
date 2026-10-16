// Stub Screen: History (Mobile/Desktop)
import { getDoseLog, getMedicineById } from '../utils/storage.js';
import { SLOTS, formatHeaderDate } from '../utils/dates.js';
import { renderBottomNav, renderDesktopHeader } from '../components/navigation.js';

export function renderHistoryScreen() {
  const doseLog = getDoseLog();
  const today = new Date();

  return `
    <div class="bg-background font-body text-body text-on-surface min-h-screen flex flex-col">
      <!-- Desktop Header -->
      ${renderDesktopHeader('Ramesh', 'history')}

      <div class="flex-1 flex flex-col relative w-full pt-safe lg:pt-24 pb-28">
        <div class="flex flex-col w-full max-w-[540px] mx-auto px-margin">
          <header class="flex items-center justify-between pt-4 pb-2">
            <div>
              <h1 class="font-headline-1 text-headline-1 text-on-surface">Dose History</h1>
              <p class="font-caption text-caption text-secondary mt-1">${formatHeaderDate(today)}</p>
            </div>
            <a href="#/app" class="lg:hidden w-11 h-11 rounded-xl bg-surface-container flex items-center justify-center text-on-surface">
              <span class="material-symbols-outlined text-[24px]">close</span>
            </a>
          </header>

          <main class="mt-6">
            ${doseLog.length === 0 ? `
              <div class="bg-surface-container-lowest rounded-3xl border border-card-border p-8 shadow-sm flex flex-col items-center text-center">
                <div class="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center text-secondary mb-4">
                  <span class="material-symbols-outlined text-[32px]">history</span>
                </div>
                <h2 class="font-headline-2 text-headline-2 text-on-surface mb-2">No past history yet</h2>
                <p class="font-body text-body text-secondary max-w-xs mb-6">
                  When you check off your doses on the Today screen, your completed logs will be recorded here.
                </p>
                <a href="#/app" class="h-12 px-6 rounded-2xl bg-primary-container text-on-lime font-body-semibold inline-flex items-center justify-center">
                  Go to Today
                </a>
              </div>
            ` : `
              <div class="flex flex-col space-y-3">
                ${doseLog.map(entry => {
                  const med = getMedicineById(entry.medId);
                  const slotDef = SLOTS.find(s => s.id === entry.slot);
                  const takenTime = new Date(entry.takenAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                  return `
                    <div class="bg-surface-container-lowest border border-card-border rounded-2xl p-4 shadow-sm flex items-center justify-between">
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-primary-container/20 flex items-center justify-center text-primary">
                          <span class="material-symbols-outlined text-[20px]">check</span>
                        </div>
                        <div>
                          <p class="font-body-semibold text-body-semibold text-on-surface">${med?.name || 'Medicine'} ${med?.strength || ''}</p>
                          <p class="font-caption text-caption text-secondary">${slotDef?.label || entry.slot} • ${entry.date}</p>
                        </div>
                      </div>
                      <span class="font-caption text-caption text-secondary bg-surface-container px-2.5 py-1 rounded-full">${takenTime}</span>
                    </div>
                  `;
                }).join('')}
              </div>
            `}
          </main>
        </div>
        ${renderBottomNav('history')}
      </div>
    </div>
  `;
}
