import re
from bs4 import BeautifulSoup

with open('itsua-reference/evidence/raw/homepage.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Let's see what containers exist under body
# Look for main tag
main_match = re.search(r'<main\b([^>]*)>(.*?)</main>', html, re.DOTALL)
if main_match:
    main_attrs = main_match.group(1)
    main_body = main_match.group(2)
    print("Found <main> with attrs:", main_attrs)
    # Find all direct or major divs/sections inside main
    # Look for id=
    ids = re.findall(r'id="([^"]+)"', html)
    print("All IDs found in HTML:", ids)
else:
    print("No <main> tag found, looking for all IDs:")
    ids = re.findall(r'id="([^"]+)"', html)
    print("All IDs:", ids)

# Look for custom data attributes
data_attrs = set(re.findall(r'data-([a-zA-Z0-9_-]+)', html))
print("Data attributes found:", data_attrs)

