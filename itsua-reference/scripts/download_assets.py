import urllib.request
import os
import re
from bs4 import BeautifulSoup

with open('itsua-reference/evidence/raw/homepage.html', 'r', encoding='utf-8') as f:
    html = f.read()

soup = BeautifulSoup(html, 'html.parser')

os.makedirs('itsua-reference/assets/extracted-assets/images', exist_ok=True)
os.makedirs('itsua-reference/assets/extracted-assets/svgs', exist_ok=True)

# 1. Images
img_tags = soup.find_all('img')
print(f"Found {len(img_tags)} img tags:")
image_manifest = []
for i, img in enumerate(img_tags):
    src = img.get('src', '')
    alt = img.get('alt', '')
    width = img.get('width', '')
    height = img.get('height', '')
    srcset = img.get('srcset', '')
    
    url = src if src.startswith('http') else f"https://itsua.com{src}"
    filename = os.path.basename(src.split('?')[0]) if src else f"img_{i}.png"
    dest = os.path.join('itsua-reference/assets/extracted-assets/images', filename)
    
    status = "skipped"
    if src:
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            data = urllib.request.urlopen(req).read()
            with open(dest, 'wb') as f:
                f.write(data)
            status = f"downloaded ({len(data)} bytes)"
        except Exception as e:
            status = f"failed: {e}"
    
    info = {
        'src': src,
        'alt': alt,
        'width': width,
        'height': height,
        'srcset': srcset,
        'filename': filename,
        'status': status
    }
    image_manifest.append(info)
    print(f"  Img: {src} -> {status}")

# 2. SVGs
svg_tags = soup.find_all('svg')
print(f"\nFound {len(svg_tags)} inline SVG elements:")
svg_manifest = []
for i, svg in enumerate(svg_tags):
    viewBox = svg.get('viewBox', '')
    cls = svg.get('class', '')
    w = svg.get('width', '')
    h = svg.get('height', '')
    
    # Save SVG string
    svg_str = str(svg)
    filename = f"icon_{i}_{viewBox.replace(' ', '_')}.svg"
    dest = os.path.join('itsua-reference/assets/extracted-assets/svgs', filename)
    with open(dest, 'w', encoding='utf-8') as f:
        f.write(svg_str)
    
    info = {
        'index': i,
        'viewBox': viewBox,
        'class': cls,
        'width': w,
        'height': h,
        'filename': filename
    }
    svg_manifest.append(info)

print(f"Saved {len(svg_tags)} SVG files!")

