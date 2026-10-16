// Screen: Reading Prescription (Loading State)

export function renderReadingScreen() {
  return `
    <div class="flex flex-col relative w-full min-h-screen bg-surface items-center justify-center px-margin text-center">
      <div class="w-28 h-28 rounded-3xl bg-surface-container flex items-center justify-center text-primary mb-6 relative">
        <span class="material-symbols-outlined text-[54px] animate-pulse">document_scanner</span>
        <div class="absolute inset-0 rounded-3xl border-2 border-primary-container animate-ping opacity-30 pointer-events-none"></div>
      </div>

      <h1 class="font-headline-1 text-headline-1 text-on-surface mb-3">Reading prescription...</h1>
      <p class="font-body text-body text-secondary max-w-xs mb-8">
        Detecting medications, dosages, and schedules from your scanned sheet.
      </p>

      <a href="#/scan" class="h-12 px-8 rounded-2xl border border-card-border text-secondary hover:text-on-surface font-body-semibold inline-flex items-center justify-center transition-colors">
        Cancel
      </a>
    </div>
  `;
}

export function attachReadingListeners() {
  // Simulate OCR completion for foundation demo
  const timer = setTimeout(() => {
    if (window.location.hash.startsWith('#/reading')) {
      window.location.hash = '#/review';
    }
  }, 1600);

  window.addEventListener('hashchange', () => clearTimeout(timer), { once: true });
}
