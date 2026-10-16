import React from 'react';

export default function ErrorState({
  title = 'Could not read prescription',
  message = 'Please try again in bright light or enter your medicines manually.',
  onRetry,
  onManualEntry
}) {
  return (
    <div
      role="alert"
      className="bg-surface-container-lowest border border-card-border rounded-3xl p-6 shadow-sm flex flex-col items-center text-center max-w-sm mx-auto"
    >
      <div className="w-14 h-14 rounded-2xl bg-error-container text-error flex items-center justify-center mb-4">
        <span className="material-symbols-outlined text-[32px]">error</span>
      </div>
      <h2 className="font-headline-2 text-headline-2 text-on-surface mb-2">{title}</h2>
      <p className="font-body text-body text-secondary mb-6">{message}</p>
      <div className="flex flex-col gap-3 w-full">
        {onManualEntry && (
          <button
            type="button"
            onClick={onManualEntry}
            className="w-full h-14 rounded-2xl bg-primary-container text-on-lime font-body-semibold text-body-semibold flex items-center justify-center shadow-sm"
          >
            Enter medicines manually
          </button>
        )}
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="w-full h-12 rounded-2xl border border-card-border text-on-surface font-body-semibold text-body-semibold flex items-center justify-center hover:bg-surface-container transition-colors"
          >
            Try scanning again
          </button>
        )}
      </div>
    </div>
  );
}
