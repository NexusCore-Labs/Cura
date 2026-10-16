import React from 'react';
import { Link } from 'react-router-dom';

export default function TopBar({
  patientName = 'Ramesh',
  role = 'patient',
  activeSection = 'today',
  variant = 'desktop',
  title = '',
  backTo = '/app',
  closeTo = '/app',
  rightSlot = null
}) {
  if (variant === 'mobile-detail') {
    return (
      <header className="h-14 flex items-center justify-between w-full">
        <Link
          to={backTo}
          aria-label="Go back to Today"
          className="w-11 h-11 rounded-xl flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors focus-visible:ring-2 focus-visible:ring-primary"
        >
          <span className="material-symbols-outlined text-[24px]">arrow_back</span>
        </Link>
        <h2 className="font-headline-2 text-[20px] text-on-surface font-semibold truncate px-2">
          {title}
        </h2>
        <Link
          to={closeTo}
          aria-label="Close detail view"
          className="w-11 h-11 rounded-xl flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors focus-visible:ring-2 focus-visible:ring-primary"
        >
          <span className="material-symbols-outlined text-[24px]">close</span>
        </Link>
      </header>
    );
  }

  if (variant === 'mobile-review') {
    return (
      <header className="h-16 flex items-center justify-between border-b border-card-border/60 mb-4">
        <div className="flex items-center min-w-0 pr-space-xs">
          <Link
            to={backTo}
            aria-label="Go back to Scanner"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-on-surface hover:text-primary transition-colors focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
          >
            <span className="material-symbols-outlined text-[28px]">arrow_back</span>
          </Link>
          <h1 className="font-headline-2 text-headline-2 text-on-surface tracking-tight truncate pl-1">
            {title}
          </h1>
        </div>
        {rightSlot || (
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary flex-shrink-0">
            <span className="material-symbols-outlined text-[18px]">person</span>
          </div>
        )}
      </header>
    );
  }

  return (
    <header className="hidden lg:block fixed top-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-xl border-b border-card-border shadow-sm">
      <div className="h-20 w-full max-w-[1440px] mx-auto px-margin flex items-center justify-between">
        <div className="flex items-center gap-space-lg">
          <Link
            to="/app"
            className="flex items-center gap-space-sm group focus-visible:ring-2 focus-visible:ring-primary rounded-xl p-1"
          >
            <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center text-on-lime">
              <span className="material-symbols-outlined text-[24px]">medication</span>
            </div>
            <span className="font-headline-2 text-headline-2 text-on-surface font-bold tracking-tight">
              Cura
            </span>
          </Link>
          <div className="h-6 w-px bg-outline-variant" />
          <nav className="flex items-center gap-space-md" aria-label="Desktop Primary Navigation">
            <Link
              to="/app"
              className={`px-3 py-1.5 rounded-xl font-body-semibold text-body-semibold ${
                activeSection === 'today'
                  ? 'text-primary font-bold bg-surface-container'
                  : 'text-muted-text hover:text-on-surface'
              } transition-colors`}
            >
              Today
            </Link>
            <Link
              to="/scan"
              className={`px-3 py-1.5 rounded-xl font-body-semibold text-body-semibold ${
                activeSection === 'scan'
                  ? 'text-primary font-bold bg-surface-container'
                  : 'text-muted-text hover:text-on-surface'
              } transition-colors`}
            >
              Scan Prescription
            </Link>
            <Link
              to="/history"
              className={`px-3 py-1.5 rounded-xl font-body-semibold text-body-semibold ${
                activeSection === 'history'
                  ? 'text-primary font-bold bg-surface-container'
                  : 'text-muted-text hover:text-on-surface'
              } transition-colors`}
            >
              History
            </Link>
            <Link
              to="/contacts"
              className={`px-3 py-1.5 rounded-xl font-body-semibold text-body-semibold ${
                activeSection === 'contacts'
                  ? 'text-primary font-bold bg-surface-container'
                  : 'text-muted-text hover:text-on-surface'
              } transition-colors`}
            >
              Contacts
            </Link>
            <Link
              to="/settings"
              className={`px-3 py-1.5 rounded-xl font-body-semibold text-body-semibold ${
                activeSection === 'settings'
                  ? 'text-primary font-bold bg-surface-container'
                  : 'text-muted-text hover:text-on-surface'
              } transition-colors`}
            >
              Settings
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-space-md">
          <div className="flex items-center gap-space-xs bg-surface-container px-space-sm py-space-xs rounded-full">
            <span className="material-symbols-outlined text-primary text-[20px]">verified_user</span>
            <span className="font-caption-bold text-caption-bold text-on-surface">
              {role === 'caretaker' ? `Caring for ${patientName}` : `${patientName} (Patient)`}
            </span>
          </div>
          <Link
            to="/settings"
            aria-label="Patient Profile Settings"
            className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-on-primary hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-[18px]">person</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
