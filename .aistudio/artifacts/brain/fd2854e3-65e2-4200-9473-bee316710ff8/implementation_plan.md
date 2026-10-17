# Implementation Plan: RA-Graph Landing Page & Notebook Dashboard

Design, implement, and integrate a high-converting, Render-inspired dark-mode landing page and an authenticated NotebookLM-style notebook management dashboard into RA-Graph, preserving all existing document ingestion, hierarchical RAG, and interactive knowledge mapping capabilities.

## User Review Required

> [!IMPORTANT]
> **Key Architecture Decisions (Incorporating Clarification Responses)**
> - **Guest Experience**: Unauthenticated users can explore the landing page or launch a guest demo notebook immediately with pre-indexed research papers. A subtle top banner prompts sign-in to persist across devices.
> - **Dashboard Experience**: Authenticated users land on a responsive grid of notebook cards displaying notebook title, document counts, chunk statistics, last-modified dates, and quick actions (open, rename, duplicate, delete).
> - **Hero Showcase**: An interactive Render-style interactive card demonstrating hierarchical tree traversal (L1 Outline $\rightarrow$ L2 Section $\rightarrow$ L3 Chunks) with real-time beam score resolution and citation generation.

---

## Proposed Changes

### 1. View & Route Architecture

We will implement an integrated client-side router (`view` state with URL sync) that manages transitions between:
1. `'landing'`: The public landing page (shown by default to unauthenticated users).
2. `'dashboard'`: The authenticated Notebook Dashboard (showing all user notebooks in a card grid, creation modal, and activity stats).
3. `'workspace'`: The existing active notebook workspace (chat, document manager, sources sidebar, thinking indicators, mind map, and force graph), enhanced with a "← Back to Dashboard" header navigation.

```
                  ┌───────────────────────────────┐
                  │      Landing Page ('landing')  │
                  └──────────────┬────────────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 │                               │
       [Sign In / Auth Success]          [Try Guest Demo]
                 │                               │
                 ▼                               ▼
     ┌──────────────────────┐        ┌──────────────────────┐
     │ Dashboard ('dashboard')│        │ Workspace (Guest)    │
     └──────────┬───────────┘        └──────────────────────┘
                │
         [Open / New Notebook]
                │
                ▼
     ┌──────────────────────┐
     │ Workspace ('workspace')│ ◄──── "← Notebooks" return button
     └──────────────────────┘
```

---

### 2. Public Landing Page (`src/components/Landing/`)

Styled with **Render's distinctive dark aesthetic**:
- **Background & Atmospheric Lighting**: Obsidian canvas (`#0b0e13`), fine radial ambient glow (`rgba(99,102,241,0.08)` and `rgba(168,199,250,0.06)`), and 28px isometric grid lines.
- **Header**: Minimalist top navigation bar with RA-Graph logo mark, navigation anchors (*Features*, *Architecture*, *Benchmarks*, *FAQ*), "Sign In" button, and high-contrast "Get Started" CTA.
- **Hero Section**:
  - Main headline: *"Research beyond flat chunking. Think in structures."*
  - Value proposition: Reconstructs document hierarchy (H1 $\rightarrow$ H2 $\rightarrow$ Leaf Paragraphs) for zero-hallucination multi-document synthesis, verifiable citations, and live conceptual mind maps.
  - Primary CTAs: **"Start with Free Demo"** and **"Sign In / Create Account"**.
  - **Interactive Hero Component (`HeroSimulator.tsx`)**: An interactive terminal/card displaying a mock document tree where users can trigger sample queries and watch the beam search highlight candidate paths down to verified `[Doc 1]` citations in real time.
- **Interactive Capabilities Grid (Bento Style)**:
  - *Hierarchical Tree Ingestion*: Visualizing heading decomposition vs naive 500-token splitting.
  - *Dual-Path Fallback*: Reciprocal Rank Fusion blending dense vectors with BM25.
  - *Dynamic Knowledge & Mind Map*: Real-time tree synthesis and entity force graphs.
  - *Verifiable Citations*: Direct section provenance markers eliminating hallucinations.
- **Architecture & Performance Comparison**:
  - Latency comparison table (In-Memory Numpy caching vs traditional vector network hops).
  - Supported document formats (PDF, DOCX, TXT, MD, PPTX).
- **Social Proof & Use Cases**:
  - Academic literature review, technical documentation synthesis, financial 10-K analysis, and executive brief generation.
- **Call-to-Action Banner & Clean Footer**:
  - Direct launch triggers, GitHub link, documentation links, and copyright notices.

---

### 3. Notebook Dashboard (`src/components/Dashboard/`)

Styled with **NotebookLM-inspired layout & Render dark styling**:
- **Dashboard Header**:
  - User greeting with active user avatar / email.
  - Search / Filter bar for quickly filtering notebooks by keyword.
  - Prominent **"+ New Notebook"** primary CTA button.
  - Sign Out action.
- **Notebook Cards Grid**:
  - Responsive card grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`).
  - Card elements: Notebook title, last-modified timestamp, attached documents count, total chunks indexed, preview excerpt, and an action menu (Open, Rename, Delete).
  - Hover states: Render-style subtle border illumination and micro-lift animation.
- **Empty State**:
  - Engaging illustrated empty state when no notebooks exist yet, guiding users to upload their first PDF or start from a curated template (e.g. *AI Research Papers*, *Financial Earnings Report*).
- **Create Notebook Modal (`CreateNotebookModal.tsx`)**:
  - Fast modal to name the new notebook, optionally pick a starter focus mode (*All*, *Academic*, *Code*, *Finance*), and immediately route into the workspace.

---

### 4. Application Integration & Persistence (`src/store/useSearchStore.ts` & `src/lib/api.ts`)

- **Notebook Model Alignment**:
  - Map each `Thread` to a first-class `Notebook` entity in `useSearchStore`:
    ```typescript
    export interface Notebook {
      id: string
      title: string
      description?: string
      documents: DocumentInfo[]
      threads: Thread[]
      model: string
      focus: FocusMode
      createdAt: Date
      updatedAt: Date
    }
    ```
  - Backward compatibility: Active thread messages, documents, and citations tie directly to the selected notebook.
- **Backend Sync**:
  - `listConversations()` / `createConversation()` / `deleteConversation()` APIs are called to persist notebooks to PostgreSQL via `/api/conversations/`.
  - Offline fallback preserves notebooks in client storage and Zustand state when running in local dev mode.
- **Navbar Update (`src/components/Navbar.tsx`)**:
  - When in `'workspace'` view, add a prominent **"← Notebooks"** button on the left to easily return to the dashboard without losing active conversation state.

---

## Verification Plan

### Automated Build & Lint Verification
1. Run `npm run lint` (`tsc --noEmit`) to verify zero TypeScript errors.
2. Run `compile_applet` (`npm run build`) to ensure Vite bundle compiles cleanly.
3. Test dev server on port 3000 (`curl -I http://localhost:3000`).

### Interactive Flow Verification
1. **Unauthenticated Visit**: Load root URL $\rightarrow$ verify Landing Page renders with Hero, Interactive Simulator, Bento grid, and navigation.
2. **Interactive Simulator**: Click sample queries in the Hero simulator $\rightarrow$ verify beam search path animation and citation preview.
3. **Guest Demo Flow**: Click "Start Free Demo" $\rightarrow$ verify immediate transition to workspace with sample documents and guest notice.
4. **Authentication Flow**: Click "Sign In" $\rightarrow$ open `AuthModal` $\rightarrow$ login $\rightarrow$ verify immediate redirect to `Dashboard`.
5. **Notebook Creation**: Click "+ New Notebook" $\rightarrow$ enter title $\rightarrow$ verify new notebook card appears in grid and automatically opens workspace.
6. **Navigation Flow**: Click "← Notebooks" from workspace $\rightarrow$ verify return to Dashboard with updated timestamp and document count.
7. **Refresh & Persistence**: Verify state and active notebook selection persist properly across browser refresh.
