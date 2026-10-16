import React from 'react';
import { Link } from 'react-router-dom';

export default function MedicineCard({
  medicine,
  slotId,
  taken = false,
  onToggleDose,
  variant = 'mobile',
  isSelected = false,
  onSelect
}) {
  if (variant === 'desktop') {
    return (
      <div
        onClick={() => onSelect?.(medicine.id)}          className={`rounded-3xl p-space-md border transition-all cursor-pointer flex items-center justify-between gap-space-sm ${
          isSelected
            ? 'bg-surface-container-lowest border-2 border-primary shadow-md'
            : 'bg-surface-container-lowest border-card-border hover:bg-surface-container-low shadow-sm'
        }`}
      >
        <div className="flex flex-col min-w-0">
          <span
            className={`font-body-semibold text-body-semibold text-on-surface truncate ${
              taken ? 'line-through opacity-70' : ''
            }`}
          >
            {medicine.name} {medicine.strength}
          </span>
          <span className="font-caption text-caption text-muted-text">
            {medicine.dose ? `${medicine.dose} · ` : ''}
            {medicine.food || 'Prescription dose'}
          </span>
        </div>
        <button
          type="button"
          aria-label={`Toggle ${medicine.name}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleDose?.(slotId, medicine.id);
          }}
          className={`w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
            taken
              ? 'bg-primary-container border-primary-container text-on-lime'
              : 'bg-surface-container-lowest border-outline-variant text-transparent hover:border-primary'
          }`}
        >
          <span className={`material-symbols-outlined text-[20px] ${taken ? 'font-bold' : ''}`}>
            check
          </span>
        </button>
      </div>
    );
  }

  return (
    <div
      className={`bg-surface-container-lowest rounded-2xl border ${
        taken ? 'border-primary/40 bg-surface-container-low/50' : 'border-card-border'
      } px-4 py-3 shadow-[0_1px_2px_rgba(6,30,15,0.04)] flex items-center justify-between gap-3 transition-colors`}
    >
      <Link
        to={`/app/med/${medicine.id}`}
        className="flex flex-col min-w-0 flex-1 hover:opacity-85 transition-opacity"
        aria-label={`View details for ${medicine.name}`}
      >
        <span
          className={`font-body-semibold text-[16px] text-on-surface truncate ${
            taken ? 'line-through opacity-70' : ''
          }`}
        >
          {medicine.name} {medicine.strength}
        </span>
        <span className="font-caption text-caption text-muted-text truncate">
          {medicine.dose ? `${medicine.dose} · ` : ''}
          {medicine.food || 'Prescribed dose'}
        </span>
      </Link>

      <button
        type="button"
        aria-label={`Mark ${medicine.name} ${medicine.strength} as ${taken ? 'not taken' : 'taken'}`}
        onClick={(e) => {
          e.stopPropagation();
          onToggleDose?.(slotId, medicine.id);
        }}
        className={`w-11 h-11 rounded-full border-2 ${
          taken
            ? 'bg-primary-container border-primary-container text-on-lime'
            : 'bg-surface-container-lowest border-outline-variant text-transparent'
        } flex items-center justify-center flex-shrink-0 transition-colors focus-visible:ring-2 focus-visible:ring-primary`}
      >
        <span
          className={`material-symbols-outlined text-[22px] font-bold ${
            taken ? 'block' : 'hidden'
          }`}
        >
          check
        </span>
      </button>
    </div>
  );
}
