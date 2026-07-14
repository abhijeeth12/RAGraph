# RAGraph Backend Architecture

## Overview
RAGraph is an advanced **Hierarchical Retrieval-Augmented Generation (RAG) v5** system built with FastAPI. It leverages a highly optimized in-memory NumPy retrieval engine alongside Qdrant, PostgreSQL, and Redis to deliver sub-millisecond query latency and rich, structure-aware context. The architecture uniquely preserves document hierarchy (H1 → H2 → Paragraphs), supports multimodal retrieval (images + text), and features adaptive beam search and graph-based reranking.

## Technology Stack
- **Web Framework**: FastAPI (Python)
- **Vector Database**: Qdrant (Text & Image Embeddings)
- **Relational Database**: PostgreSQL (Metadata, Document Status, Chat History)
- **Cache/Session**: Redis (Session management, caching)
- **LLM Integration**: OpenRouter (Defaults to free-tier models) with built-in support for GPT-4o / Claude 3.5 Sonnet (Streaming generation)

---

## Directory Structure & Core Modules
The backend is structured into domain-driven modules under `app/`:

- **`app/api/`**: API endpoints (`auth`, `documents`, `search`, `conversations`).
- **`app/services/`**: Database and infrastructure connections (`db_service.py`, `qdrant_service.py`, `redis_service.py`).
- **`app/core/ingestion/`**: The Phase 2 pipeline for parsing, structuring, and embedding documents.
- **`app/core/retrieval/`**: Advanced retrieval logic (In-memory v5, Beam search, Hybrid).
- **`app/core/reranking/`**: Graph-based contextual reranking.
- **`app/core/generation/`**: LLM prompting, streaming, and context assembly.

---

## 1. Document Ingestion Pipeline (`app/core/ingestion`)
The ingestion pipeline converts raw files (PDFs, PPTXs, etc.) into a searchable, hierarchical vector space. Orchestrated by `pipeline.py`, it executes in the following steps:

### Step 1: Parsing (`parser.py`)
Extracts raw text, headings (via regex or document structure), and images. Returns a `ParsedDocument`.

### Step 2: Heading-Aware Tree Building (`tree_builder.py`)
Unlike traditional flat-chunking, RAGraph builds a hierarchical `DocumentTree`:
- **Headings as First-Class Citizens**: H1, H2, and H3 nodes are created with their respective heading text and a summary of their section. This allows semantic queries to match strongly against the structure itself.
- **Structural Prefixing**: Content is chunked into paragraph nodes. Each chunk is prefixed with its full heading path (e.g., `[H1 > H2] chunk text...`) before embedding. This bakes structural context directly into the vector space.

### Step 3: Image Resolution (`figure_resolver.py`)
Images extracted from the document are spatially matched to their nearest headings (using page numbers and bounding boxes). This anchors visual content within the document's logical structure.

### Step 4: Embedding (`embedder.py`)
Embeds both text nodes and images into vectors using dedicated embedding models (e.g., ColPali for vision, standard text models for text).

### Step 5: Indexing (`indexer.py`)
Stores the embedded tree (headings, paragraphs, and images) into **Qdrant** with robust payload metadata (`level`, `parent_id`, `section_id`, `heading_path`).

---

## 2. Retrieval Architecture (`app/core/retrieval`)
Retrieval in RAGraph is orchestrated by `orchestrator.py` which runs a highly parallel, multi-strategy pipeline.

### Step 1: Query Expansion (`hyde.py`)
Optionally utilizes **HyDE** (Hypothetical Document Embeddings) to generate a hypothetical answer to the user's query, embedding the hypothesis to improve semantic matching against document chunks.

### Step 2: Tri-Strategy Parallel Retrieval
RAGraph executes three retrieval strategies simultaneously to maximize recall and precision:

1. **In-Memory Numpy Retrieval (v5 Architecture - Primary)**
   - **Mechanism**: Caches the user's paragraph vectors in memory via Redis/RAM (`in_memory_store.py`). Performs a single lightning-fast NumPy matrix multiplication (cosine similarity) across all vectors (~0.02ms).
   - **Section-Aware Grouping**: Implements a budget (e.g., 7 chunks from top coherent sections, 3 from diverse sections) to ensure the LLM receives context that is both deeply relevant and broadly representative.
2. **Dense Qdrant Search (Fallback & Tree Retrieval)**
   - **Mechanism**: `tree_retriever.py` runs an **Adaptive Beam Search**. It queries Qdrant to find relevant H1 nodes, expands to H2 children, and finally fetches their paragraphs. It simultaneously runs a global paragraph search.
   - **Structure Bonus**: Chunks retrieved via the structural beam path receive a score bonus over globally retrieved chunks.
3. **BM25 Sparse Search (`hybrid_search.py`)**
   - **Mechanism**: Traditional keyword-based retrieval to catch exact terminology that dense vectors might miss.

### Step 3: Merging & Reciprocal Rank Fusion (RRF)
Results from the three strategies are deduplicated and merged using RRF. The **In-Memory (v5)** results receive the highest weight (`1.4`), followed by Dense (`1.0`), and BM25 (`0.8`).

### Step 4: Graph Reranking (`graph_reranker.py`)
Passes the fused chunks through a **PageRank-style reranker**. This evaluates the interconnectedness and logical flow of the retrieved chunks, boosting scores of paragraphs that structurally support one another.

### Step 5: Sibling Context Expansion (`context_expander.py`)
Before passing to the LLM, RAGraph expands the best chunks to include their immediate structural siblings (e.g., surrounding paragraphs in the original document) to ensure complete, uninterrupted context.

### Step 6: Multimodal Retrieval (`image_retriever.py`)
Using the user query and the retrieved text chunks, the system fetches structurally related images to provide a multi-modal response.

---

## 3. Generation Pipeline (`app/core/generation`)
With the final set of retrieved text and images:

- **Context Building**: `context_builder.py` formats the retrieved chunks, attaching their heading paths and metadata so the LLM understands exactly where the information came from.
- **LLM Streaming**: `llm_client.py` constructs a multimodal payload (text + base64 images) and streams the response directly to the frontend via Server-Sent Events (SSE) using OpenAI or Anthropic APIs.

## Key Architectural Advantages
1. **v5 In-Memory Engine**: Circumvents slow database network IO for repeat queries, enabling 0.05ms retrieval times compared to standard ~15ms Qdrant round-trips.
2. **Structural Preservation**: By embedding headings separately and prefixing paragraphs, the LLM retains the "table of contents" mental model of the document.
3. **Adaptive Beam Search**: Rewards structural coherence without rigidly restricting recall, balancing the benefits of tree-based and flat retrieval.
