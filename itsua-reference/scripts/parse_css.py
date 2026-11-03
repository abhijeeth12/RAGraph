import re
import json

with open('itsua-reference/evidence/raw/css/style_0.css', 'r', encoding='utf-8') as f:
    css0 = f.read()

with open('itsua-reference/evidence/raw/css/style_1.css', 'r', encoding='utf-8') as f:
    css1 = f.read()

full_css = css0 + "\n" + css1

# 1. Custom variables
root_vars = re.findall(r'--([a-zA-Z0-9_-]+)\s*:\s*([^;]+);', full_css)
var_dict = {}
for k, v in root_vars:
    var_dict[f'--{k}'] = v.strip()
print(f"Extracted {len(var_dict)} CSS variables:")
for k in sorted(var_dict.keys()):
    if any(term in k for term in ['color', 'font', 'bg', 'ink', 'paper', 'accent', 'line', 'sub', 'red', 'magenta', 'blue', 'green', 'orange', 'yellow']):
        print(f"  {k}: {var_dict[k]}")

# 2. Keyframes
keyframes = re.findall(r'@keyframes\s+([a-zA-Z0-9_-]+)\s*\{', full_css)
print(f"\nExtracted {len(keyframes)} Keyframe animations: {keyframes}")
keyframe_bodies = {}
for kf in keyframes:
    m = re.search(r'@keyframes\s+' + re.escape(kf) + r'\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}', full_css)
    if m:
        keyframe_bodies[kf] = m.group(1).strip()
        print(f"  Animation '{kf}': {keyframe_bodies[kf][:120]}...")

# 3. Font Faces
font_faces = re.findall(r'@font-face\s*\{([^}]+)\}', full_css)
print(f"\nExtracted {len(font_faces)} @font-face rules:")
parsed_fonts = []
for ff in font_faces:
    family = re.search(r'font-family\s*:\s*[\'"]?([^\'";]+)[\'"]?', ff)
    weight = re.search(r'font-weight\s*:\s*([^\';]+)', ff)
    style = re.search(r'font-style\s*:\s*([^\';]+)', ff)
    src = re.search(r'src\s*:\s*url\([\'"]?([^\'")]+)[\'"]?\)', ff)
    finfo = {
        'family': family.group(1).strip() if family else None,
        'weight': weight.group(1).strip() if weight else None,
        'style': style.group(1).strip() if style else None,
        'src': src.group(1).strip() if src else None
    }
    parsed_fonts.append(finfo)
    print(f"  Font: {finfo['family']}, weight: {finfo['weight']}, style: {finfo['style']}, src: {finfo['src']}")

# 4. Media queries
media_queries = sorted(list(set(re.findall(r'@media\s*([^{]+)\{', full_css))))
print(f"\nExtracted {len(media_queries)} @media queries:")
for mq in media_queries[:15]:
    print(f"  @media {mq.strip()}")

# Save to design-tokens and inspection-results
output_data = {
    'cssVariables': var_dict,
    'keyframes': keyframe_bodies,
    'fontFaces': parsed_fonts,
    'mediaQueries': [mq.strip() for mq in media_queries]
}

with open('itsua-reference/evidence/inspection-results/css-tokens.json', 'w', encoding='utf-8') as f:
    json.dump(output_data, f, indent=2)
print("\nSaved css-tokens.json successfully!")

