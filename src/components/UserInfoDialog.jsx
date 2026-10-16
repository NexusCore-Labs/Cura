import React, { useEffect, useRef, useState } from 'react';
import { useContacts, useTextSize } from '../hooks/index.js';
import { buildProfileFromOnboarding } from '../utils/storage.js';
import { DEFAULT_MEAL_TIMES, formatMealTime } from '../utils/dates.js';
import { isValidInternationalPhone } from '../services/dispatchService.js';

const RELATION_OPTIONS = [
  'Daughter',
  'Son',
  'Spouse',
  'Parent',
  'Sibling',
  'Grandchild',
  'Guardian',
  'Other family'
];

const MEAL_FIELDS = [
  {
    key: 'breakfast',
    label: 'Breakfast',
    hint: 'Morning dose reminder',
    icon: 'free_breakfast'
  },
  { key: 'lunch', label: 'Lunch', hint: 'Afternoon dose reminder', icon: 'lunch_dining' },
  { key: 'dinner', label: 'Dinner', hint: 'Night dose reminder', icon: 'dinner_dining' }
];

const EMPTY_FORM = {
  userName: '',
  role: 'patient',
  patientName: '',
  relation: 'Daughter',
  phone: '',
  mealTimes: { ...DEFAULT_MEAL_TIMES }
};

/**
 * Pop-up that captures who is using Cura, who they look after, and the patient's
 * daily meal routine. Everything is stored locally on the device.
 */
export default function UserInfoDialog({ isOpen, mode = 'edit', onClose, onSaved }) {
  const { profile, updateProfile } = useTextSize();
  const { contacts, upsertContact } = useContacts();

  const [form, setForm] = useState(EMPTY_FORM);

  const [error, setError] = useState('');
  const dialogRef = useRef(null);
  const firstFieldRef = useRef(null);
  const previouslyFocusedRef = useRef(null);

  // Latest values captured in refs so the seeding effect can run on open only.
  const profileRef = useRef(profile);
  const contactsRef = useRef(contacts);
  profileRef.current = profile;
  contactsRef.current = contacts;

  const isOnboarding = mode === 'onboarding';

  // Seed the form each time the dialog opens, pre-filling saved details.
  useEffect(() => {
    if (!isOpen) return;
    const saved = profileRef.current || {};
    const savedContacts = contactsRef.current || [];
    const savedIsCaretaker = saved.role === 'caretaker';
    const savedContact = savedIsCaretaker
      ? savedContacts.find(
          (c) => c.name?.toLowerCase() === (saved.userName || '').toLowerCase()
        ) || (savedContacts.length === 1 ? savedContacts[0] : null)
      : null;

    setError('');
    setForm({
      ...EMPTY_FORM,
      userName: saved.userName || (saved.onboarded ? saved.patientName : '') || '',
      role: savedIsCaretaker ? 'caretaker' : 'patient',
      patientName: savedIsCaretaker ? saved.patientName || '' : '',
      relation: savedContact?.relation || 'Daughter',
      phone: savedContact?.phone ? `+${savedContact.phone}` : '',
      mealTimes: { ...DEFAULT_MEAL_TIMES, ...(saved.mealTimes || {}) }
    });
  }, [isOpen]);

  // Focus management, Escape to close, and background scroll lock.
  useEffect(() => {
    if (!isOpen) return;

    previouslyFocusedRef.current =
      typeof document !== 'undefined' ? document.activeElement : null;

    const focusTimer = setTimeout(() => firstFieldRef.current?.focus(), 30);
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
        return;
      }
      if (e.key !== 'Tab' || !dialogRef.current) return;

      const focusable = dialogRef.current.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = overflow;
      if (previouslyFocusedRef.current && typeof previouslyFocusedRef.current.focus === 'function') {
        previouslyFocusedRef.current.focus();
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isCaretaker = form.role === 'caretaker';

  const setField = (patch) => setForm((prev) => ({ ...prev, ...patch }));
  const setMealTime = (key, value) =>
    setForm((prev) => ({ ...prev, mealTimes: { ...prev.mealTimes, [key]: value } }));

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');

    const cleanName = form.userName.trim();
    if (!cleanName) {
      setError('Please enter your name.');
      return;
    }

    if (isCaretaker) {
      if (!form.patientName.trim()) {
        setError("Please enter the patient's name.");
        return;
      }
      if (!isValidInternationalPhone(form.phone)) {
        setError('Enter a valid WhatsApp number with country code (10–15 digits).');
        return;
      }
    }

    if (MEAL_FIELDS.some((field) => !form.mealTimes[field.key])) {
      setError('Please set a time for breakfast, lunch and dinner.');
      return;
    }

    updateProfile(
      buildProfileFromOnboarding({
        userName: cleanName,
        role: form.role,
        patientName: form.patientName,
        language: 'en',
        mealTimes: form.mealTimes
      })
    );

    if (isCaretaker) {
      upsertContact({
        name: cleanName,
        relation: form.relation,
        phone: form.phone
      });
    }

    onClose?.();
    onSaved?.();
  };

  return (
    <div
      className="fixed inset-0 z-[60] bg-inverse-surface/70 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-info-title"
        className="bg-surface-container-lowest rounded-t-3xl sm:rounded-3xl max-w-md w-full p-6 shadow-xl max-h-[92vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between gap-3 mb-1">
          <div>
            <h2 id="user-info-title" className="font-headline-2 text-headline-2 text-on-surface">
              {isOnboarding ? 'Tell us about you' : 'Your details'}
            </h2>
            <p className="font-caption text-caption text-muted-text mt-1">
              Saved only on this device. No account or password needed.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onClose?.()}
            aria-label="Close dialog"
            className="w-11 h-11 flex-shrink-0 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
          {error && (
            <p role="alert" className="font-caption text-caption text-error">
              {error}
            </p>
          )}

          <div>
            <label
              htmlFor="user-info-name"
              className="block font-caption-bold text-caption-bold text-muted-text mb-1"
            >
              Your name
            </label>
            <input
              id="user-info-name"
              ref={firstFieldRef}
              type="text"
              value={form.userName}
              onChange={(e) => setField({ userName: e.target.value })}
              placeholder="e.g. Neha"
              autoComplete="name"
              className="w-full h-12 px-4 rounded-xl border border-card-border bg-surface font-body text-body text-on-surface"
            />
          </div>

          <fieldset>
            <legend className="block font-caption-bold text-caption-bold text-muted-text mb-2">
              I am a
            </legend>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Your role">
              {[
                { value: 'patient', label: 'Patient', icon: 'person' },
                { value: 'caretaker', label: 'Family', icon: 'diversity_3' }
              ].map((option) => {
                const selected = form.role === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setField({ role: option.value })}
                    className={`h-14 rounded-2xl border flex items-center justify-center gap-2 font-body-semibold text-[16px] transition-colors ${
                      selected
                        ? 'bg-primary-container text-on-lime border-transparent shadow-sm'
                        : 'bg-surface-container-lowest text-on-surface border-card-border hover:bg-surface-container'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[22px]">{option.icon}</span>
                    {option.label}
                  </button>
                );
              })}
            </div>
            <p className="font-caption text-caption text-muted-text mt-2">
              {isCaretaker
                ? 'You look after someone. We will ask for their name and your WhatsApp number.'
                : 'You take the medicines yourself.'}
            </p>
          </fieldset>

          {isCaretaker && (
            <div className="flex flex-col gap-4 rounded-2xl bg-surface-container-low border border-card-border/60 p-4">
              <div>
                <label
                  htmlFor="user-info-patient"
                  className="block font-caption-bold text-caption-bold text-muted-text mb-1"
                >
                  Patient&apos;s name
                </label>
                <input
                  id="user-info-patient"
                  type="text"
                  value={form.patientName}
                  onChange={(e) => setField({ patientName: e.target.value })}
                  placeholder="e.g. Ramesh"
                  className="w-full h-12 px-4 rounded-xl border border-card-border bg-surface font-body text-body text-on-surface"
                />
              </div>

              <div>
                <label
                  htmlFor="user-info-relation"
                  className="block font-caption-bold text-caption-bold text-muted-text mb-1"
                >
                  You are their
                </label>
                <select
                  id="user-info-relation"
                  value={form.relation}
                  onChange={(e) => setField({ relation: e.target.value })}
                  className="w-full h-12 px-4 rounded-xl border border-card-border bg-surface font-body text-body text-on-surface"
                >
                  {RELATION_OPTIONS.map((relation) => (
                    <option key={relation} value={relation}>
                      {relation}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="user-info-phone"
                  className="block font-caption-bold text-caption-bold text-muted-text mb-1"
                >
                  WhatsApp number for dose reminders
                </label>
                <input
                  id="user-info-phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setField({ phone: e.target.value })}
                  placeholder="e.g. 919876543210"
                  autoComplete="tel"
                  className="w-full h-12 px-4 rounded-xl border border-card-border bg-surface font-body text-body text-on-surface"
                />
                <p className="font-caption text-caption text-muted-text mt-1">
                  Include the country code. We open WhatsApp and SMS for you — you always tap send.
                </p>
              </div>
            </div>
          )}

          <fieldset className="rounded-2xl bg-surface-container-low border border-card-border/60 p-4">
            <legend className="px-1 font-caption-bold text-caption-bold text-muted-text">
              Daily routine
            </legend>
            <p className="font-caption text-caption text-muted-text mb-3 -mt-1">
              We schedule before/after-meal reminders around these times.
            </p>
            <div className="flex flex-col gap-3">
              {MEAL_FIELDS.map((field) => (
                <div key={field.key} className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-[22px] flex-shrink-0">
                    {field.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <label
                      htmlFor={`meal-${field.key}`}
                      className="block font-caption-bold text-caption-bold text-on-surface"
                    >
                      {field.label}
                    </label>
                    <span className="block font-caption text-caption text-muted-text">
                      {field.hint}
                    </span>
                  </div>
                  <input
                    id={`meal-${field.key}`}
                    type="time"
                    value={form.mealTimes[field.key]}
                    onChange={(e) => setMealTime(field.key, e.target.value)}
                    aria-label={`${field.label} time`}
                    className="w-[124px] h-12 px-3 rounded-xl border border-card-border bg-surface font-body text-body text-on-surface"
                  />
                </div>
              ))}
            </div>
            <p className="font-caption text-caption text-primary mt-3">
              Dose times: {formatMealTime(form.mealTimes.breakfast, DEFAULT_MEAL_TIMES.breakfast)}{' '}
              morning · {formatMealTime(form.mealTimes.lunch, DEFAULT_MEAL_TIMES.lunch)} afternoon ·{' '}
              {formatMealTime(form.mealTimes.dinner, DEFAULT_MEAL_TIMES.dinner)} night
            </p>
          </fieldset>

          <button
            type="submit"
            className="mt-1 w-full h-14 rounded-2xl bg-primary-container text-on-lime font-body-semibold text-body-semibold inline-flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.99] transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-[22px]">check</span>
            {isOnboarding ? 'Save & scan prescription' : 'Save details'}
          </button>

          <p className="font-caption text-caption text-muted-text text-center">
            Cura stores this on your device only.
          </p>
        </form>
      </div>
    </div>
  );
}
