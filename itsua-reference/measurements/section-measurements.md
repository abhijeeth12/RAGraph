# Technical Measurements: Comprehensive Section Layout Tables

**Status:** [VERIFIED via CDP Computed Styles (Desktop 1440x900 & Mobile 390x844)]  
**Measurement Method:** Headless Chrome `getBoundingClientRect()` + `getComputedStyle()`  

---

## 1. Desktop Section Measurements (1440px Viewport)

All values in exact pixels:

| Band Index | Element Selector | Tag / ID | Offset Top | Width | Height | Padding (T R B L) | Margin (T R B L) | Display / Grid |
|---|---|---|---|---|---|---|---|---|
| **Band 00** | `header` | `<header>` | `0.0px` | `1407.0px` | `57.0px` | `0 0 0 0` | `0 0 0 0` | `flex flex-wrap` |
| **Band 01** | `#hero-root` | `div#hero-root` | `57.0px` | `1407.0px` | `659.7px` | `0 0 0 0` | `0 0 0 0` | `block relative` |
| **Band 02** | `div.border-b` | `div (band-1)` | `716.7px` | `1407.0px` | `214.5px` | `0 0 0 0` | `0 0 0 0` | `grid grid-cols-5` |
| **Band 03** | `div.border-b` | `div (band-2)` | `931.2px` | `1407.0px` | `1,054.5px`| `72px 56px 72px 56px` | `0 0 0 0` | `block` |
| **Band 04** | `#featured-section`| `div#featured-section` | `1,985.7px`| `1407.0px` | `582.1px` | `72px 56px 144px 56px` | `0 0 0 0` | `block isolate` |
| **Band 05** | `#reviews` | `div#reviews` | `2,567.8px`| `1407.0px` | `683.5px` | `72px 0 72px 0` | `0 0 0 0` | `block` |
| **Band 06** | `#services` | `div#services` | `3,251.3px`| `1407.0px` | `1,079.0px`| `72px 56px 72px 56px` | `0 0 0 0` | `block` |
| **Band 07** | `#stack` | `div#stack` | `4,330.3px`| `1407.0px` | `856.5px` | `72px 56px 72px 56px` | `0 0 0 0` | `block` |
| **Band 08** | `div.bg-ink` | `div (band-7)` | `5,186.8px`| `1407.0px` | `456.4px` | `72px 56px 72px 56px` | `0 0 0 0` | `block` |
| **Band 09** | `footer` | `<footer>` | `5,643.2px`| `1407.0px` | `55.0px` | `0 56px 0 56px` | `0 0 0 0` | `flex flex-wrap` |
| **Overlay** | `#popup-side` | `div#popup-side` | `311.0px` | `98.3px` | `125.5px` | `0 0 0 0` | `0 0 0 0` | `fixed flex-col` |

---

## 2. Mobile Section Measurements (390px Viewport)

Measured under iPhone-class emulation (390 x 844, DPR 3):

| Band Index | Tag / ID | Width | Height | Padding (T R B L) | Key Responsive Change |
|---|---|---|---|---|---|
| **Band 00** | `<header>` | `390.0px` | `103.0px` | `0 0 0 0` | Expands to 2 rows; anchors scroll horizontally. |
| **Band 01** | `div#hero-root` | `390.0px` | `526.0px` | `0 24px 0 24px` | Headline reduces to 38px, abstract stacks below. |
| **Band 02** | `div (band-1)` | `390.0px` | `380.0px` | `0 0 0 0` | 5 columns wrap to 2 columns / stacked rows. |
| **Band 03** | `div (band-2)` | `390.0px` | `920.0px` | `32px 24px 32px 24px` | Decision table collapses to vertical step cards. |
| **Band 04** | `div#featured-section`| `390.0px` | `1,002.8px`| `32px 24px 64px 24px` | Cards fan vertically along X-axis (`--rx`). |
| **Band 05** | `div#reviews` | `390.0px` | `987.0px` | `32px 0 32px 0` | Track takes full screen width with 24px gutters. |
| **Band 06** | `div#services` | `390.0px` | `1,310.5px`| `32px 24px 32px 24px` | Door table cells stack into 1-2 columns. |
| **Band 07** | `div#stack` | `390.0px` | `1,858.0px`| `32px 24px 32px 24px` | Stack cells stack in single column. |
| **Band 08** | `div (band-7)` | `390.0px` | `610.0px` | `32px 24px 32px 24px` | Contact details stack vertically. |
| **Band 09** | `<footer>` | `390.0px` | `107.0px` | `16px 24px 16px 24px` | Footer wraps into multiple rows. |

