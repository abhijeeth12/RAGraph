import os
from PIL import Image

os.makedirs('scratch/sections_crops', exist_ok=True)
img = Image.open('scratch/local_fullpage_fixed.png')
w, h = img.size
scale = h / 5764.0  # content height scale factor

sections_y = [
    ("01_header_hero", 0, 802),
    ("02_metrics_start", 802, 1630),
    ("03_work_deck", 1630, 2345),
    ("04_reviews", 2345, 3002),
    ("05_services_door_table", 3002, 4030),
    ("06_stack_matrix", 4030, 5187),
    ("07_closer_footer", 5187, 5764)
]

for name, y1, y2 in sections_y:
    crop_top = int(y1 * scale)
    crop_bottom = int(y2 * scale)
    cropped = img.crop((0, crop_top, w, min(crop_bottom, h)))
    out_path = f"scratch/sections_crops/{name}.png"
    cropped.save(out_path)
    print(f"Saved {out_path}: {cropped.size}")

