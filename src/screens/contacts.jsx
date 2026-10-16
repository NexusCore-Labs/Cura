import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useContacts, useTextSize } from '../hooks/index.js';
import TopBar from '../components/TopBar.jsx';
import BottomNav from '../components/BottomNav.jsx';
import BottomSheet from '../components/BottomSheet.jsx';

export default function ContactsScreen() {
  const { profile } = useTextSize();
  const { contacts, maxReached, addContact, updateContact, deleteContact } = useContacts();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formState, setFormState] = useState({ name: '', relation: 'Family', phone: '' });
  const [formError, setFormError] = useState('');

  const openAdd = () => {
    if (maxReached) return;
    setEditingId(null);
    setFormState({ name: '', relation: 'Family', phone: '91' });
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (contact) => {
    setEditingId(contact.id);
    setFormState({
      name: contact.name,
      relation: contact.relation,
      phone: contact.phone
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');
    const result = editingId
      ? updateContact(editingId, formState)
      : addContact(formState);

    if (!result.ok) {
      setFormError(result.error);
      return;
    }
    setModalOpen(false);
  };

  return (
    <div className="bg-background font-body text-body text-on-surface min-h-screen flex flex-col">
      <TopBar patientName={profile?.patientName || 'Ramesh'} activeSection="contacts" />

      <div className="flex-1 flex flex-col relative w-full pt-safe lg:pt-24 pb-28">
        <div className="flex flex-col w-full max-w-[540px] mx-auto px-margin">
          <header className="flex items-center justify-between pt-4 pb-2">
            <div>
              <h1 className="font-headline-1 text-headline-1 text-on-surface">
                Caregiver Contacts
              </h1>
              <p className="font-caption text-caption text-secondary mt-1">
                People notified when doses are taken (Max 3)
              </p>
            </div>
            <Link
              to="/app"
              aria-label="Close contacts"
              className="lg:hidden w-11 h-11 rounded-xl bg-surface-container flex items-center justify-center text-on-surface"
            >
              <span className="material-symbols-outlined text-[24px]">close</span>
            </Link>
          </header>

          <main className="mt-6 flex flex-col space-y-4">
            {contacts.map((c) => (
              <div
                key={c.id}
                className="bg-surface-container-lowest border border-card-border rounded-3xl p-5 shadow-sm flex items-center justify-between"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-primary-container/20 flex items-center justify-center text-primary flex-shrink-0">
                    <span className="material-symbols-outlined text-[24px]">person</span>
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-headline-2 text-[20px] text-on-surface font-semibold truncate">
                      {c.name}
                    </h2>
                    <p className="font-caption text-caption text-secondary truncate">
                      {c.relation} • +{c.phone}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => openEdit(c)}
                    aria-label={`Edit ${c.name}`}
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-secondary hover:text-on-surface hover:bg-surface-container transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteContact(c.id)}
                    aria-label={`Remove ${c.name}`}
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-error hover:bg-error-container/30 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                </div>
              </div>
            ))}

            {maxReached ? (
              <div className="p-4 rounded-2xl bg-surface-container-low border border-card-border/60 text-center">
                <span className="font-caption text-caption text-secondary">
                  Contact limit reached (3 of 3). Remove one to add another.
                </span>
              </div>
            ) : (
              <button
                type="button"
                id="add-contact-btn"
                onClick={openAdd}
                className="w-full h-14 rounded-2xl border-2 border-dashed border-card-border hover:border-primary text-secondary hover:text-primary font-body-semibold text-body-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <span className="material-symbols-outlined text-[22px]">add</span>
                <span>Add Contact</span>
              </button>
            )}
          </main>
        </div>
        <BottomNav activeRoute="today" />
      </div>

      <BottomSheet
        isOpen={modalOpen}
        title={editingId ? 'Edit Caregiver Contact' : 'Add Caregiver Contact'}
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {formError && (
            <p role="alert" className="font-caption text-caption text-error">
              {formError}
            </p>
          )}
          <div>
            <label
              htmlFor="contact-name"
              className="block font-caption-bold text-caption-bold text-secondary mb-1"
            >
              Name
            </label>
            <input
              id="contact-name"
              type="text"
              required
              value={formState.name}
              onChange={(e) => setFormState({ ...formState, name: e.target.value })}
              placeholder="e.g. Neha"
              className="w-full h-12 px-4 rounded-xl border border-card-border bg-surface font-body text-body text-on-surface"
            />
          </div>

          <div>
            <label
              htmlFor="contact-relation"
              className="block font-caption-bold text-caption-bold text-secondary mb-1"
            >
              Relationship
            </label>
            <input
              id="contact-relation"
              type="text"
              value={formState.relation}
              onChange={(e) => setFormState({ ...formState, relation: e.target.value })}
              placeholder="e.g. Daughter"
              className="w-full h-12 px-4 rounded-xl border border-card-border bg-surface font-body text-body text-on-surface"
            />
          </div>

          <div>
            <label
              htmlFor="contact-phone"
              className="block font-caption-bold text-caption-bold text-secondary mb-1"
            >
              WhatsApp Number (with country code)
            </label>
            <input
              id="contact-phone"
              type="tel"
              required
              value={formState.phone}
              onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
              placeholder="e.g. 919876543210"
              className="w-full h-12 px-4 rounded-xl border border-card-border bg-surface font-body text-body text-on-surface"
            />
          </div>

          <button
            type="submit"
            className="w-full h-12 rounded-xl bg-primary-container text-on-lime font-body-semibold"
          >
            {editingId ? 'Save Changes' : 'Add Contact'}
          </button>
        </form>
      </BottomSheet>
    </div>
  );
}
