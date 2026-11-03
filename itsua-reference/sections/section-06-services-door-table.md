# Section: § 04 Engagement Models (/services — Door Table)

**Status:** [VERIFIED via CDP Computed Styles & JavaScript Reverse Engineering]  
**DOM Target:** `div#services.border-t.border-line.bg-paper.px-6.py-8.md:px-14.md:py-18`  
**Table Selector:** `.door-table`  
**Row Selector:** `.door-row`  
**Section Index:** Band 06  
**Desktop Offset / Height:** Top: `3,251.3px` | Height: `1,079.0px` | Width: `1407px`  
**Mobile Height:** `1,310.5px`  
**Background Substrate:** `--color-paper: #f5f5f3` (`rgb(245, 245, 243)`)  

---

## 1. Visual Architecture & Service Offerings

The services section organizes studio capabilities into a technical grid ("Door Table") showcasing 4 core engagement models:

```
+-----------------------------------------------------------------------------------------+
| § 04 — ENGAGEMENT MODELS       /services                                MORE DETAILS →  |
|                                                                                         |
| "We take on more than the four below, including sites, small custom features, and other |
| work too small to be a service line. Yours gets its own number once we've scoped it."   |
|                                                                                         |
| +------------------------+------------------------+-----------------------------------+ |
| | [01] PRODUCT           | [02] TEAM              | [03] COMMERCE &                   | |
| | ENGINEERING            | AUGMENTATION           | SHOPIFY                           | |
| | Full-cycle MVP to      | Embedded senior        | Custom Shopify Plus apps,         | |
| | scale architecture     | engineers in your team | headless storefronts              | |
| +------------------------+------------------------+-----------------------------------+ |
| | [04] RESCUE &          | [05] CODE & UX         | [06] DEDICATED                    | |
| | REWRITE                | AUDITS                 | INFRASTRUCTURE                    | |
| | Stabilize failing      | 48-hour deep code      | Cloudflare Workers,               | |
| | legacy codebases       | and performance review | Kubernetes & CI/CD                | |
| +------------------------+------------------------+-----------------------------------+ |
| <------------------------- INTERACTIVE DOOR-TABLE GRID -------------------------------> |
+-----------------------------------------------------------------------------------------+
```

---

## 2. Component Specifications & Layout

### A. Introductory Callout Block
- **Container:** `max-w-[720px] mb-12`
- **Copy:** Space Grotesk `18px`, color `var(--color-ink)`, line height `1.5`.

### B. Door Table Grid Layout
- **Class:** `.door-table`
- **Columns (Desktop):** `grid grid-cols-2 md:grid-cols-4` or structured tabular rows `.door-row`.
- **Borders:** `1px solid var(--color-line)`, using negative margins to avoid 2px border overlaps.
- **Cell Dimensions (Desktop):** Width: `~330px` | Height: `~260px`
- **Cell Padding:** `p-8` (`32px`)

---

## 3. Kinetic Animation: The "Washing Wipe" Reveal

Extracted directly from runtime module `3-inline.js`:

### The Coordinate Projection Formula:
The door table computes custom CSS variables representing each cell's position relative to its containing row bounding box:

```javascript
// Extracted from 3-inline.js:
const a = Array.from(i.querySelectorAll(":scope > .door-row"));
a.forEach(r => {
  const e = Array.from(r.children);
  const o = e.map(t => t.getBoundingClientRect()).filter(t => t.width && t.height);
  if (!o.length) return;
  const s = Math.min(...o.map(t => t.left));
  const n = Math.min(...o.map(t => t.top));
  const p = Math.max(...o.map(t => t.right)) - s;
  const f = Math.max(...o.map(t => t.bottom)) - n;
  e.forEach(t => {
    const d = t.getBoundingClientRect();
    t.style.setProperty("--cx", `${d.left - s}px`);
    t.style.setProperty("--cy", `${d.top - n}px`);
    t.style.setProperty("--rw", `${p}px`);
    t.style.setProperty("--rh", `${f}px`);
  });
});
```

### Staggered Intersection Trigger:
When the row reaches `intersectionRatio >= 0.99`, an automated washing animation triggers:
```javascript
const l = new IntersectionObserver(r => {
  r.filter(e => e.intersectionRatio >= 0.99).forEach((e, o) => {
    const s = e.target.parentElement;
    if (s) {
      Array.from(s.children).forEach(n => {
        n.style.setProperty("--delay", `${o * 110}ms`); // 110ms stagger!
        n.classList.add("is-washing");
      });
      l.unobserve(e.target);
    }
  });
}, { threshold: 1 });
```

### CSS Transition Styling:
```css
.door-row > * {
  transition: clip-path 0.6s cubic-bezier(0.16, 1, 0.3, 1) var(--delay, 0ms),
              opacity 0.4s ease var(--delay, 0ms);
}
.door-row > *.is-washing {
  opacity: 1;
  clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
}
```
This produces an effect similar to sliding architectural doors opening in sequence across the viewport.

