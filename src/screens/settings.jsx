import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTextSize } from '../hooks/index.js';
import { clearAllData, resetMockData } from '../utils/storage.js';
import TopBar from '../components/TopBar.jsx';
import BottomNav from '../components/BottomNav.jsx';

export default function SettingsScreen() {
  const navigate = useNavigate();
  const { profile, updateProfile } = useTextSize();

  const [patientName, setPatientName] = useState(profile?.patientName || 'Ramesh');
  const [language, setLanguage] = useState(profile?.language || 'en');
  const [textScale, setTextScale] = useState(profile?.textScale || 'default');
  const [savedNotice, setSavedNotice] = useState(false);
  const [reloadedNotice, setReloadedNotice] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const handleSaveProfile = () => {
    updateProfile({
      patientName: patientName.trim() || 'Ramesh',
      language,
      textScale
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 1500);
  };

  const handleReloadSample = () => {
    resetMockData();
    setReloadedNotice(true);
    setTimeout(() => setReloadedNotice(false), 1500);
  };

  const handleConfirmDelete = () => {
    clearAllData();
    setDeleteModalOpen(false);
    navigate('/app');
  };

  return (
    <div className="bg-background font-body text-body text-on-surface min-h-screen flex flex-col">
      {/* Desktop Header */}
      <TopBar patientName={profile?.patientName || 'Ramesh'} activeSection="settings" />

      <div className="flex-1 flex flex-col relative w-full pt-safe lg:pt-24 pb-28">
        <div className="flex flex-col w-full max-w-[540px] mx-auto px-margin">
          <header className="flex items-center justify-between pt-4 pb-2">
            <div>
              <h1 className="font-headline-1 text-headline-1 text-on-surface">Settings</h1>
              <p className="font-caption text-caption text-secondary mt-1">
                Preferences and privacy control
              </p>
            </div>
            <Link
              to="/app"
              aria-label="Close settings"
              className="lg:hidden w-11 h-11 rounded-xl bg-surface-container flex items-center justify-center text-on-surface"
            >
              <span className="material-symbols-outlined text-[24px]">close</span>
            </Link>
          </header>

          <main className="mt-6 flex flex-col space-y-6">
            {/* Profile Settings Card */}
            <section className="bg-surface-container-lowest border border-card-border rounded-3xl p-5 shadow-sm space-y-4">
              <h2 className="font-headline-2 text-headline-2 text-on-surface">Patient Profile</h2>
              <div>
                <label
                  htmlFor="patient-name-input"
                  className="block font-caption-bold text-caption-bold text-secondary mb-1"
                >
                  Patient Name
                </label>
                <input
                  type="text"
                  id="patient-name-input"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-card-border bg-surface font-body text-body text-on-surface focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="language-select"
                  className="block font-caption-bold text-caption-bold text-secondary mb-1"
                >
                  Language
                </label>
                <select
                  id="language-select"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-card-border bg-surface font-body text-body text-on-surface focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                >
                  <option value="en">English</option>
                  <option value="hi">हिंदी (Hindi)</option>
                  <option value="mr">मराठी (Marathi)</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="text-scale-select"
                  className="block font-caption-bold text-caption-bold text-secondary mb-1"
                >
                  Text Size
                </label>
                <select
                  id="text-scale-select"
                  value={textScale}
                  onChange={(e) => setTextScale(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-card-border bg-surface font-body text-body text-on-surface focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                >
                  <option value="default">Default (18px body)</option>
                  <option value="large">Large (20px body)</option>
                  <option value="extra-large">Extra Large (22px body)</option>
                </select>
              </div>

              <button
                type="button"
                id="save-profile-btn"
                onClick={handleSaveProfile}
                className="w-full h-12 rounded-xl bg-primary text-on-primary font-body-semibold text-body-semibold hover:opacity-90 transition-opacity"
              >
                {savedNotice ? 'Saved!' : 'Save Profile'}
              </button>
            </section>

            {/* Data & Privacy Card */}
            <section className="bg-surface-container-lowest border border-card-border rounded-3xl p-5 shadow-sm space-y-4">
              <h2 className="font-headline-2 text-headline-2 text-on-surface">Data &amp; Privacy</h2>
              <p className="font-body text-body text-secondary">
                All prescription data and schedules are kept locally on your device. We never store
                photos on external servers.
              </p>

              <div className="pt-2 flex flex-col gap-3">
                <button
                  type="button"
                  id="reset-mock-btn"
                  onClick={handleReloadSample}
                  className="w-full h-12 rounded-xl border border-card-border text-on-surface font-body-semibold text-body-semibold hover:bg-surface-container transition-colors"
                >
                  {reloadedNotice ? 'Sample data reloaded!' : 'Reload Sample Data'}
                </button>

                <button
                  type="button"
                  id="delete-data-btn"
                  onClick={() => setDeleteModalOpen(true)}
                  className="w-full h-12 rounded-xl border border-error text-error font-body-semibold text-body-semibold hover:bg-error-container/20 transition-colors"
                >
                  Delete all my data
                </button>
              </div>
            </section>

            {/* App Info Card */}
            <section className="bg-surface-container-low border border-card-border/60 rounded-3xl p-5 text-center">
              <p className="font-headline-2 text-headline-2 text-on-surface font-semibold">
                Cura v1.0
              </p>
              <p className="font-caption text-caption text-secondary mt-1">
                A hackathon project. Not medical advice.
              </p>
            </section>
          </main>
        </div>
        <BottomNav activeRoute="settings" />
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div
          id="delete-modal"
          className="fixed inset-0 z-50 bg-inverse-surface/80 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div className="bg-surface-container-lowest rounded-3xl max-w-sm w-full p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-error-container text-error mx-auto flex items-center justify-center">
              <span className="material-symbols-outlined text-[32px]">warning</span>
            </div>
            <h3 className="font-headline-2 text-headline-2 text-on-surface">Delete all data?</h3>
            <p className="font-body text-body text-secondary">
              This will permanently erase all stored medicines, contacts, and dose logs from this
              device.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="flex-1 h-12 rounded-xl border border-card-border text-on-surface font-body-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 h-12 rounded-xl bg-error text-on-error font-body-semibold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
