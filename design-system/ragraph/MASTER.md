# Design System Master File (MASTER.md)

> **LOGIC:** When building or updating components, strictly follow these unified design tokens and styling rules.

---

**Project:** RA-Graph (Hierarchical RAG & Knowledge Graph Engine)  
**Influence Ratio:** 65% Awwwards (Cerebrium, Heron AI, ITSUA, CROX, FORMAT) + 34% Render.com Cloud Infrastructure + 1% RA-Graph Functional Core  
**Design Dials:** Variance 8/10 (Distinctive / Premium) | Motion 7/10 (Subtle / Purposeful) | Density 8/10 (High-Precision Technical)  

---

## 1. Global Tokens

### Color Palette

| Role | Hex | CSS Variable |
|------|-----|--------------|
| Technical Obsidian Canvas | `#08090C` | `--bg-app` |
| Elevated Component Surface | `#0E1117` | `--bg-panel`, `--bg-card` |
| Subtle Hover / Active | `#161B24` | `--bg-hover` |
| Input Surface | `#12151D` | `--bg-input` |
| Hairline Border | `rgba(255, 255, 255, 0.08)` | `--border` |
| Hairline Border Hover | `rgba(255, 255, 255, 0.16)` | `--border-hover` |
| Focus Ring | `rgba(56, 189, 248, 0.4)` | `--border-focus` |
| Text Primary | `#F8FAFC` | `--text-primary` |
| Text Secondary | `#94A3B8` | `--text-secondary` |
| Text Muted / Telemetry | `#64748B` | `--text-muted` |
| Blueprint Cyan | `#38BDF8` | `--accent-cyan` |
| Synapse Violet | `#818CF8` | `--accent-violet` |
| Verified Emerald | `#34D399` | `--accent-emerald` |
| HyDE Amber | `#FBBF24` | `--accent-amber` |
| Prune Rose | `#F43F5E` | `--accent-rose` |

### Typography

- **Display Headings:** `'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif`
- **Body & Controls:** `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- **Technical Coordinates & Code:** `'JetBrains Mono', 'Fira Code', ui-monospace, monospace`

### Grid & Seam Standards
- Modular cards use `divide-y md:divide-x border border-white/[0.08]` with background `#0E1117`.
- Corner coordinate markers use monospaced text like `[01]`, `§ 02`, `[x, y]`.
- All cards feature subtle rounded corners (`border-radius: 12px` or `16px`) with crisp 1px borders.
