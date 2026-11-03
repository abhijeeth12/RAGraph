import re

css0 = open('itsua-reference/evidence/raw/css/style_0.css', 'r', encoding='utf-8').read()
css1 = open('itsua-reference/evidence/raw/css/style_1.css', 'r', encoding='utf-8').read()
all_css = css0 + "\n" + css1

with open('scratch/deck_css.css', 'w', encoding='utf-8') as f:
    for rule in re.findall(r'([^{}]*?(?:deck|featured|review)[^{}]*?\{[^{}]*\})', all_css, re.IGNORECASE):
        f.write(rule.strip() + "\n\n")

print("Saved deck_css.css to scratch!")

