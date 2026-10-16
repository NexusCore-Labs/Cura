import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSchedule, useDoseLog, useToday, useTextSize } from '../hooks/index.js';
import { groupMedicinesBySlot } from '../utils/schedule.js';
import BottomNav from '../components/BottomNav.jsx';
import Timeline from '../components/Timeline.jsx';
import EmptyState from '../components/EmptyState.jsx';

export default function TodayScreen() {
  const navigate = useNavigate();
  const { profile } = useTextSize();
  const { medicines } = useSchedule();
  const { doseLog, isDoseTaken, toggleDose, markSlotTaken } = useDoseLog();
  const { todayIso, headerDate, calendarStrip, currentSlotId, getGreeting } = useToday();

  const [selectedDateIso, setSelectedDateIso] = useState(null);
  const activeDateIso = selectedDateIso || todayIso;

  const slotGroups = useMemo(
    () => groupMedicinesBySlot(medicines, activeDateIso, doseLog),
    [medicines, activeDateIso, doseLog]
  );

  const dueGroup = slotGroups.find((g) => g.id === currentSlotId);
  const isDueGroupCompleted =
    !dueGroup || dueGroup.medicines.length === 0 || dueGroup.isCompleted;

  const handleToggleDose = (slotId, medId) => {
    toggleDose(activeDateIso, slotId, medId);
  };

  const handleMarkCurrentSlotTaken = () => {
    if (isDueGroupCompleted || !dueGroup) return;
    markSlotTaken(activeDateIso, currentSlotId, dueGroup.medicines);
    navigate(`/confirmed?slot=${currentSlotId}`);
  };

  if (medicines.length === 0) {
    return (
      <div className="flex-1 flex flex-col relative w-full bg-surface pt-safe pb-28">
        <EmptyState />
        <BottomNav activeRoute="today" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col relative w-full bg-surface pt-safe pb-28">
      <div className="flex flex-col w-full px-margin max-w-[390px] mx-auto text-on-surface">
        {/* Header Greeting */}
        <header className="flex flex-col pt-4">
          <h1 className="font-headline-1 text-headline-1 text-on-surface">
            {getGreeting(profile?.patientName || 'Ramesh')}
          </h1>
          <p className="font-caption text-caption text-muted-text mt-1">{headerDate}</p>
        </header>

        {/* Date Strip (5 Days) */}
        <section className="mt-6" aria-label="Weekly calendar view">
          <div className="flex justify-between items-center gap-2">
            {calendarStrip.map((day) => {
              const isSelected = activeDateIso ? day.isoDate === activeDateIso : day.isToday;
              return (
                <button
                  key={day.isoDate}
                  type="button"
                  onClick={() => setSelectedDateIso(day.isoDate)}
                  aria-pressed={isSelected}
                  className={`flex-1 h-[68px] rounded-2xl flex flex-col items-center justify-center p-1 transition-colors min-w-[48px] ${
                    isSelected
                      ? 'bg-primary-container text-on-lime shadow-sm font-bold'
                      : 'bg-surface-container-lowest border border-card-border text-on-surface active:bg-surface-container'
                  }`}
                >
                  <span
                    className={`font-caption text-caption ${
                      isSelected ? 'text-on-lime font-bold' : 'text-muted-text'
                    }`}
                  >
                    {day.dayName}
                  </span>
                  <span className="font-body-semibold text-body-semibold">{day.dayNumber}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Time-of-Day Medication Schedule */}
        <Timeline
          slotGroups={slotGroups}
          currentSlotId={currentSlotId}
          dateIso={activeDateIso}
          isDoseTaken={isDoseTaken}
          onToggleDose={handleToggleDose}
          variant="mobile"
        />

        {/* Primary Bottom Action Sticky Clearance */}
        <div className="pt-8 pb-4 w-full">
          <button
            type="button"
            id="main-action-btn"
            disabled={isDueGroupCompleted}
            onClick={handleMarkCurrentSlotTaken}
            className={`w-full h-14 rounded-2xl ${
              isDueGroupCompleted
                ? 'bg-surface-container text-secondary cursor-not-allowed'
                : 'bg-primary-container text-on-lime active:bg-primary-container/90 shadow-sm'
            } font-body-semibold text-body-semibold flex items-center justify-center transition-colors`}
          >
            {isDueGroupCompleted ? 'All done for now' : 'I took it'}
          </button>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav activeRoute="today" />
    </div>
  );
}
