import subprocess
import os

os.makedirs('itsua-reference/evidence/screenshots', exist_ok=True)
chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

desktop_out = os.path.abspath('itsua-reference/evidence/screenshots/itsua-desktop.png')
mobile_out = os.path.abspath('itsua-reference/evidence/screenshots/itsua-mobile.png')

cmd_desktop = [
    chrome_path,
    "--headless=new",
    "--window-size=1440,900",
    f"--screenshot={desktop_out}",
    "--virtual-time-budget=5000",
    "https://itsua.com/"
]
res1 = subprocess.run(cmd_desktop, capture_output=True, text=True)
print("Desktop screenshot result:", res1.returncode, "file exists:", os.path.exists(desktop_out))
if os.path.exists(desktop_out):
    print("Desktop size:", os.path.getsize(desktop_out))

cmd_mobile = [
    chrome_path,
    "--headless=new",
    "--window-size=390,844",
    f"--screenshot={mobile_out}",
    "--virtual-time-budget=5000",
    "https://itsua.com/"
]
res2 = subprocess.run(cmd_mobile, capture_output=True, text=True)
print("Mobile screenshot result:", res2.returncode, "file exists:", os.path.exists(mobile_out))
if os.path.exists(mobile_out):
    print("Mobile size:", os.path.getsize(mobile_out))
