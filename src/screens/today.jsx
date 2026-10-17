import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSchedule, useDoseLog, useToday, useTextSize, useContacts } from '../hooks/index.js';
import { groupMedicinesBySlot, countDailyDoses } from '../utils/schedule.js';
import { getSlotsForProfile } from '../utils/dates.js';
import { getRegisteredContact, dispatchMedicineTaken } from '../services/dispatchService.js';
import BottomNav from '../components/BottomNav.jsx';
import Timeline from '../components/Timeline.jsx';
import EmptyState from '../components/EmptyState.jsx';
import DoseProgressRing from '../components/DoseProgressRing.jsx';

export default function TodayScreen() {
  const navigate = useNavigate();
  const { profile } = useTextSize();
  const { medicines } = useSchedule();
  const { contacts } = useContacts();
  const { doseLog, isDoseTaken, toggleDose, markSlotTaken } = useDoseLog();
  const { todayIso, headerDate, calendarStrip, currentSlotId, getGreeting } = useToday();

  const [selectedDateIso, setSelectedDateIso] = useState(null);
  const [whatsappBanner, setWhatsappBanner] = useState(null);
  const activeDateIso = selectedDateIso || todayIso;

  const slots = useMemo(() => getSlotsForProfile(profile), [profile]);

  const slotGroups = useMemo(
    () => groupMedicinesBySlot(medicines, activeDateIso, doseLog, slots),
    [medicines, activeDateIso, doseLog, slots]
  );

  const { taken: dosesToday, total: totalDoses, remaining: dosesLeft } = useMemo(
    () => countDailyDoses(slotGroups, activeDateIso, doseLog),
    [slotGroups, activeDateIso, doseLog]
  );

  const registeredContact = useMemo(
    () => getRegisteredContact(contacts, profile),
    [contacts, profile]
  );

  const dueGroup = slotGroups.find((g) => g.id === currentSlotId);
  const isDueGroupCompleted =
    !dueGroup || dueGroup.medicines.length === 0 || dueGroup.isCompleted;

  const handleToggleDose = (slotId, medId) => {
    const nowTaken = toggleDose(activeDateIso, slotId, medId);
    if (!nowTaken) {
      setWhatsappBanner(null);
      return;
    }

    if (profile?.whatsappAlerts === false) {
      return;
    }

    const medicine = medicines.find((m) => m.id === medId);
    const slotDef = slots.find((s) => s.id === slotId);
    const patientName = profile?.patientName || profile?.userName || 'Ramesh';

    if (registeredContact) {
      const result = dispatchMedicineTaken({
        contact: registeredContact,
        patientName,
        medicine,
        slot: slotDef || slotId,
        openWindow: true
      });
      if (result.ok) {
        setWhatsappBanner({
          type: 'sent',
          contactName: registeredContact.name || 'Caregiver',
          phone: registeredContact.phone,
          medName: `${medicine?.name || 'Medicine'}${medicine?.strength ? ` ${medicine.strength}` : ''}`,
          url: result.url
        });
      }
    } else {
      setWhatsappBanner({
        type: 'missing-contact',
        medName: `${medicine?.name || 'Medicine'}${medicine?.strength ? ` ${medicine.strength}` : ''}`
      });
    }
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

        {/* WhatsApp dispatch status banner */}
        {whatsappBanner && (
          <div
            role="status"
            className="mt-4 rounded-2xl border border-primary/30 bg-surface-container-lowest p-3.5 shadow-sm flex items-center justify-between gap-3"
          >
            {whatsappBanner.type === 'sent' ? (
              <>
                <div className="min-w-0 flex-1">
                  <p className="font-caption-bold text-caption-bold text-on-surface truncate">
                    WhatsApp update ready for {whatsappBanner.contactName}
                  </p>
                  <p className="font-caption text-[12px] text-muted-text truncate">
                    Marked {whatsappBanner.medName} as taken (+{whatsappBanner.phone})
                  </p>
                </div>
                <a
                  href={whatsappBanner.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-9 px-3 rounded-xl bg-primary-container text-on-lime font-caption-bold text-caption-bold flex items-center gap-1 flex-shrink-0"
                >
                  <span>Send on WhatsApp</span>
                </a>
              </>
            ) : (
              <>
                <div className="min-w-0 flex-1">
                  <p className="font-caption-bold text-caption-bold text-on-surface">
                    Add a WhatsApp number for dose alerts
                  </p>
                  <p className="font-caption text-[12px] text-muted-text">
                    Register a caregiver or personal mobile number to send automatic WhatsApp updates.
                  </p>
                </div>
                <Link
                  to="/contacts"
                  className="h-9 px-3 rounded-xl bg-primary-container text-on-lime font-caption-bold text-caption-bold flex items-center flex-shrink-0"
                >
                  Add number
                </Link>
              </>
            )}
          </div>
        )}

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
