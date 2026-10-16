import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { stopSpeech } from './utils/audio.js';
import { useTextSize } from './hooks/useTextSize.js';

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
          element={isDesktop ? <TwoPaneAppScreen /> : <TodayScreen />}
        />
        <Route
          path="/app/med/:id"
          element={isDesktop ? <TwoPaneAppScreen /> : <MedicineDetailScreen />}
        />
        <Route path="/scan" element={<CameraScannerScreen />} />
        <Route path="/reading" element={<ReadingScreen />} />
        <Route path="/review" element={<ReviewScheduleScreen />} />
        <Route path="/confirmed" element={<ConfirmedScreen />} />
        <Route path="/history" element={<HistoryScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />
        <Route path="/contacts" element={<ContactsScreen />} />
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Routes>
    </HashRouter>
  );
}
