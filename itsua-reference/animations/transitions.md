# Animation Specification: Transitions & Modal Motion

**Status:** [VERIFIED via CDP Computed Styles & CSS AST]  

---

## 1. Modal Dialog & Backdrop Transition

**Targets:** `#popup-root`, `#popup-backdrop`, `.popup-panel`  

- **Backdrop Fade:**
  - Initial State: `opacity: 0; backdrop-filter: blur(0px);`
  - Active State: `opacity: 1; backdrop-filter: blur(4px);`
  - Duration: `200ms`
  - Easing: `ease-out`
- **Panel Slide-up & Scale:**
  - Initial State: `opacity: 0; transform: translateY(16px) scale(0.98);`
  - Active State: `opacity: 1; transform: translateY(0px) scale(1.0);`
  - Duration: `300ms`
  - Easing: `cubic-bezier(0.16, 1, 0.3, 1)` (snappy spring deceleration)

---

## 2. Navigation Link Hover Micro-Transition

- **Target:** `header a`, `header button`
- **Properties:** `color`, `background-color`
- **Duration:** `150ms`
- **Easing:** `cubic-bezier(0.4, 0, 0.2, 1)` (standard Material curve)
- **Active Border Underline:** Transitions `transform: scaleX(0)` to `scaleX(1)` with transform origin left.

---

## 3. Carousel Drag Inertia & Snap

**Target:** `#review-track`  

- **Dragging State (`.dragging`):**
  - `scroll-behavior: auto;`
  - Direct 1:1 displacement tracking cursor clientX (`scrollLeft = startScroll - deltaX`).
- **Release / Settle State:**
  - `scroll-behavior: smooth;`
  - Snaps to exact computed card offset `index * clientWidth`.
  - Duration: `~350ms`.

