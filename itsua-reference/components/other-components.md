# Component Specification: Auxiliary UI Components

**Status:** [VERIFIED via CDP Computed Styles & DOM Inspection]  

---

## 1. Custom Draggable Scrollbar Track & Thumb (`header`)

- **Track Container (`#nav-scrollbar`):**
  - Height: `2px`
  - Background: `var(--color-line: #d9dadd)`
  - Border Radius: `9999px`
  - Position: Integrated into bottom border edge of `<header>`.
- **Thumb (`#nav-scrollbar-thumb`):**
  - Height: `2px`
  - Min-width: `24px` (calculated dynamically as `Math.max((clientWidth / scrollWidth) * clientWidth, 24)`)
  - Background: `var(--color-ink: #0e1012)`
  - Active Dragging State: Background shifts to `--color-accent: #2f4cff`, height expands to `3px`.

---

## 2. Review Progress Counter (`#review-index`)

- **DOM Target:** `div#review-index`
- **Format:** Two-digit numerical indicator with leading zero (e.g. `01`, `02`, `18`).
- **Font Family:** `var(--font-mono)` (JetBrains Mono)
- **Font Size:** `14px`
- **Font Weight:** `700` (Bold)
- **Color:** `--color-ink: #0e1012`
- **Divider & Total:** Accompanied by `/ 18` in `--color-sub: #60636a`.

---

## 3. Carousel Navigation Buttons (`#review-prev`, `#review-next`)

- **Dimensions:** Width: `36px` | Height: `36px`
- **Border:** `1px solid var(--color-line)` (`#d9dadd`)
- **Border Radius:** `4px`
- **Background:** White (`#ffffff`)
- **Icons:** SVG arrow paths (`<` and `>`).
- **Disabled State:** Opacity `0.3`, pointer-events `none`.
- **Hover State:** Background shifts to `var(--color-paper)` (`#f5f5f3`), border becomes `--color-ink`.

---

## 4. Operational Status Indicator Dots

- **Dimensions:** `6px x 6px`
- **Border Radius:** `9999px` (`rounded-full`)
- **Color:** `--color-green-bright: #34d399` (Active live deployment) or `--color-accent: #2f4cff`.
- **Animation:** Continuous subtle opacity pulse or scroll-triggered blink sequence.

