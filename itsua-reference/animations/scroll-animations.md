# Animation Specification: Scroll-Driven Physics & Fanning

**Status:** [VERIFIED via JS Bundle Decompilation & Formula Extraction]  
**Source Modules:** `4-FeaturedDeck.js`, `12-deck.js`  
**Target:** `#featured-deck .deck-card`  

---

## 1. 3D Card Deck Fanning Mechanics

When the user scrolls past `#featured-section`, the stacked cards fan outward in 3D perspective space:

### A. Viewport Ratio Calculation
```javascript
// Extracted from FeaturedDeck.js:
const calculateScrollProgress = () => {
  if (!rootBounds) return -1;
  const rect = sectionEl.getBoundingClientRect();
  const bottomThreshold = rootBounds.bottom - rect.height;
  const travelRange = Math.max(rootBounds.height - rect.height, rootBounds.height * 0.6);
  return (bottomThreshold - rect.top) / travelRange;
};

// Target range scaled by number of cards (A = 5) and card spacing (E = 1.6):
const getTargetProgress = () => {
  return Math.min(1, Math.max(0, calculateScrollProgress())) * (cardCount - 1 + 1.6);
};
```

### B. Exponential Smoothing Filter (Lerp)
The target progress is not applied raw (which causes jagged scroll motion on low-precision mouse wheels). Instead, it passes through an exponential low-pass filter:

$$l_t = l_{t-1} + (e - l_{t-1}) \cdot 0.16$$

```javascript
const tick = () => {
  if (!isIntersecting) {
    isRunning = false;
    return;
  }
  if (!isPointerActive) {
    const target = getTargetProgress();
    const delta = target - currentLerp;
    currentLerp = Math.abs(delta) < 0.0005 ? target : currentLerp + delta * 0.16;
    renderCards();
  }
  requestAnimationFrame(tick);
};
```

### C. Rotation Angle Attribution per Card
Each card's individual rotation angle is computed from its relative distance to the current scroll progress:
```javascript
const isDesktop = window.matchMedia("(min-width: 768px)").matches;
cards.forEach((card, index) => {
  const cardProgress = isDesktop ? (currentLerp - index) / 1.6 : calculateMobileProgress(card);
  const angle = calculateWobbleOrFan(cardProgress);
  
  const rx = isDesktop ? 0 : angle; // X-axis on mobile
  const ry = isDesktop ? angle : 0; // Y-axis on desktop
  
  card.style.setProperty("--rx", `${rx}deg`);
  card.style.setProperty("--ry", `${ry}deg`);
});
```

---

## 2. Drop-in GSAP ScrollTrigger Equivalent

```typescript
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function initDeckScrollAnimation(container: HTMLElement, cards: HTMLElement[]) {
  const isDesktop = window.innerWidth >= 768;

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: container,
      start: "top 75%",
      end: "bottom 25%",
      scrub: 0.5, // Emulates the 0.16 lerp factor
    }
  });

  cards.forEach((card, index) => {
    const maxAngle = (index - (cards.length - 1) / 2) * 6; // Fan angle (-12deg to +12deg)
    tl.to(card, {
      rotateY: isDesktop ? maxAngle : 0,
      rotateX: isDesktop ? 0 : maxAngle,
      x: isDesktop ? (index - 2) * 40 : 0,
      y: isDesktop ? Math.abs(index - 2) * 8 : (index - 2) * 30,
      ease: "power2.out",
    }, 0);
  });
}
```

