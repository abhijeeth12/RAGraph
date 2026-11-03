# Animation Specification: Text & Indicator Reveals

**Status:** [VERIFIED via JS Bundle Decompilation & CSS AST]  

---

## 1. Door Table "Washing Wipe" Reveal

**Source Module:** `3-inline.js`  
**Target:** `.door-table .door-row > *`  

When the services table reaches `threshold: 1.0` in the viewport:
1. JavaScript projects each cell's coordinate relative to the row:
   - `--cx`: Left distance from row left
   - `--cy`: Top distance from row top
   - `--rw`: Total row width
   - `--rh`: Total row height
2. Applies staggered delay: `--delay: ${index * 110}ms`.
3. Adds class `.is-washing`.

```css
/* Extracted styling */
.door-row > * {
  opacity: 0;
  clip-path: polygon(0 0, 0 0, 0 100%, 0 100%);
  transition: opacity 0.4s ease var(--delay, 0ms),
              clip-path 0.6s cubic-bezier(0.16, 1, 0.3, 1) var(--delay, 0ms);
}
.door-row > *.is-washing {
  opacity: 1;
  clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
}
```

---

## 2. Tech Stack LED Indicator Sequence

**Source Module:** `8-inline.js`  
**Target:** `.stack-cell .stack-dot`  

When entering viewport (`intersectionRatio >= 0.99`):
1. JavaScript loops through each category cell ($c$) and dot child ($n$).
2. Assigns compound delay:
   $$\text{delay} = c \cdot 120\text{ms} + n \cdot 70\text{ms}$$
3. Adds class `.is-blinking`.

```css
@keyframes stack-blink {
  0% {
    opacity: 0.2;
    transform: scale(0.85);
  }
  50% {
    opacity: 1.0;
    transform: scale(1.25);
    box-shadow: 0 0 8px rgba(52, 211, 153, 0.6);
  }
  100% {
    opacity: 0.7;
    transform: scale(1.0);
  }
}

.stack-dot.is-blinking {
  animation: stack-blink 1.2s ease-in-out var(--blink-delay, 0ms) 2 alternate;
}
```

---

## 3. Side Peeker Highlight Cycling

**Source Module:** `9-Popups.astro`  
**Target:** `#popup-side .popup-tab`  

While the user is scrolling:
1. Every `320ms`, JavaScript increments active tab pointer `(l + 1) % tabCount`.
2. Sets `data-highlight="true"` on active tab.
3. Once scrolling ceases, a `200ms` debounce timer fires, clears the interval, and removes all highlights.

