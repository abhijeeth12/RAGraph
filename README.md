# 🧠 RAGraph – Hierarchical Retrieval-Augmented Generation & Knowledge Graph Engine

RAGraph is a high-performance, hierarchical document intelligence platform inspired by NotebookLM and Graph RAG. It reconstructs the structural tree hierarchy of documents (Documents → Sections → Subsections → Leaf Paragraphs) to power contextual beam retrieval, multi-document synthesis, and interactive mind mapping.

## ✨ Features

- **Hierarchical Document Ingestion**: Upload PDF, TXT, DOCX, PPTX, and Markdown files with hierarchical outline extraction and chunk indexing. PDFs are parsed by **LiteParse** (Rust/PDFium) for structure-aware extraction — native headings, page numbers, ruled tables, and figures — with selective OCR only on scanned/text-less pages.
- **Section-Aware Beam Search**: Intelligent beam search traversing section headers to retrieve coherent context without losing macro-level thematic flow.
- **Dual-Path Fallback & HyDE**: Dense vector similarity fused with sparse BM25 keyword matching and Hypothetical Document Embeddings for maximum recall on ambiguous queries.
- **Interactive Knowledge Map & Mind Map**:
  - **NotebookLM-Style Mind Map**: Dynamic zoomable and pannable hierarchical tree with collapsible nodes, smooth curve edges, and text-aware adaptive box sizing.
  - **2D Entity Force Graph**: Force-directed network diagram categorizing Knowledge Base roots, documents, concepts, organizations, and entities.
- **Verifiable Citations**: Real-time `[Doc X]` badge provenance mapping each claim back to source documents and headings.
- **Figure & Diagram Resolution**: Multimodal image extraction, nearest-heading breadcrumbs, and modal lightbox zoom.
- **Structure-Preserving Chunking**: Markdown table blocks (header + rows) are kept atomic so tabular facts are never split across chunks.
- **Session & Notebook History**: Persistent conversations, multi-document selection scoping, and settings customization (model selector, focus modes, HyDE toggles).

## 🛠 Tech Stack

- **Framework**: React 19 SPA (Vite)
- **Styling**: Tailwind CSS v4, Dark Theme custom design system
- **State Management**: Zustand
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Markdown & Code**: React Markdown, Remark GFM
- **Graphing**: Custom Canvas / SVG hierarchical tree renderer & React Force Graph 2D

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```
