import sys
print("Python version:", sys.version)
for pkg in ['playwright', 'selenium', 'requests', 'urllib3', 'bs4', 'cssutils', 'PIL']:
    try:
        __import__(pkg)
        print(f"  {pkg}: available")
    except ImportError:
        print(f"  {pkg}: not available")

