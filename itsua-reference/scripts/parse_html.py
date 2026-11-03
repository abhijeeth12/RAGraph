import re
import urllib.request
import os

with open('itsua-reference/evidence/raw/homepage.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Find all stylesheets
css_links = re.findall(r'href="([^"]+\.css[^"]*)"', html)
print('CSS links found:', css_links)

# Download CSS files
os.makedirs('itsua-reference/evidence/raw/css', exist_ok=True)
for i, link in enumerate(css_links):
    url = link if link.startswith('http') else f'https://itsua.com{link}'
    dest = f'itsua-reference/evidence/raw/css/style_{i}.css'
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        content = urllib.request.urlopen(req).read().decode('utf-8')
        with open(dest, 'w', encoding='utf-8') as cf:
            cf.write(content)
        print(f'Downloaded {url} -> {dest} ({len(content)} chars)')
    except Exception as e:
        print(f'Failed to download {url}: {e}')

# Extract sections
section_tags = re.findall(r'<section\b([^>]*)>', html)
print(f'Found {len(section_tags)} sections:')
for s in section_tags:
    print('  <section', s[:100], '...>')

# Extract header / nav / footer
header = re.findall(r'<header\b([^>]*)>', html)
footer = re.findall(r'<footer\b([^>]*)>', html)
print('Header tags:', header)
print('Footer tags:', footer)

