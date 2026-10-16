// Screen 03: Review Schedule (Mobile/Desktop)
import { getSchedule, saveSchedule } from '../utils/storage.js';
import { SLOTS } from '../utils/dates.js';

export function renderReviewSchedule() {
  const schedule = getSchedule();
  const medicines = schedule?.medicines || [];

  return `
    <div class="w-full max-w-[420px] mx-auto min-h-screen bg-surface flex flex-col pt-safe pb-safe px-margin">
      <!-- Fixed Header Bar -->
      <header class="h-16 flex items-center justify-between border-b border-card-border/60 mb-4">
        <div class="flex items-center min-w-0 pr-space-xs">
          <a href="#/scan" aria-label="Go back to Scanner" class="min-w-[44px] min-h-[44px] flex items-center justify-center text-on-surface hover:text-primary transition-colors focus-visible:ring-2 focus-visible:ring-primary rounded-xl">
            <span class="material-symbols-outlined text-[28px]">arrow_back</span>
          </a>
          <h1 class="font-headline-2 text-headline-2 text-on-surface tracking-tight truncate pl-1">Review Schedule</h1>
        </div>
        <div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary flex-shrink-0">
          <span class="material-symbols-outlined text-[18px]">person</span>
        </div>
      </header>

      <!-- Main Content Stream -->
      <main class="flex-1 flex flex-col pb-28">
        <!-- Scanned Rx Paper Card with Real Thumbnail -->
        <div class="relative w-full h-[120px] rounded-2xl overflow-hidden bg-surface-container-lowest border border-card-border shadow-sm mb-space-lg flex items-center justify-between px-space-md">
          <div class="flex items-center space-x-space-sm min-w-0">
            <div class="w-14 h-14 rounded-xl overflow-hidden bg-surface-container flex items-center justify-center flex-shrink-0 border border-card-border">
              <img src="${schedule?.thumbnail || '/samples/cura_sample_image1.jpg'}" alt="Scanned prescription paper thumbnail" class="w-full h-full object-cover" />
            </div>
            <div class="flex flex-col min-w-0 pl-2">
              <span class="font-headline-2 text-[20px] leading-[26px] text-on-surface font-semibold truncate">Scanned Rx Paper</span>
              <span class="font-caption text-caption text-secondary truncate">Ready for verification</span>
            </div>
          </div>
          <button type="button" 
                  id="inspect-doc-btn" 
                  aria-label="Inspect prescription document" 
                  class="w-11 h-11 rounded-full bg-surface-container-lowest border border-card-border flex items-center justify-center shadow-sm flex-shrink-0 text-on-surface active:bg-surface-container transition-colors focus-visible:ring-2 focus-visible:ring-primary">
            <span class="material-symbols-outlined text-[22px]">zoom_in</span>
          </button>
        </div>

        <!-- Medicine Cards List -->
        <div class="flex flex-col space-y-gutter w-full" id="review-cards-list">
          ${medicines.map(med => {
            const hasReviewIssue = med.needsReview;
            const slotLabels = (med.slots || []).map(s => {
              const def = SLOTS.find(item => item.id === s);
              return def ? `${def.label} (${def.time})` : s;
            }).join(', ');

            return `
              <div class="w-full bg-surface-container-lowest rounded-3xl p-space-md shadow-sm transition-all border ${
                hasReviewIssue 
                  ? 'border-2 border-warning-amber ring-1 ring-warning-amber/30' 
                  : 'border border-card-border'
              }" data-med-id="${med.id}">
                <div class="flex items-start justify-between">
                  <h2 class="font-headline-2 text-headline-2 text-on-surface">${med.name} ${med.strength}</h2>
                  ${hasReviewIssue ? `
                    <div class="flex items-center space-x-1 text-warning-amber font-caption-bold text-caption-bold">
                      <span class="material-symbols-outlined text-[20px]">error</span>
                      <span>Check this</span>
                    </div>
                  ` : `
                    <span class="material-symbols-outlined text-outline text-[24px]">medication</span>
                  `}
                </div>

                <div class="flex flex-wrap gap-space-xs mt-space-md">
                  <div class="h-8 rounded-full px-3 bg-surface-container-low border border-card-border flex items-center justify-center">
                    <span class="font-caption-bold text-caption-bold text-on-surface">${slotLabels || 'Daily dose'}</span>
                  </div>
                  <div class="h-8 rounded-full px-3 bg-surface-container-low border border-card-border flex items-center justify-center">
                    <span class="font-caption-bold text-caption-bold text-on-surface">${med.food || 'After meal'}</span>
                  </div>
                </div>

                ${hasReviewIssue ? `
                  <div class="mt-3 pt-3 border-t border-warning-amber/20 flex items-center justify-between">
                    <span class="font-caption text-caption text-muted-text">Dosage verified with prescription?</span>
                    <button type="button" class="resolve-issue-btn text-primary font-caption-bold underline px-2 py-1 focus-visible:ring-2 focus-visible:ring-primary rounded-lg" data-med-id="${med.id}">
                      Confirm details
                    </button>
                  </div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>

        <!-- Help Link -->
        <div class="w-full flex justify-center py-space-lg">
          <button type="button" id="ask-pharmacist-link" class="font-body-semibold text-body-semibold text-secondary underline active:text-on-surface transition-colors py-2 focus-visible:ring-2 focus-visible:ring-primary rounded-lg">
            Not sure? Ask your pharmacist
          </button>
        </div>

        <!-- Bottom Fixed Action Container -->
        <div class="fixed bottom-0 left-0 right-0 z-40 bg-surface/90 backdrop-blur-md px-margin pb-safe pt-space-xs border-t border-card-border/60">
          <div class="max-w-[420px] mx-auto w-full pb-space-sm">
            <button type="button" 
                    id="approve-schedule-btn" 
                    class="w-full h-14 bg-primary-container text-on-lime rounded-2xl font-body-semibold text-body-semibold flex items-center justify-center shadow-sm hover:opacity-95 active:scale-[0.99] transition-all focus-visible:ring-2 focus-visible:ring-primary">
              Approve schedule
            </button>
          </div>
        </div>
      </main>

      <!-- Zoom Modal -->
      <div id="image-modal" class="hidden fixed inset-0 z-50 bg-inverse-surface/80 backdrop-blur-md flex items-center justify-center p-4">
        <div class="bg-surface-container-lowest rounded-3xl max-w-lg w-full p-4 flex flex-col items-center">
          <div class="w-full flex justify-between items-center mb-3">
            <h3 class="font-headline-2 text-headline-2 text-on-surface">Prescription Sheet</h3>
            <button type="button" id="close-modal-btn" class="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface">
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
          <img src="${schedule?.thumbnail || '/samples/cura_sample_image1.jpg'}" alt="Full prescription sheet view" class="w-full max-h-[70vh] object-contain rounded-xl" />
        </div>
      </div>

      <!-- Ask Pharmacist Dialog Modal -->
      <div id="pharmacist-dialog" class="hidden fixed inset-0 z-50 bg-inverse-surface/80 backdrop-blur-md flex items-center justify-center p-4">
        <div class="bg-surface-container-lowest rounded-3xl max-w-sm w-full p-6 flex flex-col">
          <div class="flex items-center gap-2 mb-3 text-primary">
            <span class="material-symbols-outlined text-[28px]">contact_support</span>
            <h3 class="font-headline-2 text-headline-2 text-on-surface">Ask Your Pharmacist</h3>
          </div>
          <p class="font-body text-body text-secondary mb-4 leading-relaxed">
            If any handwriting or dosage on your paper prescription looks unclear, show this sheet directly to your local registered pharmacist to confirm your schedule.
          </p>
          <button type="button" id="close-dialog-btn" class="w-full h-12 bg-primary-container text-on-lime rounded-xl font-body-semibold flex items-center justify-center">
            Got it
          </button>
        </div>
      </div>
    </div>
  `;
}

export function attachReviewListeners() {
  const inspectBtn = document.getElementById('inspect-doc-btn');
  const modal = document.getElementById('image-modal');
  const closeModalBtn = document.getElementById('close-modal-btn');

  if (inspectBtn && modal) {
    inspectBtn.addEventListener('click', () => modal.classList.remove('hidden'));
    closeModalBtn?.addEventListener('click', () => modal.classList.add('hidden'));
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.add('hidden');
    });
  }

  const pharmacistLink = document.getElementById('ask-pharmacist-link');
  const pharmacistDialog = document.getElementById('pharmacist-dialog');
  const closeDialogBtn = document.getElementById('close-dialog-btn');

  if (pharmacistLink && pharmacistDialog) {
    pharmacistLink.addEventListener('click', () => pharmacistDialog.classList.remove('hidden'));
    closeDialogBtn?.addEventListener('click', () => pharmacistDialog.classList.add('hidden'));
  }

  const resolveBtns = document.querySelectorAll('.resolve-issue-btn');
  resolveBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const medId = btn.getAttribute('data-med-id');
      const schedule = getSchedule();
      if (schedule && schedule.medicines) {
        const target = schedule.medicines.find(m => m.id === medId);
        if (target) {
          target.needsReview = false;
          saveSchedule(schedule);
          window.dispatchEvent(new CustomEvent('cura-state-changed'));
        }
      }
    });
  });

  const approveBtn = document.getElementById('approve-schedule-btn');
  if (approveBtn) {
    approveBtn.addEventListener('click', () => {
      const schedule = getSchedule();
      if (schedule) {
        schedule.approvedAt = new Date().toISOString();
        // Clear remaining needsReview flags upon explicit caregiver approval
        if (schedule.medicines) {
          schedule.medicines.forEach(m => { m.needsReview = false; });
        }
        saveSchedule(schedule);
      }
      window.location.hash = '#/app';
    });
  }
}
