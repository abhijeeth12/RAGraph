# Animation Specification: Timings, Easings & Performance Targets

**Status:** [VERIFIED via JS Bundle Decompilation & Chrome CDP Performance Audit]  

---

## 1. Timing Constants Directory

| Identifier | Value | Units | Target Feature |
|---|---|---|---|
| `DURATION_WOBBLE` | `900` | ms | Hover & click harmonic wobble on `.deck-card` and `.review-deck`. |
| `DURATION_WASH_STAGGER` | `110` | ms | Per-cell reveal delay in `.door-table`. |
| `DURATION_STACK_CELL_STAGGER` | `120` | ms | Category-level delay for `.stack-cell`. |
| `DURATION_STACK_DOT_STAGGER` | `70` | ms | Individual indicator dot delay within category. |
| `DURATION_PEEKER_CYCLE` | `320` | ms | Active tab cycling interval while scrolling. |
| `DURATION_PEEK_STAY` | `1400` | ms | Persistence time of peek state before retreating. |
| `DURATION_PEEK_RETREAT` | `500` | ms | Quick retreat duration on mouseleave. |
| `SCROLL_WINDOW_HERO` | `150` | px | Scroll travel distance over which hero lines complete translation. |
| `HERO_LINE_STAGGER` | `14` | px | Scroll offset threshold between successive hero lines. |
| `LERP_FACTOR` | `0.16` | unitless | Exponential low-pass filter smoothing coefficient. |

---

## 2. Easing Functions Used

1. **Physical Harmonic Spring (Trigonometric):**
   $$f(t) = 15 \cdot \sin(\pi t) \cdot \sin(2\pi t)$$
   Used exclusively for card hover/click oscillations.
2. **Snappy Deceleration Curve:**
   `cubic-bezier(0.16, 1, 0.3, 1)`
   Used for 180° flips, modal dialog entries, and `.door-row` clipping reveals. Fast attack, rapid damping.
3. **Standard Interactive Transition:**
   `cubic-bezier(0.4, 0, 0.2, 1)` (or `ease-out`)
   Used for button background shifts, link colors, and opacity fades.
4. **Linear Scrub:**
   `linear` / `none`
   Used for scroll-linked translations where position is directly bound to scroll progress.

---

## 3. Runtime Performance Evidence (CDP Audit)

From `audit_url` CDP profiling on `https://itsua.com/`:
- **Average Frame Rate:** `29 - 58 FPS` during initial load/layout writes, stabilizing at clean `60 FPS` during scrolling.
- **Scroll Handlers:** 4 passive scroll listeners (`{ passive: true }`), preventing UI thread jank.
- **Active Animations at Rest:** `12` hardware-accelerated CSS animations.
- **Layout Thrashing Precaution:** To ensure 60fps on our rebuild, batch all `getBoundingClientRect()` reads before writing transform styles, or bind directly to CSS variables to let the GPU compositor execute frames independently.

