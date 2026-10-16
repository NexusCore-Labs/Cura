import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSchedule, useTextSize } from '../hooks/index.js';
import { getSlotsForProfile } from '../utils/dates.js';
import { searchMedicinesCatalog } from '../utils/schedule.js';
import TopBar from '../components/TopBar.jsx';
import BottomSheet from '../components/BottomSheet.jsx';

const FOOD_OPTIONS = [
  'After breakfast',
  'After lunch',
  'After dinner',
  'After food',
  'Before food',
  'Empty stomach'
];

const DOSE_PRESETS = ['½ tablet', '1 tablet', '2 tablets', '1 capsule', '5 ml', '10 ml'];

export default function ReviewScheduleScreen() {
  const navigate = useNavigate();
  const { profile } = useTextSize();
  const {
    schedule,
    medicines,
    thumbnail,
    hasNeedsReview,
    updateMedicine,
    confirmMedicineReview,
    addMedicine,
    deleteMedicine,
    approveSchedule
  } = useSchedule();

  const slots = getSlotsForProfile(profile);

  const [zoomOpen, setZoomOpen] = useState(false);
  const [pharmacistOpen, setPharmacistOpen] = useState(false);
  const [editingMed, setEditingMed] = useState(null);
  const [isNewMed, setIsNewMed] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);

  const isPdfSource = schedule?.sourceKind === 'pdf';

  const openEditSheet = (med) => {
    setIsNewMed(false);
    setEditingMed({
      ...med,
      slots: Array.isArray(med.slots) && med.slots.length > 0 ? [...med.slots] : ['dawn']
    });
  };

  const openAddManualSheet = () => {
    setIsNewMed(true);
    setEditingMed({
      id: `med-${Date.now()}`,
      name: '',
      strength: '',
      dose: '1 tablet',
      form: 'tablet',
      slots: ['dawn'],
      food: 'After breakfast',
      notes: '',
      sourceRaw: '',
      needsReview: false
    });
  };

  const handleSaveEditor = (e) => {
    e.preventDefault();
    if (!editingMed || !editingMed.name.trim()) return;

    const cleaned = {
      ...editingMed,
      name: editingMed.name.trim(),
      strength: editingMed.strength.trim() || 'Standard dose',
      dose: (editingMed.dose || '').trim() || 'as written',
      slots: editingMed.slots.length > 0 ? editingMed.slots : ['dawn'],
      doseConfirmed: true,
      needsReview: false
    };

    if (isNewMed) {
      addMedicine(cleaned);
    } else {
      updateMedicine(cleaned.id, cleaned);
    }
    setEditingMed(null);
  };

  const handleDeleteInEditor = () => {
    if (editingMed && !isNewMed) {
      deleteMedicine(editingMed.id);
    }
    setEditingMed(null);
  };

  const toggleEditorSlot = (slotId) => {
    if (!editingMed) return;
    const exists = editingMed.slots.includes(slotId);
    const nextSlots = exists
      ? editingMed.slots.filter((s) => s !== slotId)
      : [...editingMed.slots, slotId];
    setEditingMed({
      ...editingMed,
      slots: nextSlots.length > 0 ? nextSlots : [slotId]
    });
  };

  const canApprove = !hasNeedsReview && agreed && medicines.length > 0;

  const handleApprove = () => {
    if (!canApprove) return;
    const ok = approveSchedule();
    if (ok) {
      navigate('/app');
    }
  };

  const suggestions = editingMed ? searchMedicinesCatalog(editingMed.name) : [];

  return (
    <div className="w-full max-w-[520px] mx-auto min-h-screen bg-surface flex flex-col pt-safe pb-safe px-margin">
      <TopBar variant="mobile-review" title="Confirm AI reading" backTo="/scan" />

      <main className="flex-1 flex flex-col pb-40">
        {/* AI disclosure */}
        <div
          role="note"
          className="w-full rounded-2xl bg-surface-container border border-primary/25 p-4 flex gap-3 mb-space-md"
        >
          <span className="material-symbols-outlined text-primary text-[24px] flex-shrink-0">
            neurology
          </span>
          <div>
            <p className="font-body-semibold text-[16px] text-on-surface">
              AI read this prescription — it can make mistakes.
            </p>
            <p className="font-caption text-caption text-muted-text mt-1">
              Medicine names and descriptions come from the AI. Check the dosage amount and the
              timings against the paper sheet and correct anything that looks wrong.
            </p>
          </div>
        </div>

        {/* Source card */}
        <div className="relative w-full rounded-2xl overflow-hidden bg-surface-container-lowest border border-card-border shadow-sm mb-space-lg flex items-center justify-between px-space-md py-3">
          <div className="flex items-center space-x-space-sm min-w-0">
            <div className="w-14 h-14 rounded-xl overflow-hidden bg-surface-container flex items-center justify-center flex-shrink-0 border border-card-border">
              {isPdfSource || !thumbnail ? (
                <span className="material-symbols-outlined text-muted-text text-[26px]">
                  {isPdfSource ? 'picture_as_pdf' : 'draft'}
                </span>
              ) : (
                <img
                  src={thumbnail}
                  alt="Scanned prescription thumbnail"
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div className="flex flex-col min-w-0 pl-2">
              <span className="font-body-semibold text-[16px] text-on-surface truncate">
                {isPdfSource ? schedule?.sourceFileName || 'Prescription PDF' : 'Scanned Rx paper'}
              </span>
              <span className="font-caption text-caption text-muted-text truncate">
                {medicines.length} medicine{medicines.length === 1 ? '' : 's'} detected
              </span>
            </div>
          </div>
          {!isPdfSource && thumbnail ? (
            <button
              type="button"
              id="inspect-doc-btn"
              onClick={() => setZoomOpen(true)}
              aria-label="Inspect prescription document"
              className="w-11 h-11 rounded-full bg-surface-container-lowest border border-card-border flex items-center justify-center shadow-sm flex-shrink-0 text-on-surface active:bg-surface-container transition-colors focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span className="material-symbols-outlined text-[22px]">zoom_in</span>
            </button>
          ) : null}
        </div>

        {/* Medicine cards */}
        <div className="flex flex-col space-y-gutter w-full" id="review-cards-list">
          {medicines.length === 0 && (
            <div className="w-full rounded-3xl border border-card-border bg-surface-container-lowest p-6 text-center">
              <p className="font-body text-body text-muted-text">
                We could not read any medicine from this sheet. Add them manually below.
              </p>
            </div>
          )}

          {medicines.map((med) => {
            const hasReviewIssue = Boolean(med.needsReview);
            const slotChips = (med.slots || []).map((s) => {
              const def = slots.find((item) => item.id === s);
              return def ? `${def.label} ${def.time}` : s;
            });

            return (
              <div
                key={med.id}
                onClick={() => openEditSheet(med)}
                className={`w-full bg-surface-container-lowest rounded-3xl p-space-md shadow-sm transition-all cursor-pointer border ${
                  hasReviewIssue
                    ? 'border-2 border-warning-amber ring-1 ring-warning-amber/30'
                    : 'border border-card-border'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-headline-2 text-headline-2 text-on-surface truncate">
                      {med.name} {med.strength}
                    </h2>
                    <p className="font-caption text-caption text-muted-text mt-0.5">
                      {med.dose || 'as written'} · {med.food || 'As directed'}
                    </p>
                  </div>
                  {hasReviewIssue ? (
                    <div className="flex items-center space-x-1 text-warning-amber font-caption-bold text-caption-bold flex-shrink-0">
                      <span className="material-symbols-outlined text-[20px]">error</span>
                      <span>Check this</span>
                    </div>
                  ) : (
                    <span className="material-symbols-outlined text-outline text-[24px]">
                      medication
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-space-xs mt-space-md">
                  {slotChips.map((chip) => (
                    <div
                      key={chip}
                      className="h-8 rounded-full px-3 bg-surface-container border border-card-border flex items-center justify-center"
                    >
                      <span className="font-caption-bold text-caption-bold text-on-surface">
                        {chip}
                      </span>
                    </div>
                  ))}
                  {slotChips.length === 0 && (
                    <div className="h-8 rounded-full px-3 bg-surface-container border border-card-border flex items-center justify-center">
                      <span className="font-caption-bold text-caption-bold text-on-surface">
                        Daily dose
                      </span>
                    </div>
                  )}
                </div>

                {(med.sourceRaw || typeof med.confidence === 'number') && (
                  <div className="mt-space-sm pt-space-sm border-t border-card-border/70">
                    <p className="font-caption text-caption text-muted-text">
                      AI saw:{' '}
                      <span className="text-on-surface">
                        {med.sourceRaw || 'unclear handwriting'}
                      </span>
                      {typeof med.confidence === 'number' &&
                        ` · ${Math.round(med.confidence * 100)}% match`}
                    </p>
                  </div>
                )}

                {hasReviewIssue && (
                  <div className="mt-3 pt-3 border-t border-warning-amber/20 flex items-center justify-between gap-2">
                    <span className="font-caption text-caption text-muted-text">
                      Dosage &amp; timing checked against the sheet?
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        confirmMedicineReview(med.id);
                      }}
                      className="text-primary font-caption-bold underline px-2 py-1 focus-visible:ring-2 focus-visible:ring-primary rounded-lg flex-shrink-0"
                    >
                      Confirm details
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Manual add + pharmacist help */}
        <div className="w-full flex flex-col items-center py-space-lg gap-2">
          <button
            type="button"
            onClick={openAddManualSheet}
            className="h-12 px-5 rounded-2xl border border-card-border bg-surface-container-lowest text-on-surface font-body-semibold text-[16px] hover:bg-surface-container transition-colors"
          >
            + Add medicine manually
          </button>
          <button
            type="button"
            id="ask-pharmacist-link"
            onClick={() => setPharmacistOpen(true)}
            className="font-body-semibold text-[16px] text-muted-text underline active:text-on-surface transition-colors py-2 focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
          >
            Not sure? Ask your pharmacist
          </button>
        </div>

        {/* Agreement + approve */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md px-margin pb-safe pt-space-sm border-t border-card-border/70">
          <div className="max-w-[520px] mx-auto w-full pb-space-sm flex flex-col gap-3">
            <label htmlFor="ai-agree" className="flex items-start gap-3 cursor-pointer">
              <input
                id="ai-agree"
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 w-6 h-6 flex-shrink-0 accent-[#0b8a4b]"
              />
              <span className="font-caption text-caption text-on-surface">
                I understand this schedule was generated by AI and may contain mistakes. I have
                checked the medicine names, dosages and timings against my prescription and I
                accept them.{' '}
                <button
                  type="button"
                  onClick={() => setTermsOpen(true)}
                  className="text-primary underline"
                >
                  Read the disclaimer
                </button>
              </span>
            </label>

            <button
              type="button"
              id="approve-schedule-btn"
              disabled={!canApprove}
              onClick={handleApprove}
              className={`w-full h-14 rounded-2xl font-body-semibold text-body-semibold flex items-center justify-center gap-2 transition-all focus-visible:ring-2 focus-visible:ring-primary ${
                canApprove
                  ? 'bg-primary-container text-on-lime hover:opacity-95 active:scale-[0.99] shadow-sm'
                  : 'bg-surface-container text-muted-text cursor-not-allowed'
              }`}
            >
              <span className="material-symbols-outlined text-[22px]">verified</span>
              {hasNeedsReview
                ? 'Check the highlighted medicines'
                : agreed
                  ? 'Approve schedule'
                  : 'Tick the box to approve'}
            </button>
          </div>
        </div>
      </main>

      {/* Zoom modal */}
      {zoomOpen && (
        <div
          id="image-modal"
          onClick={(e) => {
            if (e.target === e.currentTarget) setZoomOpen(false);
          }}
          className="fixed inset-0 z-50 bg-inverse-surface/80 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div className="bg-surface-container-lowest rounded-3xl max-w-lg w-full p-4 flex flex-col items-center">
            <div className="w-full flex justify-between items-center mb-3">
              <h3 className="font-headline-2 text-headline-2 text-on-surface">
                Prescription sheet
              </h3>
              <button
                type="button"
                onClick={() => setZoomOpen(false)}
                className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <img
              src={thumbnail}
              alt="Full prescription sheet view"
              className="w-full max-h-[70vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}

      {/* AI disclaimer sheet */}
      <BottomSheet
        isOpen={termsOpen}
        title="AI disclaimer"
        onClose={() => setTermsOpen(false)}
      >
        <div className="flex flex-col gap-3 font-body text-body text-muted-text">
          <p>
            Cura uses an AI model to read your prescription sheet. AI reading can be wrong,
            especially with handwriting.
          </p>
          <p>
            Medicine names and descriptions shown in Cura are AI-generated general information.
            Dosages and timings are the ones <strong>you</strong> confirmed on this screen.
          </p>
          <p>
            Cura organises and explains. It never diagnoses, and it never recommends or changes a
            dose. Always confirm your schedule with your doctor or a registered pharmacist.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setAgreed(true);
            setTermsOpen(false);
          }}
          className="mt-5 w-full h-12 bg-primary-container text-on-lime rounded-xl font-body-semibold flex items-center justify-center"
        >
          I understand
        </button>
      </BottomSheet>

      {/* Ask pharmacist sheet */}
      <BottomSheet
        isOpen={pharmacistOpen}
        title="Ask your pharmacist"
        onClose={() => setPharmacistOpen(false)}
      >
        <p className="font-body text-body text-muted-text mb-4 leading-relaxed">
          If any handwriting, dosage or timing on your paper prescription looks unclear, show this
          sheet directly to your local registered pharmacist to confirm your schedule.
        </p>
        <button
          type="button"
          onClick={() => setPharmacistOpen(false)}
          className="w-full h-12 bg-primary-container text-on-lime rounded-xl font-body-semibold flex items-center justify-center"
        >
          Got it
        </button>
      </BottomSheet>

      {/* Edit / add medicine */}
      <BottomSheet
        isOpen={Boolean(editingMed)}
        title={isNewMed ? 'Add medicine' : 'Adjust dosage & timing'}
        onClose={() => setEditingMed(null)}
      >
        {editingMed && (
          <form onSubmit={handleSaveEditor} className="flex flex-col gap-4">
            <div>
              <label
                htmlFor="edit-med-name"
                className="block font-caption-bold text-caption-bold text-muted-text mb-1"
              >
                Medicine name (AI suggestion)
              </label>
              <input
                id="edit-med-name"
                type="text"
                list="medicines-autocomplete"
                required
                value={editingMed.name}
                onChange={(e) => setEditingMed({ ...editingMed, name: e.target.value })}
                placeholder="e.g. Metformin"
                className="w-full h-12 px-4 rounded-xl border border-card-border bg-surface font-body text-body text-on-surface"
              />
              <datalist id="medicines-autocomplete">
                {suggestions.map((s, idx) => (
                  <option key={`${s.name}-${idx}`} value={s.displayName || s.generic}>
                    {s.name}
                  </option>
                ))}
              </datalist>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="edit-med-strength"
                  className="block font-caption-bold text-caption-bold text-muted-text mb-1"
                >
                  Strength
                </label>
                <input
                  id="edit-med-strength"
                  type="text"
                  value={editingMed.strength}
                  onChange={(e) => setEditingMed({ ...editingMed, strength: e.target.value })}
                  placeholder="e.g. 500 mg"
                  className="w-full h-12 px-4 rounded-xl border border-card-border bg-surface font-body text-body text-on-surface"
                />
              </div>
              <div>
                <label
                  htmlFor="edit-med-dose"
                  className="block font-caption-bold text-caption-bold text-muted-text mb-1"
                >
                  Dosage amount
                </label>
                <input
                  id="edit-med-dose"
                  type="text"
                  value={editingMed.dose || ''}
                  onChange={(e) => setEditingMed({ ...editingMed, dose: e.target.value })}
                  placeholder="e.g. 1 tablet"
                  className="w-full h-12 px-4 rounded-xl border border-card-border bg-surface font-body text-body text-on-surface"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 -mt-1">
              {DOSE_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setEditingMed({ ...editingMed, dose: preset })}
                  className={`h-9 px-3 rounded-full border font-caption-bold text-caption transition-colors ${
                    editingMed.dose === preset
                      ? 'bg-primary-container text-on-lime border-primary-container'
                      : 'bg-surface border-card-border text-on-surface hover:bg-surface-container'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>

            <div>
              <span className="block font-caption-bold text-caption-bold text-muted-text mb-2">
                Times of day
              </span>
              <div className="grid grid-cols-2 gap-2">
                {slots.map((slot) => {
                  const selected = editingMed.slots.includes(slot.id);
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => toggleEditorSlot(slot.id)}
                      className={`h-12 rounded-xl border px-3 flex items-center justify-between font-caption-bold text-caption-bold transition-colors ${
                        selected
                          ? 'bg-primary-container text-on-lime border-primary-container'
                          : 'bg-surface border-card-border text-on-surface'
                      }`}
                    >
                      <span>{slot.label}</span>
                      <span>{slot.time}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label
                htmlFor="edit-med-food"
                className="block font-caption-bold text-caption-bold text-muted-text mb-1"
              >
                Meal timing
              </label>
              <select
                id="edit-med-food"
                value={editingMed.food}
                onChange={(e) => setEditingMed({ ...editingMed, food: e.target.value })}
                className="w-full h-12 px-4 rounded-xl border border-card-border bg-surface font-body text-body text-on-surface"
              >
                {FOOD_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              {!isNewMed && (
                <button
                  type="button"
                  onClick={handleDeleteInEditor}
                  className="h-12 px-4 rounded-xl border border-error text-error font-body-semibold"
                >
                  Delete
                </button>
              )}
              <button
                type="submit"
                className="flex-1 h-12 rounded-xl bg-primary-container text-on-lime font-body-semibold"
              >
                Save my changes
              </button>
            </div>
          </form>
        )}
      </BottomSheet>
    </div>
  );
}
