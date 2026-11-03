# Section: § 01 Decision Matrix (/start)

**Status:** [VERIFIED via CDP Computed Styles & DOM Inspection]  
**DOM Target:** `div.border-b.border-line.px-6.py-8.md:px-14.md:py-18`  
**Section Index:** Band 03  
**Desktop Offset / Height:** Top: `931.2px` | Height: `1,054.5px` | Width: `1407px`  
**Mobile Height:** `920px`  

---

## 1. Section Purpose & Content Strategy

The `/start` section functions as an interactive **Engagement Decision Matrix**. It addresses prospective clients who may not know their exact technical needs by mapping problem states to concrete engagement paths:

```
+---------------------------------------------------------------------------------------+
| § 01 — START HERE       /start                                      MORE DETAILS →    |
|                                                                                       |
| [HEADER ROW]                                                                          |
| 01 · YOU HAVE              | 02 · START WITH               | 03 · LEADS TO            |
|----------------------------+-------------------------------+--------------------------|
| My project is behind       | Rescue Audit                  | A written verdict,       |
| schedule                   | 2 days to an answer           | 2-day timeline, clear    |
|                            | you can forward               | architecture fixes       |
|----------------------------+-------------------------------+--------------------------|
| I have a spec and          | Product Sprint                | Shipped v1 in 6 weeks,   |
| need it built              | End-to-end MVP delivery       | production release date  |
|----------------------------+-------------------------------+--------------------------|
| I need senior engineers    | Team Augmentation             | Engineers embedded       |
| to plug into our team      | Staff scaling with vetted devs| in your Slack in 5 days  |
+---------------------------------------------------------------------------------------+
```

---

## 2. Component Specifications & Layout

### A. Section Header Bar
- **Section Indicator:** `§ 01 — START HERE` (`font-mono text-[12px] text-sub`)
- **Route Heading:** `/start` (`font-mono text-[18px] md:text-[22px] font-bold text-ink`)
- **Action Link:** `MORE DETAILS →` (`font-mono text-[12px] text-accent hover:underline`)

### B. Decision Matrix Table Grid
- **Container:** `div.divide-y.divide-line.border.border-line`
- **Columns (Desktop):** `grid grid-cols-12` or `grid grid-cols-[1.5fr_1.5fr_2fr]`
- **Row Padding:** `py-6 px-6 md:py-8 md:px-8`
- **Background:** White (`#ffffff`), with alternating rows subtly tinting on hover.

### C. Column Content & Typography
1. **Column 1 ("01 · YOU HAVE"):**
   - Header: `font-mono text-[11px] text-sub tracking-wider uppercase`
   - Content: Space Grotesk `18px` - `20px`, font weight 600, color `var(--color-ink)`.
2. **Column 2 ("02 · START WITH"):**
   - Service Pill / Badge: Custom soft pill badge (e.g. `bg-orange-soft text-orange` or `bg-blue-soft text-accent`).
   - Deliverable timeframe: JetBrains Mono `13px`, medium weight.
3. **Column 3 ("03 · LEADS TO"):**
   - Outcome copy: Space Grotesk `15px` - `16px`, color `var(--color-sub)`, line height `1.5`.

---

## 3. Responsive Adaptations
- On screens `< 768px`, the 3-column table collapses into a series of stacked, boxed action cards with step indicators ("STEP 01", "STEP 02", "STEP 03") rendered vertically.

