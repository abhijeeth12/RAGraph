import json
import subprocess

chrome = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
script = """
const ids = ['specification', 'metrics', 'start', 'showcases', 'reviews', 'services', 'stack', 'closer'];
const res = ids.map(id => {
  const el = document.getElementById(id);
  if (!el) return { id, exists: false };
  const r = el.getBoundingClientRect();
  return { id, exists: true, top: r.top + window.scrollY, height: r.height, width: r.width };
});
const header = document.querySelector('header');
const footer = document.querySelector('footer');
console.log(JSON.stringify({
  header: header ? { height: header.getBoundingClientRect().height } : null,
  sections: res,
  footer: footer ? { height: footer.getBoundingClientRect().height } : null
}));
"""

# Run CDP command to evaluate
eval_script = f"console.log(JSON.stringify(Array.from(document.querySelectorAll('section, header, footer')).map(el => ({{ tag: el.tagName, id: el.id, h: el.offsetHeight, w: el.offsetWidth }}))))"

cmd = [
    chrome,
    "--headless=new",
    "--window-size=1440,900",
    "--dump-dom",
    "http://localhost:3000/"
]
p = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8")
print("HTML retrieved:", len(p.stdout) > 0)

