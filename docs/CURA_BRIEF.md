# Cura: build brief

## Product

Cura reads a photographed prescription (often handwritten), lets a caregiver review and
approve the schedule, shows it as four daily groups (Dawn 07:00, Midday 13:00, Dusk 18:00,
Night 21:00), lets the patient tick doses off, explains each medicine in plain language
(Gemini), reads it aloud, and opens WhatsApp with a prefilled message to a family contact.
It organises and explains. It NEVER diagnoses, recommends or changes doses.

## Stack

- Vite + React 18 + Tailwind (built via PostCSS). JSX, functional components, hooks.
- HashRouter (react-router-dom). One tailwind.config.js from the Stitch tokens.
- utils/ and services/ stay framework-free JS. Screens and components are .jsx.
- Never build UI by concatenating HTML strings or using innerHTML.
- Keep the existing structure: src/utils/storage.js, src/utils/dates.js, src/utils/schedule.js, src/utils/audio.js, src/services/ocrService.js, src/services/dispatchService.js, src/services/explainService.js, src/data/medicines.json, api/read-prescription.js, api/explain-medicine.js, .env.example, vercel.json, README.md.
- No database, no auth. State in localStorage via utils/storage.js.

## Design (source of truth: design/stitch/\*.html)

- Port the Stitch screens faithfully. Use ONE tailwind.config.js built from the
  theme.extend block in 01-today.html. Use ONE font: Nunito Sans. Page background #F5F5F2.
- Lime #86C61F buttons always use DARK text #1F2D17. One primary button per screen.
- Body text at least 18px, tap targets at least 48px (buttons 56px), cards radius 24px.
- Remove user-scalable=no / maximum-scale from every viewport meta.
- Responsive: below 1024px single column with bottom nav (Today, Scan, History, Settings);
  at 1024px and above, two panes (Today list 420px left, medicine detail right, top header,
  no bottom nav), as in 07-desktop-app.html. Landing page follows 06-landing.html.
- Respect prefers-reduced-motion. Visible focus rings. aria-live for status text.
- Replace every hardcoded name, date, time and message with real data (today's date from JS).

## Routes

#/ landing; #/app today (+ detail panel on desktop); #/app/med/:id detail (mobile);
#/scan; #/reading; #/review; #/contacts; #/confirmed; #/settings (minimal).
If no schedule exists, Today shows an empty state with a lime "Scan a prescription" button.

## Data (localStorage keys)

cura.profile {patientName, language: "en"|"hi"|"mr", textScale}
cura.contacts [{id, name, relation, phone}] (max 3)
cura.schedule {approvedAt, medicines:[{id, name, nameRead, strength, form, slots:[dawn|midday|dusk|night], food, notes, needsReview}]}
cura.doseLog [{date:"YYYY-MM-DD", slot, medId, takenAt}]
cura.explanations {"<generic>|<strength>|<lang>": {...explanation}}
Never persist the prescription image. Keep a 300px thumbnail in memory/sessionStorage only,
clear it after approval. Settings has "Delete all my data".

## Reading a prescription (services/ocrService.js -> /api/read-prescription)

Capture: getUserMedia (facingMode "environment") in components/camera.js with a file-upload
fallback and a permission-denied state. Downscale to max 1280px JPEG q0.8 before sending.
Function calls Gemini vision (model from env GEMINI_MODEL, default "gemini-flash-latest")
using JSON mode. Never log request bodies. Reject payloads over 4 MB. Timeout 30 s, one retry.
Friendly errors for 429 and 5xx; on failure offer "Enter medicines manually".
System instruction:
"You read photographed medical prescriptions (often handwritten) and return ONLY JSON:
{"medicines":[{"raw_text":"","name_candidates":[{"name":"","confidence":0.0}],
"strength":"","form":"tablet|capsule|syrup|drops|injection|other|unknown",
"frequency_raw":"","food_raw":"","duration":"","notes":"","legible":true}],
"image_quality":"good|poor","warnings":[]}
Rules: never guess an unreadable word (set legible=false, empty name_candidates). At most 3
candidates, best first. Copy frequency and food text exactly as written (e.g. "1-0-1","BD",
"after food"). Do not infer doses or diagnoses. Do NOT output patient or doctor names or
phone numbers. If it is not a prescription return {"medicines":[],"image_quality":"poor",
"warnings":["not_a_prescription"]}."
In code (utils/schedule.js), NOT in the model: decode shorthand to slots: "1-0-1"/"1+0+1" =
dawn+night; "1-1-1" = dawn+midday+night; "1-1-1-1" = all four; OD = dawn; BD/BID =
dawn+night; TDS/TID = dawn+midday+night; QID = all four; HS = night; AC/before food,
PC/after food set the food field; "after breakfast/lunch/dinner" also implies dawn/midday/night.
Fuzzy-match name candidates with fuse.js against src/data/medicines.json (generic, brand
names incl. common Indian brands, drug_class only; seed ~60 common entries and add a note that
a human must verify the file). needsReview = true if best confidence < 0.75, not legible,
frequency ambiguous or unknown, or strength missing.

## Review screen

Show the real thumbnail (tap to zoom) and one card per medicine. needsReview cards get the
amber outline and "Check this". Tapping a card opens an editor (bottom sheet on mobile, dialog
on desktop): name autocomplete from medicines.json, strength, time-of-day multi-select, food
select, delete. Also "Add medicine manually". "Approve schedule" stays disabled until every
amber card is edited or explicitly confirmed. "Not sure? Ask your pharmacist" opens a short dialog.

## Explaining a medicine (services/explainService.js -> /api/explain-medicine)

Send ONLY generic name, strength, form and language. No image, no patient data. Low
temperature, JSON mode, validate the JSON, cache per cura.explanations.
System instruction:
"You explain medicines to older adults and their families in simple, kind language (reading
level: age 12). You receive ONLY a generic medicine name, strength and form. Return JSON:
{"generic_name","drug_class","commonly_used_for","how_it_helps","good_to_know",
"ask_pharmacist_if","confidence","unsure"}, plus the same fields translated into {language}.
Rules: use "commonly used to..." wording. Never say what the patient has. Never give or change
doses, never say to stop or skip, never judge interactions, never diagnose. good_to_know may only
contain widely accepted general tips, otherwise leave it empty. ask_pharmacist_if must be
generic (feeling unwell after taking it; unsure about timing or a missed dose; taking other
medicines or supplements). If not confident set unsure=true and leave other fields empty. Each
field under 30 words."
UI: cards "What it's for", "How it helps", "How to take it" (from the prescription only), and a
collapsed "Ask your pharmacist if...". Always show "AI-generated general information.
Confirm with your pharmacist." If unsure: "We're not sure about this one. Please ask your
pharmacist." Translated text is labelled "AI-translated".

## Daily use

Today groups come from the schedule. Each checkbox writes to cura.doseLog. "I took it" marks
only the current group (the latest slot whose time has passed, or the next one), then opens
#/confirmed. If nothing is due the button is disabled ("All done for now").
Confirmed screen builds the message from real data: "<patientName> took the <slot time>
medicines." Button "Send to <contact> on WhatsApp" uses dispatchService: wa.me link with
digits only (strip +, spaces, dashes; require country code), opened from the click handler.
Caption: "WhatsApp will open. Tap Send." If no contact, route to #/contacts. If several, let the
user pick. Keep dispatchService provider-based so another provider can be added later.
Read aloud uses speechSynthesis through utils/audio.js with the right lang (en-IN, hi-IN, mr-IN),
real play/stop state, and graceful message if no voice is installed. A short WebAudio chime on
dose confirmation (muteable).

## Content rules (very important)

- Remove or replace every hardcoded medical claim from the Stitch screens ("Avoid grapefruit",
  "never double up", "keeps your pressure stable", "Daily Heart Care", etc.). All medicine
  text must come from the guarded explain flow or from the prescription itself.
- No dosing advice, interaction verdicts, risk labels, diagnoses or "stop taking" anywhere.
- Missed dose text: "Ask your pharmacist what to do if you miss a dose."
- Remove false marketing claims ("Free family sharing", "No credit card required",
  "© Cura Health Inc.", "Verified by ..."). Footer: "A hackathon project. Not medical advice."

## Out of scope

Login, cloud database, push notifications, pill identification by appearance, price or
pharmacy features, vitals. Label check, History and the Stats tab are stubs ("Coming soon")
unless a task says otherwise.

## Definition of done

Works at 390px and 1440px. Full flow scan -> read -> review -> approve -> today -> tick ->
confirmed -> WhatsApp works. No console errors. No keys in client code. README explains
env vars and Vercel deploy.
