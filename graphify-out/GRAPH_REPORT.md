# Graph Report - .  (2026-07-16)

## Corpus Check
- 114 files · ~68,963 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 785 nodes · 1368 edges · 48 communities (40 shown, 8 thin omitted)
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 125 edges (avg confidence: 0.78)
- Token cost: 0 input · 0 output

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
- Configuration & CSRF Security
- Environment Variables Config
- Test Mocks & Config
- FastAPI Application Setup
- Hypothetical Document Expansion
- Health Tests
- Health API Endpoints
- Community 26
- Community 27
- Community 28
- Community 29
- Community 30
- Community 31
- Community 32

## God Nodes (most connected - your core abstractions)
1. `DBService` - 42 edges
2. `RetrievedChunk` - 27 edges
3. `useSearchStore` - 24 edges
4. `cn()` - 21 edges
5. `build_tree()` - 20 edges
6. `QdrantService` - 20 edges
7. `apiFetch()` - 20 edges
8. `DocumentTree` - 18 edges
9. `parse_document()` - 16 edges
10. `compilerOptions` - 16 edges

## Surprising Connections (you probably didn't know these)
- `google_callback()` --calls--> `exchange_code()`  [INFERRED]
  backend/app/api/auth.py → backend/app/core/auth/oauth_google.py
- `_pipeline()` --calls--> `build_context()`  [INFERRED]
  backend/app/api/search.py → backend/app/core/generation/context_builder.py
- `_pipeline()` --calls--> `generate_related_questions()`  [INFERRED]
  backend/app/api/search.py → backend/app/core/generation/llm_client.py
- `_pipeline()` --calls--> `stream_answer()`  [INFERRED]
  backend/app/api/search.py → backend/app/core/generation/llm_client.py
- `_pipeline()` --calls--> `retrieve()`  [INFERRED]
  backend/app/api/search.py → backend/app/core/retrieval/orchestrator.py

## Import Cycles
- None detected.

## Communities (48 total, 8 thin omitted)

### Community 0 - "Frontend Application & Components"
Cohesion: 0.06
Nodes (76): CallbackHandler(), Home(), AnswerCard(), Props, AuthModal(), AuthModalProps, CitationMap(), Props (+68 more)

### Community 1 - "Document Parsing & Tree Ingestion"
Cohesion: 0.06
Nodes (66): _build_image_points(), _build_text_points(), index_tree(), PointStruct, Qdrant Indexer — uploads the embedded DocumentTree.  KEY CHANGE:   Now indexe, _extract_fig_label(), _extract_title(), _find_caption_near() (+58 more)

### Community 2 - "Retrieval & Reranking Algorithms"
Cohesion: 0.07
Nodes (53): _cross_encoder_rerank(), graph_rerank(), _pagerank_boost(), RankedChunk, Graph-Enhanced Reranker.  Step 1 — Build similarity graph:   Nodes = retrieve, Rerank using Cohere Rerank v3.     Falls back to score-based ranking if Cohere, Full graph-enhanced reranking pipeline.     Returns top_k chunks sorted by fina, Simplified PageRank on chunk similarity graph.     Uses three types of structur (+45 more)

### Community 3 - "Relational Database Management"
Cohesion: 0.06
Nodes (9): DBService, datetime, PostgreSQL database service — full persistence layer.  Tables: users, sessions, Get documents for owner — user_id takes precedence over session_id., Get total document count for numbering., Verify that doc belongs to this user or session., Returns {doc_id: sequential_number} for citation mapping., Returns {doc_id: original_filename} for citation display. (+1 more)

### Community 4 - "Frontend Dependencies List"
Cohesion: 0.04
Nodes (47): axios, @base-ui/react, class-variance-authority, clsx, framer-motion, dependencies, axios, @base-ui/react (+39 more)

### Community 5 - "Authentication & User Sessions"
Cohesion: 0.09
Nodes (35): _clear_refresh_cookie(), _format_user(), get_me(), google_callback(), google_url(), login(), logout(), Map DB 'id' -> output 'user_id' for Pydantic (+27 more)

### Community 6 - "LLM Context Generation"
Cohesion: 0.12
Nodes (32): build_context(), BuiltContext, _count(), RetrievedImage, _fallback_answer(), generate_related_questions(), _heading_based_questions(), _openai_client() (+24 more)

### Community 7 - "Vector Store Service"
Cohesion: 0.10
Nodes (15): _bm25_search(), _doc_filter(), _hits_to_chunks(), hybrid_search(), _para_filter(), Hybrid Search — Dense + BM25 + RRF fusion with text deduplication., BM25 search filtered by owner_id — CRITICAL for data isolation., _dense_search() (+7 more)

### Community 8 - "Reusable UI Elements"
Cohesion: 0.11
Nodes (18): Badge(), badgeVariants, Button(), buttonVariants, Card(), CardAction(), CardContent(), CardDescription() (+10 more)

### Community 9 - "Document API Endpoints"
Cohesion: 0.07
Nodes (21): cleanup_session(), get_document_graph(), get_owner(), Returns {'user_id': str} or {'session_id': str} or raises 401, Returns the real hierarchical structure of the specified documents., _run_ingestion(), _fuzzy_match(), _normalise_ref() (+13 more)

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
Cohesion: 0.25
Nodes (10): CachedParagraph, get_or_load(), invalidate(), _load_from_qdrant(), OwnerCache, In-Memory Vector Store — RAGraph v5 Architecture.  Benchmark insight:   The para, Scroll ALL paragraph vectors for this owner from Qdrant and cache them.      Thi, Lightweight metadata + vector reference for in-memory retrieval. (+2 more)

### Community 18 - "Chat Conversations API"
Cohesion: 0.27
Nodes (5): add_message(), ConversationCreate, create_conversation(), MessageCreate, BaseModel

### Community 19 - "Configuration & CSRF Security"
Cohesion: 0.20
Nodes (6): get_settings(), Request, CSRF Protection Middleware/Dependency.     Requires state-changing requests to, verify_csrf_token(), Context Expander — Sibling-aware context enrichment.  After retrieval, expands e, In-Memory Tree Retriever — RAGraph v5.  Replaces the multi-round Qdrant beam sea

### Community 20 - "Environment Variables Config"
Cohesion: 0.22
Nodes (3): Verified working free models on OpenRouter as of March 2026., Settings, BaseSettings

### Community 21 - "Test Mocks & Config"
Cohesion: 0.22
Nodes (9): _fake_local_model(), mock_embeddings(), mock_qdrant(), mock_redis(), Global test fixtures — mocks embeddings so tests never trigger real API calls o, Minimal mock that mimics SentenceTransformer., Auto-used fixture: patches all embedding functions so no     model is loaded an, Auto-used fixture: patches Qdrant so tests never need     a running Qdrant inst (+1 more)

### Community 22 - "FastAPI Application Setup"
Cohesion: 0.36
Nodes (6): create_app(), lifespan(), _check_limit(), Request, rate_limit_middleware(), FastAPI

### Community 23 - "Hypothetical Document Expansion"
Cohesion: 0.38
Nodes (6): _call_llm(), generate_hypothetical_doc(), _local_expand(), Enhanced Query Expansion — combines: 1. Abbreviation expansion (ANN -> Artifici, Expand abbreviations locally without LLM., Generate an expanded query string combining:     - Abbreviation expansion

### Community 25 - "Health API Endpoints"
Cohesion: 0.50
Nodes (4): clear_cache(), health_check(), ping(), Clear all cached search results and in-memory vector cache.

## Knowledge Gaps
- **103 isolated node(s):** `DocumentStatus`, `$schema`, `style`, `rsc`, `tsx` (+98 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `DBService` connect `Relational Database Management` to `Document API Endpoints`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._
- **Why does `build_tree()` connect `Document Parsing & Tree Ingestion` to `Document API Endpoints`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Why does `QdrantService` connect `Vector Store Service` to `Redis Caching Layer`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `RetrievedChunk` (e.g. with `BuiltContext` and `RankedChunk`) actually correct?**
  _`RetrievedChunk` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `DocumentStatus`, `$schema`, `style` to the rest of the system?**
  _103 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Frontend Application & Components` be split into smaller, more focused modules?**
  _Cohesion score 0.05798969072164949 - nodes in this community are weakly interconnected._
- **Should `Document Parsing & Tree Ingestion` be split into smaller, more focused modules?**
  _Cohesion score 0.056842105263157895 - nodes in this community are weakly interconnected._