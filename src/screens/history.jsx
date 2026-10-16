import React from 'react';
import { Link } from 'react-router-dom';
import { useDoseLog, useSchedule, useToday, useTextSize } from '../hooks/index.js';
import { SLOTS } from '../utils/dates.js';
import TopBar from '../components/TopBar.jsx';
import BottomNav from '../components/BottomNav.jsx';

export default function HistoryScreen() {
  const { profile } = useTextSize();
  const { doseLog } = useDoseLog();
  const { getMedicineById } = useSchedule();
  const { headerDate } = useToday();

  return (
    <div className="bg-background font-body text-body text-on-surface min-h-screen flex flex-col">
      {/* Desktop Header */}
      <TopBar patientName={profile?.patientName || 'Ramesh'} activeSection="history" />

      <div className="flex-1 flex flex-col relative w-full pt-safe lg:pt-24 pb-28">
        <div className="flex flex-col w-full max-w-[540px] mx-auto px-margin">
          <header className="flex items-center justify-between pt-4 pb-2">
            <div>
              <h1 className="font-headline-1 text-headline-1 text-on-surface">Dose History</h1>
              <p className="font-caption text-caption text-secondary mt-1">{headerDate}</p>
            </div>
            <Link
              to="/app"
              aria-label="Close history"
              className="lg:hidden w-11 h-11 rounded-xl bg-surface-container flex items-center justify-center text-on-surface"
            >
              <span className="material-symbols-outlined text-[24px]">close</span>
            </Link>
          </header>

          <main className="mt-6">
            {doseLog.length === 0 ? (
              <div className="bg-surface-container-lowest rounded-3xl border border-card-border p-8 shadow-sm flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center text-secondary mb-4">
                  <span className="material-symbols-outlined text-[32px]">history</span>
                </div>
                <h2 className="font-headline-2 text-headline-2 text-on-surface mb-2">
                  No past history yet
                </h2>
                <p className="font-body text-body text-secondary max-w-xs mb-6">
                  When you check off your doses on the Today screen, your completed logs will be
                  recorded here.
                </p>
                <Link
                  to="/app"
                  className="h-12 px-6 rounded-2xl bg-primary-container text-on-lime font-body-semibold inline-flex items-center justify-center"
                >
                  Go to Today
                </Link>
              </div>
            ) : (
              <div className="flex flex-col space-y-3">
                {doseLog.map((entry, idx) => {
                  const med = getMedicineById(entry.medId);
                  const slotDef = SLOTS.find((s) => s.id === entry.slot);
                  const takenTime = new Date(entry.takenAt).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  });
                  return (
                    <div
                      key={`${entry.date}-${entry.slot}-${entry.medId}-${idx}`}
                      className="bg-surface-container-lowest border border-card-border rounded-2xl p-4 shadow-sm flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-container/20 flex items-center justify-center text-primary">
                          <span className="material-symbols-outlined text-[20px]">check</span>
                        </div>
                        <div>
                          <p className="font-body-semibold text-body-semibold text-on-surface">
                            {med?.name || 'Medicine'} {med?.strength || ''}
                          </p>
                          <p className="font-caption text-caption text-secondary">
                            {slotDef?.label || entry.slot} • {entry.date}
                          </p>
                        </div>
                      </div>
                      <span className="font-caption text-caption text-secondary bg-surface-container px-2.5 py-1 rounded-full">
                        {takenTime}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>
        <BottomNav activeRoute="history" />
      </div>
    </div>
  );
}
