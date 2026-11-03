import re

html = open('itsua-reference/evidence/raw/homepage.html', 'r', encoding='utf-8').read()

print("All elements with id:")
ids = re.findall(r'id="([^"]+)"', html)
for i in ids:
    print(" -", i)

print("\n--- Work/Featured section extract ---")
# find where /work or featured appears
for match in re.finditer(r'(?:/work|featured|review)', html, re.IGNORECASE):
    start = max(0, match.start() - 200)
    end = min(len(html), match.end() + 400)
    print("MATCH at", match.start())
    print(html[start:end])
    print("=" * 60)
    break

