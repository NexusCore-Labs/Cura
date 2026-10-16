// Navigation component for Cura (Mobile Bottom Navigation & Desktop App Header)

export function renderBottomNav(activeRoute = 'today') {
  const items = [
    { route: 'today', hash: '#/app', label: 'Today', icon: 'calendar_today' },
    { route: 'scan', hash: '#/scan', label: 'Scan', icon: 'document_scanner' },
    { route: 'history', hash: '#/history', label: 'History', icon: 'history' },
    { route: 'settings', hash: '#/settings', label: 'Settings', icon: 'settings' }
  ];

  return `
    <nav aria-label="Bottom Navigation" class="lg:hidden fixed bottom-0 inset-x-0 z-50 pb-safe bg-surface-container-lowest/95 backdrop-blur-xl border-t border-card-border shadow-[0_-1px_12px_rgba(23,29,24,0.04)]">
      <div class="flex justify-around items-center h-20 px-space-xs max-w-[390px] mx-auto">
        ${items.map(item => {
          const isActive = activeRoute === item.route;
          return `
            <a href="${item.hash}" 
               aria-current="${isActive ? 'page' : 'false'}" 
               class="flex flex-col items-center justify-center gap-1 min-w-[48px] min-h-[48px] px-3 py-1.5 transition-colors relative ${
                 isActive ? 'text-on-surface font-caption-bold' : 'text-secondary hover:text-on-surface font-caption'
               }">
              <span class="material-symbols-outlined text-[24px]">${item.icon}</span>
              <span class="text-caption leading-none">${item.label}</span>
              ${isActive ? '<span class="w-1.5 h-1.5 rounded-full bg-primary-container absolute bottom-1"></span>' : ''}
            </a>
          `;
        }).join('')}
      </div>
    </nav>
  `;
}

export function renderDesktopHeader(patientName = 'Ramesh', activeSection = 'today') {
  return `
    <header class="hidden lg:block fixed top-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-xl border-b border-card-border shadow-sm">
      <div class="h-20 w-full max-w-[1440px] mx-auto px-margin flex items-center justify-between">
        <div class="flex items-center gap-space-lg">
          <a href="#/app" class="flex items-center gap-space-sm group focus-visible:ring-2 focus-visible:ring-primary rounded-xl p-1">
            <div class="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center text-on-lime">
              <span class="material-symbols-outlined text-[24px]">medication</span>
            </div>
            <span class="font-headline-2 text-headline-2 text-on-surface font-bold tracking-tight">Cura</span>
          </a>
          <div class="h-6 w-px bg-outline-variant"></div>
          <nav class="flex items-center gap-space-md" aria-label="Desktop Primary Navigation">
            <a href="#/app" class="px-3 py-1.5 rounded-xl font-body-semibold text-body-semibold ${activeSection === 'today' ? 'text-primary font-bold bg-surface-container' : 'text-secondary hover:text-on-surface'} transition-colors">Today</a>
            <a href="#/scan" class="px-3 py-1.5 rounded-xl font-body-semibold text-body-semibold ${activeSection === 'scan' ? 'text-primary font-bold bg-surface-container' : 'text-secondary hover:text-on-surface'} transition-colors">Scan Prescription</a>
            <a href="#/history" class="px-3 py-1.5 rounded-xl font-body-semibold text-body-semibold ${activeSection === 'history' ? 'text-primary font-bold bg-surface-container' : 'text-secondary hover:text-on-surface'} transition-colors">History</a>
            <a href="#/contacts" class="px-3 py-1.5 rounded-xl font-body-semibold text-body-semibold ${activeSection === 'contacts' ? 'text-primary font-bold bg-surface-container' : 'text-secondary hover:text-on-surface'} transition-colors">Contacts</a>
            <a href="#/settings" class="px-3 py-1.5 rounded-xl font-body-semibold text-body-semibold ${activeSection === 'settings' ? 'text-primary font-bold bg-surface-container' : 'text-secondary hover:text-on-surface'} transition-colors">Settings</a>
          </nav>
        </div>
        <div class="flex items-center gap-space-md">
          <div class="flex items-center gap-space-xs bg-surface-container px-space-sm py-space-xs rounded-full">
            <span class="material-symbols-outlined text-primary text-[20px]">verified_user</span>
            <span class="font-caption-bold text-caption-bold text-on-surface">${patientName} (Patient)</span>
          </div>
          <a href="#/settings" aria-label="Patient Profile Settings" class="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-on-primary hover:opacity-90 transition-opacity">
            <span class="material-symbols-outlined text-[18px]">person</span>
          </a>
        </div>
      </div>
    </header>
  `;
}
