
from PIL import Image

input_path = r'C:\Users\abhij\.gemini\antigravity\brain\bd0c8145-c8bf-477f-b447-733bbba746b1\media__1787508768209.png'
output_path = r'a:\Projects\RAGraph\frontend\public\logo.png'
output_icon_path = r'a:\Projects\RAGraph\frontend\src\app\icon.png'

img = Image.open(input_path).convert('RGBA')
datas = img.getdata()
new_data = []

# The background is a light gradient, usually > 220, 220, 220
# Let's make pixels with high luminance transparent, scaling alpha based on how close to white they are.
for item in datas:
    r, g, b, a = item
    luminance = (r + g + b) / 3
    if luminance > 240:
        # completely transparent
        new_data.append((r, g, b, 0))
    elif luminance > 200:
        # fade out the edge
        alpha = int((240 - luminance) / 40 * 255)
        new_data.append((r, g, b, alpha))
    else:
        new_data.append((r, g, b, a))

img.putdata(new_data)
img.save(output_path, 'PNG')
img.save(output_icon_path, 'PNG')
print('Done PIL processing')

