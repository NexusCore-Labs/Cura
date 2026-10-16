import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSchedule, useDoseLog, useToday, useTextSize } from '../hooks/index.js';
import { groupMedicinesBySlot } from '../utils/schedule.js';
import { getSlotsForProfile } from '../utils/dates.js';
import BottomNav from '../components/BottomNav.jsx';
import Timeline from '../components/Timeline.jsx';
import EmptyState from '../components/EmptyState.jsx';
import DoseProgressRing from '../components/DoseProgressRing.jsx';

export default function TodayScreen() {
  const navigate = useNavigate();
  const { profile } = useTextSize();
  const { medicines } = useSchedule();
  const { doseLog, isDoseTaken, toggleDose, markSlotTaken } = useDoseLog();
  const { todayIso, headerDate, calendarStrip, currentSlotId, getGreeting } = useToday();

  const [selectedDateIso, setSelectedDateIso] = useState(null);
  const activeDateIso = selectedDateIso || todayIso;

  const slots = useMemo(() => getSlotsForProfile(profile), [profile]);

  const slotGroups = useMemo(
    () => groupMedicinesBySlot(medicines, activeDateIso, doseLog, slots),
    [medicines, activeDateIso, doseLog, slots]
  );

  const dosesToday = useMemo(
    () => doseLog.filter((entry) => entry.date === activeDateIso).length,
    [doseLog, activeDateIso]
  );
  const totalDoses = medicines.length;
  const dosesLeft = Math.max(0, totalDoses - dosesToday);

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
      <div className="flex flex-col w-full px-margin max-w-[420px] mx-auto text-on-surface">
        {/* Header: date, greeting, progress */}
        <header className="flex flex-col pt-5">
          <p className="font-caption-bold text-caption-bold text-muted-text uppercase tracking-wide">
            {headerDate}
          </p>
          <div className="flex items-center justify-between gap-4 mt-2">
            <h1 className="font-headline-1 text-[30px] leading-[38px] font-bold text-on-surface">
              {getGreeting(profile?.patientName || 'Ramesh')}
            </h1>
            <DoseProgressRing
              taken={dosesToday}
              total={totalDoses}
              className="flex-shrink-0"
            />
          </div>
          <p className="font-caption text-caption text-muted-text mt-2">
            <span className="text-primary font-caption-bold">{dosesLeft}</span> of {totalDoses}{' '}
            doses left today.
          </p>
        </header>

        {/* Week strip */}
        <section className="mt-6" aria-label="Weekly calendar view">
          <div className="flex justify-between items-center gap-1.5">
            {calendarStrip.map((day) => {
              const isSelected = activeDateIso ? day.isoDate === activeDateIso : day.isToday;
              return (
                <button
                  key={day.isoDate}
                  type="button"
                  onClick={() => setSelectedDateIso(day.isoDate)}
                  aria-pressed={isSelected}
                  className={`flex-1 h-[70px] rounded-2xl flex flex-col items-center justify-center gap-0.5 py-1 transition-colors min-w-[40px] ${
                    isSelected
                      ? 'bg-card-dark text-surface-container-lowest font-bold'
                      : 'text-on-surface active:bg-surface-container'
                  }`}
                >
                  <span
                    className={`font-caption text-[12px] tracking-wide ${
                      isSelected ? 'text-surface-container-lowest/80' : 'text-muted-text'
                    }`}
                  >
                    {day.dayName}
                  </span>
                  <span className="font-body-semibold text-[17px]">{day.dayNumber}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Time-of-day schedule */}
        <Timeline
          slotGroups={slotGroups}
          currentSlotId={currentSlotId}
          dateIso={activeDateIso}
          isDoseTaken={isDoseTaken}
          onToggleDose={handleToggleDose}
          variant="mobile"
        />

        {/* Primary action */}
        <div className="pt-8 pb-4 w-full">
          <button
            type="button"
            id="main-action-btn"
            disabled={isDueGroupCompleted}
            onClick={handleMarkCurrentSlotTaken}
            className={`w-full h-14 rounded-2xl ${
              isDueGroupCompleted
                ? 'bg-surface-container text-muted-text cursor-not-allowed'
                : 'bg-primary-container text-on-lime active:bg-primary-container/90 shadow-sm'
            } font-body-semibold text-body-semibold flex items-center justify-center transition-colors`}
          >
            {isDueGroupCompleted ? 'All done for now' : 'I took it'}
          </button>
        </div>
      </div>

      <BottomNav activeRoute="today" />
    </div>
  );
}
