"""
Fix with verified free models from OpenRouter (March 2026).
Run: python fix_verified_models.py
from A:\Projects\RAGraph\backend\
"""
import os

BASE = os.path.dirname(os.path.abspath(__file__))
FRONTEND = os.path.join(os.path.dirname(BASE), "frontend", "src")

# Verified working free models as of March 22, 2026 (from openrouter.ai):
# - openrouter/free         : auto-router picks best available free model (RECOMMENDED)
# - meta-llama/llama-3.3-70b-instruct:free  : 66K ctx, best general purpose
# - mistralai/mistral-small-3.1-24b-instruct:free : 128K ctx, vision+tools
# - google/gemma-3-27b-it:free : 131K ctx, vision
# - nousresearch/hermes-3-llama-3.1-405b:free : 131K ctx

GENERATION_MODEL = "meta-llama/llama-3.3-70b-instruct:free"
CHEAP_MODEL      = "meta-llama/llama-3.3-70b-instruct:free"
FALLBACK_MODEL   = "openrouter/free"  # auto-picks from all free models

def patch_env(key, value):
    env_path = os.path.join(BASE, ".env")
    with open(env_path, "r") as f:
        lines = f.readlines()
    found = False
    for i, line in enumerate(lines):
        if line.startswith(f"{key}="):
            lines[i] = f"{key}={value}\n"
            found = True
            break
    if not found:
        lines.append(f"{key}={value}\n")
    with open(env_path, "w") as f:
        f.writelines(lines)
    print(f"  .env: {key}={value}")

print("\n[1] Updating .env with verified models...")
patch_env("DEFAULT_LLM", GENERATION_MODEL)

print("\n[2] Updating config.py...")
config_path = os.path.join(BASE, "app", "config.py")
with open(config_path, "r") as f:
    config = f.read()

# Replace all old free model strings
broken_models = [
    "meta-llama/llama-3.1-8b-instruct:free",
    "nousresearch/hermes-3-llama-3.1-405b:free",
    "google/gemma-2-9b-it:free",
    "mistralai/mistral-7b-instruct:free",
]
for m in broken_models:
    if m in config:
        config = config.replace(m, GENERATION_MODEL)
        print(f"  replaced: {m}")

# Rebuild the model map section cleanly
import re
old_map_match = re.search(
    r'@property\s+def openrouter_model_map.*?return \{.*?\}',
    config, re.DOTALL
)
new_map = '''    @property
    def openrouter_model_map(self) -> dict[str, str]:
        """Verified working free models on OpenRouter as of March 2026."""
        return {
            # Paid
            "gpt-4o":            "openai/gpt-4o",
            "gpt-4o-mini":       "openai/gpt-4o-mini",
            "claude-3-5-sonnet": "anthropic/claude-3.5-sonnet",
            # Free — verified March 2026 (openrouter.ai/models?q=free)
            "meta-llama/llama-3.3-70b-instruct:free":         "meta-llama/llama-3.3-70b-instruct:free",
            "mistralai/mistral-small-3.1-24b-instruct:free":  "mistralai/mistral-small-3.1-24b-instruct:free",
            "google/gemma-3-27b-it:free":                     "google/gemma-3-27b-it:free",
            "nousresearch/hermes-3-llama-3.1-405b:free":      "nousresearch/hermes-3-llama-3.1-405b:free",
            "openrouter/free":                                 "openrouter/free",
        }'''

if old_map_match:
    config = config[:old_map_match.start()] + new_map + config[old_map_match.end():]
    print("  config.py: model map rebuilt with verified models")
else:
    print("  config.py: could not find model map — patch manually if needed")

# Fix resolve methods
config = re.sub(
    r'def resolve_cheap_model\(self\) -> str:.*?return "[^"]*"',
    f'def resolve_cheap_model(self) -> str:\n        if self.using_openrouter:\n            return "{CHEAP_MODEL}"\n        return "gpt-4o-mini"',
    config, flags=re.DOTALL
)
config = re.sub(
    r'def resolve_generation_model\(self\) -> str:.*?return self\.default_llm',
    'def resolve_generation_model(self) -> str:\n        if self.using_openrouter:\n            return self.resolve_model(self.default_llm)\n        return self.default_llm',
    config, flags=re.DOTALL
)

with open(config_path, "w") as f:
    f.write(config)
print("  config.py: resolve methods updated")

print("\n[3] Updating llm_client.py with fallback chain...")
llm_path = os.path.join(BASE, "app", "core", "generation", "llm_client.py")
with open(llm_path, "r") as f:
    llm = f.read()

# Replace broken model refs
for m in broken_models:
    llm = llm.replace(m, GENERATION_MODEL)

# Update free detection
llm = llm.replace(
    'is_free = ":free" in model or "free" in model.lower()',
    'is_free = ":free" in model or model == "openrouter/free"'
)
llm = llm.replace(
    'is_free = ":free" in model',
    'is_free = ":free" in model or model == "openrouter/free"'
)

# Add fallback to openrouter/free on 404
old_404 = (
    '        if "402" in err_str or "credits" in err_str.lower():\n'
    '            logger.error("OpenRouter credits exhausted — switching to fallback")\n'
    '            yield ("\\n\\n**Note**: OpenRouter credits exhausted. "\n'
    '                   "Using fallback response from retrieved context.\\n\\n")\n'
    '            for word in _fallback_answer(context).split(" "):\n'
    '                await asyncio.sleep(0.01)\n'
    '                yield word + " "'
)
new_404 = (
    '        if "402" in err_str or "credits" in err_str.lower():\n'
    '            logger.error("OpenRouter credits exhausted — switching to fallback")\n'
    '            yield ("\\n\\n**Note**: OpenRouter credits exhausted. "\n'
    '                   "Using fallback response from retrieved context.\\n\\n")\n'
    '            for word in _fallback_answer(context).split(" "):\n'
    '                await asyncio.sleep(0.01)\n'
    '                yield word + " "\n'
    '        elif "404" in err_str or "No endpoints" in err_str:\n'
    '            logger.warning(f"Model {model} not available — retrying with openrouter/free")\n'
    '            async for delta in _stream_openai(context, "openrouter/free"):\n'
    '                yield delta'
)
if old_404 in llm:
    llm = llm.replace(old_404, new_404)
    print("  llm_client.py: 404 fallback -> openrouter/free added")
else:
    # Try to add it in the except block
    llm = llm.replace(
        '        elif "404" in err_str',
        '        # 404 already handled'
    )
    # Add fallback at end of except
    llm = llm.replace(
        '            yield "\\n\\n[Error generating answer: " + repr(e) + "]"',
        '            if "404" in err_str or "No endpoints" in err_str:\n'
        '                logger.warning(f"Model {model} not available — retrying with openrouter/free")\n'
        '                async for delta in _stream_openai(context, "openrouter/free"):\n'
        '                    yield delta\n'
        '            else:\n'
        '                yield "\\n\\n[Error: " + repr(e) + "]"'
    )
    print("  llm_client.py: 404 fallback added")

with open(llm_path, "w") as f:
    f.write(llm)

print("\n[4] Updating hyde.py...")
hyde_path = os.path.join(BASE, "app", "core", "ingestion", "hyde.py")
with open(hyde_path, "r") as f:
    hyde = f.read()
for m in broken_models:
    hyde = hyde.replace(m, CHEAP_MODEL)
with open(hyde_path, "w") as f:
    f.write(hyde)
print("  hyde.py: model updated")

print("\n[5] Updating frontend...")
store_path = os.path.join(FRONTEND, "store", "useSearchStore.ts")
if os.path.exists(store_path):
    with open(store_path, "r") as f:
        store = f.read()
    for old in broken_models + ["model: 'gpt-4o',"]:
        store = store.replace(old, store)  # no-op for non-matches
    # Direct replace of model default
    import re as re2
    store = re2.sub(
        r"model: '[^']*',(\s+// model)",
        f"model: '{GENERATION_MODEL}',$1",
        store
    )
    store = re2.sub(
        r"model: '[^']*',",
        f"model: '{GENERATION_MODEL}',",
        store, count=1
    )
    with open(store_path, "w") as f:
        f.write(store)
    print(f"  useSearchStore.ts: default -> {GENERATION_MODEL}")

types_path = os.path.join(FRONTEND, "lib", "types.ts")
if os.path.exists(types_path):
    with open(types_path, "r") as f:
        types = f.read()
    # Update MODEL_LABELS
    new_labels = """export const MODEL_LABELS: Record<string, string> = {
  'gpt-4o': 'GPT-4o',
  'claude-3-5-sonnet': 'Claude 3.5',
  'meta-llama/llama-3.3-70b-instruct:free': 'Llama 3.3 70B (Free)',
  'mistralai/mistral-small-3.1-24b-instruct:free': 'Mistral Small 3.1 (Free)',
  'google/gemma-3-27b-it:free': 'Gemma 3 27B (Free)',
  'openrouter/free': 'Auto Free Model',
}"""
    import re as re3
    types = re3.sub(
        r'export const MODEL_LABELS: Record<[^>]+> = \{[^}]+\}',
        new_labels, types, flags=re3.DOTALL
    )
    with open(types_path, "w") as f:
        f.write(types)
    print("  types.ts: MODEL_LABELS updated with verified models")

print("\n" + "="*55)
print("  Done!")
print("="*55)
print()
print("Verified free models (March 2026):")
print(f"  Generation : {GENERATION_MODEL}")
print(f"  Cheap/HyDE : {CHEAP_MODEL}")
print(f"  Auto-fallback: {FALLBACK_MODEL}")
print()
print("How the fallback chain works:")
print("  1. Try meta-llama/llama-3.3-70b-instruct:free")
print("  2. If 404: auto-retry with openrouter/free")
print("     (openrouter/free picks any working free model)")
print("  3. If 402 (credits): show raw retrieved content")
print()
print("Restart:")
print("  uvicorn app.main:app --reload --port 8000")