# Component Specification: Navigation & Header

**Status:** [VERIFIED via CDP Computed Styles & Reverse Engineered JS]  
**DOM Target:** `<header class="sticky top-0 z-50 flex flex-wrap items-stretch border-b border-line bg-white/95 font-mono text-[12px] backdrop-blur">`  
**Sub-elements:** `#nav-scroll`, `#nav-scrollbar`, `#nav-scrollbar-thumb`, `a[data-nav-active]`  

---

## 1. Visual & Anatomical Structure

```
+-------------------------------------------------------------------------------------------------------------+
| [LOGO]       | [/start]  [/work]  [/reviews]  [/services]  [/stack]           | [CUSTOM SCROLLBAR] | [/meet CTA]|
| ITSUA.COM    |                                                                | [====thumb====]    | → /meet    |
+-------------------------------------------------------------------------------------------------------------+
```

- **Height (Desktop):** `57px`
- **Height (Mobile):** `103px` (Logo and `/meet` action sit on top row, horizontally scrollable category anchors sit on second row).
- **Position:** `sticky; top: 0; z-index: 50;`
- **Background:** `rgba(255, 255, 255, 0.95)` with `backdrop-filter: blur(8px)`.
- **Border:** Bottom border `1px solid var(--color-line)` (`#d9dadd`).
- **Font:** `var(--font-mono)` (JetBrains Mono), `12px`, weight `500`.

---

## 2. Interactive Mechanics: Custom Draggable Scrollbar

Extracted directly from runtime module `1-inline.js`:

### A. Scroll Ratio & Thumb Geometry Calculation
```javascript
const e = document.getElementById("nav-scroll");
const s = document.getElementById("nav-scrollbar");
const c = document.getElementById("nav-scrollbar-thumb");

const updateScrollbar = () => {
  const { scrollWidth: t, clientWidth: n, scrollLeft: r } = e;
  const maxScroll = t - n;
  if (maxScroll <= 1) {
    s.style.display = "none";
    return;
  }
  s.style.display = "";
  const ratio = n / t;
  const thumbWidth = Math.max(ratio * n, 24); // Minimum thumb width: 24px
  const travelWidth = n - thumbWidth;
  c.style.width = `${thumbWidth}px`;
  c.style.transform = `translateX(${(r / maxScroll) * travelWidth}px)`;
};
```

### B. Auto-Centering Active Section Anchor
When an anchor becomes active (`[data-nav-active]`), the navigation automatically scrolls horizontally to center that item:
```javascript
const centerActive = () => {
  if (e.scrollWidth - e.clientWidth <= 1) return;
  const activeEl = e.querySelector("[data-nav-active]");
  if (!activeEl) return;
  const offset = activeEl.offsetLeft - (e.clientWidth - activeEl.offsetWidth) / 2;
  e.scrollLeft = Math.max(0, offset);
};
```

### C. Pointer Capture Dragging on Scrollbar Track
Users can click and drag the scrollbar track directly:
```javascript
let isDragging = false;
const onDrag = clientX => {
  const trackRect = s.getBoundingClientRect();
  const thumbW = c.offsetWidth;
  const maxTravel = trackRect.width - thumbW;
  const clampedX = Math.min(Math.max(clientX - trackRect.left - thumbW / 2, 0), maxTravel);
  e.scrollLeft = (clampedX / maxTravel) * (e.scrollWidth - e.clientWidth);
};

s.addEventListener("pointerdown", t => {
  isDragging = true;
  s.setPointerCapture(t.pointerId);
  onDrag(t.clientX);
});
s.addEventListener("pointermove", t => isDragging && onDrag(t.clientX));
s.addEventListener("pointerup", () => isDragging = false);
s.addEventListener("pointercancel", () => isDragging = false);
```

---

## 3. Navigation Links & States

- **Default State:** Color `--color-sub: #60636a`, no underline, padding `0 16px`.
- **Hover State:** Color shifts to `--color-ink: #0e1012`, background tints to `var(--color-paper)` (`#f5f5f3`).
- **Active State (`[data-nav-active]`):** Color `--color-accent: #2f4cff`, solid font weight `600`.
- **CTA Action (`/meet`):** Positioned far right, bounded by left border divider, displays `→ /meet` with accent hover.

