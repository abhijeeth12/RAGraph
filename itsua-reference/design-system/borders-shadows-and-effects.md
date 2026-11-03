# Design System: Borders, Shadows & Visual Effects

**Status:** [VERIFIED via CDP Computed Styles & CSS AST]  

---

## 1. Border & Divider Architecture

Itsua relies heavily on continuous 1px hairline dividers to structure space rather than drop shadows or heavy cards.

- **Standard Border Width:** Exactly `1px` (`border`, `border-t`, `border-b`, `border-r`, `border-l`).
- **Standard Border Color:** `--color-line: #d9dadd` (`rgb(217, 218, 221)`).
- **Divider Treatment:** Sections are bounded by top and bottom borders that span the entire browser width. Table columns and rows utilize `border-collapse` style lines without gap doubling.
- **Inverted Dark Section Border:** In the dark contact closer (`#0e1012`), borders transition to `#26292e` (a darkened counterpart maintaining subtle division).

---

## 2. Border Radii Scale

Itsua employs an ultra-sharp architectural aesthetic where corners are predominantly square or subtly filleted:

| Radius Token | Computed Value | Applied Elements |
|---|---|---|
| `rounded-none` | `0px` | Standard page sections, headers, footer, table rows, hero container. |
| `rounded-sm` | `2px` - `3px` | Technical status badges, small code chips, indicator markers. |
| `rounded` | `4px` | Project 3D cards, review cards, modal dialog containers. |
| `rounded-md` | `6px` | Interactive CTA buttons, popup tabs. |
| `rounded-full` | `9999px` | Circular status dots, blinking LED indicators, avatar image masks. |

---

## 3. Shadows & Elevation

In contrast to conventional SaaS designs that utilize heavy multi-layer box shadows, Itsua's shadow vocabulary is minimal, reserved almost exclusively for elevated 3D cards:

### A. Flat / Default State (No Shadow)
```css
box-shadow: none;
```
Applied to 95% of components, maintaining crisp typographic definition.

### B. Elevated 3D Card Shadow (`.is-raised`)
When a card is hovered or flipped in the 3D deck or reviews carousel:
```css
/* Computed elevation extracted from .deck-card.is-raised */
box-shadow: 0 12px 32px -4px rgba(14, 16, 18, 0.08), 0 4px 12px -2px rgba(14, 16, 18, 0.04);
```

### C. Modal Dialog Elevation
```css
/* Extracted from .popup-panel */
box-shadow: 0 24px 64px -12px rgba(14, 16, 18, 0.25);
```

---

## 4. Backdrop Blur & Glassmorphism

- **Sticky Header Glass:**
  - Background: `rgba(255, 255, 255, 0.95)` (`bg-white/95`)
  - Filter: `backdrop-filter: blur(8px)`
  - Border: `1px solid #d9dadd`
  - Ensures underlying typography remains legible without causing distracting high-frequency background noise.
- **Modal Backdrop:**
  - Background: `rgba(14, 16, 18, 0.4)` (`bg-ink/40`)
  - Filter: `backdrop-filter: blur(4px)`

