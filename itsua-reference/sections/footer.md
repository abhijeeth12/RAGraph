# Section: Footer & Global Meta

**Status:** [VERIFIED via CDP Computed Styles & DOM Inspection]  
**DOM Target:** `footer.flex.flex-wrap.items-stretch.border-t.border-line.font-mono`  
**Section Index:** Band 09  
**Desktop Offset / Height:** Top: `5,643.2px` | Height: `55.0px` | Width: `1407px`  
**Mobile Height:** `107px` (wraps across 2-3 vertical lines)  

---

## 1. Visual Architecture & Layout

The footer concludes the page with understated, legal, and operational metadata presented in a clean single-row monospace format:

```
+-----------------------------------------------------------------------------------------+
| © 2014–2026 ITSUA OÜ · ALL RIGHTS RESERVED        | COOKIES & CONSENT | PRIVACY POLICY  |
+-----------------------------------------------------------------------------------------+
```

---

## 2. Component Specifications & Measurements

- **Container:** `footer`
- **Height (Desktop):** Exactly `55px`
- **Height (Mobile):** `107px`
- **Borders:** Top border `1px solid var(--color-line)` (`#d9dadd`)
- **Padding (Desktop):** `px-14` (`56px`) horizontal, `0` vertical (uses `items-center` / `items-stretch` for vertical centering).
- **Padding (Mobile):** `px-6 py-4` (`24px 16px`).
- **Font Family:** `var(--font-mono)` (JetBrains Mono)
- **Font Size (Desktop):** `12px`
- **Font Size (Mobile):** `11px` (`sm:text-[12px]`)
- **Color:** `--color-sub: #60636a`
- **Link Hover State:** Color shifts to `--color-ink` (`#0e1012`) with underline.

---

## 3. Interactive Elements
1. **Consent Re-open Trigger:**
   - Link with `data-consent-open` attribute.
   - Clicking re-invokes the cookie consent banner (`#consent`) without requiring cache clearance.
2. **External Legal Links:**
   - Privacy Policy and Terms links styled with subtle hover transitions.

