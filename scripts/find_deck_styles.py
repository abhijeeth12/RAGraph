import re

html = open('itsua-reference/evidence/raw/homepage.html', 'r', encoding='utf-8').read()
styles = re.findall(r'<style[^>]*>(.*?)</style>', html, re.DOTALL)
print(f"Total inline <style> tags: {len(styles)}")
for i, s in enumerate(styles):
    if 'deck' in s or 'featured' in s or 'review' in s:
        print(f"--- Style {i} ---")
        print(s[:2000])

# Also search all_css for '3lzmdax4'
css0 = open('itsua-reference/evidence/raw/css/style_0.css', 'r', encoding='utf-8').read()
css1 = open('itsua-reference/evidence/raw/css/style_1.css', 'r', encoding='utf-8').read()
all_css = css0 + "\n" + css1

matches = [m.group(0) for m in re.finditer(r'[^{}]*?3lzmdax4[^{}]*?\{[^{}]*\}', all_css, re.IGNORECASE)]
print(f"Matches for 3lzmdax4 in CSS: {len(matches)}")
for m in matches:
    print(m)

