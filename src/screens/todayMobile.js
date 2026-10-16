// Screen 01: Today (Mobile)
import { getProfile, getSchedule, getDoseLog, isDoseTaken, toggleDose, markSlotTaken, isSlotTaken } from '../utils/storage.js';
import { formatGreeting, formatHeaderDate, getCalendarStrip, toIsoDate, getCurrentDueSlot, SLOTS } from '../utils/dates.js';
import { renderBottomNav } from '../components/navigation.js';

export function renderTodayMobile() {
  const profile = getProfile();
  const schedule = getSchedule();
  const today = new Date();
  const todayIso = toIsoDate(today);
  const calendarStrip = getCalendarStrip(today);
  const currentSlotId = getCurrentDueSlot(today);
  const currentSlotDef = SLOTS.find(s => s.id === currentSlotId) || SLOTS[0];

  const medicines = schedule?.medicines || [];

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

  if (medicines.length === 0) {
    return `
      <div class="flex-1 flex flex-col relative w-full bg-surface pt-safe pb-28">
        <div class="flex flex-col w-full px-margin max-w-[390px] mx-auto min-h-[70vh] justify-center items-center text-center">
          <div class="w-20 h-20 rounded-3xl bg-surface-container flex items-center justify-center text-primary mb-space-md">
            <span class="material-symbols-outlined text-[40px]">calendar_today</span>
          </div>
          <h1 class="font-headline-1 text-headline-1 text-on-surface mb-2">No schedule yet</h1>
          <p class="font-body text-body text-secondary mb-8">Scan a paper prescription to set up your daily medicine schedule.</p>
          <a href="#/scan" class="w-full h-14 rounded-2xl bg-primary-container text-on-lime font-body-semibold text-body-semibold flex items-center justify-center shadow-sm hover:opacity-95 transition-opacity">
            Scan a prescription
          </a>
        </div>
        ${renderBottomNav('today')}
      </div>
    `;
  }

  return `
    <div class="flex-1 flex flex-col relative w-full bg-surface pt-safe pb-28">
      <div class="flex flex-col w-full px-margin max-w-[390px] mx-auto text-on-surface">
        <!-- Header Greeting -->
        <header class="flex flex-col pt-4">
          <h1 class="font-headline-1 text-headline-1 text-on-surface">
            ${formatGreeting(today, profile.patientName)}
          </h1>
          <p class="font-caption text-caption text-muted-text mt-1">
            ${formatHeaderDate(today)}
          </p>
        </header>

        <!-- Date Strip (5 Days) -->
        <section class="mt-6" aria-label="Weekly calendar view">
          <div class="flex justify-between items-center gap-2">
            ${calendarStrip.map(day => `
              <button type="button" 
                      class="flex-1 h-[68px] rounded-2xl flex flex-col items-center justify-center p-1 transition-colors min-w-[48px] ${
                        day.isToday 
                          ? 'bg-primary-container text-on-lime shadow-sm font-bold' 
                          : 'bg-surface-container-lowest border border-card-border text-on-surface active:bg-surface-container'
                      }">
                <span class="font-caption text-caption ${day.isToday ? 'text-on-lime font-bold' : 'text-muted-text'}">${day.dayName}</span>
                <span class="font-body-semibold text-body-semibold">${day.dayNumber}</span>
              </button>
            `).join('')}
          </div>
        </section>

        <!-- Time-of-Day Medication Schedule -->
        <div class="flex flex-col mt-6 space-y-6">
          ${slotGroups.map(group => {
            const isCurrentSlot = group.id === currentSlotId;
            return `
              <section class="flex flex-col" aria-labelledby="heading-${group.id}">
                <div class="flex items-center justify-between mb-3">
                  <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-[24px] ${isCurrentSlot ? 'text-primary' : 'text-on-surface'}">${group.icon}</span>
                    <h2 id="heading-${group.id}" class="font-headline-2 text-headline-2 text-on-surface">${group.label}</h2>
                    ${isCurrentSlot ? '<span class="text-[12px] bg-surface-container px-2 py-0.5 rounded-full text-primary font-caption-bold">Current</span>' : ''}
                  </div>
                  <span class="font-caption text-caption text-muted-text">${group.time}</span>
                </div>

                ${group.medicines.length === 0 ? `
                  <div class="bg-surface-container-lowest rounded-3xl border border-card-border p-5 shadow-sm flex items-center">
                    <span class="font-body text-body text-muted-text">Nothing to take</span>
                  </div>
                ` : `
                  <div class="flex flex-col space-y-3">
                    ${group.medicines.map(med => {
                      const taken = isDoseTaken(todayIso, group.id, med.id);
                      return `
                        <div class="bg-surface-container-lowest rounded-3xl border ${taken ? 'border-primary/40 bg-surface-container-low/40' : 'border-card-border'} p-5 shadow-sm flex items-center justify-between gap-4">
                          <button type="button"
                                  aria-label="Mark ${med.name} ${med.strength} as ${taken ? 'not taken' : 'taken'}" 
                                  class="dose-checkbox w-11 h-11 rounded-full border-2 ${
                                    taken ? 'bg-primary-container border-primary-container text-on-lime' : 'bg-surface-container-lowest border-card-border text-transparent'
                                  } flex items-center justify-center flex-shrink-0 transition-colors focus-visible:ring-2 focus-visible:ring-primary"
                                  data-slot="${group.id}" 
                                  data-med="${med.id}">
                            <span class="material-symbols-outlined text-[22px] font-bold ${taken ? 'block' : 'hidden'}">check</span>
                          </button>
                          
                          <a href="#/app/med/${med.id}" class="flex flex-col min-w-0 flex-1 hover:opacity-85 transition-opacity" aria-label="View details for ${med.name}">
                            <span class="font-body-semibold text-body-semibold text-on-surface truncate ${taken ? 'line-through opacity-70' : ''}">${med.name} ${med.strength}</span>
                            <span class="font-caption text-caption text-muted-text">${med.food || 'Prescribed dose'}</span>
                          </a>

                          <a href="#/app/med/${med.id}" aria-label="View medication" class="text-secondary hover:text-on-surface p-2">
                            <span class="material-symbols-outlined text-[20px]">chevron_right</span>
                          </a>
                        </div>
                      `;
                    }).join('')}
                  </div>
                `}
              </section>
            `;
          }).join('')}
        </div>

        <!-- Primary Bottom Action Sticky Clearance -->
        <div class="pt-8 pb-4 w-full">
          <button type="button" 
                  id="main-action-btn"
                  ${isDueGroupCompleted ? 'disabled' : ''}
                  class="w-full h-14 rounded-2xl ${
                    isDueGroupCompleted 
                      ? 'bg-surface-container text-secondary cursor-not-allowed' 
                      : 'bg-primary-container text-on-lime active:bg-primary-container/90 shadow-sm'
                  } font-body-semibold text-body-semibold flex items-center justify-center transition-colors">
            ${isDueGroupCompleted ? 'All done for now' : 'I took it'}
          </button>
        </div>
      </div>

      <!-- Mobile Bottom Navigation -->
      ${renderBottomNav('today')}
    </div>
  `;
}

export function attachTodayListeners() {
  const todayIso = toIsoDate(new Date());
  const checkboxes = document.querySelectorAll('.dose-checkbox');
  checkboxes.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const slotId = btn.getAttribute('data-slot');
      const medId = btn.getAttribute('data-med');
      toggleDose(todayIso, slotId, medId);
      window.dispatchEvent(new CustomEvent('cura-state-changed'));
    });
  });

  const mainActionBtn = document.getElementById('main-action-btn');
  if (mainActionBtn && !mainActionBtn.disabled) {
    mainActionBtn.addEventListener('click', () => {
      const schedule = getSchedule();
      const currentSlotId = getCurrentDueSlot(new Date());
      const medsInSlot = (schedule?.medicines || []).filter(m => m.slots && m.slots.includes(currentSlotId));
      
      // Mark ONLY the current slot as taken
      markSlotTaken(todayIso, currentSlotId, medsInSlot);
      
      // Route directly to confirmed screen with current slot context
      window.location.hash = `#/confirmed?slot=${currentSlotId}`;
    });
  }
}
