/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,html}"
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        /**
         * Brand palette (source of truth).
         * `primary` is the readable green used for text/icons on light mint;
         * `primary-container` is the bright brand green used for solid fills
         * (always paired with the dark `on-lime` text, as in the reference design).
         */
        text: "#061e0f",
        background: "#effcf4",
        primary: "#0b8a4b",
        secondary: "#92acea",
        accent: "#6a57df",

        /* Material-style roles mapped onto the palette above */
        "on-tertiary-container": "#623e00",
        outline: "#7b9a8b",
        "primary-fixed": "#d3f8e2",
        "surface-variant": "#d2ecdb",
        "on-error": "#ffffff",
        "on-primary": "#04240f",
        "surface-container": "#e6f7ec",
        "surface-container-low": "#f6fdf8",
        "tertiary-fixed": "#ffddb5",
        tertiary: "#835400",
        "surface-container-high": "#dbf1e3",
        "secondary-fixed-dim": "#b8c8f0",
        "on-tertiary": "#ffffff",
        "tertiary-fixed-dim": "#ffb956",
        "error-container": "#ffe1dd",
        "inverse-primary": "#3bd979",
        "on-tertiary-fixed-variant": "#643f00",
        "on-background": "#061e0f",
        "on-primary-fixed": "#04240f",
        "secondary-container": "#dbe6ff",
        "on-secondary-container": "#31456f",
        "on-secondary-fixed": "#0f1c36",
        "surface-bright": "#f9fefb",
        "primary-fixed-dim": "#8ee9b4",
        "error": "#c0392b",
        "surface-dim": "#dcefe3",
        "on-secondary": "#061e0f",
        "on-surface": "#061e0f",
        "on-secondary-fixed-variant": "#3f5177",
        "primary-container": "#3bd979",
        "surface-container-highest": "#d2ecdb",
        "outline-variant": "#cfe4d7",
        "tertiary-container": "#eca640",
        "secondary-fixed": "#dfe7ff",
        "surface-container-lowest": "#ffffff",
        "on-primary-fixed-variant": "#0b5a34",
        "on-primary-container": "#04240f",
        surface: "#effcf4",
        "surface-tint": "#0b8a4b",
        "on-surface-variant": "#3e5b4b",
        "inverse-on-surface": "#e8f6ee",
        "on-tertiary-fixed": "#2a1800",
        "on-error-container": "#7d2018",
        "inverse-surface": "#0b2018",

        /* Additional design system tokens */
        "on-lime": "#04240f",
        "card-border": "#dfeee5",
        "card-dark": "#0d1f16",
        "warning-amber": "#e0a63c",
        "muted-text": "#4f7263"
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
        full: "9999px"
      },
      spacing: {
        "space-xs": "8px",
        "space-sm": "16px",
        "space-md": "20px",
        "space-lg": "24px",
        "space-xl": "32px",
        margin: "24px",
        gutter: "16px"
      },
      fontFamily: {
        heading: ["Inter", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
        "body-semibold": ["Inter", "system-ui", "sans-serif"],
        caption: ["Inter", "system-ui", "sans-serif"],
        "caption-bold": ["Inter", "system-ui", "sans-serif"],
        "headline-1": ["Inter", "system-ui", "sans-serif"],
        "headline-2": ["Inter", "system-ui", "sans-serif"]
      },
      fontWeight: {
        normal: "400",
        semibold: "600",
        bold: "700"
      },
      fontSize: {
        /* Semantic scale used across the app */
        caption: ["14px", { lineHeight: "20px", fontWeight: "400" }],
        "caption-bold": ["14px", { lineHeight: "20px", fontWeight: "600" }],
        body: ["17px", { lineHeight: "26px", fontWeight: "400" }],
        "body-semibold": ["17px", { lineHeight: "26px", fontWeight: "600" }],
        "headline-2": ["21px", { lineHeight: "28px", fontWeight: "600" }],
        "headline-1": ["32px", { lineHeight: "40px", fontWeight: "700" }],
        /* Numeric scale */
        sm: "0.750rem",
        base: "1rem",
        xl: "1.333rem",
        "2xl": "1.777rem",
        "3xl": "2.369rem",
        "4xl": "3.158rem",
        "5xl": "4.210rem"
      }
    }
  }
};
