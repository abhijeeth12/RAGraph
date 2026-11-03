# Animation Inventory: Master Registry of Kinetic Behaviors

**Status:** [VERIFIED via JS Bundle Decompilation & Runtime Measurement]  

---

## Master Animation Registry

| ID | Animation Name | Target Elements | Trigger Mechanism | Mathematical Formula / Easing | Duration | Stagger Interval | State Change |
|---|---|---|---|---|---|---|---|
| **ANIM-01** | Hero Exit Parallax | `#hero-lines .hero-line` (12 lines) | Window scroll past top | Linear stagger travel: `(h - (r-1-E)*14)/150 * -1200px` | 150px scroll window | 14px scroll stagger per line | `translateY(0)` -> `translateY(-1200px)` |
| **ANIM-02** | 3D Deck Fanning | `#featured-deck .deck-card` | Window scroll in section | Exponential lerp: `l = l + t * 0.16` | Continuous RAF | Proportional card index $(l - n)/1.6$ | `rotateY(0deg)` -> `rotateY(b deg)` |
| **ANIM-03** | Card Tactile Wobble | `.deck-card`, `.review-deck` | `pointerenter` (hover) | Harmonic oscillation: $15 \cdot \sin(\pi t) \cdot \sin(2\pi t)$ | 900ms | Independent per card | `--rx` / `--ry` oscillates $\pm 15^\circ$ |
| **ANIM-04** | Card 180° Flip | `.deck-card`, `.review-deck` | Click on card surface | 3D Perspective Rotation | 600ms (`cubic-bezier(0.16, 1, 0.3, 1)`) | Instant | `rotateX(0deg)` -> `rotateX(180deg)` |
| **ANIM-05** | Door Table Washing Wipe | `.door-table .door-row > *` | `IntersectionObserver` (99% view) | Clip-path coordinate projection: `--cx, --cy, --rw, --rh` | 600ms | 110ms per row child | Opacity 0 -> 1, clip-path unmask |
| **ANIM-06** | Tech Stack LED Blinking | `.stack-cell .stack-dot` | `IntersectionObserver` (99% view) | Keyframe pulse: `c * 120 + n * 70 ms` | 1200ms | Category: 120ms, Dot: 70ms | Opacity 0.2 -> 1.0 -> 0.7, glow |
| **ANIM-07** | Carousel Momentum Drag | `#review-track` | Pointer drag / touch swipe | Inertial snap $(v + p \cdot \text{width})$ | 350ms (`ease-out`) | None | `scrollLeft` smooth scroll |
| **ANIM-08** | Proximity Peeker Peek | `#popup-side` | Mouse within 140px radius | Distance formula: $\text{hypot}(dx, dy) < 140$ | 1400ms stay | None | `data-state="peek"`, translateX |
| **ANIM-09** | Peeker Tab Scroll Cycle | `#popup-side .popup-tab` | Window scroll active | Periodic interval loop | 320ms cycle | None | Cycles `data-highlight="true"` |
| **ANIM-10** | Custom Nav Scrollbar | `#nav-scrollbar-thumb` | Scroll or track pointer drag | Direct ratio: `(scrollLeft / max) * travel` | Real-time | None | `translateX(px)` |
| **ANIM-11** | Consent Banner Slide-in| `#consent` | GPC & LocalStorage evaluated | `@keyframes consent-in` | 400ms (`ease-out`) | None | `translateY(24px)` -> `0px`, opacity 0 -> 1 |

---

## Core Engine Architecture

Rather than loading a 70KB third-party bundle, Itsua's motion architecture is built on three lean primitives:
1. **Window-gated `requestAnimationFrame` loops:** Running only when `IntersectionObserver` flags sections as currently intersecting.
2. **CSS Variables (`--rx`, `--ry`, `--delay`, `--cx`, `--cy`):** Mathematical values are written to inline styles as CSS variables, allowing hardware-accelerated CSS engines to interpolate frames on the GPU compositor thread.
3. **Passive Event Listeners:** All scroll and touch listeners enforce `{ passive: true }`, ensuring scroll threads never block on JavaScript execution.

