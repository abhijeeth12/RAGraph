# Implementation Plan: Fix Hero Interactive Card & Evidence Transformation Simulation

Diagnose and resolve the broken/misaligned layout in the hero interactive card, elevating it into a polished, auto-advancing evidence transformation simulation styled in scholarly obsidian with warm brass accents and verified document citations.

---

## 1. Root Cause Analysis of the Broken Hero Layout

Based on inspection of `EvidenceTransformationHero.tsx` and `LandingPage.tsx`:

1. **Stair-Stepped Margin Misalignment**: The outline beam traversal used arbitrary left margins (`ml-2 sm:ml-3`, `ml-4 sm:ml-6`) instead of a genuine connected tree hierarchy. On varied viewports, this causes the cards to look misaligned, clipped, or broken rather than structured.
2. **Tab Header Cramming**: A rigid `grid-cols-3` layout with verbose labels ("Dual-Path RRF Fallback") caused awkward text truncation and uneven tab wrapping.
3. **Static Stagnation vs. Expected Simulation**: The user requested a research query transforming into grounded evidence and source citations. Currently, the card is static until manually clicked, failing to deliver the dynamic transformation simulation expected of the hero.
4. **Vertical Grid Alignment & Overflow**: The grid container in `LandingPage.tsx` used `items-center` without fixed or balanced min-height constraints, causing vertical shift and clipping between tab states or when the citation drawer is toggled.

---

## 2. Proposed Architectural & Visual Fixes

### A. Connected Tree Hierarchy Visualization
* Replace the disjointed indented cards with a unified **SVG-connected Tree Hierarchy**:
  * Root document node ($Tree\_RAG\_Arch.pdf$)
  * Branch connector lines rendered with hairline brass stroke (`#d4af37` at 25% opacity)
  * Level-1 Section $\rightarrow$ Level-2 Subsection $\rightarrow$ Leaf Paragraph with glowing progress markers and verified cosine scores.
  * Ensures pixel-perfect alignment across all screen widths without arbitrary margin shifting.

### B. Interactive & Automated Inquiry-to-Evidence Simulation
* Implement a smooth 3-stage visual progression with an auto-play / pause toggle and manual step scrubbers:
  * **Stage 1 (Query Ingestion)**: Live research prompt displayed with an animated pulse beam scanning the document index.
  * **Stage 2 (Outline Traversal)**: Cascading beam activates the outline nodes sequentially, displaying real-time retrieval latencies ($\sim 42\text{ms}$).
  * **Stage 3 (Evidence Synthesis & Citation Provenance)**: Grounded thesis emerges with warm brass citation chips (`[Doc 1 §2.3]`) and an interactive provenance inspector showing the exact source text and page proof.

### C. Refined Scholarly Obsidian & Brass Styling
* **Surfaces**: Pure obsidian base (`#090a0d`), elevated charcoal card panel (`#0f1118`), inner display wells (`#07080b`).
* **Borders & Accents**: Subtle hairline brass borders (`rgba(212, 175, 55, 0.22)`), glowing brass indicators (`#d4af37`), bone-white typography (`#f5f4ef`), and emerald verification signals (`#7ec8a3`).
* **Clean Scenario Tabs**: Redesign tabs into responsive, pill-segmented chips with clean short badges and smooth layout transitions.

### D. Layout Stability & Mobile Responsiveness
* Enforce stable vertical bounds (`min-h-[520px]`) to prevent layout shifts when toggling between scenarios or opening citation details.
* Add responsive layout switches so mobile viewports display a vertical tree timeline, while desktop retains the full multi-tier architectural canvas.

---

## 3. Step-by-Step Execution Sequence

1. **Re-architect `EvidenceTransformationHero.tsx`**:
   * Implement connected tree canvas with SVG vertical trunk and branching connector stems.
   * Add automated progression timer with pause-on-hover and scenario selector.
   * Build out the interactive citation inspection popover with exact document excerpts and page numbers.
   * Ensure robust typographic contrast matching the scholarly obsidian aesthetic.

2. **Harmonize `LandingPage.tsx` Hero Grid**:
   * Adjust hero grid alignment to `lg:items-stretch` with balanced container spacing.
   * Verify header, headline typography, and action buttons align cleanly with the newly structured hero card.

3. **Validation & Testing**:
   * Run `compile_applet` to confirm clean TypeScript compilation.
   * Run `lint_applet` to verify zero lint or syntax issues.
   * Test across various screen sizes (desktop, tablet, mobile) to ensure zero text truncation, layout breaks, or overflow clipping.
