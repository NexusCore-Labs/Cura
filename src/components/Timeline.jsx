import React from 'react';
import DoseGroupCard from './DoseGroupCard.jsx';

export default function Timeline({
  slotGroups = [],
  currentSlotId = 'dawn',
  dateIso,
  isDoseTaken,
  onToggleDose,
  variant = 'mobile',
  selectedMedId = null,
  onSelectMed
}) {
  if (variant === 'desktop') {
    return (
      <div className="flex flex-col gap-space-md w-full">
        {slotGroups.map((group) => (
          <DoseGroupCard
            key={group.id}
            group={group}
            isCurrentSlot={group.id === currentSlotId}
            dateIso={dateIso}
            isDoseTaken={isDoseTaken}
            onToggleDose={onToggleDose}
            variant="desktop"
            selectedMedId={selectedMedId}
            onSelectMed={onSelectMed}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col mt-6 space-y-6">
      {slotGroups.map((group) => (
        <DoseGroupCard
          key={group.id}
          group={group}
          isCurrentSlot={group.id === currentSlotId}
          dateIso={dateIso}
          isDoseTaken={isDoseTaken}
          onToggleDose={onToggleDose}
          variant="mobile"
        />
      ))}
    </div>
  );
}
