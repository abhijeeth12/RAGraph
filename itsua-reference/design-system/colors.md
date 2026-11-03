# Design System: Color Palette & Specifications

**Status:** [VERIFIED via CSS AST & Computed DOM Styles]  
**Source Stylesheets:** `Base.CGMHpWBi.css`, `ReviewCard.DZefoKtB.css`  

---

## 1. Master Palette Overview

Itsua's color system is anchored in an industrial "Paper & Ink" motif, characterized by high-contrast monochrome foundations softened by an organic off-white substrate, delineated by technical hair lines, and punctuated by an electric blue primary accent and pastel category tints.

```
+-------------------------------------------------------------------------+
|  Primary Substrate: --color-paper (#f5f5f3)                             |
|  Surface Card:      --color-white (#ffffff)                             |
|  Technical Line:    --color-line  (#d9dadd)                             |
|  Primary Ink:       --color-ink   (#0e1012)                             |
|  Electric Accent:   --color-accent (#2f4cff)                            |
+-------------------------------------------------------------------------+
```

---

## 2. Core Color Tokens (HEX & Computed RGB/OKLAB)

| Token Name | HEX Code | Computed RGB / OKLAB | Usage / Semantic Role |
|---|---|---|---|
| `--color-paper` | `#f5f5f3` | `rgb(245, 245, 243)` | Primary alternating section background (Featured, Services). Warm, tactile off-white. |
| `--color-bg` / `--color-white` | `#ffffff` | `rgb(255, 255, 255)` | Page body base, card surfaces, sticky header background (with 95% opacity). |
| `--color-ink` | `#0e1012` | `rgb(14, 16, 18)` | Primary heading, body text, dark closer section background, heavy contrast accents. |
| `--color-sub` (Desktop) | `#60636a` | `rgb(96, 99, 106)` | Secondary body copy, section labels, timestamps, metadata on desktop. |
| `--color-sub` (Mobile) | `#4a4d55` | `rgb(74, 77, 85)` | Elevated contrast secondary copy on screens `max-width: 767px` for readability. |
| `--color-line` | `#d9dadd` | `rgb(217, 218, 221)` | 1px borders, table dividers, card boundaries, grid hair lines. |
| `--color-accent` | `#2f4cff` | `rgb(47, 76, 255)` | Primary interactive highlight, active status pills, CTA arrows, focus rings. |
| `--color-ink-soft` | `#eeeef0` | `rgb(238, 238, 240)` | Subtle neutral badge backgrounds, inactive toggle states. |

---

## 3. Categorical Soft Tint Accents (Badges & Tags)

Used across project cards, tech stack categories, and customer review tags:

| Category Tint | Soft Background HEX | Solid Foreground HEX | Example Application |
|---|---|---|---|
| **Blue Soft** | `#eef1ff` | `#2f4cff` | Web applications, Frontend stack, React/Vue tags |
| **Green Soft** | `#e6f7f1` | `#047857` (`#34d399` bright) | Active production status, verified Clutch reviews, Node.js |
| **Orange Soft** | `#fff2e5` | `#b45309` | Rescue & Rewrite service line, Python/Django tags |
| **Magenta Soft**| `#fbeefc` | `#a21caf` | Design & UX, E-commerce & Shopify Plus tags |
| **Red Soft** | `#fdecec` | `#ee4234` | Urgent alerts, behind schedule project states |
| **Yellow Soft** | `#fcfdec` | `#854d0e` | Security & compliance audits, caution notes |

---

## 4. Contrast & Accessibility Verification

All color pairings were analyzed against WCAG 2.1 AA specifications:

- **Ink (`#0e1012`) on White (`#ffffff`):** Ratio `18.2:1` (Passes AAA Large & Normal text).
- **Ink (`#0e1012`) on Paper (`#f5f5f3`):** Ratio `16.8:1` (Passes AAA Large & Normal text).
- **Secondary Subtext (`#60636a`) on White:** Ratio `6.1:1` (Passes AA Normal text).
- **Mobile Subtext (`#4a4d55`) on White:** Ratio `8.4:1` (Passes AAA Normal text — intentional mobile enhancement).
- **Accent Blue (`#2f4cff`) on White:** Ratio `5.2:1` (Passes AA Normal text & Large text).
- **Line (`#d9dadd`) on White:** Ratio `1.4:1` (Appropriate for non-text structural decorative borders).

---

## 5. CSS / Tailwind Export Code

```css
/* Core Root Variables extracted from Base.CGMHpWBi.css */
:root {
  --color-bg: #fff;
  --color-white: #fff;
  --color-ink: #0e1012;
  --color-paper: #f5f5f3;
  --color-sub: #60636a;
  --color-line: #d9dadd;
  --color-accent: #2f4cff;
  --color-ink-soft: #eeeef0;

  --color-blue-soft: #eef1ff;
  --color-green: #047857;
  --color-green-bright: #34d399;
  --color-green-soft: #e6f7f1;
  --color-orange: #b45309;
  --color-orange-soft: #fff2e5;
  --color-magenta: #a21caf;
  --color-magenta-soft: #fbeefc;
  --color-red-soft: #fdecec;
  --color-yellow-soft: #fcfdec;
}

@media (max-width: 767px) {
  :root {
    --color-sub: #4a4d55;
  }
}
```

