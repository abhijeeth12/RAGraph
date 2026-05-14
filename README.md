# 🧠 RAGraph – Hierarchical Retrieval-Augmented Generation System

## 🚀 Overview
RAGraph is a high-performance Retrieval-Augmented Generation (RAG) system designed to overcome the limitations of traditional "flat chunking". 

Instead of splitting documents into arbitrary chunks, RAGraph reconstructs the **hierarchical structure of documents** (headings → subheadings → paragraphs), enabling context-aware retrieval and improving LLM response quality.

With the **v5 Architecture**, RAGraph fundamentally eliminates the vector database network bottleneck by caching paragraph vectors in-memory and utilizing high-speed Numpy matrix multiplications combined with section-aware candidate grouping.

---

## 💡 Core Idea – Structural Intelligence

Traditional RAG systems lose context due to flat chunking and suffer from fixed network overheads per vector database query.

RAGraph introduces a **hierarchical document tree**:
- **Root** → Document summary  
- **Branches** → Headings (H1, H2, H3)  
- **Leaves** → Paragraph chunks  

This structural representation enables:
- **Macro-level understanding** (section context)
- **Micro-level precision** (fine-grained retrieval)
- **In-Memory Speed** (tree structures are small enough to cache efficiently in RAM)

---

## 🔥 Novel Contributions & Innovations

### 1. In-Memory Hierarchical Retrieval (RAGraph v5)
- **Zero-Network Overhead:** Caches the paragraph vectors in-memory and performs a single Numpy matmul over them.
- Eliminates the ~13ms+ network round-trip of standard vector databases like Qdrant, dropping retrieval latency to **~0.05ms**.
- Vector databases (like Qdrant) are still utilized, but mainly as a robust fallback and for dense recall, rather than blocking the critical path for the primary search.

### 2. Section-Aware Selection (Beam Budgeting)
- Client-side grouping algorithm applied post-matmul.
- Evaluates the top candidate scores to identify the **Top 3 Sections** (the "beam").
- Allocates a **Coherent Core Budget** (e.g., 7 results) from these top sections, and a **Diverse Budget** (e.g., 3 results) from other sections to maximize coverage while maintaining structural context.

### 3. Contextual Prefixing & First-Class Headings
- Each retrieved chunk includes its full hierarchical path baked in.  
  Example: `[Methodology > Data Collection > Sampling]`
- Headings themselves are enriched with their first meaningful sentence. The tree's structural signal is baked directly into the embeddings, naturally surfacing structurally-relevant paragraphs without multi-round vector DB queries.

### 4. Advanced RRF Hybrid Retrieval Pipeline
- Fuses multiple retrieval strategies in parallel using **Reciprocal Rank Fusion (RRF)**:
  1. **In-Memory Numpy Retrieval** (highest weight, section-aware).
  2. **Dense Qdrant Search** (fallback / extra recall).
  3. **BM25 Sparse Search** (exact keyword coverage).

### 5. Multi-Stage Reranking & Expansion
- **Graph Reranking:** Applies post-retrieval graph-based reranking to the fetched chunks to align the best contextual nodes.
- **Sibling Context Expansion:** Automatically expands retrieved nodes with their adjacent siblings to provide the LLM with a wider window of continuity.
- **HyDE (Hypothetical Document Embeddings):** Expands search queries by generating a hypothetical LLM response before embedding.

### 6. Multimodal Figure Resolution
- Links extracted images to their precise structural context (nearest heading).
- Dual-path retrieval natively retrieves relevant document images alongside text, enabling the LLM to reference figures correctly.

---

## ⚙️ System Architecture

### Ingestion Pipeline
1. **Parse** → Extract text, figures, and metadata.
2. **Build Tree** → Construct heading hierarchy and prefix paragraph chunks.
3. **Resolve Figures** → Map images to their nearest contextual nodes.
4. **Embed** → Generate Sentence-Transformer embeddings.
5. **Index** → Store in Qdrant (for persistence/dense fallback) and SQLite.

### Retrieval Pipeline
1. **Cache Load** → Fetch document vectors into RAM.
2. **Parallel Search** → In-Memory Numpy matmul + Qdrant Dense + BM25 Sparse.
3. **Merge & Group** → Section-aware grouping & RRF.
4. **Rerank & Expand** → Graph reranking and sibling node expansion.
5. **Generation** → Stream enriched context to LLM (Llama 3 / Claude / OpenAI).

---

## 🛠️ Tech Stack

- **Backend:** FastAPI (Python), Numpy, asyncio
- **Vector DB:** Qdrant (Persistent layer / Fallback)
- **Frontend:** Next.js (React) / Vite
- **Database:** SQLite
- **LLM:** LLaMA3 (Ollama), OpenAI, Anthropic
- **Embeddings:** Sentence-Transformers (`all-MiniLM-L6-v2`)
- **Search & Caching:** Redis (for session-based response caching)
- **Logging:** Loguru

---

## 🧠 Key Engineering Challenges Solved

### Vector DB Latency Bottleneck
- Solved by implementing the **v5 In-Memory Tree architecture** using Numpy matmuls, fundamentally reducing the retrieval latency floor.

### Context Loss & Hallucination
- Solved using the hierarchical document tree, contextual prefixing, and sibling context expansion.

### Concurrency & Multi-User Isolation
- Implemented payload-based filtering in Qdrant (by session/owner).
- Ensures completely isolated queries per user session.

### Pipeline Reliability
- Designed a multi-stage ingestion pipeline with robust state management:
  Parsing → Embedding → Indexing → Cache Warming.

---

## 📦 Key Components

| Component | Description |
|---|---|
| `in_memory_retriever.py` | v5 Numpy-based ultra-fast retrieval |
| `orchestrator.py` | Parallel RRF hybrid search (In-Mem + Dense + BM25) |
| `qdrant_service.py` | Vector operations & dense fallback |
| `graph_reranker.py` | Post-retrieval node reranking |
| `context_expander.py` | Sibling expansion around hit nodes |
| `benchmark.py` | Standalone script validating the in-memory architecture |

---

## 🧑‍💻 Getting Started

### 1. Clone the repository
```bash
git clone <your-repo-url>  
cd ragraph  
```

### 2. Install dependencies
```bash
cd backend
pip install -r requirements.txt  
```

### 3. Run backend
```bash
uvicorn app.main:app --reload  
```

### 4. Run frontend
```bash
cd frontend  
npm install  
npm run dev  
```

---

## 📌 Summary

RAGraph transforms static documents into a **navigable, structurally-aware knowledge graph**. By combining the contextual depth of hierarchical trees with the blinding speed of **in-memory Numpy retrieval**, it delivers:

- **Context-aware retrieval** with zero network bottlenecks.
- **Reduced hallucinations** through precise contextual prefixing.
- **High-precision LLM responses** backed by structural hybrid search and reranking.

Best suited for dense, structured documents like research papers, manuals, textbooks, and legal texts.
