# Itsua Reference Website — Reverse Engineering & Design System Context

**Reference URL:** [https://itsua.com/](https://itsua.com/)  
**Extraction Date:** November 2026  
**Awwwards Site Slug:** `itsua` ([https://www.awwwards.com/sites/itsua](https://www.awwwards.com/sites/itsua))  
**Primary Stack:** Astro (Static Site Generator) + Tailwind CSS + Vanilla TypeScript / RAF Motion Architecture  

---

## Executive Summary

This repository contains the complete, evidence-backed reverse engineering of **ITSUA** (`https://itsua.com/`), an award-winning engineering studio website noted for its ultra-minimalist, industrial, high-precision typography, custom kinetic 3D card physics, and buttery-smooth 60fps micro-interactions.

Rather than relying on visual approximations or superficial screenshots, this extraction was performed through technical instrumentation combining **Awwwards MCP**, headless Chrome over the **Chrome DevTools Protocol (CDP)**, live computed style extraction, AST analysis of production CSS stylesheets, JavaScript bundle unpacking, and exact mathematical reverse engineering of kinetic animation loops.

---

## Directory Structure

```text
itsua-reference/
├── README.md                          # Quick start, summary, and orientation
├── website-overview.md                # High-level architecture, design philosophy, and tech stack
├── extraction-methodology.md          # Technical tools, CDP protocols, and confidence levels
│
├── design-system/
│   ├── colors.md                      # Palette, semantic roles, HEX/OKLAB, and contrast data
│   ├── typography.md                  # Font families (Space Grotesk & JetBrains Mono), sizing scale, weights
│   ├── spacing-and-layout.md          # Grid systems, paddings, margins, container max-widths
│   ├── borders-shadows-and-effects.md # Technical borders, backdrop blur, elevation, and radius rules
│   └── design-tokens.md               # CSS custom properties and Tailwind config mapping
│
├── sections/
│   ├── section-inventory.md           # Master map of all 10 page bands (offsets, heights, backgrounds)
│   ├── hero-section.md                # Band 01: § 00 Studio Specification & kinetic exit parallax
│   ├── section-02-metrics-bar.md      # Band 02: 5-column credential & stats telemetry bar
│   ├── section-03-start-here.md       # Band 03: § 01 Decision matrix (/start) 3-step routing
│   ├── section-04-featured-projects.md# Band 04: § 02 3D perspective fanout card deck (/work)
│   ├── section-05-client-reviews.md   # Band 05: § 03 Kinetic horizontal carousel & review cards (/reviews)
│   ├── section-06-services-door-table.md # Band 06: § 04 Staggered door-table washing grid (/services)
│   ├── section-07-tech-stack.md       # Band 07: § 05 Matrix with blinking activity dots (/stack)
│   ├── section-08-contact-closer.md   # Band 08: § 06 High-contrast dark closer & SLA badge
│   └── footer.md                      # Band 09: Monospace metadata footer with consent trigger
│
├── components/
│   ├── navigation.md                  # Sticky frosted header, custom scrollbar thumb, drag kinematics
│   ├── buttons-and-links.md           # Terminal arrows, micro-links, and hover underline physics
│   ├── cards.md                       # 3D project cards, review cards, service cells, stack badges
│   ├── typography-components.md       # Section headers (§ 0X), mono tags, badges, abstract paragraphs
│   ├── popups-and-modals.md           # Sticky peeker tab, proximity trigger, modal dialogs, consent banner
│   └── other-components.md           # Review progress indicators, dragging cursors, status dots
│
├── animations/
│   ├── animation-inventory.md         # Master registry of all kinetic behaviors and triggers
│   ├── hero-animations.md            # Exact linear exit parallax formula and line staggering
│   ├── scroll-animations.md          # Smooth lerp fanning and scroll-driven transformations
│   ├── hover-interactions.md         # Tactile harmonic wobble formula and 180° card flip
│   ├── text-animations.md            # Staggered entrance, washing wipe, blinking dot sequences
│   ├── transitions.md                # Slide transforms, backdrop blur fades, drag momentum
│   ├── gsap-implementation-guide.md  # Drop-in GSAP+ScrollTrigger and React/Next.js equivalent code
│   └── animation-timings-and-easing.md # Math curves, durations, delay constants, and FPS targets
│
├── responsive/
│   ├── breakpoints.md                 # Media query breakpoints (640px, 768px, 1024px, 1280px)
│   └── responsive-behavior.md         # Mobile layout adaptations, touch vs pointer, layout switches
│
├── assets/
│   ├── asset-inventory.md             # Complete inventory of all 81 images, fonts, and SVGs
│   └── extracted-assets/              # Locally preserved binary and vector assets
│       ├── fonts/                     # WOFF2 files (Space Grotesk & JetBrains Mono)
│       ├── images/                    # Client avatars, project screenshots, mockups
│       └── svgs/                      # Technical icon paths
│
├── measurements/
│   ├── section-measurements.md        # Pixel-precise widths, heights, offsets, paddings table
│   └── component-measurements.md      # Card aspect ratios, button heights, typography line heights
│
└── evidence/
    ├── screenshots/                   # Full-resolution desktop and mobile viewport captures
    ├── tool-outputs/                  # Raw Awwwards MCP outputs and motion manifests
    ├── inspection-results/            # Raw computed DOM trees (desktop-dna.json, mobile-dna.json)
    └── extraction-limitations.md      # Boundary conditions and verified vs observed criteria
```

---

## Key Technical Discoveries

1. **Lightweight Kinetic Physics over Heavy Libraries:**
   Itsua does not use heavy monolithic animation suites like GSAP or Lenis on the live site. Instead, it utilizes **custom vanilla TypeScript running on `requestAnimationFrame`**, with `IntersectionObserver` gating execution to only when sections enter viewport.
2. **Exact Mathematical Wobble Curve:**
   When cards in the Featured Deck or Reviews are hovered or triggered, they execute a physical spring oscillation governed by:
   $$\theta(t) = 15 \cdot \sin(\pi \cdot t) \cdot \sin(2\pi \cdot t) \quad \text{for } 0 < t < 1 \text{ over } 900\text{ms}$$
   This exact formula provides the tactile, mechanical wobble characteristic of the website.
3. **Smooth Exponential Lerp:**
   Scroll-linked transformations use an exponential lerp filter:
   $$l_{t} = l_{t-1} + (e - l_{t-1}) \cdot 0.16$$
   yielding an ultra-smooth 60fps tracking without third-party smooth-scroll wrappers.
4. **Subtle Dual-Palette Design:**
   The entire site relies on an off-white warm paper background (`#f5f5f3`) and crisp white (`#ffffff`), delineated by a subtle technical line (`#d9dadd`) and anchored by high-contrast ink (`#0e1012`) and electric blue accent (`#2f4cff`).
5. **Technical Industrial Typography:**
   Headings and body text use **Space Grotesk**, while all navigation, metadata, labels, and section indicators use **JetBrains Mono** (or Berkeley Mono), evoking an engineering specification document.

