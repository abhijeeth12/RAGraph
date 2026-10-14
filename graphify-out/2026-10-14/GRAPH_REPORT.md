# Graph Report - RAGraph  (2026-10-14)

## Corpus Check
- 118 files · ~82,959 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 964 nodes · 1650 edges · 61 communities (52 shown, 9 thin omitted)
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 159 edges (avg confidence: 0.77)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7f5830b4`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Frontend Application & Components
- Document Parsing & Tree Ingestion
- Retrieval & Reranking Algorithms
- Relational Database Management
- Frontend Dependencies List
- Authentication & User Sessions
- LLM Context Generation
- Vector Store Service
- Reusable UI Elements
- Document API Endpoints
- TypeScript Configurations
- Node Tooling Config
- Search & Streaming API
- Text & Image Embeddings
- Styling Configuration
- Performance Benchmarks
- Redis Caching Layer
- In-Memory Document Store
- Chat Conversations API
- json_repair.py
- Environment Variables Config
- Test Mocks & Config
- generate_outline
- Community 27
- Community 28
- Community 29
- Community 30
- Community 31
- Community 32
- 🧠 RAGraph – Hierarchical Retrieval-Augmented Generation System
- RAGraph Backend Architecture
- _add_paragraph_nodes
- parser.py
- build_tree
- resolve_figures
- index_tree
- Karpathy Guidelines
- README.md
- graphify.md
- graphify.md
- AGENTS.md

## God Nodes (most connected - your core abstractions)
1. `DBService` - 48 edges
2. `RetrievedChunk` - 27 edges
3. `useSearchStore` - 24 edges
4. `build_tree()` - 21 edges
5. `apiFetch()` - 21 edges
6. `cn()` - 21 edges
7. `QdrantService` - 20 edges
8. `DocumentTree` - 18 edges
9. `parse_document()` - 17 edges
10. `compilerOptions` - 16 edges

## Surprising Connections (you probably didn't know these)
- `google_callback()` --calls--> `exchange_code()`  [INFERRED]
  backend/app/api/auth.py → backend/app/core/auth/oauth_google.py
- `get_document_outline()` --indirect_call--> `parse_document()`  [INFERRED]
  backend/app/api/documents.py → backend/app/core/ingestion/parser.py
- `get_document_outline()` --indirect_call--> `build_tree()`  [INFERRED]
  backend/app/api/documents.py → backend/app/core/ingestion/tree_builder.py
- `_pipeline()` --calls--> `build_context()`  [INFERRED]
  backend/app/api/search.py → backend/app/core/generation/context_builder.py
- `_pipeline()` --calls--> `generate_related_questions()`  [INFERRED]
  backend/app/api/search.py → backend/app/core/generation/llm_client.py

## Import Cycles
- None detected.

## Communities (61 total, 9 thin omitted)

### Community 0 - "Frontend Application & Components"
Cohesion: 0.06
Nodes (78): CallbackHandler(), Home(), AnswerCard(), Props, AuthModal(), AuthModalProps, CitationMap(), Props (+70 more)

### Community 1 - "Document Parsing & Tree Ingestion"
Cohesion: 0.13
Nodes (19): _build_hierarchy(), _build_image_nodes(), _count(), _find_heading_path_for_page(), _make_doc_summary(), Hierarchical Document Tree Builder.  KEY CHANGE vs original:   H1/H2/H3 nodes, Build node hierarchy.      IMPORTANT: H1/H2/H3 nodes store HEADING TEXT + firs, Find the heading path of H1 nodes on or before this page. (+11 more)

### Community 2 - "Retrieval & Reranking Algorithms"
Cohesion: 0.07
Nodes (53): _cross_encoder_rerank(), graph_rerank(), _pagerank_boost(), RankedChunk, Graph-Enhanced Reranker.  Step 1 — Build similarity graph:   Nodes = retrieve, Rerank using Cohere Rerank v3.     Falls back to score-based ranking if Cohere, Full graph-enhanced reranking pipeline.     Returns top_k chunks sorted by fina, Simplified PageRank on chunk similarity graph.     Uses three types of structur (+45 more)

### Community 3 - "Relational Database Management"
Cohesion: 0.07
Nodes (12): DBService, datetime, PostgreSQL database service — full persistence layer.  Tables: users, sessions, Get documents for owner — user_id takes precedence over session_id., Verify that doc belongs to this user or session., Returns {doc_id: sequential_number} for citation mapping., Returns {doc_id: original_filename} for citation display., Persist serialised outline and/or graph JSON into the documents row. (+4 more)

### Community 4 - "Frontend Dependencies List"
Cohesion: 0.04
Nodes (47): axios, @base-ui/react, class-variance-authority, clsx, framer-motion, dependencies, axios, @base-ui/react (+39 more)

### Community 5 - "Authentication & User Sessions"
Cohesion: 0.12
Nodes (29): _clear_refresh_cookie(), _format_user(), get_me(), google_callback(), google_url(), login(), logout(), Map DB 'id' -> output 'user_id' for Pydantic (+21 more)

### Community 6 - "LLM Context Generation"
Cohesion: 0.11
Nodes (34): build_context(), BuiltContext, _count(), RetrievedImage, _fallback_answer(), generate_related_questions(), _heading_based_questions(), _openai_client() (+26 more)

### Community 7 - "Vector Store Service"
Cohesion: 0.09
Nodes (17): _bm25_search(), _doc_filter(), _hits_to_chunks(), hybrid_search(), _para_filter(), Hybrid Search — Dense + BM25 + RRF fusion with text deduplication.  Optimized fo, Lightweight, low-memory tokenization replacing heavy NLTK tokenizers., BM25 search filtered by owner_id.     Reuses paragraphs from in_memory_store to (+9 more)

### Community 8 - "Reusable UI Elements"
Cohesion: 0.11
Nodes (17): Badge(), badgeVariants, Button(), buttonVariants, Card(), CardAction(), CardContent(), CardDescription() (+9 more)

### Community 9 - "Document API Endpoints"
Cohesion: 0.06
Nodes (31): cleanup_session(), get_document_graph(), get_document_outline(), get_owner(), Returns {'user_id': str} or {'session_id': str} or raises 401, Returns hierarchical outline (mind map) for NotebookLM-style map.          Rea, Returns the semantic knowledge graph of the specified documents.          Read, _run_ingestion() (+23 more)

### Community 10 - "TypeScript Configurations"
Cohesion: 0.07
Nodes (28): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+20 more)

### Community 11 - "Node Tooling Config"
Cohesion: 0.07
Nodes (27): babel-plugin-react-compiler, eslint, eslint-config-next, devDependencies, babel-plugin-react-compiler, eslint, eslint-config-next, tailwindcss (+19 more)

### Community 12 - "Search & Streaming API"
Cohesion: 0.14
Nodes (24): upload_document(), _build_citation_map(), _chunks_to_sources(), _pipeline(), Build citation number -> doc info mapping for display., _replay_cached(), search(), _sse() (+16 more)

### Community 13 - "Text & Image Embeddings"
Cohesion: 0.13
Nodes (22): _embed_image_nodes(), _embed_image_text_only(), _embed_text_nodes(), embed_tree(), Embedder — generates embeddings for all tree nodes and image nodes.  Text node, Try CLIP — returns None silently if not installed., Build composite embedding from text context only.     No CLIP required — uses t, _try_clip() (+14 more)

### Community 14 - "Styling Configuration"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 15 - "Performance Benchmarks"
Cohesion: 0.19
Nodes (20): build_tree(), embed_one(), embed_texts(), fetch_document(), first_meaningful_sentence(), flat_chunk(), get_model(), HeadingNode (+12 more)

### Community 16 - "Redis Caching Layer"
Cohesion: 0.14
Nodes (6): Any, get_qdrant(), get_redis(), Delete all query cache entries., Delete all cache entries for a specific owner., RedisService

### Community 17 - "In-Memory Document Store"
Cohesion: 0.08
Nodes (29): BoundedLRUStore, CachedParagraph, get_cached_now(), get_or_load(), get_store_stats(), invalidate(), _load_from_qdrant(), OwnerCache (+21 more)

### Community 18 - "Chat Conversations API"
Cohesion: 0.05
Nodes (29): add_message(), ConversationCreate, create_conversation(), MessageCreate, BaseModel, clear_cache(), health_check(), ping() (+21 more)

### Community 19 - "json_repair.py"
Cohesion: 0.16
Nodes (19): extract_first_json_array(), extract_first_json_object(), parse_json_object(), parse_triplets_response(), JSON repair utilities for LLM response parsing.  Handles the common failure mode, Remove trailing commas before ] or } (common LLM mistake)., Attempt to salvage a truncated {"triplets": [...]} response.      Strategy:, Progressive recovery for truncated JSON objects (e.g. outline / mindmap).      H (+11 more)

### Community 20 - "Environment Variables Config"
Cohesion: 0.07
Nodes (19): get_settings(), Resolve postgres URL supporting POSTGRES_URL, DATABASE_URL, and NEON_DATABASE_UR, Verified working free models on OpenRouter as of March 2026., Settings, _call_llm(), generate_hypothetical_doc(), _local_expand(), Enhanced Query Expansion — combines: 1. Abbreviation expansion (ANN -> Artifici (+11 more)

### Community 21 - "Test Mocks & Config"
Cohesion: 0.22
Nodes (9): _fake_local_model(), mock_embeddings(), mock_qdrant(), mock_redis(), Global test fixtures — mocks embeddings so tests never trigger real API calls o, Minimal mock that mimics SentenceTransformer., Auto-used fixture: patches all embedding functions so no     model is loaded an, Auto-used fixture: patches Qdrant so tests never need     a running Qdrant inst (+1 more)

### Community 22 - "generate_outline"
Cohesion: 0.43
Nodes (7): assignIds(), buildVisible(), Edge, KnowledgeMindMap(), OutlineNode, pillWidth(), useStableLayout()

### Community 48 - "🧠 RAGraph – Hierarchical Retrieval-Augmented Generation System"
Cohesion: 0.07
Nodes (26): 1. Clone the repository, 1. In-Memory Hierarchical Retrieval (RAGraph v5), 2. Install dependencies, 2. Section-Aware Selection (Beam Budgeting), 3. Contextual Prefixing & First-Class Headings, 3. Run backend, 4. Advanced RRF Hybrid Retrieval Pipeline, 4. Run frontend (+18 more)

### Community 49 - "RAGraph Backend Architecture"
Cohesion: 0.10
Nodes (19): 1. Document Ingestion Pipeline (`app/core/ingestion`), 2. Retrieval Architecture (`app/core/retrieval`), 3. Generation Pipeline (`app/core/generation`), Directory Structure & Core Modules, Key Architectural Advantages, Overview, RAGraph Backend Architecture, Step 1: Parsing (`parser.py`) (+11 more)

### Community 50 - "_add_paragraph_nodes"
Cohesion: 0.21
Nodes (14): _add_paragraph_nodes(), Chunk content into paragraph nodes.     Each chunk is prefixed with its heading, chunk_by_tokens(), chunk_document(), clean_text(), count_tokens(), detect_heading(), extract_fig_references() (+6 more)

### Community 51 - "parser.py"
Cohesion: 0.25
Nodes (14): _extract_fig_label(), _extract_title(), _find_caption_near(), _parse_docx(), _parse_pdf(), _parse_pptx(), _parse_text(), ParsedDocument (+6 more)

### Community 52 - "build_tree"
Cohesion: 0.33
Nodes (14): parse_document(), Route to the correct parser based on file extension.     Falls back gracefully, build_tree(), _make_sample_txt(), Paragraphs should have H1/H2/H3 as parent, not root., H1/H2 nodes must contain both heading name AND content preview., test_build_tree(), test_figure_resolver() (+6 more)

### Community 53 - "resolve_figures"
Cohesion: 0.32
Nodes (7): _fuzzy_match(), _normalise_ref(), Figure Resolver — maps 'Fig 1', 'Figure A' references in text to their correspo, Pass over all paragraph nodes and resolve figure references.     Updates tree.f, Normalise fig reference: 'Figure 3a' -> 'Fig 3a, Match by the numeric/letter part only., resolve_figures()

### Community 55 - "index_tree"
Cohesion: 0.53
Nodes (5): _build_image_points(), _build_text_points(), index_tree(), PointStruct, Qdrant Indexer — uploads the embedded DocumentTree.  KEY CHANGE:   Now indexe

### Community 56 - "Karpathy Guidelines"
Cohesion: 0.33
Nodes (5): 1. Think Before Coding, 2. Simplicity First, 3. Surgical Changes, 4. Goal-Driven Execution, Karpathy Guidelines

### Community 58 - "README.md"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

## Knowledge Gaps
- **152 isolated node(s):** `DocumentStatus`, `$schema`, `style`, `rsc`, `tsx` (+147 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `DBService` connect `Relational Database Management` to `Document API Endpoints`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._
- **Why does `run_ingestion()` connect `Document API Endpoints` to `LLM Context Generation`, `Text & Image Embeddings`, `build_tree`, `resolve_figures`, `index_tree`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Why does `trim_memory()` connect `Document API Endpoints` to `In-Memory Document Store`, `Vector Store Service`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `RetrievedChunk` (e.g. with `BuiltContext` and `RankedChunk`) actually correct?**
  _`RetrievedChunk` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Are the 12 inferred relationships involving `build_tree()` (e.g. with `get_document_outline()` and `run_ingestion()`) actually correct?**
  _`build_tree()` has 12 INFERRED edges - model-reasoned connections that need verification._
- **What connects `DocumentStatus`, `$schema`, `style` to the rest of the system?**
  _152 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Frontend Application & Components` be split into smaller, more focused modules?**
  _Cohesion score 0.05668934240362812 - nodes in this community are weakly interconnected._