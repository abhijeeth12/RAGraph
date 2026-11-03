# Responsive Design: Breakpoints & Media Queries

**Status:** [VERIFIED via CSS AST Inspection & Chrome CDP Emulation]  
**Source Stylesheet:** `Base.CGMHpWBi.css`  

---

## 1. Breakpoint Taxonomy

Itsua utilizes Tailwind's standard breakpoint ladder augmented with custom capability media queries:

| Breakpoint Slug | Pixel Value | Rem Value | Core Layout Changes |
|---|---|---|---|
| **Base (Mobile)** | `< 640px` | `< 40rem` | Single-column layouts, stacked cards, full-width review cards, `px-6 py-8` section padding. |
| **`sm` (Tablet Portrait)** | `640px` | `40rem` | 2-column grid switches, footer wraps into 2 horizontal rows. |
| **`md` (Tablet Landscape)** | `768px` | `48rem` | **Critical Switch:** Section paddings expand to `px-14 py-18`. 3D card deck shifts from vertical (X-axis) to horizontal (Y-axis) fanning. |
| **`lg` (Desktop Baseline)** | `1024px` | `64rem` | Multi-column tabular grids (4-column tech stack, 5-column metrics bar). |
| **`xl` (Wide Desktop)** | `1280px` | `80rem` | Max-width content boundaries engage, increased headline rag. |
| **`2xl` (Ultra Wide)** | `1536px` | `96rem` | Generous whitespace gutters. |

---

## 2. Interaction Capability Queries

Extracted from production CSS rules:

### A. Hover vs Touch Detection (`@media (hover: hover)`)
```css
@media (hover: hover) {
  /* Enables desktop hover styles (card tilt, background tinting) */
  .deck-card:hover { ... }
}
```
On touch devices (`hover: none`), pointer enter events are ignored to prevent sticky hover states.

### B. Mobile Contrast Elevation (`@media (max-width: 767px)`)
```css
@media (max-width: 767px) {
  :root {
    --color-sub: #4a4d55; /* Higher contrast than desktop #60636a for sunlight legibility */
  }
}
```

### C. Reduced Motion Accessibility (`@media (prefers-reduced-motion: reduce)`)
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
    scroll-behavior: auto !important;
  }
}
```
All 3D rotations, washing wipes, and kinetic stagger exits freeze to their final readable states.

