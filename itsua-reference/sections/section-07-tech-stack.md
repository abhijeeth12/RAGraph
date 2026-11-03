# Section: § 05 Runtime & Tooling (/stack — Tech Stack Matrix)

**Status:** [VERIFIED via CDP Computed Styles & JavaScript Reverse Engineering]  
**DOM Target:** `div#stack.border-t.border-line.px-6.py-8.md:px-14.md:py-18`  
**Cell Selector:** `.stack-cell`  
**Dot Selector:** `.stack-dot`  
**Section Index:** Band 07  
**Desktop Offset / Height:** Top: `4,330.3px` | Height: `856.5px` | Width: `1407px`  
**Mobile Height:** `1,858px` (stacks vertically into individual category cards)  

---

## 1. Visual Architecture & Categories

The tech stack section demonstrates full-stack competence across 4 core operational domains:

```
+-----------------------------------------------------------------------------------------+
| § 05 — RUNTIME & TOOLING       /stack                                                   |
|                                                                                         |
| [CATEGORY 01]                  | [CATEGORY 02]                                          |
| LANGUAGES & RUNTIMES           | FRAMEWORKS                                             |
| TypeScript ●  Node.js ●        | Astro ●  React ●  Vue ●                                |
| PHP ●  Python ●  Go ●          | Nest.js ●  Laravel ●  Symfony ●  Tailwind ●            |
|--------------------------------+--------------------------------------------------------|
| [CATEGORY 03]                  | [CATEGORY 04]                                          |
| DATA & AI                      | INFRASTRUCTURE & CLOUD                                 |
| PostgreSQL ●  MySQL ●          | Cloudflare (Workers, Pages) ●  Docker ●                |
| Redis ●  Elasticsearch ●       | AWS (ECS, Lambda, S3) ●  Azure ●                       |
| OpenAI / Anthropic APIs ●      | GitHub Actions ●  Vercel ●                             |
+-----------------------------------------------------------------------------------------+
```

---

## 2. Kinetic Animation: Dual-Stagger Blinking Indicator LEDs

Extracted directly from runtime script `8-inline.js`:

### The Timing Calculation Formula:
Each technology item is accompanied by a circular indicator dot (`.stack-dot`). When the section scrolls into view (`intersectionRatio >= 0.99`), dots animate with a dual-stagger delay:

$$\text{delay}(c, n) = c \cdot 120\text{ms} + n \cdot 70\text{ms}$$

where:
- $c$: Index of the category cell ($0, 1, 2, 3$).
- $n$: Index of the technology dot within that category.

```javascript
// Extracted from 8-inline.js:
const l = document.querySelectorAll(".stack-cell");
const t = new IntersectionObserver(e => {
  e.filter(r => r.intersectionRatio >= 0.99).forEach((r, c) => {
    const s = r.target;
    s.querySelectorAll(".stack-dot").forEach((o, n) => {
      o.style.setProperty("--blink-delay", `${c * 120 + n * 70}ms`);
      o.classList.add("is-blinking");
    });
    t.unobserve(s);
  });
}, { threshold: 1 });
l.forEach(e => t.observe(e));
```

### CSS Blinking Keyframe Styling:
```css
.stack-dot {
  width: 6px;
  height: 6px;
  border-radius: 9999px;
  background-color: var(--color-green-bright, #34d399);
  opacity: 0.3;
  display: inline-block;
  margin-left: 6px;
  transition: opacity 0.3s ease;
}

.stack-dot.is-blinking {
  animation: stack-blink 1.2s ease-in-out var(--blink-delay, 0ms) 2 alternate;
}

@keyframes stack-blink {
  0% { opacity: 0.2; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.2); box-shadow: 0 0 8px #34d399; }
  100% { opacity: 0.7; transform: scale(1.0); }
}
```
This produces a physical server rack LED effect where status lights blink to life across the matrix upon entering view.

---

## 3. Typographic & Component Styling

- **Category Heading:** `font-mono text-[12px] font-bold tracking-wider text-sub mb-4 uppercase`
- **Tech Item Name:** Space Grotesk `15px` - `16px`, medium weight `500`, color `var(--color-ink)`.
- **Item Hover State:** Hovering over any technology item elevates its font color to `--color-accent` (`#2f4cff`) and illuminates its indicator dot to solid green.

