# Section Inventory: Master Map of Itsua Landing Page

**Status:** [VERIFIED via CDP Section Scan & DOM Inspection]  
**Total Measured Bands:** 10 continuous bands (from `<header>` to `<footer>`)  
**Total Desktop Height:** `5,698px` (at `1440 x 900` baseline)  

---

## Master Section Matrix

| Band # | Identifier / ID | Tag / Component | Desktop Offset (Top) | Desktop Height | Mobile Height (390px) | Background Color | Semantic Name |
|---|---|---|---|---|---|---|---|
| **00** | `None` | `<header>` | `0px` | `57px` | `103px` | `rgba(255, 255, 255, 0.95)` | Sticky Header & Navigation |
| **01** | `#hero-root` | `<div>` | `57px` | `659.7px` | `526px` | `rgba(0, 0, 0, 0)` (Transparent) | § 00 Studio Specification & Hero |
| **02** | `None` (`band-1`)| `<div>` | `716.7px` | `214.5px` | `380px` | `rgba(0, 0, 0, 0)` (Transparent) | Credentials & Stats Telemetry Bar |
| **03** | `None` (`band-2`)| `<div>` | `931.2px` | `1,054.5px` | `920px` | `rgba(0, 0, 0, 0)` (Transparent) | § 01 Decision Matrix (/start) |
| **04** | `#featured-section` | `<div>` | `1,985.7px`| `582.1px` | `1,002.8px`| `rgb(245, 245, 243)` (`#f5f5f3`)| § 02 3D Featured Work Deck (/work)|
| **05** | `#reviews` | `<div>` | `2,567.8px`| `683.5px` | `987px` | `rgba(0, 0, 0, 0)` (Transparent) | § 03 Client Reviews Carousel (/reviews)|
| **06** | `#services` | `<div>` | `3,251.3px`| `1,079.0px`| `1,310.5px`| `rgb(245, 245, 243)` (`#f5f5f3`)| § 04 Engagement Models Door Table |
| **07** | `#stack` | `<div>` | `4,330.3px`| `856.5px` | `1,858px` | `rgba(0, 0, 0, 0)` (Transparent) | § 05 Runtime & Tooling Matrix |
| **08** | `None` (`band-7`)| `<div>` | `5,186.8px`| `456.4px` | `610px` | `rgb(14, 16, 18)` (`#0e1012`) | § 06 Dark Contact Closer & SLA |
| **09** | `None` | `<footer>` | `5,643.2px`| `55.0px` | `107px` | `rgba(0, 0, 0, 0)` (Transparent) | Monospace Meta Footer |
| **Overlay**| `#popup-side` | `<div>` | `311px` (Fixed) | `125.5px` | `125.5px` | `rgba(0, 0, 0, 0)` | Proximity Peeker Tab |

---

## Visual Rhythm & Substrate Alternation

The page creates an intentional cadence of alternating backgrounds that guides visual focus:

1. **Light / Neutral Substrate:** Bands 00, 01, 02, 03 (White & Transparent, with 1px border lines).
2. **Warm Tactile Paper Substrate:** Band 04 Featured Deck (`#f5f5f3`).
3. **Light Neutral Substrate:** Band 05 Client Reviews (`#ffffff`).
4. **Warm Tactile Paper Substrate:** Band 06 Services Door Table (`#f5f5f3`).
5. **Light Neutral Substrate:** Band 07 Tech Stack (`#ffffff`).
6. **High-Contrast Dark Void:** Band 08 Contact Closer (`#0e1012`).
7. **Neutral Monospace Ground:** Band 09 Footer (`#ffffff`).

