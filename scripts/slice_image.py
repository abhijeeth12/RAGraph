from PIL import Image

img = Image.open('scratch/local_fullpage_fixed.png')
w, h = img.size
print(f"Image dimensions: {w} x {h}")

step = 1500
for i, top in enumerate(range(0, h, step)):
    bottom = min(top + step, h)
    crop = img.crop((0, top, w, bottom))
    crop.save(f"scratch/sections_crops/slice_{i:02d}_{top}_{bottom}.png")
    print(f"Saved slice_{i:02d}_{top}_{bottom}.png")

