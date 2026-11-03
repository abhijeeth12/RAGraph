# Section: § 06 Contact Closer (Dark Closer & SLA)

**Status:** [VERIFIED via CDP Computed Styles & DOM Inspection]  
**DOM Target:** `div.border-t.border-b.border-line.bg-ink.text-white`  
**Section Index:** Band 08  
**Desktop Offset / Height:** Top: `5,186.8px` | Height: `456.4px` | Width: `1407px`  
**Mobile Height:** `610px`  
**Background Substrate:** `--color-ink: #0e1012` (`rgb(14, 16, 18)`) — Inverted High-Contrast Dark  

---

## 1. Visual Architecture & Layout

The contact closer is an intentional high-contrast interruption to the light/paper flow. Staging the closer on pure dark ink commands immediate attention:

```
+-----------------------------------------------------------------------------------------+
| § 06 — INITIATE CONTACT                                                                 |
|                                                                                         |
| Ready when you are.                                                                     |
|                                                                                         |
| [ → OPEN BRIEF FORM ]                                                                   |
|                                                                                         |
| --------------------------------------------------------------------------------------- |
| EMAIL            | HQ                           | VAT             | TIMEZONE  | SLA     |
| hello@itsua.com  | Sakala tn 7-2, Tallinn,      | EE102549430     | EET/UTC+2 | < 24h   |
|                  | 10141, Estonia               |                 |           |         |
+-----------------------------------------------------------------------------------------+
```

---

## 2. Component Specifications & Measurements

### A. Display Title (`h2`)
- **Text:** "Ready when you are."
- **Font Family:** `var(--font-sans)` (Space Grotesk)
- **Font Size (Desktop):** `48px` - `60px`
- **Font Size (Mobile):** `32px` - `36px`
- **Font Weight:** `700` (Bold)
- **Line Height:** `1.1`
- **Letter Spacing:** `-0.025em`
- **Color:** `#ffffff`

### B. Action Button (`→ OPEN BRIEF FORM`)
- **Tag:** `button[data-popup-trigger="start"]`
- **Dimensions:** Height: `48px` | Padding: `0 24px`
- **Background:** White (`#ffffff`)
- **Text Color:** `--color-ink: #0e1012`
- **Border Radius:** `4px`
- **Font Family:** `var(--font-mono)`
- **Font Size:** `13px`
- **Font Weight:** `600`
- **Hover State:** Background shifts to `--color-accent: #2f4cff`, text shifts to white.

### C. Operational Telemetry Strip
Positioned below a subtle border line (`border-t border-[#26292e]`):

| Metric Label | Content Value | Typography |
|---|---|---|
| **EMAIL** | `hello@itsua.com` | Mono 12px, hover underline |
| **HQ** | `Sakala tn 7-2, Tallinn, 10141, Estonia` | Mono 12px |
| **VAT** | `EE102549430` | Mono 12px |
| **TIMEZONE** | `EET / UTC+2` | Mono 12px |
| **RESPONSE SLA** | `< 24h` | Mono 12px, highlighted in green `#34d399` |

