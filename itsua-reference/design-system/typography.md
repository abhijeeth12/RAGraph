# Design System: Typography & Type Hierarchy

**Status:** [VERIFIED via CSS AST, `@font-face` inspection & Computed DOM Styles]  
**Extracted Fonts:** Saved in `itsua-reference/assets/extracted-assets/fonts/`  

---

## 1. Font Family System

Itsua establishes a dual-font typographic architecture:
1. **Primary Editorial / Display Font:** **Space Grotesk** (Geometric Sans-Serif with idiosyncratic ink-traps).
2. **Technical / Telemetry / Interface Font:** **JetBrains Mono** (Technical Monospace with clean legibility).

```css
/* Extracted font stacks from Base.CGMHpWBi.css */
--font-sans: "Space Grotesk", "Söhne", "GT America", "Inter", "Helvetica Neue", Helvetica, Arial, sans-serif;
--font-mono: "Berkeley Mono", "JetBrains Mono", "IBM Plex Mono", ui-monospace, monospace;
```

---

## 2. Extracted `@font-face` Specifications

The live site serves custom self-hosted WOFF2 fonts with optimized character subsets:

| Font Family | Weights | Style | Formats | Local Extracted Path |
|---|---|---|---|---|
| **Space Grotesk** | `400` (Normal), `700` (Bold) | `normal` | `.woff2` | `assets/extracted-assets/fonts/space-grotesk-latin.woff2` |
| **Space Grotesk (Ext)** | `400`, `700` | `normal` | `.woff2` | `assets/extracted-assets/fonts/space-grotesk-latin-ext.woff2` |
| **JetBrains Mono** | `400` (Normal), `500` (Medium) | `normal` | `.woff2` | `assets/extracted-assets/fonts/jetbrains-mono-latin.woff2` |
| **JetBrains Mono (Ext)**| `400`, `500` | `normal` | `.woff2` | `assets/extracted-assets/fonts/jetbrains-mono-latin-ext.woff2` |

---

## 3. Typographic Hierarchy & Scale

Measurements extracted from live Chrome runtime across desktop and mobile viewports:

| Level / Role | Font Family | Size (px / rem) | Weight | Line Height | Letter Spacing | Text Transform | Example Content |
|---|---|---|---|---|---|---|---|
| **Display H1 (Hero)** | Space Grotesk | `60px` - `80px` (fluid) | 700 (Bold) | `1.05` - `1.1` | `-0.03em` | None | "A full-stack engineering studio / Shipping since 2014" |
| **Section Title (H2)**| Space Grotesk | `34px` - `40px` | 700 (Bold) | `1.15` | `-0.02em` | None | "Ready when you are." |
| **Card Title (H3)** | Space Grotesk | `20px` - `26px` | 700 (Bold) | `1.2` | `-0.015em`| None | "Crawler", "Retail Network" |
| **Section Label** | JetBrains Mono | `12px` (`0.75rem`) | 500 (Medium) | `1.4` | `0.02em` | Uppercase | "§ 00 — STUDIO SPECIFICATION", "§ 02 — FEATURED PROJECTS" |
| **Telemetry / Route** | JetBrains Mono | `12px` | 500 (Medium) | `1.0` | `0` | None | `/start`, `/work`, `/reviews`, `/services`, `/stack` |
| **Body Paragraph** | Space Grotesk | `16px` (`1rem`) | 400 (Normal) | `1.5` | `0` | None | Studio abstract, project descriptions, client review text |
| **Metadata / Badge** | JetBrains Mono | `11px` - `12px` | 400 (Normal) | `1.3` | `0.03em` | Uppercase | "PYTHON · NEST · VUE · MYSQL", "RECRUITMENT" |
| **Footer Legal** | JetBrains Mono | `11px` (Mobile) / `12px` (Desktop) | 400 (Normal) | `1.4` | `0` | None | "VAT EE102549430", "© 2014–2026 ITSUA OÜ" |

---

## 4. Special Typographic Conventions

1. **Section Indexing Marker (`§`):**
   - Every section is prefixed with the legal/specification symbol `§` followed by a two-digit zero-padded index (e.g., `§ 00`, `§ 01`, `§ 02`, `§ 03`, `§ 04`, `§ 05`, `§ 06`).
   - Styled with `font-mono text-[12px] text-sub tracking-wider`.
2. **Terminal Routing Slashes (`/`):**
   - Headings of major sections display the URL path representation in bold monospaced typography (`/start`, `/work`, `/reviews`, `/services`, `/stack`).
3. **Indicator Dots (`●`):**
   - Technical bullet points in the stack section and metadata tags use circular filled dots `●` styled with blinking opacity or accent tints.
4. **Directional Arrow Glyphs (`→`, `↗`):**
   - Internal links use rightwards arrow `→` (e.g., `→ REQUEST PROPOSAL`, `MORE DETAILS →`).
   - External links use north-east arrow `↗` (e.g., `ALL ON CLUTCH ↗`).

