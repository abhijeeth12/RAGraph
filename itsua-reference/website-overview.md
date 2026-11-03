# Itsua Website Overview & Architectural Analysis

**Reference:** [https://itsua.com/](https://itsua.com/)  
**Status:** [VERIFIED via Awwwards MCP + AST + CDP]  

---

## 1. Brand Identity & Design Philosophy

ITSUA positions itself as a "full-stack engineering studio shipping since 2014". The aesthetic language combines:
- **Swiss International Typographic Style:** Asymmetrical grid, structured tabular data, strict alignment, and pure functional hierarchy.
- **Engineering Specification / Blueprint Motif:** Numbered sections (`§ 00`, `§ 01`, `§ 02`...), technical monospaced telemetry headers, status indicators (blinking LEDs), and clear SLA metrics.
- **Kinetic Physical Tactility:** Elements do not feel like flat web pixels; cards tilt in 3D perspective space, wobble upon interaction, flip to reveal technical specifications, and respond to pointer velocity.
- **Controlled Restraint:** Color is applied with extreme surgical precision. Backgrounds are primarily warm off-white (`#f5f5f3`) and clean white, with color reserved for status pills and category distinctions.

---

## 2. High-Level Technology Stack

| Layer | Technology | Evidence / Extraction Source |
|---|---|---|
| **Framework** | **Astro** (Static Site Generator) | `data-astro-cid` markers found across DOM, compiled Astro component chunks in JS bundle. |
| **Styling** | **Tailwind CSS** (v3.x) + Custom CSS Variables | Extracted Tailwind utilities (`flex`, `grid-cols-12`, `bg-paper`, etc.) and 93 CSS root variables. |
| **Typography** | **Space Grotesk** + **JetBrains Mono** | `@font-face` definitions extracted from `style_0.css`; WOFF2 font files preserved in `/assets/fonts/`. |
| **Motion Architecture**| Custom Vanilla TS / Native `requestAnimationFrame` | Bundle chunks (`0-inline.js` through `12-deck.js`) contain raw RAF loops, IntersectionObservers, and lerp math. |
| **State / Analytics** | Custom Consent Mode + GTM / Cloudflare | LocalStorage `itsua_consent` management with Global Privacy Control compliance. |

---

## 3. Page Hierarchy & Flow Breakdown

The single-page landing structure flows deliberately from macro positioning down to micro engagement:

1. **Header (Sticky Global Telemetry):**
   - Brand logo (`ITSUA.COM`), active section indicator, horizontally scrollable category anchors (`/start`, `/work`, `/reviews`, `/services`, `/stack`), custom draggable scrollbar thumb, and `/meet` action.
2. **Hero Section (`§ 00 — STUDIO SPECIFICATION`):**
   - Studio title, "A full-stack engineering studio / Shipping since 2014", abstract paragraph, proposal CTA button, and 12 background grid/lines that perform staggered exit parallax when scrolled.
3. **Credentials & Key Metrics Bar:**
   - 5-column horizontal strip: 12 years in operation, 50+ clients shipped, 250K daily active users, 10+ countries served, 20+ industry verticals.
4. **Engagement Decision Matrix (`§ 01 — START HERE / /start`):**
   - 3-step routing column layout ("01 · YOU HAVE" -> "02 · START WITH" -> "03 · LEADS TO"). Solves client paralysis before portfolio showcase.
5. **Interactive 3D Work Showcase (`§ 02 — FEATURED PROJECTS / /work`):**
   - 5 interactive project cards stacked in 3D perspective space. Features mathematical wobble on hover (`sin(πt)·sin(2πt)`), 180° flip to technical specs on click, and smooth scroll fanning.
6. **Client Reviews & Social Proof (`§ 03 — CLIENT REVIEWS / /reviews`):**
   - Horizontal drag-and-swipe carousel containing 18 verified client reviews and project cards. Features live height adaptation via `ResizeObserver`, 2-digit counter (`01`, `02`...), and Clutch ratings.
7. **Engagement Models (`§ 04 — ENGAGEMENT MODELS / /services`):**
   - "Door-table" interactive grid layout showcasing 4 core service lines: Product Engineering, Team Augmentation, Commerce & Shopify, Rescue & Rewrite. Staggered washing wipe reveal animation.
8. **Runtime & Tooling Matrix (`§ 05 — RUNTIME & TOOLING / /stack`):**
   - Comprehensive technical matrix organized by Languages & Runtimes, Frameworks, Data & AI, and Infrastructure. Features animated blinking LED indicator dots.
9. **Contact Closer (`§ 06 — INITIATE CONTACT`):**
   - High-contrast inverted dark section (`#0e1012`) with bold typographic statement "Ready when you are.", proposal modal trigger, email, physical studio address in Tallinn, Estonia, and `< 24h` SLA badge.
10. **Monospace Footer:**
    - Technical copyright notices, legal disclaimers, cookie preferences trigger, and timezone clock.
11. **Persistent Proximity Peeker (`#popup-side`):**
    - Fixed left-edge tab that detects pointer proximity (`Math.hypot < 140px`) to peek out, and cycles active tabs during scrolling.

---

## 4. Architectural Patterns for Re-implementation

When recreating this landing page in our stack (React 19 / Next.js 16 or Vite SPA):

- **Component Boundaries:** Each section operates with stable IDs (`#hero-root`, `#featured-section`, `#reviews`, `#services`, `#stack`) to allow smooth anchor scrolling and programmatic targeting.
- **Kinetic Physics Porting:** While Itsua wrote custom vanilla RAF loops, these can be implemented either natively (for zero bundle overhead) or mapped into GSAP timelines and ScrollTriggers via the provided mapping guides.
- **Responsiveness First:** Below `768px`, 3D rotation angles switch axes (X vs Y rotation), horizontal tracks wrap or enable native touch drag, and section paddings reduce proportionally.

