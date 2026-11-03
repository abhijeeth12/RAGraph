import re

css0 = open('itsua-reference/evidence/raw/css/style_0.css', 'r', encoding='utf-8').read()
css1 = open('itsua-reference/evidence/raw/css/style_1.css', 'r', encoding='utf-8').read()
all_css = css0 + "\n" + css1

matches = [m.group(0) for m in re.finditer(r'[^{}]*?featured[^{}]*?\{[^{}]*\}', all_css, re.IGNORECASE)]
print("Total featured matches:", len(matches))
for m in matches[:10]:
    print(m)
