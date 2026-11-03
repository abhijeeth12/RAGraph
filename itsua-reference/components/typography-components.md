# Component Specification: Typography & Micro-text Components

**Status:** [VERIFIED via CDP Computed Styles & DOM Inspection]  

---

## 1. Section Header Flag (`§ 0X — NAME`)

Every primary section initiates with an architectural specification flag:

```html
<div class="flex items-center gap-2 font-mono text-[12px] text-sub tracking-wider uppercase">
  <span class="text-ink font-bold">§ 02</span>
  <span>—</span>
  <span>FEATURED PROJECTS</span>
</div>
```

- **Symbol (`§`):** Signifies legal/engineering code standard.
- **Index:** Two-digit integer with leading zero (`00`, `01`, `02`, `03`, `04`, `05`, `06`).
- **Divider:** Em-dash `—` with equal whitespace.
- **Title:** All-caps monospaced category name.

---

## 2. Category Soft Pill Badges

Used for project categories, urgency flags, and technology pills:

```html
<!-- Example Blue Soft Badge -->
<span class="inline-flex items-center rounded px-2 py-0.5 font-mono text-[11px] font-medium bg-blue-soft text-accent">
  WEB APPLICATION
</span>

<!-- Example Green Soft Badge -->
<span class="inline-flex items-center rounded px-2 py-0.5 font-mono text-[11px] font-medium bg-green-soft text-green">
  LIVE PLATFORM
</span>

<!-- Example Orange Soft Badge -->
<span class="inline-flex items-center rounded px-2 py-0.5 font-mono text-[11px] font-medium bg-orange-soft text-orange">
  RESCUE AUDIT
</span>
```

- **Padding:** `2px 8px` (`py-0.5 px-2`)
- **Border Radius:** `2px` - `4px`
- **Font Size:** `11px` (`0.6875rem`)
- **Font Weight:** `500` (Medium)
- **Tracking:** `0.02em`

---

## 3. Inline Technology Tag Lists

Used to list tech stacks in cards and headers:

```html
<p class="font-mono text-[11px] text-sub tracking-wide">
  PYTHON <span class="text-line">·</span> NEST <span class="text-line">·</span> VUE <span class="text-line">·</span> MYSQL
</p>
```

- **Separator:** Middle dot `·` styled with `--color-line` to avoid visual clutter.
- **Font Family:** `var(--font-mono)`
- **Color:** `--color-sub: #60636a`
- **Text Transform:** `uppercase`

