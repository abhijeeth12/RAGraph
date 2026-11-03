# Component Specification: Buttons & Interactive Links

**Status:** [VERIFIED via CDP Computed Styles & CSS AST]  

---

## 1. Button Archetypes & Variants

Itsua uses 3 primary button variants across its interface:

```
+-----------------------------------------------------------------------------------------+
| [Primary Dark CTA]        [Inverted White CTA]        [Micro Terminal Pill]             |
| +--------------------+    +--------------------+      +--------------------+            |
| | → REQUEST PROPOSAL |    | → OPEN BRIEF FORM  |      | /start MORE →      |            |
| +--------------------+    +--------------------+      +--------------------+            |
| Bg: #0e1012, Text: #fff   Bg: #fff, Text: #0e1012     Transparent, Hover underline      |
+-----------------------------------------------------------------------------------------+
```

---

## 2. Technical Specifications

### A. Primary Dark CTA (`button`, `a[data-popup-trigger="start"]`)
- **Background:** `--color-ink: #0e1012` (`rgb(14, 16, 18)`)
- **Text Color:** `#ffffff`
- **Font Family:** `var(--font-mono)` (JetBrains Mono)
- **Font Size:** `12px` (`0.75rem`)
- **Font Weight:** `500` (Medium)
- **Padding:** `12px 20px` (`py-3 px-5`)
- **Height:** `44px`
- **Border Radius:** `4px` (`rounded`)
- **Border:** `1px solid transparent`
- **Hover Transition:** `background-color 0.15s ease, transform 0.1s ease`
- **Hover State:** Background becomes `--color-accent: #2f4cff`, subtle `scale(1.01)`.
- **Active / Pressed:** `scale(0.99)`.

### B. Inverted White CTA (Used in Dark Closer Band 08)
- **Background:** `#ffffff`
- **Text Color:** `--color-ink: #0e1012`
- **Font Family:** `var(--font-mono)`
- **Font Size:** `13px`
- **Font Weight:** `600` (Semi-bold)
- **Padding:** `14px 24px`
- **Height:** `48px`
- **Border Radius:** `4px`
- **Hover State:** Background becomes `--color-accent: #2f4cff`, text becomes `#ffffff`.

### C. Text Action Links (`MORE DETAILS →`, `SHOW ALL 33 →`)
- **Font Family:** `var(--font-mono)`
- **Font Size:** `12px`
- **Font Weight:** `500`
- **Color:** `--color-sub: #60636a`
- **Arrow Icon:** Unicode rightward arrow `→` with `2px` left margin.
- **Hover State:** Color shifts to `--color-accent: #2f4cff`, text underlines.

### D. External Links (`ALL ON CLUTCH ↗`)
- **Arrow Icon:** North-east arrow `↗`.
- **Attributes:** `target="_blank" rel="noopener noreferrer"`.
- **Hover State:** Arrow translates `1px` top-right on hover.

