# Section: § 03 Client Reviews (/reviews — Horizontal Carousel)

**Status:** [VERIFIED via CDP Computed Styles & JavaScript Reverse Engineering]  
**DOM Target:** `div#reviews.border-t.border-line.py-8.md:py-18`  
**Track Selector:** `#review-track`  
**Controls:** `#review-prev`, `#review-next`, `#review-index`  
**Card Selector:** `.review-deck`  
**Section Index:** Band 05  
**Desktop Offset / Height:** Top: `2,567.8px` | Height: `683.5px` | Width: `1407px`  
**Mobile Height:** `987px`  

---

## 1. Visual Architecture & Layout

The reviews section features an interactive horizontal sliding carousel that showcases 18 client endorsements, case studies, and Clutch ratings:

```
+-----------------------------------------------------------------------------------------+
| § 03 — CLIENT REVIEWS       /reviews                                    ALL ON CLUTCH ↗ |
|                                                                                         |
|  [ <-- ] [ --> ]  [ 01 / 18 ]                                                           |
|                                                                                         |
|  +--------------------------------+  +--------------------------------+                 |
|  | ITSUA.COM 2023                 |  | ITSUA.COM 2024                 |                 |
|  | Retail Network                 |  | StudyBooster                   |                 |
|  | RETAIL                         |  | EDTECH                         |                 |
|  | ASTRO · STRAPI · TAILWIND      |  | NEXT.JS · PYTHON · OPENAI      |                 |
|  | "ITSUA rebuilt 50+ storefronts |  | "Delivered an AI tutor that    |                 |
|  | with zero downtime..."         |  | handles 10k concurrent users." |                 |
|  |                                |  |                                |                 |
|  | [Elena Pomazanova, CEO]        |  | [Dr. Michael Vance, Founder]   |                 |
|  +--------------------------------+  +--------------------------------+                 |
|  <--------------------------- DRAGGABLE TRACK ---------------------------->             |
+-----------------------------------------------------------------------------------------+
```

---

## 2. Interactive Mechanics & Kinematics

Extracted from decompiled module `6-inline.js`:

### A. Dynamic Height Fitting with `ResizeObserver`
Because review text lengths vary across clients, the container dynamically resizes its height to fit the currently active card without clipping:

```javascript
const f = () => {
  t.style.height = `${s[r()].offsetHeight}px`;
};
const m = new ResizeObserver(f);
s.forEach(e => m.observe(e));
```

### B. Two-Digit Counter Indexing
The index indicator updates on scroll:
```javascript
h.textContent = String(currentIndex + 1).padStart(2, "0"); // e.g. "01", "02", "18"
prevBtn.disabled = currentIndex === 0;
nextBtn.disabled = currentIndex === totalSlides - 1;
```

### C. Drag and Swipe Physics
The carousel supports continuous mouse drag and mobile touch gesture swipe:
- **Drag Initiation:** Activates when mouse drag exceeds `5px` (`Math.abs(i) > 5`). Clears browser selection and applies `.dragging` class to track.
- **Snap Threshold:** Releasing mouse or lifting finger evaluates if drag distance exceeded `10%` of client width (`Math.abs(i) > clientWidth * 0.1`). If exceeded, slides smoothly to next/previous card (`v + -Math.sign(i)`).
- **Prevent Click During Drag:** If drag occurred, synthetic click events on child links/buttons are captured and suppressed (`e.preventDefault()`, `e.stopPropagation()`).

---

## 3. Review Card Anatomy & Visual Specifications

Each `.review-deck` card is a rich engineering artifact:
- **Header Metadata:** Monospace timestamp `ITSUA.COM 2023 (active)`, category pill (e.g. `RETAIL`), project code.
- **Project Title:** Space Grotesk `22px` - `26px`, bold.
- **Technology Stack Bar:** JetBrains Mono `11px`, listing production stack (`ASTRO · STRAPI · MYSQL · VUE · REACT · TAILWIND · SHOPIFY PLUS`).
- **Quote Body:** Space Grotesk `15px` - `16px`, regular weight, line height `1.55`.
- **Client Endorsement Strip:**
  - Avatar: Circular image `40px x 40px` (`rounded-full`), extracted to `assets/extracted-assets/images/`.
  - Name: Space Grotesk `14px`, medium weight.
  - Role & Organization: JetBrains Mono `12px`, color `var(--color-sub)`.
  - Verified Rating: Clutch 5.0 Star badge or Clutch link.
- **Hover Wobble & 180° Flip:** Review cards incorporate the exact same 900ms harmonic oscillation (`c(e)`) and 180° click flip found on Featured Deck cards!

