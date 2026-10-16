// Hash Router for Cura
import { renderTodayMobile, attachTodayListeners } from './screens/todayMobile.js';
import { renderTwoPaneDesktop, attachTwoPaneListeners } from './screens/twoPaneDesktop.js';
import { renderMedicineDetail, attachMedicineDetailListeners } from './screens/medicineDetail.js';
import { renderReviewSchedule, attachReviewListeners } from './screens/reviewSchedule.js';
import { renderCameraScanner, attachCameraListeners } from './screens/cameraScanner.js';
import { renderConfirmed, attachConfirmedListeners } from './screens/confirmed.js';
import { renderLandingDesktop } from './screens/landingDesktop.js';
import { renderHistoryScreen } from './screens/historyScreen.js';
import { renderSettingsScreen, attachSettingsListeners } from './screens/settingsScreen.js';
import { renderContactsScreen, attachContactsListeners } from './screens/contactsScreen.js';
import { renderReadingScreen, attachReadingListeners } from './screens/readingScreen.js';

export function parseHash() {
  const rawHash = window.location.hash.slice(1) || '/';
  const [path, queryString] = rawHash.split('?');
  const params = new URLSearchParams(queryString || '');
  return { path, params };
}

export function announceRoute(message) {
  const el = document.getElementById('aria-status');
  if (el) {
    el.textContent = message;
  }
}

export function navigate() {
  const appContainer = document.getElementById('app');
  if (!appContainer) return;

  const { path, params } = parseHash();
  const isDesktop = window.innerWidth >= 1024;

  // Scroll to top on route change
  window.scrollTo(0, 0);

  // Route 1: Landing Page
  if (path === '/' || path === '') {
    appContainer.innerHTML = renderLandingDesktop();
    announceRoute('Home landing page loaded');
    return;
  }

  // Route 2: App Today / Two-Pane
  if (path === '/app') {
    const selectedMedId = params.get('med');
    if (isDesktop) {
      appContainer.innerHTML = renderTwoPaneDesktop(selectedMedId);
      attachTwoPaneListeners();
      announceRoute('Today schedule loaded in two-pane desktop view');
    } else {
      appContainer.innerHTML = renderTodayMobile();
      attachTodayListeners();
      announceRoute('Today schedule loaded in mobile view');
    }
    return;
  }

  // Route 3: Medicine Detail
  if (path.startsWith('/app/med/')) {
    const medId = path.replace('/app/med/', '');
    if (isDesktop) {
      appContainer.innerHTML = renderTwoPaneDesktop(medId);
      attachTwoPaneListeners();
      announceRoute(`Showing details for medicine in desktop view`);
    } else {
      appContainer.innerHTML = renderMedicineDetail(medId);
      attachMedicineDetailListeners();
      announceRoute('Showing medicine details');
    }
    return;
  }

  // Route 4: Scan Camera
  if (path === '/scan') {
    appContainer.innerHTML = renderCameraScanner();
    attachCameraListeners();
    announceRoute('Prescription camera scanner loaded');
    return;
  }

  // Route 5: Reading Loading State
  if (path === '/reading') {
    appContainer.innerHTML = renderReadingScreen();
    attachReadingListeners();
    announceRoute('Reading prescription document');
    return;
  }

  // Route 6: Review Schedule
  if (path === '/review') {
    appContainer.innerHTML = renderReviewSchedule();
    attachReviewListeners();
    announceRoute('Review schedule loaded');
    return;
  }

  // Route 7: Confirmed Dose Recorded
  if (path === '/confirmed') {
    const slot = params.get('slot');
    appContainer.innerHTML = renderConfirmed(slot);
    attachConfirmedListeners();
    announceRoute('Dose recorded successfully. Notification confirmation view.');
    return;
  }

  // Route 8: History
  if (path === '/history') {
    appContainer.innerHTML = renderHistoryScreen();
    announceRoute('Dose history loaded');
    return;
  }

  // Route 9: Settings
  if (path === '/settings') {
    appContainer.innerHTML = renderSettingsScreen();
    attachSettingsListeners();
    announceRoute('Settings loaded');
    return;
  }

  // Route 10: Contacts
  if (path === '/contacts') {
    appContainer.innerHTML = renderContactsScreen();
    attachContactsListeners();
    announceRoute('Caregiver contacts loaded');
    return;
  }

  // Fallback to /app
  window.location.hash = '#/app';
}

export function initRouter() {
  window.addEventListener('hashchange', navigate);
  window.addEventListener('resize', () => {
    // Re-render when crossing the 1024px desktop breakpoint
    navigate();
  });
  window.addEventListener('cura-state-changed', () => {
    navigate();
  });
  navigate();
}
