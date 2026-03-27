# 🧠 RAGraph – Hierarchical Retrieval-Augmented Generation System

## 🚀 Overview
RAGraph is a high-performance Retrieval-Augmented Generation (RAG) system designed to overcome the limitations of traditional "flat chunking".

Instead of splitting documents into arbitrary chunks, RAGraph reconstructs the **hierarchical structure of documents** (headings → subheadings → paragraphs), enabling context-aware retrieval and improving LLM response quality.

---

## 💡 Core Idea – Structural Intelligence

Traditional RAG systems lose context due to flat chunking.

RAGraph introduces a **hierarchical document tree**:

- **Root** → Document summary  
- **Branches** → Headings (H1, H2, H3)  
- **Leaves** → Paragraph chunks  

This enables:
- Macro-level understanding (section context)
- Micro-level precision (fine-grained retrieval)

---

## 🔥 Novel Contributions

### 1. Hierarchical Retrieval (Beam Search)
- Replaces naive top-K similarity search
- Traverses document structure:
  - H1 → H2 → Paragraphs
- Ensures retrieval from the most relevant section

---

### 2. First-Class Heading Embeddings
- Headings are embedded as searchable nodes
- Enables retrieval based on section semantics

---

### 3. Contextual Prefixing
- Each retrieved chunk includes its full hierarchical path  
  Example: Methodology > Data Collection > Sampling  
- Reduces hallucination and improves grounding

---

### 4. Multimodal Figure Resolution
- Links extracted images to structural context
- Enables LLM to reference figures correctly

---

## ⚙️ System Architecture

### Ingestion Pipeline
1. Parse → Extract text and images  
2. Build Tree → Construct hierarchy  
3. Resolve Figures → Map images to nodes  
4. Embed → Generate embeddings  
5. Index → Store in Qdrant  

---

### Retrieval Pipeline
- Beam Search traversal over document tree  
- Hybrid search:
  - Semantic similarity (vector search)
  - Metadata filtering  

---

## 🛠️ Tech Stack

- Backend: FastAPI (Python)
- Vector DB: Qdrant
- Frontend: React (Vite)
- Database: SQLite
- LLM: LLaMA3 (Ollama)
- Embeddings: Sentence-Transformers
- Logging: Loguru

---

## 🧠 Key Engineering Challenges Solved

### Context Loss
- Solved using hierarchical document tree

### Retrieval Accuracy
- Improved via Beam Search vs naive top-K

### Concurrency & Multi-User Isolation
- Implemented payload-based filtering in Qdrant
- Ensured isolated queries per user/session

### Pipeline Reliability
- Designed multi-stage ingestion pipeline:
  Parsing → Embedding → Indexing → Ready

### Structure–Vector Consistency
- Maintained alignment between tree nodes and vector DB

---

## 📦 Key Components

| Component             | Description |
|---------------------|------------|
| tree_retriever.py   | Beam Search traversal |
| qdrant_service.py   | Vector operations |
| pipeline.py         | Ingestion orchestrator |
| hybrid_search.py    | Hybrid retrieval |

---

## ⚠️ Current Status

- Core RAG pipeline implemented  
- Multi-user isolation (Phase 1)  
- Persistent storage (Phase 3)  

---

## 🔮 Future Improvements

- Real-time streaming responses  
- Retrieval evaluation metrics  
- Learning-based retrieval  
- Distributed indexing  

---

## 🧑‍💻 Getting Started

### 1. Clone the repository
git clone <your-repo-url>  
cd ragraph  

### 2. Install dependencies
pip install -r requirements.txt  

### 3. Run backend
uvicorn app.main:app --reload  

### 4. Run frontend
cd frontend  
npm install  
npm run dev  

---

## 📌 Summary

RAGraph transforms static documents into a **navigable knowledge graph**, enabling:

- Context-aware retrieval  
- Reduced hallucinations  
- High-precision LLM responses  

Best suited for structured documents like research papers, manuals, and legal texts.
