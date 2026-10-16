// Screen 05: Confirmed (Mobile/Desktop)
import { getProfile, getContacts, getSchedule } from '../utils/storage.js';
import { SLOTS, formatTimeString, getCurrentDueSlot } from '../utils/dates.js';

export function renderConfirmed(selectedSlotId) {
  const profile = getProfile();
  const contacts = getContacts();
  const primaryContact = contacts[0] || { name: 'Family', phone: '' };

  const currentSlotId = selectedSlotId || getCurrentDueSlot(new Date());
  const slotDef = SLOTS.find(s => s.id === currentSlotId) || SLOTS[0];
  const now = new Date();
  const timeFormatted = formatTimeString(now);

  // Message strictly computed from stored profile & slot time
  const messageBody = `${profile.patientName || 'Patient'} took the ${slotDef.time} medicines.`;

  return `
    <div class="flex flex-col relative w-full min-h-screen bg-surface">
      <div class="flex flex-col w-full max-w-[390px] mx-auto px-margin pt-safe pb-safe min-h-screen justify-between">
        <!-- Top Status Area -->
        <div class="flex flex-col items-center pt-space-lg pb-space-md text-center">
          <div class="w-36 h-36 mx-auto flex items-center justify-center mb-space-sm relative">
            <!-- Lime glow circle -->
            <div class="w-28 h-28 rounded-full bg-primary-container/25 flex items-center justify-center animate-pulse">
              <div class="w-20 h-20 rounded-full bg-primary-container flex items-center justify-center text-on-lime shadow-md">
                <span class="material-symbols-outlined text-[44px] font-bold">check</span>
              </div>
            </div>
          </div>

          <h1 class="font-headline-1 text-headline-1 text-on-surface text-center mb-space-xs">
            Well done, ${profile.patientName || 'Ramesh'}!
          </h1>
          <p class="font-body text-body text-secondary text-center max-w-[280px]">
            Your ${slotDef.label.toLowerCase()} doses are all recorded.
          </p>
        </div>

        <!-- WhatsApp Message Preview Card -->
        <div class="my-space-md">
          <div class="bg-surface-container-lowest rounded-3xl p-space-md border border-card-border shadow-sm flex flex-col gap-space-sm">
            <div class="flex items-center gap-space-xs text-secondary">
              <span class="material-symbols-outlined text-[20px]">forum</span>
              <span class="font-caption-bold text-caption-bold">
                Preview message for ${primaryContact.name}
              </span>
            </div>

            <div class="bg-surface-container-low rounded-2xl rounded-tr-sm p-space-sm flex flex-col gap-1 border border-card-border/40">
              <p class="font-body-semibold text-body-semibold text-on-surface">
                ${messageBody}
              </p>
              <div class="flex items-center justify-end gap-1 text-secondary">
                <span class="font-caption text-caption text-secondary">
                  Today, ${timeFormatted}
                </span>
                <span class="material-symbols-outlined text-[18px] text-primary">
                  done_all
                </span>
              </div>
            </div>
          </div>
          <p class="font-caption text-caption text-muted-text text-center mt-2">
            WhatsApp will open. Tap Send.
          </p>
        </div>

        <!-- Bottom Actions (Single Primary Lime Button) -->
        <div class="flex flex-col items-center gap-space-sm pb-space-lg w-full">
          <button type="button" 
                  id="send-whatsapp-btn"
                  class="w-full h-14 rounded-2xl bg-primary-container text-on-lime flex items-center justify-center gap-space-xs font-body-semibold text-body-semibold shadow-sm hover:opacity-95 active:scale-[0.99] transition-all focus-visible:ring-2 focus-visible:ring-primary">
            <span class="material-symbols-outlined text-[24px]">chat</span>
            <span>Send to ${primaryContact.name} on WhatsApp</span>
          </button>

          <a href="#/app" class="min-h-[48px] px-space-md flex items-center justify-center font-body text-body text-secondary hover:text-on-surface transition-colors focus-visible:ring-2 focus-visible:ring-primary rounded-xl">
            Skip
          </a>
        </div>
      </div>
    </div>
  `;
}

export function attachConfirmedListeners() {
  const sendBtn = document.getElementById('send-whatsapp-btn');
  if (sendBtn) {
    sendBtn.addEventListener('click', () => {
      const contacts = getContacts();
      const profile = getProfile();
      const primaryContact = contacts[0];
      const slotDef = SLOTS.find(s => s.id === getCurrentDueSlot(new Date())) || SLOTS[0];
      const message = `${profile.patientName || 'Patient'} took the ${slotDef.time} medicines.`;
      
      const phoneDigits = (primaryContact?.phone || '').replace(/\D/g, '');
      const encodedMsg = encodeURIComponent(message);
      
      if (phoneDigits) {
        window.open(`https://wa.me/${phoneDigits}?text=${encodedMsg}`, '_blank');
      } else {
        window.location.hash = '#/contacts';
      }
    });
  }
}
