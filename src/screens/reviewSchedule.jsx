import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSchedule } from '../hooks/index.js';
import { SLOTS } from '../utils/dates.js';
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

export default function ReviewScheduleScreen() {
  const navigate = useNavigate();
  const {
    medicines,
    thumbnail,
    hasNeedsReview,
    updateMedicine,
    confirmMedicineReview,
    addMedicine,
    deleteMedicine,
    approveSchedule
  } = useSchedule();

  const [zoomOpen, setZoomOpen] = useState(false);
  const [pharmacistOpen, setPharmacistOpen] = useState(false);
  const [editingMed, setEditingMed] = useState(null);
  const [isNewMed, setIsNewMed] = useState(false);

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
      form: 'tablet',
      slots: ['dawn'],
      food: 'After breakfast',
      notes: '',
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
      slots: editingMed.slots.length > 0 ? editingMed.slots : ['dawn'],
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

  const handleApprove = () => {
    if (hasNeedsReview) return;
    const ok = approveSchedule();
    if (ok) {
      navigate('/app');
    }
  };

  const suggestions = editingMed ? searchMedicinesCatalog(editingMed.name) : [];

  return (
    <div className="w-full max-w-[420px] mx-auto min-h-screen bg-surface flex flex-col pt-safe pb-safe px-margin">
      {/* Fixed Header Bar */}
      <TopBar variant="mobile-review" title="Review Schedule" backTo="/scan" />

      {/* Main Content Stream */}
      <main className="flex-1 flex flex-col pb-28">
        {/* Scanned Rx Paper Card with Real Thumbnail */}
        <div className="relative w-full h-[120px] rounded-2xl overflow-hidden bg-surface-container-lowest border border-card-border shadow-sm mb-space-lg flex items-center justify-between px-space-md">
          <div className="flex items-center space-x-space-sm min-w-0">
            <div className="w-14 h-14 rounded-xl overflow-hidden bg-surface-container flex items-center justify-center flex-shrink-0 border border-card-border">
              <img
                src={thumbnail || '/samples/cura_sample_image1.jpg'}
                alt="Scanned prescription paper thumbnail"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col min-w-0 pl-2">
              <span className="font-headline-2 text-[20px] leading-[26px] text-on-surface font-semibold truncate">
                Scanned Rx Paper
              </span>
              <span className="font-caption text-caption text-secondary truncate">
                Ready for verification
              </span>
            </div>
          </div>
          <button
            type="button"
            id="inspect-doc-btn"
            onClick={() => setZoomOpen(true)}
            aria-label="Inspect prescription document"
            className="w-11 h-11 rounded-full bg-surface-container-lowest border border-card-border flex items-center justify-center shadow-sm flex-shrink-0 text-on-surface active:bg-surface-container transition-colors focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span className="material-symbols-outlined text-[22px]">zoom_in</span>
          </button>
        </div>

        {/* Medicine Cards List */}
        <div className="flex flex-col space-y-gutter w-full" id="review-cards-list">
          {medicines.map((med) => {
            const hasReviewIssue = Boolean(med.needsReview);
            const slotLabels = (med.slots || [])
              .map((s) => {
                const def = SLOTS.find((item) => item.id === s);
                return def ? `${def.label} (${def.time})` : s;
              })
              .join(', ');

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
                <div className="flex items-start justify-between">
                  <h2 className="font-headline-2 text-headline-2 text-on-surface">
                    {med.name} {med.strength}
                  </h2>
                  {hasReviewIssue ? (
                    <div className="flex items-center space-x-1 text-warning-amber font-caption-bold text-caption-bold">
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
                  <div className="h-8 rounded-full px-3 bg-surface-container-low border border-card-border flex items-center justify-center">
                    <span className="font-caption-bold text-caption-bold text-on-surface">
                      {slotLabels || 'Daily dose'}
                    </span>
                  </div>
                  <div className="h-8 rounded-full px-3 bg-surface-container-low border border-card-border flex items-center justify-center">
                    <span className="font-caption-bold text-caption-bold text-on-surface">
                      {med.food || 'After meal'}
                    </span>
                  </div>
                </div>

                {hasReviewIssue && (
                  <div className="mt-3 pt-3 border-t border-warning-amber/20 flex items-center justify-between">
                    <span className="font-caption text-caption text-muted-text">
                      Dosage verified with prescription?
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        confirmMedicineReview(med.id);
                      }}
                      className="text-primary font-caption-bold underline px-2 py-1 focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
                    >
                      Confirm details
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Help Link & Manual Add */}
        <div className="w-full flex flex-col items-center py-space-lg gap-2">
          <button
            type="button"
            id="ask-pharmacist-link"
            onClick={() => setPharmacistOpen(true)}
            className="font-body-semibold text-body-semibold text-secondary underline active:text-on-surface transition-colors py-2 focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
          >
            Not sure? Ask your pharmacist
          </button>
          <button
            type="button"
            onClick={openAddManualSheet}
            className="font-caption-bold text-caption-bold text-primary hover:underline py-1 px-3 rounded-lg"
          >
            + Add medicine manually
          </button>
        </div>

        {/* Bottom Fixed Action Container */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface/90 backdrop-blur-md px-margin pb-safe pt-space-xs border-t border-card-border/60">
          <div className="max-w-[420px] mx-auto w-full pb-space-sm">
            <button
              type="button"
              id="approve-schedule-btn"
              disabled={hasNeedsReview}
              onClick={handleApprove}
              className={`w-full h-14 bg-primary-container text-on-lime rounded-2xl font-body-semibold text-body-semibold flex items-center justify-center shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-primary ${
                hasNeedsReview ? 'cursor-not-allowed' : 'hover:opacity-95 active:scale-[0.99]'
              }`}
            >
              Approve schedule
            </button>
          </div>
        </div>
      </main>

      {/* Zoom Modal */}
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
                Prescription Sheet
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
              src={thumbnail || '/samples/cura_sample_image1.jpg'}
              alt="Full prescription sheet view"
              className="w-full max-h-[70vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}

      {/* Ask Pharmacist Dialog Modal */}
      <BottomSheet
        isOpen={pharmacistOpen}
        title="Ask Your Pharmacist"
        onClose={() => setPharmacistOpen(false)}
      >
        <p className="font-body text-body text-secondary mb-4 leading-relaxed">
          If any handwriting or dosage on your paper prescription looks unclear, show this sheet
          directly to your local registered pharmacist to confirm your schedule.
        </p>
        <button
          type="button"
          onClick={() => setPharmacistOpen(false)}
          className="w-full h-12 bg-primary-container text-on-lime rounded-xl font-body-semibold flex items-center justify-center"
        >
          Got it
        </button>
      </BottomSheet>

      {/* Edit / Add Medicine BottomSheet */}
      <BottomSheet
        isOpen={Boolean(editingMed)}
        title={isNewMed ? 'Add Medicine' : 'Review Medicine'}
        onClose={() => setEditingMed(null)}
      >
        {editingMed && (
          <form onSubmit={handleSaveEditor} className="flex flex-col gap-4">
            <div>
              <label
                htmlFor="edit-med-name"
                className="block font-caption-bold text-caption-bold text-secondary mb-1"
              >
                Medicine Name
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

            <div>
              <label
                htmlFor="edit-med-strength"
                className="block font-caption-bold text-caption-bold text-secondary mb-1"
              >
                Strength
              </label>
              <input
                id="edit-med-strength"
                type="text"
                required
                value={editingMed.strength}
                onChange={(e) => setEditingMed({ ...editingMed, strength: e.target.value })}
                placeholder="e.g. 500 mg"
                className="w-full h-12 px-4 rounded-xl border border-card-border bg-surface font-body text-body text-on-surface"
              />
            </div>

            <div>
              <span className="block font-caption-bold text-caption-bold text-secondary mb-2">
                Time of Day
              </span>
              <div className="grid grid-cols-2 gap-2">
                {SLOTS.map((slot) => {
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
                className="block font-caption-bold text-caption-bold text-secondary mb-1"
              >
                Meal Timing
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
                Save &amp; Confirm
              </button>
            </div>
          </form>
        )}
      </BottomSheet>
    </div>
  );
}
