# RA-Graph Design Specification & Architecture (DESIGN.md)

## 1. Creative Direction & Research Synthesis
Synthesized from Awwwards award-winning references (**Heron AI** [SOTD], **Wafer.ai** [Nominee], **Townhouse** [Nominee], **Plumeform** [Nominee]) and UI UX Pro Max intelligence:

- **Aesthetic Identity**: *Architectural Knowledge Engineering* — High-contrast dark technical canvas, razor-sharp hairline borders, coordinate indexing (`[01]`, `[02]`, `[x, y]`), and scientific data density. Replaces generic SaaS gradients with deliberate editorial structure.
- **Color System**:
  - Technical Obsidian Background: `#0B0D11`
  - Elevated Component Surface: `#13161C` (Border: `1px solid rgba(255, 255, 255, 0.08)`)
  - Elevated Hover State: `#1A1E26`
  - High-Precision Blueprint Cyan: `#38BDF8`
  - Neural Synapse Violet: `#818CF8`
  - Emerald Verification Anchor: `#34D399`
  - Typography Base: `#F1F5F9` (Headings: `95% #FFFFFF`, Meta: `#94A3B8`, Monospace: `#64748B`)
- **Typography**:
  - Primary Sans: `Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
  - Monospace Data / Coordinates: `'JetBrains Mono', 'Fira Code', ui-monospace, monospace`

## 2. Redesigned Surfaces
### Surface A: Landing Page (`src/components/Landing/LandingPage.tsx`)
- **Navigation Masthead**: Glassmorphic hairline bar with technical telemetry badges, feature anchor links, and direct CTA to Guest Sandbox or Dashboard.
- **Hero Presentation**: Editorial split-screen composition with live interactive **Dual-Engine Visualizer**:
  - *Naive Flat Chunking*: Illustrates lost section context and fragmented snippets.
  - *RA-Graph Hierarchical Beam Search*: Illustrates semantic tree descent (`Document → Section §4 → Leaf Chunks`) with verified coordinate citations.
- **Interactive Beam Search Simulator**: Step-through interactive pipeline (`01 Parsing`, `02 Section Scoring`, `03 Branch Pruning`, `04 Leaf Fusion`).
- **Comparative Scientific Matrix**: Benchmark table evaluating Flat Vector DB vs Naive Hybrid vs RA-Graph Dual-Path Beam Search on 100k+ token corpora.
- **Knowledge Graph & Entity Edge Showcase**: Dynamic interactive node-graph visualization highlighting relationship propagation.
- **Conversion Gateway**: Direct launch points for guest demo and authenticated researcher accounts.

### Surface B: Notebook Dashboard (`src/components/Dashboard/NotebookDashboard.tsx`)
- **Control Bar**: Real-time backend connectivity telemetry, user session indicator, quick search filter, view toggle (Grid / Dense Table), and `+ Create Notebook` CTA.
- **Quick Filters**: All Notebooks, Academic Research, Technical Specifications, Recent Activity.
- **Notebook Cards**: Technical binder cards displaying focus badge, document count, thread count, model allocation, quick-rename, delete protection, and `Open Workspace →`.
- **Demo Sandboxes**: 1-click launcher for pre-configured research notebooks.
- **Empty State**: Architectural blueprint placeholder with rapid setup guide.

## 3. Preserved Chatbot Workspace
- `src/App.tsx` Workspace view remains architecturally intact.
- Seamless state handoff via `activeNotebookId`, `loadNotebooks()`, and `ensureActiveNotebookId()`.
