import re

with open("scratch/dom.txt", "w", encoding="utf-8") as f:
    pass

import subprocess
chrome = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
res = subprocess.run([chrome, "--headless=new", "--dump-dom", "http://localhost:3000/"], capture_output=True, text=True, encoding="utf-8")
out = res.stdout

sections = re.findall(r'<section[^>]*id="([^"]*)"', out)
print("Section IDs found:", sections)
tags = re.findall(r'<(?:header|section|footer)[^>]*class="([^"]*)"', out)
print("Tag classes found:", tags)
