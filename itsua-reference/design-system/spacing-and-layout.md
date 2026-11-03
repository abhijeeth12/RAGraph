# Design System: Spacing & Layout Architecture

**Status:** [VERIFIED via CDP Computed Styles & DOM Geometry]  

---

## 1. Grid & Container Architecture

Itsua is built on an asymmetric, industrial grid layout rather than a standard centered container. The layout hugs the browser viewport with structured gutter margins.

### A. Primary Viewport Geometry
- **Full Viewport Width:** Section containers span `100%` of viewport width. On desktop (1440px baseline), effective content width is `1407px` (excluding vertical scrollbar).
- **Horizontal Section Padding:**
  - Desktop (`md:` and above): `px-14` = `56px` padding left and right.
  - Mobile (`< 768px`): `px-6` = `24px` padding left and right.
- **Vertical Section Padding:**
  - Standard Sections: `py-8 md:py-18` = `32px` mobile, `72px` desktop.
  - Featured Deck: `pt-8 pb-16 md:pt-18 md:pb-36` = `72px` top, `144px` bottom desktop (extended bottom buffer for 3D card overflow).

---

## 2. Grid Column Formats (Extracted from Tailwind markers)

The following distinct CSS Grid setups were extracted from the production bundle:

| Grid Class | Template Columns | Usage Section |
|---|---|---|
| `grid-cols-12` | 12 equal fractional columns | Overall page structural alignment |
| `grid-cols-[3fr_1fr]` | 75% main content, 25% side metadata | Service detail rows, Hero metadata splits |
| `grid-cols-[1fr_auto]` | Fluid left, auto right | Card action bars, review author rows |
| `grid-cols-[24vw_1fr]` | Fixed 24 viewport-width sidebar, fluid right | Service section category navigation |
| `grid-cols-[110px_1fr]` / `grid-cols-[140px_1fr]` | Fixed width label, fluid value | Specification and metadata lists |
| `grid-cols-1 md:grid-cols-2 lg:grid-cols-4` | 1 column mobile -> 4 columns desktop | Tech stack matrix, Metrics bar |

---

## 3. Spacing Scale Reference (Tailwind & Computed Pixels)

| Token | Rem Value | Pixel Value | Typical Application |
|---|---|---|---|
| `gap-1` / `p-1` | `0.25rem` | `4px` | Dot badge spacing, micro indicator gaps |
| `gap-2` / `p-2` | `0.5rem` | `8px` | Icon-to-text spacing, small button internal padding |
| `gap-3` / `p-3` | `0.75rem` | `12px` | Pill badge padding, input fields |
| `gap-4` / `p-4` | `1rem` | `16px` | Card internal content spacing |
| `gap-6` / `p-6` | `1.5rem` | `24px` | Mobile section horizontal padding (`px-6`), card gaps |
| `gap-8` / `p-8` | `2rem` | `32px` | Mobile section vertical padding (`py-8`) |
| `gap-14` / `p-14` | `3.5rem` | `56px` | Desktop section horizontal padding (`px-14`) |
| `gap-18` / `p-18` | `4.5rem` | `72px` | Desktop section vertical padding (`py-18`) |
| `p-36` | `9rem` | `144px` | Featured deck bottom margin buffer (`pb-36`) |

---

## 4. Stacking Context & Z-Index Ladder

All layers follow a strict, non-colliding z-index hierarchy:

```
Z-Index Level 50:  Sticky Navigation Header (<header class="sticky top-0 z-50">)
Z-Index Level 45:  Modal Backdrop & Popup Root (#popup-root, #popup-backdrop)
Z-Index Level 40:  Sticky Persistent Side Tab (#popup-side class="fixed z-40")
Z-Index Level 10:  Active / Hovered 3D Cards (.deck-card.is-raised, style="--z: 5")
Z-Index Level 1-5: Inactive 3D Cards in Deck Stack (style="--z: 1", "--z: 2"...)
Z-Index Level 0:   Default Section Content, Section Borders
Z-Index Level -1:  Hero Background Parallax Grid Lines (#hero-lines)
```

