"""
Fix ModelChoice enum — accept any model string, not just gpt-4o/claude.
Run: python fix_model_enum.py
from A:\Projects\RAGraph\backend\
"""
import os

BASE = os.path.dirname(os.path.abspath(__file__))
FRONTEND = os.path.join(os.path.dirname(BASE), "frontend", "src")

def w(path, content, base=None):
    root = base or BASE
    full = os.path.join(root, path.replace("/", os.sep))
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w", encoding="utf-8") as f:
        f.write(content.lstrip("\n"))
    print(f"  wrote: {path}")

# ── Fix 1: backend models/search.py — remove strict enum ─────────────────
print("\n[1] Fixing backend SearchRequest model...")
w("app/models/search.py", """
from pydantic import BaseModel, Field
from typing import Optional, Literal
from enum import Enum
import json


class FocusMode(str, Enum):
    ALL      = "all"
    ACADEMIC = "academic"
    CODE     = "code"
    NEWS     = "news"
    IMAGES   = "images"


# No longer an Enum — accepts any model string
# This allows free OpenRouter models like mistralai/mistral-7b-instruct:free
class ConversationMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=2000)
    model: str = "google/gemma-2-9b-it:free"   # any OpenRouter model ID
    focus: FocusMode = FocusMode.ALL
    thread_id: Optional[str] = None
    conversation_history: list[ConversationMessage] = []
    image: Optional[str] = None
    use_hyde: bool = True
    use_dual_path: bool = True


class SourceItem(BaseModel):
    id: str
    title: str
    url: str
    domain: str
    snippet: str
    relevance_score: float
    heading_path: list[str] = []
    doc_id: Optional[str] = None


class ImageItem(BaseModel):
    id: str
    url: str
    caption: Optional[str] = None
    alt: Optional[str] = None
    source_title: str
    source_url: str
    heading_path: list[str] = []
    relevance_score: float
    width: Optional[int] = None
    height: Optional[int] = None


class StreamChunkType(str, Enum):
    TEXT    = "text"
    SOURCES = "sources"
    IMAGES  = "images"
    RELATED = "related"
    DONE    = "done"
    ERROR   = "error"


class StreamChunk(BaseModel):
    type: StreamChunkType
    content: str

    def to_sse(self) -> str:
        return f"data: {json.dumps(self.model_dump())}\\n\\n"


class SearchResponse(BaseModel):
    query: str
    answer: str
    sources: list[SourceItem] = []
    images: list[ImageItem] = []
    related_questions: list[str] = []
    model_used: str
    tokens_used: int = 0
    time_ms: int = 0
    hyde_used: bool = False
    dual_path_fallback_used: bool = False


class UploadResponse(BaseModel):
    doc_id: str
    filename: str
    status: Literal["queued", "processing", "done", "error"]
    message: str
    page_count: Optional[int] = None
    node_count: Optional[int] = None
    image_count: Optional[int] = None
""")

# ── Fix 2: frontend types.ts — accept any string as model ─────────────────
print("\n[2] Fixing frontend types...")
types_path = os.path.join(FRONTEND, "lib", "types.ts")
if os.path.exists(types_path):
    with open(types_path, "r") as f:
        types = f.read()

    # Replace strict union type with string
    for old in [
        "export type ModelOption = 'gpt-4o' | 'claude-3-5-sonnet'",
        "export type ModelOption = 'gpt-4o' | 'claude-3-5-sonnet' | 'meta-llama/llama-3.1-8b-instruct:free' | 'google/gemma-2-9b-it:free'",
        "export type ModelOption = 'gpt-4o' | 'claude-3-5-sonnet' | 'nousresearch/hermes-3-llama-3.1-405b:free' | 'google/gemma-2-9b-it:free'",
        "export type ModelOption = 'gpt-4o' | 'claude-3-5-sonnet' | 'google/gemma-2-9b-it:free' | 'google/gemma-2-9b-it:free'",
    ]:
        if old in types:
            types = types.replace(old, "export type ModelOption = string")
            print("  types.ts: ModelOption -> string (accepts any model)")
            break
    else:
        # Generic replacement
        import re
        types = re.sub(
            r"export type ModelOption = [^\n]+",
            "export type ModelOption = string",
            types,
        )
        print("  types.ts: ModelOption -> string (regex replacement)")

    # Update MODEL_LABELS to include current free models
    old_labels_patterns = [
        """export const MODEL_LABELS: Record<ModelOption, string> = {
  'gpt-4o': 'GPT-4o',
  'claude-3-5-sonnet': 'Claude 3.5',
}""",
    ]
    new_labels = """export const MODEL_LABELS: Record<string, string> = {
  'gpt-4o': 'GPT-4o',
  'claude-3-5-sonnet': 'Claude 3.5',
  'google/gemma-2-9b-it:free': 'Gemma 2 (Free)',
  'mistralai/mistral-7b-instruct:free': 'Mistral 7B (Free)',
  'qwen/qwen-2-7b-instruct:free': 'Qwen 2 (Free)',
  'deepseek/deepseek-r1-distill-qwen-7b:free': 'DeepSeek R1 (Free)',
}"""
    for old_l in old_labels_patterns:
        if old_l in types:
            types = types.replace(old_l, new_labels)
            print("  types.ts: MODEL_LABELS updated with free models")
            break

    with open(types_path, "w") as f:
        f.write(types)

# ── Fix 3: SearchBar — add free model options ─────────────────────────────
print("\n[3] Updating SearchBar model selector...")
searchbar_path = os.path.join(FRONTEND, "components", "SearchBar.tsx")
if os.path.exists(searchbar_path):
    with open(searchbar_path, "r") as f:
        sb = f.read()

    # Replace MODEL_LABELS import usage — just show label or last part of model id
    if "MODEL_LABELS[model]" in sb:
        sb = sb.replace(
            "MODEL_LABELS[model]",
            "MODEL_LABELS[model] ?? model.split('/').pop()?.replace(':free', ' (Free)') ?? model"
        )
        with open(searchbar_path, "w") as f:
            f.write(sb)
        print("  SearchBar.tsx: model label shows friendly name or shortened ID")

# ── Fix 4: useSearchStore — update default model ──────────────────────────
print("\n[4] Updating store default model...")
store_path = os.path.join(FRONTEND, "store", "useSearchStore.ts")
if os.path.exists(store_path):
    with open(store_path, "r") as f:
        store = f.read()
    # Set default to whatever is in .env (we'll use mistral as it's in the error)
    for old in [
        "model: 'gpt-4o',",
        "model: 'meta-llama/llama-3.1-8b-instruct:free',",
        "model: 'nousresearch/hermes-3-llama-3.1-405b:free',",
        "model: 'google/gemma-2-9b-it:free',",
    ]:
        if old in store:
            store = store.replace(old, "model: 'mistralai/mistral-7b-instruct:free',")
            print(f"  useSearchStore.ts: default model -> mistralai/mistral-7b-instruct:free")
            break
    with open(store_path, "w") as f:
        f.write(store)

# ── Fix 5: update .env to match what user already has working ─────────────
print("\n[5] Updating .env DEFAULT_LLM...")
env_path = os.path.join(BASE, ".env")
with open(env_path, "r") as f:
    lines = f.readlines()
for i, line in enumerate(lines):
    if line.startswith("DEFAULT_LLM="):
        lines[i] = "DEFAULT_LLM=mistralai/mistral-7b-instruct:free\n"
        break
else:
    lines.append("DEFAULT_LLM=mistralai/mistral-7b-instruct:free\n")
with open(env_path, "w") as f:
    f.writelines(lines)
print("  .env: DEFAULT_LLM=mistralai/mistral-7b-instruct:free")

# Also patch config.py resolve methods
config_path = os.path.join(BASE, "app", "config.py")
with open(config_path, "r") as f:
    config = f.read()

# Replace all free model references in config
for old in [
    "google/gemma-2-9b-it:free",
    "nousresearch/hermes-3-llama-3.1-405b:free",
    "meta-llama/llama-3.1-8b-instruct:free",
]:
    config = config.replace(old, "mistralai/mistral-7b-instruct:free")

with open(config_path, "w") as f:
    f.write(config)
print("  config.py: all free model refs -> mistralai/mistral-7b-instruct:free")

print("\n" + "="*55)
print("  Done!")
print("="*55)
print()
print("Key change: backend now accepts ANY model string")
print("  (no more 'must be gpt-4o or claude-3-5-sonnet' error)")
print()
print("Current model: mistralai/mistral-7b-instruct:free")
print()
print("To change model — just edit .env:")
print("  DEFAULT_LLM=<any-openrouter-model-id>")
print()
print("Restart servers:")
print("  uvicorn app.main:app --reload --port 8000")
print("  cd frontend && npm run dev")