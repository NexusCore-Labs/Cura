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
        "on-tertiary-container": "#623e00",
        "primary": "#436900",
        "outline": "#727a64",
        "primary-fixed": "#b2f750",
        "surface-variant": "#dee4db",
        "on-error": "#ffffff",
        "on-primary": "#ffffff",
        "surface-container": "#e9f0e7",
        "surface-container-low": "#eff6ec",
        "tertiary-fixed": "#ffddb5",
        "tertiary": "#835400",
        "surface-container-high": "#e3eae1",
        "secondary-fixed-dim": "#c4c7c3",
        "on-tertiary": "#ffffff",
        "tertiary-fixed-dim": "#ffb956",
        "error-container": "#ffdad6",
        "inverse-primary": "#98d935",
        "on-tertiary-fixed-variant": "#643f00",
        "on-background": "#171d18",
        "on-primary-fixed": "#112000",
        "secondary-container": "#dbded9",
        "on-secondary-container": "#5e625e",
        "on-secondary-fixed": "#191c1a",
        "secondary": "#5b5f5c",
        "surface-bright": "#f5fbf2",
        "primary-fixed-dim": "#98d935",
        "background": "#f5fbf2",
        "error": "#ba1a1a",
        "surface-dim": "#d5dcd3",
        "on-secondary": "#ffffff",
        "on-surface": "#171d18",
        "on-secondary-fixed-variant": "#444844",
        "primary-container": "#86c61f",
        "surface-container-highest": "#dee4db",
        "outline-variant": "#c2cab1",
        "tertiary-container": "#eca640",
        "secondary-fixed": "#e0e3df",
        "surface-container-lowest": "#ffffff",
        "on-primary-fixed-variant": "#314f00",
        "on-primary-container": "#314e00",
        "surface": "#f5fbf2",
        "surface-tint": "#436900",
        "on-surface-variant": "#424936",
        "inverse-on-surface": "#ecf3ea",
        "on-tertiary-fixed": "#2a1800",
        "on-error-container": "#93000a",
        "inverse-surface": "#2b322c",
        // Additional design system tokens for normalization without hex codes
        "on-lime": "#1F2D17",
        "card-border": "#E6E6E1",
        "card-dark": "#2A2E2B",
        "warning-amber": "#E8A33D",
        "muted-text": "#5F665F"
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
        body: ["Nunito Sans", "sans-serif"],
        "body-semibold": ["Nunito Sans", "sans-serif"],
        caption: ["Nunito Sans", "sans-serif"],
        "caption-bold": ["Nunito Sans", "sans-serif"],
        "headline-1": ["Nunito Sans", "sans-serif"],
        "headline-2": ["Nunito Sans", "sans-serif"],
      },
      fontSize: {
        caption: ["14px", { lineHeight: "20px", fontWeight: "400" }],
        "caption-bold": ["14px", { lineHeight: "20px", fontWeight: "700" }],
        body: ["18px", { lineHeight: "28px", fontWeight: "400" }],
        "body-semibold": ["18px", { lineHeight: "28px", fontWeight: "600" }],
        "headline-2": ["22px", { lineHeight: "30px", fontWeight: "600" }],
        "headline-1": ["32px", { lineHeight: "40px", fontWeight: "700" }]
      }
    }
  }
};
