# Component Specification: Cards Architecture

**Status:** [VERIFIED via CDP Computed Styles & DOM Inspection]  

---

## 1. Card Archetypes

The Itsua landing page implements 4 distinct card specifications:
1. **Featured 3D Project Deck Card (`.deck-card`)**
2. **Horizontal Review Card (`.review-deck`)**
3. **Engagement Step Card (`.start-card` / matrix cell)**
4. **Service Offering Door Cell (`.door-table td / div`)**

---

## 2. Featured 3D Project Deck Card (`.deck-card`)

- **Container:** `div.deck-card` inside `#featured-deck`
- **Dimensions (Desktop):** Width: `~395px` | Height: `~224px` | Aspect Ratio: `~16:9`
- **Surface Styling:**
  - Background: `#ffffff`
  - Border: `1px solid var(--color-line)` (`#d9dadd`)
  - Border Radius: `4px` (`rounded`)
  - Overflow: `hidden`
- **Internal Structure:**
  - **Front Face (`.deck-card-front`):**
    - Header: Project metadata pill (e.g. `RECRUITMENT`), Year `2025 (active)`.
    - Body: Bold title (Space Grotesk `22px`), Tech stack tags.
    - Image Preview: Scaled project UI mockup (WebP), with subtle border.
  - **Back Face (`.deck-card-back`):**
    - Technical engineering brief, architecture highlights, metrics delivered, CTA button (`View Case Study`).
    - Staged with `backface-visibility: hidden; transform: rotateX(180deg)`.
- **Kinetic States:**
  - Hover: Executes 900ms harmonic oscillation (`c(e)`).
  - Click: Toggles 180° flip (`--rx: 180deg`).
  - Active: Receives class `.is-raised`, elevates `z-index` to `var(--z)`, casts elevation shadow.

---

## 3. Client Review Card (`.review-deck`)

- **Container:** `div.review-deck` inside `#review-track`
- **Dimensions (Desktop):** Width: `~420px` - `460px` | Min-height: `340px` (fluidly sized by content)
- **Dimensions (Mobile):** Width: `calc(100vw - 48px)` (almost full viewport width)
- **Surface Styling:**
  - Background: `#ffffff`
  - Border: `1px solid var(--color-line)`
  - Border Radius: `4px`
  - Padding: `24px` (`p-6 md:p-8`)
- **Internal Structure:**
  - Top Strip: Project timestamp and category badge.
  - Title: Space Grotesk `20px` bold.
  - Stack Tags: JetBrains Mono `11px`, listing technologies separated by dots.
  - Quote: Space Grotesk `15px`, line height `1.55`, color `var(--color-ink)`.
  - Author Strip: Client avatar image (`40px x 40px`, `rounded-full`), author name, role, company, and Clutch 5-star verification badge.

---

## 4. Tech Stack Card Cell (`.stack-cell`)

- **Container:** `div.stack-cell` inside `#stack`
- **Dimensions:** Width: `100%` of column width | Height: `auto`
- **Surface Styling:**
  - Background: `#ffffff`
  - Border: `1px solid var(--color-line)`
  - Padding: `28px 24px`
- **Internal Elements:**
  - Category Title: Mono `12px` uppercase.
  - List of tech items: Each with Space Grotesk `15px` label and accompanying `.stack-dot` blinking LED indicator.

