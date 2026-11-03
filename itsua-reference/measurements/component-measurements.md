# Technical Measurements: Detailed Component Measurements

**Status:** [VERIFIED via CDP Computed Styles & DOM Inspection]  

---

## 1. Card Components

### A. Featured 3D Project Card (`.deck-card`)
- **Desktop Dimensions:** Width: `395.2px` | Height: `224.0px`
- **Aspect Ratio:** `1.76 : 1` (`~16:9`)
- **Border Radius:** `4px`
- **Border Width:** `1px solid var(--color-line)`
- **Internal Padding:** `20px` (`p-5`)
- **Card-to-Card Spacing in Deck:** `E = 1.6` relative scaling factor
- **Image Mockup Dimensions:** Width: `100%` | Height: `132px` | Object-fit: `cover`

### B. Client Review Card (`.review-deck`)
- **Desktop Dimensions:** Width: `440.0px` | Min-height: `340.0px`
- **Mobile Dimensions:** Width: `342.0px` (`calc(100vw - 48px)`)
- **Border Radius:** `4px`
- **Border Width:** `1px solid var(--color-line)`
- **Internal Padding:** `28px` (`p-7`)
- **Avatar Image:** Width: `40px` | Height: `40px` | Border Radius: `9999px` (`rounded-full`)

### C. Services Door Table Cell (`.door-row > *`)
- **Desktop Dimensions:** Width: `324.0px` | Height: `256.0px`
- **Border:** `1px solid var(--color-line)`
- **Internal Padding:** `32px` (`p-8`)

---

## 2. Interactive Controls & Buttons

### A. Primary CTA Button (`→ REQUEST PROPOSAL`)
- **Height:** `44px`
- **Width:** Auto (Content-based, `~184px`)
- **Padding:** `12px 20px` (`py-3 px-5`)
- **Border Radius:** `4px`

### B. Large Contact Closer Button (`→ OPEN BRIEF FORM`)
- **Height:** `48px`
- **Padding:** `14px 24px`
- **Border Radius:** `4px`

### C. Navigation Scrollbar Thumb (`#nav-scrollbar-thumb`)
- **Height:** `2px` (expands to `3px` on active drag)
- **Minimum Width:** `24px`
- **Border Radius:** `9999px`

### D. Carousel Arrow Buttons (`#review-prev`, `#review-next`)
- **Dimensions:** Width: `36px` | Height: `36px`
- **Border Radius:** `4px`
- **Border Width:** `1px solid var(--color-line)`
- **Icon Size:** `16px x 16px` SVG paths

---

## 3. Typography Line Heights & Letter Spacing

| Style Target | Font Size | Computed Line Height | Ratio | Computed Letter Spacing |
|---|---|---|---|---|
| **Display H1 (Hero)** | `72px` | `77.76px` | `1.08` | `-2.16px` (`-0.03em`) |
| **Section H2 (Closer)**| `48px` | `52.80px` | `1.10` | `-1.20px` (`-0.025em`) |
| **Card H3 (Titles)** | `22px` | `26.40px` | `1.20` | `-0.33px` (`-0.015em`) |
| **Body Paragraph** | `16px` | `24.80px` | `1.55` | `0.0px` |
| **Metadata Tag** | `12px` | `16.80px` | `1.40` | `+0.36px` (`+0.03em`) |
| **Footer Micro-text** | `11px` | `15.40px` | `1.40` | `0.0px` |

