import React from 'react';
import MedicineCard from './MedicineCard.jsx';

export default function DoseGroupCard({
  group,
  isCurrentSlot = false,
  isDoseTaken,
  dateIso,
  onToggleDose,
  variant = 'mobile',
  selectedMedId = null,
  onSelectMed
}) {
  if (variant === 'desktop') {
    return (
      <div className="flex flex-col gap-space-xs">
        <div className="flex items-center gap-space-xs px-1">
          <span
            className={`material-symbols-outlined text-[22px] ${
              isCurrentSlot ? 'text-primary' : 'text-secondary'
            }`}
          >
            {group.icon}
          </span>
          <span className="font-body-semibold text-body-semibold text-on-surface">
            {group.label}
          </span>
          <span className="font-caption text-caption text-secondary ml-auto">{group.time}</span>
        </div>

        {group.medicines.length === 0 ? (
          <div className="bg-surface-container-low rounded-3xl p-space-md flex items-center border border-card-border/50">
            <span className="font-body text-body text-secondary">Nothing to take</span>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {group.medicines.map((med) => (
              <MedicineCard
                key={med.id}
                medicine={med}
                slotId={group.id}
                taken={isDoseTaken(dateIso, group.id, med.id)}
                onToggleDose={onToggleDose}
                variant="desktop"
                isSelected={med.id === selectedMedId}
                onSelect={onSelectMed}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <section className="flex flex-col" aria-labelledby={`heading-${group.id}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className={`material-symbols-outlined text-[24px] ${
              isCurrentSlot ? 'text-primary' : 'text-on-surface'
            }`}
          >
            {group.icon}
          </span>
          <h2
            id={`heading-${group.id}`}
            className="font-headline-2 text-headline-2 text-on-surface"
          >
            {group.label}
          </h2>
          {isCurrentSlot && (
            <span className="text-[12px] bg-surface-container px-2 py-0.5 rounded-full text-primary font-caption-bold">
              Current
            </span>
          )}
        </div>
        <span className="font-caption text-caption text-muted-text">{group.time}</span>
      </div>

      {group.medicines.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-3xl border border-card-border p-5 shadow-sm flex items-center">
          <span className="font-body text-body text-muted-text">Nothing to take</span>
        </div>
      ) : (
        <div className="flex flex-col space-y-3">
          {group.medicines.map((med) => (
            <MedicineCard
              key={med.id}
              medicine={med}
              slotId={group.id}
              taken={isDoseTaken(dateIso, group.id, med.id)}
              onToggleDose={onToggleDose}
              variant="mobile"
            />
          ))}
        </div>
      )}
    </section>
  );
}
