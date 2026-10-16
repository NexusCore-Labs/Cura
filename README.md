# Cura — Senior-Friendly Medication Companion

Cura reads a photographed or scanned prescription (often handwritten), lets a caregiver review and
approve the schedule, shows it in four daily groups (**Morning 07:00**, **Afternoon 13:00**,
**Evening 18:00**, **Night 21:00** — all anchored to the patient's own meal routine), lets the
patient tick doses off, explains each medicine in plain language via Gemini, reads it aloud, and
opens WhatsApp or SMS with a prefilled message to a family contact.

> **Safety Principle:** Cura organises and explains. It **never** diagnoses, recommends, or changes doses.

---

## Design system

- **Palette:** mint background `#effcf4`, ink text `#061e0f`, bright green `#3bd979` for solid
  buttons (always with the dark `on-lime` ink), readable green `#0b8a4b` for text/icons on light
  surfaces, periwinkle `#92acea` and violet `#6a57df` accents. Deep green-black gradient panel
  (`.cura-dark-panel`) for the "prescribed daily" header card.
- **Type:** one family, **Inter**, self-hosted through `@fontsource/inter`.
- Tokens live in a single `tailwind.config.js`. `muted-text` is the readable grey-green used for
  secondary copy.

---

## Stack

- **Vite + React 18 + Tailwind CSS** (built via PostCSS). JSX, functional components, and hooks.
- **HashRouter (`react-router-dom`)** with single-pane mobile (`< 1024px`) and two-pane desktop (`>= 1024px`) responsive layouts.
- **Framework-free `src/utils/` & `src/services/`:**
  - `src/utils/storage.js` — `localStorage` models (`cura.profile`, `cura.contacts`, `cura.schedule`, `cura.doseLog`, `cura.explanations`) plus `sessionStorage` for the 300px thumbnail and the pending scan payload.
  - `src/utils/dates.js` — Meal-routine-driven dose times, the seven-day strip, and the Dawn/Midday/Dusk/Night slot definitions (`getSlotsForProfile`).
  - `src/utils/schedule.js` — Medical shorthand decoder (`OD`, `BD`, `TDS`, `QID`, `1-0-1`, `HS`, `AC`, `PC`), `fuse.js` fuzzy matcher against `src/data/medicines.json`, and `describeDose` for the user-confirmed "how to take it" line.
  - `src/utils/audio.js` — Web Speech API readout (`en-IN`) and muteable WebAudio confirmation chime.
  - `src/services/dispatchService.js` — Provider-based caregiver dispatch: `whatsapp` (`wa.me`) and `sms` (`sms:` hand-off) for both the dose confirmation and the dose reminder.
  - `src/services/ocrService.js` — Client image downscaling (max 1280px JPEG q0.8, 4 MB cap, 30s timeout + 1 retry), PDF pass-through, and sample fixtures.
  - `src/services/explainService.js` — Guarded plain-language medicine explanation client with local caching.
- **Vercel Serverless Functions (`api/`):**
  - `api/read-prescription.js` — Calls Gemini Vision/PDF in JSON mode using server-side `GEMINI_API_KEY`.
  - `api/explain-medicine.js` — Calls Gemini in JSON mode with only generic name, strength, form, and language.
  - `vite.config.js` mounts both handlers as dev middleware, so `/api/*` works under `npm run dev`.

---

## Flow

1. **Landing page** (same theme; hero has **Get started** and **See features**, which scrolls to the
   walkthrough). Get started opens the user-info pop-up.
2. **User info pop-up** — name, role (patient / family), the patient's name + relation + WhatsApp
   number for family, and the **daily routine** (breakfast / lunch / dinner times) that schedules the
   reminders. Only English is offered. Everything stays on the device.
3. Every app route waits for setup: until those details exist, `/app`, `/scan`, `/review`, `/history`,
   `/settings` and `/contacts` redirect to the landing page (`RequireSetup` in `src/App.jsx`).
4. **Scan** — desktop is **upload only** (drag-and-drop or picker; PDF, JPG, JPEG, PNG, 4 MB); mobile
   offers the rear camera, gallery/files (JPG, JPEG, PNG, PDF) and a camera-app fallback. The
   prepared payload is handed to the reading screen through `sessionStorage`.
5. **Confirm AI reading** — Cura shows what the AI saw (`raw_text` + match confidence) per medicine and
   states plainly that AI can make mistakes. The user can change the **dosage amount**, the times of
   day, the strength and the meal timing, add medicines manually, or delete them. Approving requires
   ticking an explicit AI acknowledgement (with a full disclaimer sheet).
6. **Today / medicine detail** — medicine **name and description** come from the Gemini explanation
   flow; **dosage and timings** are exactly what the user confirmed. WhatsApp and SMS reminders are
   prepared for the saved family number.

---

## Environment Variables & Vercel Deployment

Copy `.env.example` to `.env.local` for local development or configure the variables in your Vercel project settings:

```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
```

- `GEMINI_API_KEY` is read **exclusively** inside `api/read-prescription.js` and `api/explain-medicine.js` and is never bundled into client code.
- Without a key the handlers return safe sample/guarded payloads, so the whole demo flow still works locally.

### Commands

```bash
npm install
npm run dev      # Start Vite development server on port 5173
npm test         # Unit tests for shorthand decoding, fuzzy matching, dates, meal times, dosage and reminders
npm run build    # Production build to dist/
```

---

*A hackathon project. Not medical advice.*
