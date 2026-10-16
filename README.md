# 🌿 Cura — Renaissance Assistive Health Station

> **Transforming chaotic medical handwriting into clean, dignifying, and accessible daily care routines.**

Cura is a zero-hardware, browser-based assistive health hub built to simplify medical schedule management for elderly individuals, patients in recovery, and their caregivers. By combining multimodal optical recognition with a Renaissance-inspired daylight timeline and automated caregiver dispatch, Cura turns confusing prescriptions into clear, actionable care routines.

---

## 🏛️ The Problem & Our Vision

Medical schedules are notoriously difficult to manage:
* **Doctor Handwriting is Unreadable:** Cursive contractions, Latin shorthand (*b.i.d.*, *p.c.*, *q.d.*), and messy scribbles cause medication errors and anxiety for families.
* **Clinical Interfaces are Cold & Stressful:** Standard health apps feel like sterile hospital monitors, frustrating elderly users.
* **Caregiver Isolation:** Family members and caregivers constantly worry whether a dose was taken or if instructions were misread.

**Cura addresses these challenges by:**
1. Using **Google Gemini 1.5 Flash** to parse handwritten medical shorthand into structured, validated JSON schedules.
2. Presenting tasks through an **Ambient Daylight Timeline** (*Dawn*, *Midday*, *Dusk*, *Night*) built with warm, high-contrast typography.
3. Enabling **One-Tap WhatsApp Dispatch** so caregivers stay informed without needing complex backend servers.

---

## ✨ Key Features

* **📷 Multimodal Prescription Scanner:** Hold any handwritten prescription up to the webcam to extract drug names, dosages, frequencies, and meal instructions in seconds.
* **🌅 Ambient Daylight Cards:** Replaces confusing calendar grids with 4 intuitive daylight time blocks (*Dawn, Midday, Dusk, Night*).
* **🔊 Web Speech & Audio Harmony:** Synthesizes clear voice instructions and plays harmonic pentatonic bells upon task confirmation.
* **✉️ Caregiver WhatsApp Bridge:** Instantly shares structured daily care plans with family members using native `wa.me` deep links.
* **💾 Zero-Backend Persistence:** Runs entirely client-side using browser `localStorage` and `WebAssembly` for maximum speed and privacy.

---

## 🛠️ Tech Stack

* **Build Tool:** [Vite](https://vitejs.dev/) (Vanilla JS Template)
* **Styling & UI:** Tailwind CSS + HTML5 Canvas API (Glassmorphism & Gold Accent Theme)
* **Multimodal OCR Engine:** Google Gemini 1.5 Flash API (`@google/genai`)
* **Audio & Speech:** Native Web Audio API (`AudioContext`) + Web Speech API (`speechSynthesis`)
* **Dispatch Pipeline:** WhatsApp Web Scheme (`https://api.whatsapp.com/send?phone=...`)
* **Deployment:** Vercel / GitHub Pages

---

## 📁 Repository Structure

```text
cura/
├── index.html                  # Main application shell & viewport layout
├── package.json                # Project scripts & Vite config
├── vite.config.js              # Environment variable handling
├── .env.local                  # Local API keys (VITE_GEMINI_API_KEY)
├── .gitignore                  # Git exclusions (node_modules, dist, .env)
├── public/
│   ├── favicon.ico
│   └── samples/                # Demo fallback prescription images
│       ├── sample_prescription_1.jpg
│       └── sample_prescription_2.jpg
└── src/
    ├── main.js                 # Application lifecycle & state controller
    ├── style.css               # Renaissance gold theme & custom CSS
    ├── config.js               # Preset constants & configuration
    ├── components/
    │   ├── camera.js           # Webcam video stream & frame capture
    │   ├── timeline.js         # Canvas/DOM renderer for daylight cards
    │   └── settingsModal.js    # Modal for caregiver contacts & API settings
    ├── services/
    │   ├── ocrService.js       # Gemini 1.5 Flash vision parser
    │   ├── dictionary.js       # Medical shorthand & drug name fuzzy-matcher
    │   └── dispatchService.js  # WhatsApp URL scheme generator & Speech synthesis
    └── utils/
        ├── audio.js            # Web Audio API harmonic chime synthesizer
        └── storage.js          # LocalStorage persistence manager
