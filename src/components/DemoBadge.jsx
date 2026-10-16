import React from 'react';

export default function DemoBadge({ label = 'Sample Prescription Ready', onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-space-xs px-3 py-1.5 rounded-full bg-surface-container-high border border-card-border text-on-surface font-caption-bold text-caption hover:bg-surface-container transition-colors"
    >
      <span className="w-2 h-2 rounded-full bg-primary-container" />
      <span>{label}</span>
    </button>
  );
}
