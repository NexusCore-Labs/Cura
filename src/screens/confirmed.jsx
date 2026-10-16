import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useContacts, useToday, useTextSize } from '../hooks/index.js';
import { SLOTS } from '../utils/dates.js';
import {
  buildConfirmationMessage,
  dispatchToContact
} from '../services/dispatchService.js';

export default function ConfirmedScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { profile } = useTextSize();
  const { contacts } = useContacts();
  const { currentSlotId: dueSlotId, timeString } = useToday();

  const [selectedContactIdx, setSelectedContactIdx] = useState(0);

  const selectedSlotId = searchParams.get('slot') || dueSlotId;
  const slotDef = SLOTS.find((s) => s.id === selectedSlotId) || SLOTS[0];
  const activeContact = contacts[selectedContactIdx] || contacts[0] || {
    name: 'Family',
    phone: ''
  };

  const messageBody = buildConfirmationMessage({
    patientName: profile?.patientName || 'Ramesh',
    slotTime: slotDef.time
  });

  const handleSendWhatsApp = () => {
    if (!contacts || contacts.length === 0 || !activeContact.phone) {
      navigate('/contacts');
      return;
    }

    const res = dispatchToContact({
      contact: activeContact,
      patientName: profile?.patientName || 'Ramesh',
      slotTime: slotDef.time,
      openWindow: true
    });

    if (!res.ok) {
      navigate('/contacts');
    }
  };

  return (
    <div className="flex flex-col relative w-full min-h-screen bg-surface">
      <div className="flex flex-col w-full max-w-[390px] mx-auto px-margin pt-safe pb-safe min-h-screen justify-between">
        {/* Top Status Area */}
        <div className="flex flex-col items-center pt-space-lg pb-space-md text-center">
          <div className="w-36 h-36 mx-auto flex items-center justify-center mb-space-sm relative">
            {/* Lime glow circle */}
            <div className="w-28 h-28 rounded-full bg-primary-container/25 flex items-center justify-center animate-pulse">
              <div className="w-20 h-20 rounded-full bg-primary-container flex items-center justify-center text-on-lime shadow-md">
                <span className="material-symbols-outlined text-[44px] font-bold">check</span>
              </div>
            </div>
          </div>

          <h1 className="font-headline-1 text-headline-1 text-on-surface text-center mb-space-xs">
            Well done, {profile?.patientName || 'Ramesh'}!
          </h1>
          <p className="font-body text-body text-secondary text-center max-w-[280px]">
            Your {slotDef.label.toLowerCase()} doses are all recorded.
          </p>
        </div>

        {/* WhatsApp Message Preview Card */}
        <div className="my-space-md">
          {contacts.length > 1 && (
            <div className="flex items-center justify-center gap-2 mb-3">
              {contacts.map((c, idx) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedContactIdx(idx)}
                  className={`px-3 py-1.5 rounded-full font-caption-bold text-caption-bold border transition-colors ${
                    idx === selectedContactIdx
                      ? 'bg-primary-container text-on-lime border-primary-container'
                      : 'bg-surface-container-lowest text-secondary border-card-border'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}

          <div className="bg-surface-container-lowest rounded-3xl p-space-md border border-card-border shadow-sm flex flex-col gap-space-sm">
            <div className="flex items-center gap-space-xs text-secondary">
              <span className="material-symbols-outlined text-[20px]">forum</span>
              <span className="font-caption-bold text-caption-bold">
                Preview message for {activeContact.name}
              </span>
            </div>

            <div className="bg-surface-container-low rounded-2xl rounded-tr-sm p-space-sm flex flex-col gap-1 border border-card-border/40">
              <p className="font-body-semibold text-body-semibold text-on-surface">
                {messageBody}
              </p>
              <div className="flex items-center justify-end gap-1 text-secondary">
                <span className="font-caption text-caption text-secondary">
                  Today, {timeString}
                </span>
                <span className="material-symbols-outlined text-[18px] text-primary">
                  done_all
                </span>
              </div>
            </div>
          </div>
          <p className="font-caption text-caption text-muted-text text-center mt-2">
            WhatsApp will open. Tap Send.
          </p>
        </div>

        {/* Bottom Actions (Single Primary Lime Button) */}
        <div className="flex flex-col items-center gap-space-sm pb-space-lg w-full">
          <button
            type="button"
            id="send-whatsapp-btn"
            onClick={handleSendWhatsApp}
            className="w-full h-14 rounded-2xl bg-primary-container text-on-lime flex items-center justify-center gap-space-xs font-body-semibold text-body-semibold shadow-sm hover:opacity-95 active:scale-[0.99] transition-all focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span className="material-symbols-outlined text-[24px]">chat</span>
            <span>Send to {activeContact.name} on WhatsApp</span>
          </button>

          <Link
            to="/app"
            className="min-h-[48px] px-space-md flex items-center justify-center font-body text-body text-secondary hover:text-on-surface transition-colors focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
          >
            Skip
          </Link>
        </div>
      </div>
    </div>
  );
}
