import React from 'react';
import { Link } from 'react-router-dom';

export default function EmptyState({
  icon = 'calendar_today',
  title = 'No schedule yet',
  description = 'Scan a paper prescription to set up your daily medicine schedule.',
  actionLabel = 'Scan a prescription',
  actionTo = '/scan'
}) {
  return (
    <div className="flex flex-col w-full px-margin max-w-[390px] mx-auto min-h-[70vh] justify-center items-center text-center">
      <div className="w-20 h-20 rounded-3xl bg-surface-container flex items-center justify-center text-primary mb-space-md">
        <span className="material-symbols-outlined text-[40px]">{icon}</span>
      </div>
      <h1 className="font-headline-1 text-headline-1 text-on-surface mb-2">{title}</h1>
      <p className="font-body text-body text-muted-text mb-8">{description}</p>
      {actionLabel && (
        <Link
          to={actionTo}
          className="w-full h-14 rounded-2xl bg-primary-container text-on-lime font-body-semibold text-body-semibold flex items-center justify-center shadow-sm hover:opacity-95 transition-opacity"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
