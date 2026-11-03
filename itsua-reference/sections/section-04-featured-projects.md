# Section: § 02 Featured Projects (/work — 3D Card Deck)

**Status:** [VERIFIED via CDP Computed Styles & JavaScript Reverse Engineering]  
**DOM Target:** `div#featured-section.featured-section.isolate.bg-paper`  
**Deck Container:** `div#featured-deck`  
**Card Selector:** `.deck-card`  
**Section Index:** Band 04  
**Desktop Offset / Height:** Top: `1,985.7px` | Height: `582.1px` | Width: `1407px`  
**Mobile Height:** `1,002.8px` (cards fan vertically instead of horizontally)  
**Background Substrate:** `--color-paper: #f5f5f3` (`rgb(245, 245, 243)`)  

---

## 1. Visual Architecture & 3D Stage

The Featured Projects section is the visual highlight of the Itsua website. Rather than presenting a generic flat grid, projects are staged as a physical deck of 5 stacked, interactive cards positioned in CSS 3D perspective space:

```
+-----------------------------------------------------------------------------------------+
| § 02 — FEATURED PROJECTS       /work                                    SHOW ALL 33 →   |
|                                                                                         |
|       [Card 1: Crawler]    [Card 2: Retail]    [Card 3: EpinForce]   [Card 4: Blaze]     |
|      /                 \  /                \  /                  \  /              \    |
|     |  RECRUITMENT      ||  RETAIL          ||  FINTECH           ||  HOSPITALITY   |   |
|     |  PYTHON · NEST    ||  ASTRO · STRAPI  ||  REACT · NODE      ||  AI INSIGHTS   |   |
|     |  [Visual Mockup]  ||  [Visual Mockup] ||  [Visual Mockup]   ||  [Visual Mock] |   |
|     |                   ||                  ||                    ||                |   |
|      \_________________/  \________________/  \__________________/  \______________/    |
|                                                                                         |
|      [Interactive 3D Perspective Stage: perspective: 1200px; transform-style: 3d]       |
+-----------------------------------------------------------------------------------------+
```

---

## 2. Card Inventory & Specifications

The deck contains 5 primary project cards extracted from the live DOM:

| Card Index | Project Title | Category Tag | Stack Badges | Subtitle / Metric | Card Dimensions (Desktop) |
|---|---|---|---|---|---|
| **0** | **Crawler** | RECRUITMENT | `PYTHON · NEST · VUE · MYSQL` | "Live fully automated crawler" | `395.2px x 224.0px` |
| **1** | **Retail Network** | RETAIL | `ASTRO · STRAPI · MYSQL · VUE · REACT · TAILWIND` | "50+ sites · one stack" | `392.7px x 218.8px` |
| **2** | **EpinForce** | GAMING / FINTECH | `REACT · NODE.JS · POSTGRES` | "Live platform" | `390.1px x 213.5px` |
| **3** | **Blaze Reviews** | HOSPITALITY | `AI · FASTAPI · TYPESCRIPT` | "Live hotel platform · <1s insight"| `394.6px x 222.7px` |
| **4** | **99designs Contest Winners** | PORTFOLIO | `35 WEB-DESIGN CONTESTS WON` | "35 web-design contests won" | `392.0px x 217.5px` |

---

## 3. Kinetic 3D Physics & Reverse-Engineered Math

Extracted directly from decompiled modules `4-FeaturedDeck.js` and `12-deck.js`:

### A. The Card Harmonic Wobble Formula
When a user pointer enters any card (`pointerenter`), the card does not move with generic linear easing. It runs an exact harmonic spring oscillation:

$$\theta(t) = 15 \cdot \sin(\pi \cdot t) \cdot \sin(2\pi \cdot t) \quad \text{for } 0 < t < 1 \text{ over } 900\text{ms}$$

```javascript
// Extracted from deck.Cx960KMr.js:
const r = t => t <= 0 || t >= 1 ? 0 : 15 * Math.sin(Math.PI * t) * Math.sin(2 * Math.PI * t);
const H = 900; // Duration constant: 900 milliseconds
```
- **Max Amplitude:** `15 degrees` rotation.
- **Harmonic Modulation:** `sin(π*t)` enforces zero boundary conditions at $t=0$ and $t=1$, while `sin(2π*t)` introduces an organic double-wave wobble before settling.

### B. 180° 3D Flip on Click
- Clicking any card flips it around the X axis (`--rx: 180deg`), revealing technical engineering notes, architecture diagrams, and client deliverable dates on the card back.
- If already flipped, clicking again toggles it back to `0deg`.

### C. Smooth Exponential Lerp Filter
During scroll and hover tracking, rotation angles are filtered through an exponential smoothing function:

$$l_{t} = l_{t-1} + (e - l_{t-1}) \cdot 0.16$$

```javascript
// Extracted from FeaturedDeck.astro:
const e = calculateScrollTarget();
const diff = e - currentLerp;
currentLerp = Math.abs(diff) < 0.0005 ? e : currentLerp + diff * 0.16;
```
This lerp factor `0.16` provides instant, responsive tracking without jitter or lag.

### D. CSS Variables Applied to Cards
Every card receives continuous real-time CSS variable updates:
```css
.deck-card {
  transform: perspective(1200px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg));
  z-index: var(--z, 1);
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease;
}
.deck-card.is-raised {
  box-shadow: 0 12px 32px -4px rgba(14, 16, 18, 0.08), 0 4px 12px -2px rgba(14, 16, 18, 0.04);
}
```

---

## 4. Responsive Adaptation (Desktop vs Mobile)

Extracted from the breakpoint query:
```javascript
const B = window.matchMedia("(min-width: 768px)");
```
- **Desktop (`>= 768px`):** Wobble and fanning occur along the **Y axis** (`--ry`), creating horizontal card spreading like a poker hand.
- **Mobile (`< 768px`):** Wobble and fanning switch to the **X axis** (`--rx`), creating vertical card cascading that accommodates narrow portrait viewports.

