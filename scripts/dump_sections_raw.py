import re

html = open('itsua-reference/evidence/raw/homepage.html', 'r', encoding='utf-8').read()

def extract_element_by_id(html_str, target_id):
    pos = html_str.find(f'id="{target_id}"')
    if pos == -1:
        return f"ID {target_id} not found"
    # find opening tag start
    tag_start = html_str.rfind('<', 0, pos)
    # grab 5000 characters from tag_start
    return html_str[tag_start:tag_start + 6000]

print("=== FEATURED SECTION ===")
feat = extract_element_by_id(html, 'featured-section')
print(feat[:2500])

print("\n=== REVIEWS SECTION ===")
rev = extract_element_by_id(html, 'reviews')
print(rev[:2500])

