# Design System: Complete Design Tokens Specification

**Status:** [VERIFIED - Generated from Production CSS & Computed Tokens]  

---

## 1. Master CSS Custom Properties (`tokens.css`)

```css
:root {
  /* ==========================================================================
     COLOR TOKENS
     ========================================================================== */
  --color-bg: #ffffff;
  --color-white: #ffffff;
  --color-ink: #0e1012;
  --color-paper: #f5f5f3;
  --color-sub: #60636a;
  --color-line: #d9dadd;
  --color-accent: #2f4cff;
  --color-ink-soft: #eeeef0;

  /* Categorical Pastel Accents */
  --color-blue-soft: #eef1ff;
  --color-green: #047857;
  --color-green-bright: #34d399;
  --color-green-soft: #e6f7f1;
  --color-orange: #b45309;
  --color-orange-soft: #fff2e5;
  --color-magenta: #a21caf;
  --color-magenta-soft: #fbeefc;
  --color-red-soft: #fdecec;
  --color-yellow-soft: #fcfdec;

  /* ==========================================================================
     TYPOGRAPHY TOKENS
     ========================================================================== */
  --font-sans: "Space Grotesk", "Söhne", "GT America", "Inter", "Helvetica Neue", Helvetica, Arial, sans-serif;
  --font-mono: "Berkeley Mono", "JetBrains Mono", "IBM Plex Mono", ui-monospace, monospace;

  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  /* ==========================================================================
     ANIMATION & TIMING CONSTANTS (Extracted from deck.js & scripts)
     ========================================================================== */
  --duration-wobble: 900ms;
  --duration-wash-stagger: 110ms;
  --duration-dot-cell-stagger: 120ms;
  --duration-dot-stagger: 70ms;
  --lerp-factor: 0.16;
  --max-wobble-deg: 15deg;

  /* ==========================================================================
     LAYOUT & RADIUS TOKENS
     ========================================================================== */
  --radius-sm: 2px;
  --radius-card: 4px;
  --radius-btn: 6px;
  --radius-full: 9999px;

  --header-height: 57px;
  --border-width-standard: 1px;
}

@media (max-width: 767px) {
  :root {
    --color-sub: #4a4d55;
    --header-height: 103px;
  }
}
```

---

## 2. Tailwind CSS Configuration Mapping (`tailwind.config.js`)

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        bg: 'var(--color-bg)',
        ink: {
          DEFAULT: 'var(--color-ink)',
          soft: 'var(--color-ink-soft)',
        },
        paper: 'var(--color-paper)',
        sub: 'var(--color-sub)',
        line: 'var(--color-line)',
        accent: 'var(--color-accent)',
        'blue-soft': 'var(--color-blue-soft)',
        green: {
          DEFAULT: 'var(--color-green)',
          bright: 'var(--color-green-bright)',
          soft: 'var(--color-green-soft)',
        },
        orange: {
          DEFAULT: 'var(--color-orange)',
          soft: 'var(--color-orange-soft)',
        },
        magenta: {
          DEFAULT: 'var(--color-magenta)',
          soft: 'var(--color-magenta-soft)',
        },
        'red-soft': 'var(--color-red-soft)',
        'yellow-soft': 'var(--color-yellow-soft)',
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
      },
      borderRadius: {
        DEFAULT: '4px',
        sm: '2px',
        md: '6px',
        full: '9999px',
      },
      spacing: {
        '14': '3.5rem', /* 56px */
        '18': '4.5rem', /* 72px */
        '36': '9rem',   /* 144px */
      },
      boxShadow: {
        card: '0 12px 32px -4px rgba(14, 16, 18, 0.08), 0 4px 12px -2px rgba(14, 16, 18, 0.04)',
        modal: '0 24px 64px -12px rgba(14, 16, 18, 0.25)',
      }
    },
  },
};
```

