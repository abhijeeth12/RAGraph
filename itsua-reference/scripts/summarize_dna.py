import json

with open('itsua-reference/evidence/inspection-results/desktop-dna.json', 'r', encoding='utf-8') as f:
    desktop = json.load(f)

with open('itsua-reference/evidence/inspection-results/mobile-dna.json', 'r', encoding='utf-8') as f:
    mobile = json.load(f)

print("=== DESKTOP SECTIONS (1440x900) ===")
for sec in desktop['sections']:
    r = sec['styles']['rect']
    print(f"[{sec['index']}] <{sec['tag']}> id={sec['id']} class={sec['className']}")
    print(f"    w={r['width']}px, h={r['height']}px, top={r['top']}px, bg={sec['styles']['backgroundColor']}, pad={sec['styles']['padding']}")

print("\n=== KEY COMPONENT MEASUREMENTS ===")
comps = desktop['components']

# Header
h = comps['header']['styles']
print(f"Header: h={h['rect']['height']}px, pos={h['position']}, zIndex={h['zIndex']}, bg={h['backgroundColor']}, backdrop={h['backdropFilter']}")

# Hero
hero = comps['hero']['container']
print(f"Hero Container: w={hero['rect']['width']}px, h={hero['rect']['height']}px, pad={hero['padding']}")
for line in comps['hero']['heroLines']:
    print(f"  Hero Line [{line['index']}]: '{line['text']}' font-size={line['styles']['fontSize']}, weight={line['styles']['fontWeight']}, h={line['styles']['rect']['height']}px")

# Featured Deck
fd = comps['featuredDeck']['container']
print(f"Featured Section: w={fd['rect']['width']}px, h={fd['rect']['height']}px")
for card in comps['featuredDeck']['cards']:
    cr = card['styles']['rect']
    print(f"  Deck Card [{card['index']}]: '{card['title']}' w={cr['width']}px, h={cr['height']}px, pad={card['styles']['padding']}")

# Reviews
rev = comps['reviews']['container']
print(f"Reviews Section: w={rev['rect']['width']}px, h={rev['rect']['height']}px")

# Services
srv = comps['services']['container']
print(f"Services Section: w={srv['rect']['width']}px, h={srv['rect']['height']}px")
print(f"  Door rows count: {len(comps['services']['rows'])}")

# Stack
stk = comps['stack']['container']
print(f"Stack Section: w={stk['rect']['width']}px, h={stk['rect']['height']}px, cells={len(comps['stack']['cells'])}")

# Popups
print(f"Popup Panels count: {len(comps['popups']['panels'])}")

# Tokens
print(f"\nUnique Colors: {len(desktop['tokens']['colors'])}")
print(f"Unique Bg Colors: {len(desktop['tokens']['bgColors'])}")
print(f"Unique Font Sizes: {desktop['tokens']['fontSizes']}")
print(f"Unique Font Weights: {desktop['tokens']['fontWeights']}")
print(f"Unique Font Families: {desktop['tokens']['fontFamilies']}")

print("\n=== MOBILE SECTIONS (390x844) ===")
for sec in mobile['sections']:
    r = sec['styles']['rect']
    print(f"[{sec['index']}] <{sec['tag']}> id={sec['id']} w={r['width']}px, h={r['height']}px, font-size={sec['styles']['fontSize']}")

