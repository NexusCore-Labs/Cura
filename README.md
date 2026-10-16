# Cura — Senior-Friendly Medication Companion

Cura reads a photographed prescription (often handwritten), lets a caregiver review and approve the schedule, displays it as four daily groups (**Dawn 07:00**, **Midday 13:00**, **Dusk 18:00**, **Night 21:00**), lets the patient tick doses off, explains each medicine in plain language via Gemini, reads it aloud, and opens WhatsApp with a prefilled confirmation message to a family contact.

> **Safety Principle:** Cura organises and explains. It **never** diagnoses, recommends, or changes doses.

---

## Stack

- **Vite + React 18 + Tailwind CSS** (built via PostCSS). JSX, functional components, and hooks.
- **HashRouter (`react-router-dom`)** with single-pane mobile (`< 1024px`) and two-pane desktop (`>= 1024px`) responsive layouts.
- **Self-hosted Typography & Icons:** `@fontsource/nunito-sans` and `material-symbols`.
- **Framework-free `src/utils/` & `src/services/`:**
  - `src/utils/storage.js` — `localStorage` models (`cura.profile`, `cura.contacts`, `cura.schedule`, `cura.doseLog`, `cura.explanations`) and `sessionStorage` 300px temporary thumbnail.
  - `src/utils/dates.js` — Real calendar strip dates and Dawn/Midday/Dusk/Night slot definitions.
  - `src/utils/schedule.js` — Medical shorthand decoder (`OD`, `BD`, `TDS`, `QID`, `1-0-1`, `HS`, `AC`, `PC`) and `fuse.js` fuzzy matcher against `src/data/medicines.json`.
  - `src/utils/audio.js` — Web Speech API readout (`en-IN`, `hi-IN`, `mr-IN`) and muteable WebAudio confirmation chime.
  - `src/services/dispatchService.js` — Provider-based caregiver alert builder (`wa.me` sanitized digit links).
  - `src/services/ocrService.js` — Client image downscaling (max 1280px JPEG q0.8, 4 MB cap, 30s timeout + 1 retry).
  - `src/services/explainService.js` — Guarded plain-language medicine explanation client with local caching.
- **Vercel Serverless Functions (`api/`):**
  - `api/read-prescription.js` — Calls Gemini Vision in JSON mode using server-side `GEMINI_API_KEY`.
  - `api/explain-medicine.js` — Calls Gemini in JSON mode with only generic name, strength, form, and language.

---

## Environment Variables & Vercel Deployment

Copy `.env.example` to `.env.local` for local development or configure the variables in your Vercel project settings:

```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
```

- `GEMINI_API_KEY` is read **exclusively** inside `api/read-prescription.js` and `api/explain-medicine.js` and is never bundled into client code.

### Commands

```bash
npm install
npm run dev      # Start Vite development server on port 5173
npm test         # Run unit tests for shorthand decoding, fuzzy matching, dates, and dispatch
npm run build    # Production build to dist/
```

---

*A hackathon project. Not medical advice.*
