import urllib.request
import os

font_urls = [
    '/fonts/jetbrains-mono-latin.woff2',
    '/fonts/jetbrains-mono-latin-ext.woff2',
    '/fonts/space-grotesk-latin.woff2',
    '/fonts/space-grotesk-latin-ext.woff2'
]

os.makedirs('itsua-reference/assets/extracted-assets/fonts', exist_ok=True)
for path in font_urls:
    url = f'https://itsua.com{path}'
    filename = os.path.basename(path)
    dest = os.path.join('itsua-reference/assets/extracted-assets/fonts', filename)
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        data = urllib.request.urlopen(req).read()
        with open(dest, 'wb') as f:
            f.write(data)
        print(f"Downloaded {filename}: {len(data)} bytes")
    except Exception as e:
        print(f"Error downloading {filename}: {e}")

