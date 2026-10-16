// Stub Screen: Contacts (Mobile/Desktop)
import { getContacts, saveContacts } from '../utils/storage.js';
import { renderBottomNav, renderDesktopHeader } from '../components/navigation.js';

export function renderContactsScreen() {
  const contacts = getContacts();
  const maxReached = contacts.length >= 3;

  return `
    <div class="bg-background font-body text-body text-on-surface min-h-screen flex flex-col">
      ${renderDesktopHeader('Ramesh', 'contacts')}

      <div class="flex-1 flex flex-col relative w-full pt-safe lg:pt-24 pb-28">
        <div class="flex flex-col w-full max-w-[540px] mx-auto px-margin">
          <header class="flex items-center justify-between pt-4 pb-2">
            <div>
              <h1 class="font-headline-1 text-headline-1 text-on-surface">Caregiver Contacts</h1>
              <p class="font-caption text-caption text-secondary mt-1">People notified when doses are taken (Max 3)</p>
            </div>
            <a href="#/app" class="lg:hidden w-11 h-11 rounded-xl bg-surface-container flex items-center justify-center text-on-surface">
              <span class="material-symbols-outlined text-[24px]">close</span>
            </a>
          </header>

          <main class="mt-6 flex flex-col space-y-4">
            ${contacts.map(c => `
              <div class="bg-surface-container-lowest border border-card-border rounded-3xl p-5 shadow-sm flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 rounded-2xl bg-primary-container/20 flex items-center justify-center text-primary">
                    <span class="material-symbols-outlined text-[24px]">person</span>
                  </div>
                  <div>
                    <h2 class="font-headline-2 text-[20px] text-on-surface font-semibold">${c.name}</h2>
                    <p class="font-caption text-caption text-secondary">${c.relation} • +${c.phone}</p>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-primary material-symbols-outlined text-[20px]" title="WhatsApp ready">chat</span>
                </div>
              </div>
            `).join('')}

            ${maxReached ? `
              <div class="p-4 rounded-2xl bg-surface-container-low border border-card-border/60 text-center">
                <span class="font-caption text-caption text-secondary">Contact limit reached (3 of 3). Remove one to add another.</span>
              </div>
            ` : `
              <button type="button" id="add-contact-btn" class="w-full h-14 rounded-2xl border-2 border-dashed border-card-border hover:border-primary text-secondary hover:text-primary font-body-semibold text-body-semibold flex items-center justify-center gap-2 transition-colors">
                <span class="material-symbols-outlined text-[22px]">add</span>
                <span>Add Contact</span>
              </button>
            `}
          </main>
        </div>
        ${renderBottomNav('today')}
      </div>
    </div>
  `;
}

export function attachContactsListeners() {
  const addBtn = document.getElementById('add-contact-btn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      const contacts = getContacts();
      if (contacts.length < 3) {
        contacts.push({
          id: `c-${Date.now()}`,
          name: 'Caregiver',
          relation: 'Family',
          phone: '919876543211'
        });
        saveContacts(contacts);
        window.dispatchEvent(new CustomEvent('cura-state-changed'));
      }
    });
  }
}
