# Animation Specification: Hero Kinetic Exit Parallax

**Status:** [VERIFIED via JavaScript Reverse Engineering & Formula Extraction]  
**Source Module:** `2-inline.js`  
**Target:** `document.getElementById("hero-lines")` -> `.hero-line`  

---

## 1. Mathematical Derivation

The hero section features a signature kinetic exit animation applied to its 12 background grid/lines. As the user begins scrolling down from the top of the page, the lines exit upwards in a staggered, accelerating wave:

### The Production Code:
```javascript
const n = document.getElementById("hero-lines");
if (n) {
  const o = Array.from(n.querySelectorAll(".hero-line"));
  const s = n.parentElement;
  const r = o.length;  // r = 12 (number of lines)
  const l = 14;        // l = 14px stagger interval per line
  const c = 150;       // c = 150px active scroll travel window
  const i = 1200;      // i = 1200px max translation distance
  let e = null;

  const a = () => {
    e = null;
    if (!s) return;
    const d = s.getBoundingClientRect();
    const h = Math.max(0, -d.top); // Pixels scrolled past hero top
    
    o.forEach((u, E) => {
      // E: line index (0 to 11)
      // Progress calculation with inverted stagger:
      const staggerThreshold = (r - 1 - E) * l;
      const progress = Math.max(0, Math.min(1, (h - staggerThreshold) / c));
      const m = -progress * i;
      u.style.translate = `0 ${m.toFixed(2)}px`;
    });
  };

  const t = () => {
    e === null && (e = requestAnimationFrame(a));
  };

  window.addEventListener("scroll", t, { passive: true });
  window.addEventListener("resize", t);
  t();
}
```

---

## 2. Parameter Breakdown

| Symbol | Value | Architectural Purpose |
|---|---|---|
| `r` | `12` | Total line elements in the hero grid container. |
| `l` | `14px` | Stagger offset in scroll pixels. Each line waits for an additional 14px of scroll before initiating movement. |
| `c` | `150px` | Scroll duration window. Over a total of 150px of page scroll, a line completes its entire travel. |
| `i` | `1200px` | Maximum upward translation applied to `.hero-line`. Exits completely past the top viewport edge. |
| `r - 1 - E` | Inverted index | Lines at the bottom of the container (index 11) move first; lines at the top move last. |

---

## 3. Implementation in React / GSAP

For implementation in React / Next.js with GSAP ScrollTrigger:

```typescript
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function useHeroParallax(heroRef: React.RefObject<HTMLElement>, linesRef: React.RefObject<HTMLElement>) {
  useEffect(() => {
    if (!heroRef.current || !linesRef.current) return;

    const lines = linesRef.current.querySelectorAll(".hero-line");
    const total = lines.length;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: heroRef.current,
        start: "top top",
        end: "+=150",
        scrub: true,
      }
    });

    lines.forEach((line, index) => {
      // Inverted stagger matching Itsua's formula
      const delay = (total - 1 - index) * (14 / 150);
      tl.to(line, {
        y: -1200,
        ease: "none",
        duration: 1 - delay,
      }, delay);
    });

    return () => {
      tl.kill();
    };
  }, []);
}
```

