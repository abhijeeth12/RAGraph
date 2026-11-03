# Section: Band 02 — Metrics & Credentials Telemetry Strip

**Status:** [VERIFIED via CDP Computed Styles & DOM Inspection]  
**DOM Target:** `div.border-b.border-line.border-t`  
**Section Index:** Band 02  
**Desktop Offset / Height:** Top: `716.7px` | Height: `214.5px` | Width: `1407px`  
**Mobile Height:** `380px` (wraps to multi-row grid on smaller viewports)  

---

## 1. Section Layout & Structure

A high-density technical telemetry bar that anchors studio credibility immediately following the hero introduction:

```
+---------------------------------------------------------------------------------------------------------+
| [01] YEARS           | [02] CLIENTS         | [03] USERS           | [04] COUNTRIES       | [05] VERTICALS      |
| 12                   | 50+                  | 250K                 | 10+                  | 20+                 |
| years in operation   | clients shipped      | daily active users   | countries served     | industry verticals  |
+---------------------------------------------------------------------------------------------------------+
```

---

## 2. Telemetry Metric Data Points

| Metric Index | Label / Tag | Primary Value | Subtitle Description |
|---|---|---|---|
| **Col 1** | `years` | `12` | "years in operation" |
| **Col 2** | `clients` | `50 +` | "clients shipped" |
| **Col 3** | `users` | `250 K` | "daily active users" |
| **Col 4** | `countries` | `10 +` | "countries served" |
| **Col 5** | `verticals` | `20 +` | "industry verticals" |

---

## 3. Component Measurements & Styling

### A. Container Grid
- **Display:** `grid`
- **Columns (Desktop):** `grid-cols-5` (5 equal columns divided by continuous 1px right borders).
- **Columns (Tablet):** `grid-cols-2` or `grid-cols-3`
- **Columns (Mobile):** `grid-cols-1` stacked or `grid-cols-2`
- **Borders:** Top border `1px solid var(--color-line)`, bottom border `1px solid var(--color-line)`. Internal column divider `1px solid var(--color-line)`.
- **Cell Padding (Desktop):** `px-8 py-10` (`padding: 40px 32px`).
- **Cell Padding (Mobile):** `px-6 py-6` (`padding: 24px 24px`).

### B. Typography Specifications
- **Category Label (`years`, `clients`...):**
  - Font: `var(--font-mono)` (JetBrains Mono)
  - Size: `11px` (`0.6875rem`)
  - Weight: `400`
  - Color: `--color-sub: #60636a`
  - Text Transform: `uppercase`
  - Letter Spacing: `0.08em`
- **Numeric Value (`12`, `50 +`, `250 K`...):**
  - Font: `var(--font-sans)` (Space Grotesk)
  - Size (Desktop): `48px` - `60px`
  - Size (Mobile): `36px` - `40px`
  - Weight: `700` (Bold)
  - Line Height: `1.0`
  - Color: `--color-ink: #0e1012`
  - Letter Spacing: `-0.02em`
- **Description Copy ("years in operation"...):**
  - Font: `var(--font-mono)`
  - Size: `12px`
  - Weight: `400`
  - Color: `--color-sub: #60636a`
  - Line Height: `1.4`

---

## 4. Interaction & Micro-states
- Cells feature subtle hover background transition to `var(--color-paper)` (`#f5f5f3`) on `hover:hover` devices.
- Values do not run distracting slot-machine ticker counters; they stand clean and authoritative upon load.

