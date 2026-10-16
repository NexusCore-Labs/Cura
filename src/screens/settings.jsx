import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTextSize } from '../hooks/index.js';
import { clearAllData, resetMockData } from '../utils/storage.js';
import TopBar from '../components/TopBar.jsx';
import BottomNav from '../components/BottomNav.jsx';
import UserInfoDialog from '../components/UserInfoDialog.jsx';
import { describeMealRoutine, getSlotsForProfile } from '../utils/dates.js';

export default function SettingsScreen() {
  const navigate = useNavigate();
  const { profile, updateProfile } = useTextSize();

  const [patientName, setPatientName] = useState(profile?.patientName || 'Ramesh');
  const [textScale, setTextScale] = useState(profile?.textScale || 'default');
  const [savedNotice, setSavedNotice] = useState(false);
  const [reloadedNotice, setReloadedNotice] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const isCaretaker = profile?.role === 'caretaker';

  // Dose times follow the routine saved in "Your details".
  const slots = getSlotsForProfile(profile);

  // Keep the inline fields in sync when details are edited in the dialog.
  useEffect(() => {
    setPatientName(profile?.patientName || 'Ramesh');
    setTextScale(profile?.textScale || 'default');
  }, [profile?.patientName, profile?.textScale]);

  const handleSaveProfile = () => {
    const nextName = patientName.trim() || 'Ramesh';
    updateProfile({
      patientName: nextName,
      // A patient's own name is the patient name; a caretaker keeps their own name.
      ...(isCaretaker ? {} : { userName: nextName }),
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
    // Data is gone, so setup starts over from the landing page.
    navigate('/');
  };

  return (
    <div className="bg-background font-body text-body text-on-surface min-h-screen flex flex-col">
      {/* Desktop Header */}
      <TopBar
        patientName={profile?.patientName || 'Ramesh'}
        role={profile?.role}
        activeSection="settings"
      />

      <div className="flex-1 flex flex-col relative w-full pt-safe lg:pt-24 pb-28">
        <div className="flex flex-col w-full max-w-[540px] mx-auto px-margin">
          <header className="flex items-center justify-between pt-4 pb-2">
            <div>
              <h1 className="font-headline-1 text-headline-1 text-on-surface">Settings</h1>
              <p className="font-caption text-caption text-muted-text mt-1">
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
            {/* Your Details Card */}
            <section className="bg-surface-container-lowest border border-card-border rounded-3xl p-5 shadow-sm space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-headline-2 text-headline-2 text-on-surface">Your details</h2>
                  <p className="font-caption text-caption text-muted-text mt-1 truncate">
                    {profile?.userName || 'Not set yet'}
                    {' • '}
                    {isCaretaker ? `Family caretaker for ${profile?.patientName || '—'}` : 'Patient'}
                  </p>
                  <p className="font-caption text-caption text-muted-text mt-0.5">
                    {describeMealRoutine(profile)}
                  </p>
                </div>
                <button
                  type="button"
                  id="edit-details-btn"
                  onClick={() => setDetailsOpen(true)}
                  className="flex-shrink-0 h-11 px-4 rounded-xl border border-card-border text-on-surface font-body-semibold text-[16px] hover:bg-surface-container transition-colors"
                >
                  Edit details
                </button>
              </div>
            </section>

            {/* Profile Settings Card */}
            <section className="bg-surface-container-lowest border border-card-border rounded-3xl p-5 shadow-sm space-y-4">
              <h2 className="font-headline-2 text-headline-2 text-on-surface">
                {isCaretaker ? 'Patient & preferences' : 'My preferences'}
              </h2>
              <div>
                <label
                  htmlFor="patient-name-input"
                  className="block font-caption-bold text-caption-bold text-muted-text mb-1"
                >
                  {isCaretaker ? "Patient's name" : 'My name (patient)'}
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
                <span className="block font-caption-bold text-caption-bold text-muted-text mb-2">
                  Daily routine &amp; dose times
                </span>
                <ul className="rounded-2xl bg-surface-container-low border border-card-border/60 divide-y divide-card-border/60">
                  {slots.map((slot) => (
                    <li
                      key={slot.id}
                      className="flex items-center justify-between px-4 py-2.5"
                    >
                      <span className="font-body text-[16px] text-on-surface">{slot.label}</span>
                      <span className="font-caption-bold text-caption-bold text-primary">
                        {slot.time}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="font-caption text-caption text-muted-text mt-2">
                  Reminders follow these times. Use <strong>Edit details</strong> above to change your
                  breakfast, lunch or dinner times.
                </p>
              </div>

              <div>
                <label
                  htmlFor="text-scale-select"
                  className="block font-caption-bold text-caption-bold text-muted-text mb-1"
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

            {/* Reminder channels */}
            <section className="bg-surface-container-lowest border border-card-border rounded-3xl p-5 shadow-sm space-y-4">
              <h2 className="font-headline-2 text-headline-2 text-on-surface">Reminders</h2>
              <p className="font-body text-body text-muted-text">
                Dose reminders are prepared for every number saved in Caregiver Contacts. Open them
                anytime — you always tap send yourself.
              </p>

              <div className="flex flex-col gap-3">
                {[
                  {
                    key: 'whatsappAlerts',
                    icon: 'chat',
                    title: 'WhatsApp reminders',
                    body: 'Send the daily confirmation to family on WhatsApp.'
                  },
                  {
                    key: 'smsAlerts',
                    icon: 'sms',
                    title: 'SMS reminders',
                    body: 'Send the same reminder as a text message to the saved number.'
                  }
                ].map((channel) => {
                  const enabled = profile?.[channel.key] !== false;
                  return (
                    <label
                      key={channel.key}
                      htmlFor={`toggle-${channel.key}`}
                      className="flex items-start gap-3 rounded-2xl border border-card-border/60 bg-surface-container-low p-4 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-primary text-[22px] flex-shrink-0">
                        {channel.icon}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block font-body-semibold text-[16px] text-on-surface">
                          {channel.title}
                        </span>
                        <span className="block font-caption text-caption text-muted-text mt-0.5">
                          {channel.body}
                        </span>
                      </span>
                      <input
                        id={`toggle-${channel.key}`}
                        type="checkbox"
                        checked={enabled}
                        onChange={(e) => updateProfile({ [channel.key]: e.target.checked })}
                        className="mt-1 w-6 h-6 flex-shrink-0 accent-[#0b8a4b]"
                      />
                    </label>
                  );
                })}
              </div>

              <Link
                to="/contacts"
                className="min-h-[48px] px-4 rounded-xl border border-card-border text-on-surface font-body-semibold text-[16px] inline-flex items-center gap-2 hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">contacts</span>
                Manage reminder numbers
              </Link>
            </section>

            {/* Data & Privacy Card */}
            <section className="bg-surface-container-lowest border border-card-border rounded-3xl p-5 shadow-sm space-y-4">
              <h2 className="font-headline-2 text-headline-2 text-on-surface">Data &amp; Privacy</h2>
              <p className="font-body text-body text-muted-text">
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
              <p className="font-caption text-caption text-muted-text mt-1">
                A hackathon project. Not medical advice.
              </p>
            </section>
          </main>
        </div>
        <BottomNav activeRoute="settings" />
      </div>

      <UserInfoDialog
        isOpen={detailsOpen}
        mode="edit"
        onClose={() => setDetailsOpen(false)}
        onSaved={() => {
          setSavedNotice(true);
          setTimeout(() => setSavedNotice(false), 1500);
        }}
      />

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
            <p className="font-body text-body text-muted-text">
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
