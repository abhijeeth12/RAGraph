# Responsive Design: Adaptive Behavior & Viewport Comparisons

**Status:** [VERIFIED via CDP Emulation (1440x900 vs 390x844)]  

---

## 1. Measured Viewport Differences

Comparison of measured properties between Desktop (`1440 x 900`) and Mobile (`390 x 844`):

| Section / Element | Desktop (1440px) | Mobile (390px) | Architectural Adjustment |
|---|---|---|---|
| **Header Height** | `57px` | `103px` | Header expands into two stacked tiers on mobile (brand/meet on top, scrollable categories below). |
| **Hero Height** | `659.7px` | `526.0px` | Headline decreases from `72px` to `38px`; vertical padding compresses. |
| **Section Padding (Horizontal)** | `56px` (`px-14`) | `24px` (`px-6`) | Maximizes available screen width for text readability. |
| **Section Padding (Vertical)** | `72px` (`py-18`) | `32px` (`py-8`) | Prevents excessive vertical scrolling distance. |
| **Featured Deck Height** | `582.1px` | `1,002.8px` | Cards stack vertically in mobile cascade rather than spreading horizontally. |
| **Deck 3D Rotation Axis** | Y-Axis (`--ry`) | X-Axis (`--rx`) | Prevents horizontal card clipping off mobile screen edges. |
| **Review Cards Width** | `~420px` (partial card) | `342px` (full viewport - 48px) | 1 card visible per mobile screen. |
| **Services Door Table** | 4 columns | 1 or 2 columns | Converts from horizontal grid into vertical stacked cards. |
| **Tech Stack Section Height** | `856.5px` | `1,858.0px` | 4 columns collapse to 1 column; height doubles to preserve comfortable touch targets. |
| **Side Peeker (`#popup-side`)**| Active mouse proximity | Hidden or docked bottom | Disabled or docked on touch screens where mouse hovering is nonexistent. |

---

## 2. Touch vs Pointer Handling

Extracted from decompiled scripts:

### A. Touch Reveal Fallback (Popups):
```javascript
const isTouchOnly = window.matchMedia("(hover: none)").matches;
if (isTouchOnly && !el.getAttribute("data-revealed")) {
  // First tap reveals tooltip / preview
  el.setAttribute("data-revealed", "true");
  return;
}
// Second tap executes navigation or opens popup
```

### B. Carousel Touch Swipe:
Touch events (`touchstart`, `touchmove`, `touchend`) integrate directly with native CSS scroll snap (`scroll-snap-type: x mandatory`), ensuring fluid inertia on iOS Safari and Android Chrome.

