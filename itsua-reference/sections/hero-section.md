# Section: § 00 Studio Specification (Hero Section)

**Status:** [VERIFIED via CDP Computed Styles & Reverse Engineered JS]  
**DOM Target:** `div#hero-root.relative`  
**Section Index:** Band 01  
**Desktop Offset / Height:** Top: `57px` | Height: `659.7px` | Width: `1407px`  
**Mobile Offset / Height:** Top: `103px` | Height: `526.0px` | Width: `390px`  

---

## 1. Section Structure & Visual Hierarchy

The hero section introduces the studio with architectural precision:

```
+-------------------------------------------------------------------------+
| [Section Marker]  § 00 — STUDIO SPECIFICATION                            |
|                                                                         |
| [Main Headline]   A full-stack engineering studio                       |
|                   Shipping since 2014                                   |
|                                                                         |
| [Abstract Block]  ABSTRACT                                              |
|                   ITSUA designs, builds, and operates custom web        |
|                   applications for product teams in 20+ verticals.      |
|                   Small senior teams, weekly demos, production on       |
|                   a known date.                                         |
|                                                                         |
| [CTA Button]      → REQUEST PROPOSAL                                    |
|                                                                         |
| [Background]      12 staggered kinetic parallax lines (#hero-lines)     |
+-------------------------------------------------------------------------+
```

---

## 2. Component Specifications & Measurements

### A. Section Label (`§ 00 — STUDIO SPECIFICATION`)
- **Tag:** `span` / `div`
- **Font Family:** `var(--font-mono)` (JetBrains Mono)
- **Font Size:** `12px`
- **Font Weight:** `500` (Medium)
- **Color:** `--color-sub: #60636a`
- **Text Transform:** `uppercase`
- **Tracking:** `0.05em`

### B. Main Display Headline (`h1`)
- **Text:** "A full-stack engineering studio / Shipping since 2014"
- **Font Family:** `var(--font-sans)` (Space Grotesk)
- **Font Size (Desktop):** `72px` (`4.5rem`) - fluid up to `80px` on wide screens
- **Font Size (Mobile):** `38px` - `42px`
- **Line Height:** `1.08`
- **Letter Spacing:** `-0.03em`
- **Font Weight:** `700` (Bold)
- **Color:** `--color-ink: #0e1012`
- **Layout Behavior:** Splits across 2 to 3 lines with clean typographic rag.

### C. Abstract Paragraph Block
- **Container:** `div.grid` / `max-w-[540px]`
- **Header Label:** "ABSTRACT" (`font-mono text-[11px] tracking-widest text-sub`)
- **Body Text:** "ITSUA designs, builds, and operates custom web applications for product teams in 20+ verticals. Small senior teams, weekly demos, production on a known date."
- **Font Family:** `var(--font-sans)` (Space Grotesk)
- **Font Size:** `16px` (`1rem`)
- **Line Height:** `1.55` (`25px`)
- **Color:** `--color-ink: #0e1012`
- **Font Weight:** `400` (Normal)

### D. Primary CTA Button (`→ REQUEST PROPOSAL`)
- **Tag:** `button` / `a[data-popup-trigger="start"]`
- **Dimensions:** Height: `44px` | Padding: `0 20px` (`py-3 px-5`)
- **Background:** `--color-ink: #0e1012`
- **Text Color:** `#ffffff`
- **Border Radius:** `4px` (`rounded`)
- **Font Family:** `var(--font-mono)`
- **Font Size:** `12px`
- **Font Weight:** `500`
- **Hover State:** Background shifts to `--color-accent: #2f4cff` with smooth 150ms transition.

---

## 3. Kinetic Animation: Staggered Scroll Exit Parallax

Extracted directly from runtime script `2-inline.js`:

### The Mathematical Formula:
```javascript
const n = document.getElementById("hero-lines");
const o = Array.from(n.querySelectorAll(".hero-line"));
const s = n.parentElement;
const r = o.length;     // 12 lines
const l = 14;           // 14px stagger distance per line
const c = 150;          // 150px scroll travel window
const i = 1200;         // 1200px maximum travel offset

const a = () => {
  const d = s.getBoundingClientRect();
  const h = Math.max(0, -d.top); // Scroll distance past top
  o.forEach((u, E) => {
    // Stagger progress calculation per line
    const progress = Math.max(0, Math.min(1, (h - (r - 1 - E) * l) / c));
    const m = -progress * i;
    u.style.translate = `0 ${m.toFixed(2)}px`;
  });
};
```

### Visual Effect Description:
As the user begins scrolling down from the top of the page, the 12 background grid/lines do not scroll uniformly. Instead, they exit upwards with a cascading stagger: the bottom lines begin moving first, accelerating upward by up to `-1200px` across the initial `150px` of page scroll, creating a dynamic mechanical shutter exit.

