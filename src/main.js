// Cura Entrypoint
import './style.css';
import { initStorage, getProfile } from './utils/storage.js';
import { initRouter } from './router.js';

function initApp() {
  // Initialize mock data in localStorage
  initStorage();

  // Apply persisted text scaling preference
  const profile = getProfile();
  if (profile?.textScale === 'large') {
    document.documentElement.style.fontSize = '18px';
  } else if (profile?.textScale === 'extra-large') {
    document.documentElement.style.fontSize = '20px';
  } else {
    document.documentElement.style.fontSize = '16px';
  }

  // Start the hash router
  initRouter();
}

document.addEventListener('DOMContentLoaded', initApp);
