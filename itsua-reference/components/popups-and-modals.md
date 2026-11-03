# Component Specification: Popups, Modals & Side Peeker

**Status:** [VERIFIED via CDP Computed Styles & JavaScript Reverse Engineering]  
**DOM Targets:** `#popup-side`, `#popup-root`, `#popup-backdrop`, `#popup-meet`, `#popup-start`, `#popup-refer`, `#consent`  

---

## 1. Persistent Sticky Side Peeker (`#popup-side`)

The side peeker is a floating interactive widget docked on the left browser edge:

```
+-------------------+
| [/start Project]  |  Fixed left edge: top: 50%; transform: translateY(-50%);
| [/meet Founder]   |  Detects cursor proximity: Math.hypot(dx, dy) < 140px -> peeks out
| [/refer Client]   |  Cycles active highlight every 320ms while page scrolls!
+-------------------+
```

### A. Proximity Sensing Mechanics
Extracted from `9-Popups.astro`:
```javascript
const a = document.getElementById("popup-side");
const triggerPeek = (duration = 1400) => {
  a.setAttribute("data-state", "peek");
  clearTimeout(timer);
  timer = setTimeout(() => {
    if (!a.matches(":hover")) a.setAttribute("data-state", "");
  }, duration);
};

// Proximity detection listener:
document.addEventListener("mousemove", o => {
  const s = a.getBoundingClientRect();
  const dx = Math.max(0, s.left - o.clientX, o.clientX - s.right);
  const dy = Math.max(0, s.top - o.clientY, o.clientY - s.bottom);
  if (Math.hypot(dx, dy) < 140) triggerPeek(); // 140px proximity radius!
}, { passive: true });
```

### B. Scroll Tab Cycling Highlight
While the page is scrolling, tabs inside `#popup-side` cycle an active highlight every `320ms`:
```javascript
window.addEventListener("scroll", () => {
  if (intervalId === undefined) {
    cycleTab();
    intervalId = setInterval(cycleTab, 320); // 320ms cycle!
  }
  clearTimeout(scrollStopTimer);
  scrollStopTimer = setTimeout(() => {
    clearInterval(intervalId);
    intervalId = undefined;
    clearHighlight();
  }, 200);
}, { passive: true });
```

---

## 2. Modal Overlay System (`#popup-root`, `#popup-backdrop`)

### A. Modals Inventory
1. `#popup-meet`: "Book an introductory call with an engineering partner" (Calendly integration).
2. `#popup-start`: "Submit project brief or RFP" (Direct proposal submission form).
3. `#popup-refer`: "Refer a client and earn partner rev-share".

### B. Modal Dialog Architecture
- **Root Container:** Fixed overlay (`fixed inset-0 z-50 flex items-center justify-center p-4`).
- **Backdrop:** `#popup-backdrop` with `bg-ink/40 backdrop-blur-[4px]`.
- **Panel Dimensions:** Max-width: `560px` | Width: `100%` | Padding: `32px` (`p-8`).
- **Surface:** White background (`#ffffff`), `rounded-[4px]`, `box-shadow: 0 24px 64px -12px rgba(14, 16, 18, 0.25)`.
- **Keyboard & Accessibility Controls:**
  - Locks body scrolling upon opening: `document.body.style.overflow = "hidden"`.
  - Dismisses on `Escape` key (`e.key === "Escape"`).
  - Dismisses on backdrop click or close button (`[data-popup-close]`).
  - Sets `aria-hidden="false"` on open, `aria-hidden="true"` on close.

---

## 3. Cookie & Consent Banner (`#consent`)

Extracted from `0-inline.js` and `10-ConsentBanner.astro`:
- **Storage Key:** `localStorage.getItem("itsua_consent")`.
- **Consent Duration:** 395 days (13 months) before re-prompting.
- **Global Privacy Control (GPC):** If `navigator.globalPrivacyControl` is active, defaults strictly to `denied`.
- **Animation Entrance:** Keyframe animation `consent-in`:
```css
@keyframes consent-in {
  0% { opacity: 0; transform: translateY(24px); visibility: hidden; }
  100% { opacity: 1; transform: translateY(0); visibility: visible; }
}
```

