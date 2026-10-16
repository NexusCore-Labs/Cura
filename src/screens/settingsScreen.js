// Stub Screen: Settings (Mobile/Desktop)
import { getProfile, saveProfile, clearAllData, resetMockData } from '../utils/storage.js';
import { renderBottomNav, renderDesktopHeader } from '../components/navigation.js';

export function renderSettingsScreen() {
  const profile = getProfile();

  return `
    <div class="bg-background font-body text-body text-on-surface min-h-screen flex flex-col">
      <!-- Desktop Header -->
      ${renderDesktopHeader(profile.patientName || 'Ramesh', 'settings')}

      <div class="flex-1 flex flex-col relative w-full pt-safe lg:pt-24 pb-28">
        <div class="flex flex-col w-full max-w-[540px] mx-auto px-margin">
          <header class="flex items-center justify-between pt-4 pb-2">
            <div>
              <h1 class="font-headline-1 text-headline-1 text-on-surface">Settings</h1>
              <p class="font-caption text-caption text-secondary mt-1">Preferences and privacy control</p>
            </div>
            <a href="#/app" class="lg:hidden w-11 h-11 rounded-xl bg-surface-container flex items-center justify-center text-on-surface">
              <span class="material-symbols-outlined text-[24px]">close</span>
            </a>
          </header>

          <main class="mt-6 flex flex-col space-y-6">
            <!-- Profile Settings Card -->
            <section class="bg-surface-container-lowest border border-card-border rounded-3xl p-5 shadow-sm space-y-4">
              <h2 class="font-headline-2 text-headline-2 text-on-surface">Patient Profile</h2>
              <div>
                <label for="patient-name-input" class="block font-caption-bold text-caption-bold text-secondary mb-1">Patient Name</label>
                <input type="text" id="patient-name-input" value="${profile.patientName || 'Ramesh'}" class="w-full h-12 px-4 rounded-xl border border-card-border bg-surface font-body text-body text-on-surface focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none" />
              </div>

              <div>
                <label for="language-select" class="block font-caption-bold text-caption-bold text-secondary mb-1">Language</label>
                <select id="language-select" class="w-full h-12 px-4 rounded-xl border border-card-border bg-surface font-body text-body text-on-surface focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none">
                  <option value="en" ${profile.language === 'en' ? 'selected' : ''}>English</option>
                  <option value="hi" ${profile.language === 'hi' ? 'selected' : ''}>हिंदी (Hindi)</option>
                  <option value="mr" ${profile.language === 'mr' ? 'selected' : ''}>मराठी (Marathi)</option>
                </select>
              </div>

              <div>
                <label for="text-scale-select" class="block font-caption-bold text-caption-bold text-secondary mb-1">Text Size</label>
                <select id="text-scale-select" class="w-full h-12 px-4 rounded-xl border border-card-border bg-surface font-body text-body text-on-surface focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none">
                  <option value="default" ${profile.textScale === 'default' ? 'selected' : ''}>Default (18px body)</option>
                  <option value="large" ${profile.textScale === 'large' ? 'selected' : ''}>Large (20px body)</option>
                  <option value="extra-large" ${profile.textScale === 'extra-large' ? 'selected' : ''}>Extra Large (22px body)</option>
                </select>
              </div>

              <button type="button" id="save-profile-btn" class="w-full h-12 rounded-xl bg-primary text-on-primary font-body-semibold text-body-semibold hover:opacity-90 transition-opacity">
                Save Profile
              </button>
            </section>

            <!-- Data & Privacy Card -->
            <section class="bg-surface-container-lowest border border-card-border rounded-3xl p-5 shadow-sm space-y-4">
              <h2 class="font-headline-2 text-headline-2 text-on-surface">Data & Privacy</h2>
              <p class="font-body text-body text-secondary">
                All prescription data and schedules are kept locally on your device. We never store photos on external servers.
              </p>

              <div class="pt-2 flex flex-col gap-3">
                <button type="button" id="reset-mock-btn" class="w-full h-12 rounded-xl border border-card-border text-on-surface font-body-semibold text-body-semibold hover:bg-surface-container transition-colors">
                  Reload Sample Data
                </button>

                <button type="button" id="delete-data-btn" class="w-full h-12 rounded-xl border border-error text-error font-body-semibold text-body-semibold hover:bg-error-container/20 transition-colors">
                  Delete all my data
                </button>
              </div>
            </section>

            <!-- App Info Card -->
            <section class="bg-surface-container-low border border-card-border/60 rounded-3xl p-5 text-center">
              <p class="font-headline-2 text-headline-2 text-on-surface font-semibold">Cura v1.0</p>
              <p class="font-caption text-caption text-secondary mt-1">A hackathon project. Not medical advice.</p>
            </section>
          </main>
        </div>
        ${renderBottomNav('settings')}
      </div>

      <!-- Delete Confirmation Modal -->
      <div id="delete-modal" class="hidden fixed inset-0 z-50 bg-inverse-surface/80 backdrop-blur-md flex items-center justify-center p-4">
        <div class="bg-surface-container-lowest rounded-3xl max-w-sm w-full p-6 text-center space-y-4">
          <div class="w-14 h-14 rounded-full bg-error-container text-error mx-auto flex items-center justify-center">
            <span class="material-symbols-outlined text-[32px]">warning</span>
          </div>
          <h3 class="font-headline-2 text-headline-2 text-on-surface">Delete all data?</h3>
          <p class="font-body text-body text-secondary">
            This will permanently erase all stored medicines, contacts, and dose logs from this device.
          </p>
          <div class="flex gap-3 pt-2">
            <button type="button" id="cancel-delete-btn" class="flex-1 h-12 rounded-xl border border-card-border text-on-surface font-body-semibold">
              Cancel
            </button>
            <button type="button" id="confirm-delete-btn" class="flex-1 h-12 rounded-xl bg-error text-on-error font-body-semibold">
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function attachSettingsListeners() {
  const saveBtn = document.getElementById('save-profile-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const name = document.getElementById('patient-name-input')?.value;
      const lang = document.getElementById('language-select')?.value;
      const textScale = document.getElementById('text-scale-select')?.value;
      
      const profile = getProfile();
      profile.patientName = name || 'Ramesh';
      profile.language = lang || 'en';
      profile.textScale = textScale || 'default';
      saveProfile(profile);

      // Apply root rem scaling
      if (textScale === 'large') {
        document.documentElement.style.fontSize = '18px';
      } else if (textScale === 'extra-large') {
        document.documentElement.style.fontSize = '20px';
      } else {
        document.documentElement.style.fontSize = '16px';
      }

      saveBtn.textContent = 'Saved!';
      setTimeout(() => { saveBtn.textContent = 'Save Profile'; }, 1500);
      window.dispatchEvent(new CustomEvent('cura-state-changed'));
    });
  }

  const deleteBtn = document.getElementById('delete-data-btn');
  const deleteModal = document.getElementById('delete-modal');
  const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
  const confirmDeleteBtn = document.getElementById('confirm-delete-btn');

  if (deleteBtn && deleteModal) {
    deleteBtn.addEventListener('click', () => deleteModal.classList.remove('hidden'));
    cancelDeleteBtn?.addEventListener('click', () => deleteModal.classList.add('hidden'));
    confirmDeleteBtn?.addEventListener('click', () => {
      clearAllData();
      deleteModal.classList.add('hidden');
      window.location.hash = '#/app';
    });
  }

  const resetMockBtn = document.getElementById('reset-mock-btn');
  if (resetMockBtn) {
    resetMockBtn.addEventListener('click', () => {
      resetMockData();
      resetMockBtn.textContent = 'Sample data reloaded!';
      setTimeout(() => { resetMockBtn.textContent = 'Reload Sample Data'; }, 1500);
      window.dispatchEvent(new CustomEvent('cura-state-changed'));
    });
  }
}
