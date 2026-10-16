import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { stopSpeech } from './utils/audio.js';
import { useTextSize } from './hooks/useTextSize.js';
import { getProfile } from './utils/storage.js';

import LandingDesktopScreen from './screens/landingDesktop.jsx';
import TodayScreen from './screens/today.jsx';
import TwoPaneAppScreen from './screens/twoPaneApp.jsx';
import MedicineDetailScreen from './screens/medicineDetail.jsx';
import CameraScannerScreen from './screens/cameraScanner.jsx';
import ReadingScreen from './screens/reading.jsx';
import ReviewScheduleScreen from './screens/reviewSchedule.jsx';
import ConfirmedScreen from './screens/confirmed.jsx';
import HistoryScreen from './screens/history.jsx';
import SettingsScreen from './screens/settings.jsx';
import ContactsScreen from './screens/contacts.jsx';

/**
 * Cura needs the user's details (and the patient's meal routine) before any dose
 * schedule makes sense, so every app route waits for setup to be finished.
 */
function RequireSetup({ children }) {
  const location = useLocation();
  const profile = getProfile();

  if (!profile?.onboarded) {
    return <Navigate to="/" replace state={{ needsSetup: true, from: location.pathname }} />;
  }
  return children;
}

function RouteEffects({ isDesktop }) {
  const location = useLocation();
  useTextSize();

  useEffect(() => {
    window.scrollTo(0, 0);
    stopSpeech();

    const ariaEl = document.getElementById('aria-status');
    if (!ariaEl) return;

    const p = location.pathname;
    if (p === '/') ariaEl.textContent = 'Home landing page loaded';
    else if (p === '/app') {
      ariaEl.textContent = isDesktop
        ? 'Today schedule loaded in two-pane desktop view'
        : 'Today schedule loaded in mobile view';
    } else if (p.startsWith('/app/med/')) {
      ariaEl.textContent = isDesktop
        ? 'Showing details for medicine in desktop view'
        : 'Showing medicine details';
    } else if (p === '/scan') ariaEl.textContent = 'Prescription camera scanner loaded';
    else if (p === '/reading') ariaEl.textContent = 'Reading prescription document';
    else if (p === '/review') ariaEl.textContent = 'Review schedule loaded';
    else if (p === '/confirmed') {
      ariaEl.textContent = 'Dose recorded successfully. Notification confirmation view.';
    } else if (p === '/history') ariaEl.textContent = 'Dose history loaded';
    else if (p === '/settings') ariaEl.textContent = 'Settings loaded';
    else if (p === '/contacts') ariaEl.textContent = 'Caregiver contacts loaded';
  }, [location.pathname, location.search, isDesktop]);

  return null;
}

export default function App() {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <HashRouter>
      <RouteEffects isDesktop={isDesktop} />
      <Routes>
        <Route path="/" element={<LandingDesktopScreen />} />
        <Route
          path="/app"
          element={
            <RequireSetup>{isDesktop ? <TwoPaneAppScreen /> : <TodayScreen />}</RequireSetup>
          }
        />
        <Route
          path="/app/med/:id"
          element={
            <RequireSetup>              {isDesktop ? <TwoPaneAppScreen /> : <MedicineDetailScreen />}
            </RequireSetup>
          }
        />
        <Route
          path="/scan"
          element={
            <RequireSetup>
              <CameraScannerScreen />
            </RequireSetup>
          }
        />
        <Route
          path="/reading"
          element={
            <RequireSetup>
              <ReadingScreen />
            </RequireSetup>
          }
        />
        <Route
          path="/review"
          element={
            <RequireSetup>
              <ReviewScheduleScreen />
            </RequireSetup>
          }
        />
        <Route
          path="/confirmed"
          element={
            <RequireSetup>
              <ConfirmedScreen />
            </RequireSetup>
          }
        />
        <Route
          path="/history"
          element={
            <RequireSetup>
              <HistoryScreen />
            </RequireSetup>
          }
        />
        <Route
          path="/settings"
          element={
            <RequireSetup>
              <SettingsScreen />
            </RequireSetup>
          }
        />
        <Route
          path="/contacts"
          element={
            <RequireSetup>
              <ContactsScreen />
            </RequireSetup>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
