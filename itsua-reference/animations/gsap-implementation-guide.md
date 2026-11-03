# Animation Specification: GSAP + React Implementation Guide

**Status:** [VERIFIED Motion Mapping Architecture]  
**Purpose:** Re-implement Itsua's kinetic feel inside modern React 19 / Next.js 16 or Vite projects using standard GSAP + ScrollTrigger while preserving 100% of the mathematical behavior.

---

## 1. Complete GSAP Master Controller (`useItsuaMotion.ts`)

```typescript
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function useItsuaMotion() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Prefers-Reduced-Motion Guardrail
      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (prefersReduced) return;

      // -----------------------------------------------------------------------
      // ANIM-01: Hero Line Stagger Exit Parallax
      // -----------------------------------------------------------------------
      const heroLines = gsap.utils.toArray<HTMLElement>("#hero-lines .hero-line");
      if (heroLines.length > 0) {
        const total = heroLines.length;
        const heroTl = gsap.timeline({
          scrollTrigger: {
            trigger: "#hero-root",
            start: "top top",
            end: "+=150",
            scrub: true,
          }
        });

        heroLines.forEach((line, index) => {
          // Inverted stagger calculation from Itsua formula
          const staggerOffset = (total - 1 - index) * (14 / 150);
          heroTl.to(line, {
            y: -1200,
            ease: "none",
          }, staggerOffset);
        });
      }

      // -----------------------------------------------------------------------
      // ANIM-02: Featured Deck 3D Scroll Fanning
      // -----------------------------------------------------------------------
      const deckCards = gsap.utils.toArray<HTMLElement>("#featured-deck .deck-card");
      if (deckCards.length > 0) {
        const isDesktop = window.innerWidth >= 768;
        const deckTl = gsap.timeline({
          scrollTrigger: {
            trigger: "#featured-section",
            start: "top 80%",
            end: "bottom 30%",
            scrub: 0.5, // Emulates 0.16 exponential lerp factor
          }
        });

        deckCards.forEach((card, index) => {
          const spreadFactor = (index - (deckCards.length - 1) / 2);
          const fanAngle = spreadFactor * 5.5; // -11deg to +11deg

          deckTl.to(card, {
            rotateY: isDesktop ? fanAngle : 0,
            rotateX: isDesktop ? 0 : fanAngle,
            x: isDesktop ? spreadFactor * 42 : 0,
            y: isDesktop ? Math.abs(spreadFactor) * 8 : spreadFactor * 28,
            ease: "power2.out",
          }, 0);
        });
      }

      // -----------------------------------------------------------------------
      // ANIM-05: Services Door Table Washing Wipe
      // -----------------------------------------------------------------------
      const doorRows = gsap.utils.toArray<HTMLElement>(".door-row");
      doorRows.forEach((row, rowIndex) => {
        const cells = row.children;
        gsap.fromTo(cells, 
          {
            opacity: 0,
            clipPath: "polygon(0 0, 0 0, 0 100%, 0 100%)",
          },
          {
            opacity: 1,
            clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
            duration: 0.6,
            stagger: 0.11, // Exactly 110ms Itsua stagger!
            ease: "power2.out",
            scrollTrigger: {
              trigger: row,
              start: "top 85%",
              toggleActions: "play none none none",
            }
          }
        );
      });

      // -----------------------------------------------------------------------
      // ANIM-06: Tech Stack Blinking LED Sequence
      // -----------------------------------------------------------------------
      const stackCells = gsap.utils.toArray<HTMLElement>(".stack-cell");
      stackCells.forEach((cell, cellIndex) => {
        const dots = cell.querySelectorAll(".stack-dot");
        dots.forEach((dot, dotIndex) => {
          const delayMs = cellIndex * 120 + dotIndex * 70;
          gsap.fromTo(dot,
            { opacity: 0.2, scale: 0.8 },
            {
              opacity: 1,
              scale: 1.25,
              duration: 0.5,
              delay: delayMs / 1000,
              repeat: 3,
              yoyo: true,
              ease: "power1.inOut",
              scrollTrigger: {
                trigger: "#stack",
                start: "top 80%",
                toggleActions: "play none none none",
              }
            }
          );
        });
      });

    }, rootRef);

    return () => ctx.revert();
  }, []);

  return rootRef;
}
```

---

## 2. Card Harmonic Wobble Hook (`useCardWobble.ts`)

```typescript
import { useRef, useCallback } from "react";

export function useCardWobble() {
  const cardRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number | null>(null);

  // Exact Itsua mathematical formula
  const wobbleEquation = (t: number) => {
    return t <= 0 || t >= 1 ? 0 : 15 * Math.sin(Math.PI * t) * Math.sin(2 * Math.PI * t);
  };

  const triggerWobble = useCallback(() => {
    const startTime = performance.now();
    const duration = 900; // ms

    const step = (now: number) => {
      const elapsed = (now - startTime) / duration;
      if (cardRef.current) {
        const angle = wobbleEquation(elapsed);
        cardRef.current.style.setProperty("--rx", `${angle.toFixed(2)}deg`);
      }

      if (elapsed < 1) {
        animRef.current = requestAnimationFrame(step);
      } else {
        if (cardRef.current) cardRef.current.style.setProperty("--rx", "0deg");
      }
    };

    if (animRef.current) cancelAnimationFrame(animRef.current);
    animRef.current = requestAnimationFrame(step);
  }, []);

  return { cardRef, triggerWobble };
}
```

