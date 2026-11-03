import sys
import json
from bs4 import BeautifulSoup

sys.stdout.reconfigure(encoding='utf-8')

with open('itsua-reference/evidence/raw/homepage.html', 'r', encoding='utf-8') as f:
    html = f.read()

soup = BeautifulSoup(html, 'html.parser')
main = soup.find('main')
children = [c for c in main.children if c.name == 'div' or c.name == 'section']

print(f"Total top-level containers in main: {len(children)}")
band_records = []
for idx, child in enumerate(children):
    cid = child.get('id', f'band-{idx}')
    ccls = ' '.join(child.get('class', []))
    headings = [h.get_text(separator=' ', strip=True) for h in child.find_all(['h1', 'h2', 'h3', 'h4'])]
    text_snippet = ' '.join(child.get_text(separator=' ', strip=True).split()[:40])
    print(f"\n--- CONTAINER [{idx}]: id='{cid}' class='{ccls}' ---")
    print(f"  Headings: {headings}")
    print(f"  Text snippet: {text_snippet}...")
    
    band_records.append({
        'index': idx,
        'id': cid,
        'class': ccls,
        'headings': headings,
        'textSnippet': text_snippet,
        'html': str(child)[:2000]
    })

with open('itsua-reference/evidence/inspection-results/bands-detail.json', 'w', encoding='utf-8') as f:
    json.dump(band_records, f, indent=2)
