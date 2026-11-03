import re

html = open('itsua-reference/evidence/raw/homepage.html', 'r', encoding='utf-8').read()

def extract_element_by_id(html_str, target_id, length=12000):
    pos = html_str.find(f'id="{target_id}"')
    if pos == -1:
        return f"ID {target_id} not found"
    tag_start = html_str.rfind('<', 0, pos)
    return html_str[tag_start:tag_start + length]

with open('scratch/itsua_real_featured.html', 'w', encoding='utf-8') as f:
    f.write(extract_element_by_id(html, 'featured-section', 25000))

with open('scratch/itsua_real_reviews.html', 'w', encoding='utf-8') as f:
    f.write(extract_element_by_id(html, 'reviews', 25000))

print("Saved raw sections to scratch!")

