# RA-Graph Design Specification & Architecture (DESIGN.md)

## 1. Creative Direction & Research Synthesis

Synthesized from **65% Awwwards Award-Winning References**, **34% Render.com Cloud Infrastructure Aesthetic**, and **1% RA-Graph Functional Core Identity**:

### Primary Awwwards References
- **Heron AI** (Site of the Day, Oct 2026): Precision engineering framing, drafting hairline borders, crosshair coordinates (`+`, `[01/04]`), blueprint gridlines, and architectural data badges.
- **Cerebrium** (Site of the Day, Sep 2026): Deep dark obsidian canvas (`#08090C`), vibrant glowing accents (neural cyan `#38BDF8`, synapse violet `#818CF8`, emerald verification `#34D399`), circular interactive focal points, and live serverless telemetry.
- **ITSUA** (Nominee, Oct 2026): Monospace section indexes (`§ 00 — SYSTEM MANIFEST`, `[ 01 ]`), structured multi-column spec ledgers with vertical hairline guides, bold editorial metric counters, and distinct semantic badge tags.
- **CROX** (Nominee, Oct 2026): Precision engineering studio language — "tiles joined by one seam, nameplate type, numbers before adjectives and wireframe geometry."
- **FORMAT** (Site of the Day & Developer Award): Swiss typographic discipline, monospaced utility notes, clean high-contrast readability, and restrained elegance.

### Render.com Secondary Reference (`Render ｜ The cloud for builders`)
- **Typography & Headline Composition**: Confident geometric display headings with tight tracking (`tracking-tight`), editorial hierarchy, and multi-color inline phrase highlights (e.g. `text-purple-400`, `text-green-300`, `text-cyan-400`, `text-amber-300`).
- **Architectural Seam Grid**: Clean modular dividing borders (`divide-y md:divide-x border border-white/[0.08]`, `bg-[#0E1117]`).
- **Builder Identity**: High-density telemetry readouts, quickstart sandboxes, AST inspection metrics, and zero-latency feedback loops.

---

## 2. Design System Tokens

### Color System
- **Background App**: `#08090C` (Technical Obsidian)
- **Background Elevated Surface**: `#0E1117` (Component Card / Panel Surface)
- **Background Active / Hover**: `#161B24` (Subtle Interactive Elevation)
- **Hairline Borders**: `rgba(255, 255, 255, 0.08)` (Active focus: `rgba(56, 189, 248, 0.4)`)
- **Semantic Accents**:
  - **Blueprint Cyan**: `#38BDF8` (`rgba(56, 189, 248, 0.15)` background glow)
  - **Synapse Violet**: `#818CF8` (`rgba(129, 140, 248, 0.15)` background glow)
  - **Verified Emerald**: `#34D399` (`rgba(52, 211, 153, 0.15)` background glow)
  - **HyDE Amber**: `#FBBF24`
  - **Prune Rose**: `#F43F5E`
- **Typography Palette**:
  - **Primary**: `#F8FAFC` (98% High contrast)
  - **Secondary**: `#94A3B8` (Subtitles, descriptive copy)
  - **Muted / Coordinates**: `#64748B` (Technical telemetry, timestamps, indexes)

### Typography Stack
- **Display Headings**: `'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif`
- **Body & Controls**: `'Inter', system-ui, -apple-system, sans-serif`
- **Technical Coordinates & Code**: `'JetBrains Mono', 'Fira Code', monospace`

---

## 3. Surface Specifications

### Surface A: Landing Page (`src/components/Landing/LandingPage.tsx`)
1. **Architectural Masthead**: Floating glassmorphic bar with live cluster telemetry (`CLUSTER: ONLINE [38ms]`, `AST DEPTH: k=4`), section navigation, and direct guest/auth launch points.
2. **Hero Section**:
   - Confident editorial headline with Render-style multi-color inline highlights.
   - Interactive **Dual-Engine Visualizer**: Live side-by-side comparison of **Hierarchical Tree-RAG Beam Search** vs **Naive Flat Chunking** with sample query switching and real-time AST descent.
   - Quick-action CTA row with 1-click sandbox access.
3. **Traversal Pipeline**: 4-stage architectural deconstruction and beam fusion ledger (`01 Parsing`, `02 Dual-Path Fusion`, `03 Beam Descent`, `04 Lightbox Verification`).
4. **Empirical Benchmark Ledger**: Comparative metrics matrix measuring latency, token retention, table preservation, and hallucination reduction.
5. **Knowledge Graph & Entity Map**: Interactive visualizer showing relationship clustering and entity cross-linking.
6. **Technical FAQ**: Monospaced accordion clarifying architecture, local models, privacy, and parsing.
7. **Builder Footer**: High-contrast, spacious footer with API links, system status, and version telemetry.

### Surface B: Notebook Dashboard (`src/components/Dashboard/NotebookDashboard.tsx`)
1. **High-Density Control Bar**: Search with `/` hotkey, focus mode filter pills (All, Academic, Code, Finance, Images), grid vs table view toggle, and `+ New Notebook` CTA.
2. **Featured Research Sandboxes**: Instant pre-loaded notebooks for distributed consensus, Tree-RAG, and financial filings.
3. **Notebook Bento & Table Views**: Obsidian cards with hairline seams, document count, conversation threads, model badge, inline rename, and workspace navigation.
4. **Architectural Empty State**: Blueprint guide for initial document upload.
5. **Creation Modal**: High-precision modal with focus tags and model parameter selection.

### Surface C: Chatbot Workspace (`src/components/...` & `src/App.tsx`)
1. **Layout Integrity**: Preserves 3-panel workflow (Left: History Panel, Center: Chat Synthesis, Right: Sources & Documents).
2. **Visual Modernization**: Updated to Obsidian `#08090C` background, hairline borders, refined typography, and sleek telemetry chips.
3. **Citation & Figure Lightbox**: Refined `[Doc X · §Y]` citation badges and figure extraction previews.
