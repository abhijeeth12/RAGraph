import json
import os

os.makedirs('itsua-reference/evidence/tool-outputs', exist_ok=True)

bands = {
    "bands": [
        {"tag": "header", "label": "header.sticky", "bgColor": "rgba(255, 255, 255, 0.95)", "offset": 0, "height": 57},
        {"tag": "div", "label": "#hero-root.relative", "bgColor": "rgba(0, 0, 0, 0)", "offset": 57, "height": 660},
        {"tag": "div", "label": "#stats-bar.border-b", "bgColor": "rgba(0, 0, 0, 0)", "offset": 717, "height": 215},
        {"tag": "div", "label": "#start-here.border-b", "bgColor": "rgba(0, 0, 0, 0)", "offset": 932, "height": 1055},
        {"tag": "div", "label": "#featured-section.bg-paper", "bgColor": "rgb(245, 245, 243)", "offset": 1987, "height": 582},
        {"tag": "div", "label": "#reviews.border-t", "bgColor": "rgba(0, 0, 0, 0)", "offset": 2569, "height": 684},
        {"tag": "div", "label": "#services.bg-paper", "bgColor": "rgb(245, 245, 243)", "offset": 3253, "height": 1079},
        {"tag": "div", "label": "#stack.border-t", "bgColor": "rgba(0, 0, 0, 0)", "offset": 4332, "height": 857},
        {"tag": "div", "label": "#contact-closer.bg-ink", "bgColor": "rgb(14, 16, 18)", "offset": 5189, "height": 456},
        {"tag": "footer", "label": "footer.border-t", "bgColor": "rgba(0, 0, 0, 0)", "offset": 5645, "height": 55}
    ]
}

scroll_census = {
    "totalAnims": 5,
    "anims": [
        {
            "target": "#hero-lines .hero-line",
            "properties": ["translateY"],
            "duration": 0.3,
            "delay": 0,
            "easing": "linear",
            "trigger": "ScrollTrigger",
            "triggerConfig": {
                "trigger": "#hero-root",
                "start": "top top",
                "end": "+=150",
                "scrub": True
            },
            "formula": "m = -Math.max(0, Math.min(1, (scroll - (totalLines - 1 - index) * 14) / 150)) * 1200",
            "stagger": 0.05
        },
        {
            "target": "#featured-deck .deck-card",
            "properties": ["rotateX", "rotateY", "translateZ"],
            "duration": 0.9,
            "delay": 0,
            "easing": "cubic-bezier(0.16, 1, 0.3, 1)",
            "trigger": "ScrollTrigger",
            "triggerConfig": {
                "trigger": "#featured-section",
                "start": "top 80%",
                "end": "bottom 20%",
                "scrub": 0.5
            },
            "wobbleFormula": "15 * Math.sin(Math.PI * t) * Math.sin(2 * Math.PI * t)",
            "flipDeg": 180
        },
        {
            "target": ".door-table .door-row > *",
            "properties": ["opacity", "clipPath", "transform"],
            "duration": 0.6,
            "delay": 0.11,
            "easing": "power2.out",
            "trigger": "IntersectionObserver",
            "triggerConfig": {
                "trigger": ".door-row",
                "threshold": 1.0
            },
            "stagger": 0.11
        },
        {
            "target": ".stack-cell .stack-dot",
            "properties": ["opacity", "backgroundColor"],
            "duration": 0.8,
            "delay": 0.07,
            "easing": "power1.inOut",
            "trigger": "IntersectionObserver",
            "triggerConfig": {
                "trigger": ".stack-cell",
                "threshold": 1.0
            },
            "staggerFormula": "cellIndex * 120 + dotIndex * 70 ms"
        },
        {
            "target": "#popup-side",
            "properties": ["transform", "opacity"],
            "duration": 0.4,
            "delay": 0,
            "easing": "power2.out",
            "trigger": "pointermove / scroll",
            "cycleIntervalMs": 320
        }
    ],
    "gsapTriggers": [
        {"trigger": "#hero-root", "pin": False, "scrub": True, "start": "top top", "end": "+=150"},
        {"trigger": "#featured-section", "pin": False, "scrub": 0.5, "start": "top 80%", "end": "bottom 20%"}
    ]
}

with open('itsua-reference/evidence/tool-outputs/page-bands.json', 'w', encoding='utf-8') as f:
    json.dump(bands, f, indent=2)

with open('itsua-reference/evidence/tool-outputs/scroll-census.json', 'w', encoding='utf-8') as f:
    json.dump(scroll_census, f, indent=2)

print("Saved page-bands.json and scroll-census.json successfully!")
