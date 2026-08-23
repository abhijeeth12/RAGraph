
from PIL import Image

output_path = r'a:\Projects\RAGraph\frontend\public\logo.png'
output_icon_path = r'a:\Projects\RAGraph\frontend\src\app\icon.png'

print('Opening image...')
img = Image.open(output_path).convert('RGBA')

# Get the bounding box of the non-transparent pixels
bbox = img.getbbox()
if bbox:
    print(f'Cropping image to bbox: {bbox}')
    img_cropped = img.crop(bbox)
    
    # Let's save the cropped image
    img_cropped.save(output_path, 'PNG')
    img_cropped.save(output_icon_path, 'PNG')
    print('Done cropping.')
else:
    print('Image is completely transparent, cannot crop.')

