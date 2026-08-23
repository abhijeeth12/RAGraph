from rembg import remove
import os

input_path = r'C:\Users\abhij\.gemini\antigravity\brain\bd0c8145-c8bf-477f-b447-733bbba746b1\media__1787508768209.png'
output_path = r'a:\Projects\RAGraph\frontend\public\logo.png'
output_icon_path = r'a:\Projects\RAGraph\frontend\src\app\icon.png'

print('Opening image...')
with open(input_path, 'rb') as i:
    input_img = i.read()

print('Removing background with rembg...')
output_img = remove(input_img, alpha_matting=True)

print('Writing output files...')
with open(output_path, 'wb') as o:
    o.write(output_img)
with open(output_icon_path, 'wb') as o:
    o.write(output_img)

print('Done! Background removed perfectly.')
