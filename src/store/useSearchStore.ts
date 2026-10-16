import { create } from 'zustand'
import type { Thread, Message, Source, RetrievedImage, FocusMode, CitationEntry, DocumentInfo } from '@/lib/types'
import { generateId } from '@/lib/utils'

interface AuthUser {
  user_id: string
  email: string
}

export interface DocumentProcessingInfo {
  filename: string
  status: string
  startedAt: Date
}

export interface SearchState {
  // Auth
  user: AuthUser | null
  token: string | null
  session_id: string

  isAuthLoading: boolean
  documentProcessingState: Record<string, DocumentProcessingInfo>

  isUploading: boolean
  uploadPct: number

  currentThreadId: string | null
  threads: Thread[]
  isLoading: boolean
  isStreaming: boolean
  streamText: string
  _targetStreamText: string
  _typingInterval: ReturnType<typeof setInterval> | null
  abortController: AbortController | null

  model: string
  focus: FocusMode
  sidebarOpen: boolean
  useHyde: boolean
  useDualPath: boolean
  backendOnline: boolean

  documents: DocumentInfo[]
  selectedDocuments: Record<string, boolean>

  _currentSources: Source[]
  _currentImages: RetrievedImage[]
  _currentCitations: Record<string, CitationEntry>

  // Auth actions
  setUser: (user: AuthUser | null, token: string | null) => void
  logout: () => void
  getOwnerId: () => string

  setSessionId: (id: string) => void
  setModel: (m: string) => void
  setFocus: (f: FocusMode) => void
  setUseHyde: (v: boolean) => void
  setUseDualPath: (v: boolean) => void
  toggleSidebar: () => void
  setSidebarOpen: (v: boolean) => void
  setBackendOnline: (v: boolean) => void
  setDocuments: (docs: DocumentInfo[]) => void
  toggleDocumentSelection: (docId: string) => void
  selectAllDocuments: (docIds: string[], select: boolean) => void
  clearDocumentSelection: () => void
  setUploading: (v: boolean) => void
  setUploadPct: (v: number) => void

  addProcessingDoc: (docId: string, info: DocumentProcessingInfo) => void
  removeProcessingDoc: (docId: string) => void
  updateProcessingDoc: (docId: string, status: string) => void

  startStream: () => AbortController
  appendStream: (delta: string) => void
  endStream: (
    sources: Source[],
    images: RetrievedImage[],
    related: string[],
    citations: Record<string, CitationEntry>,
    meta?: Record<string, unknown>
  ) => void
  cancelStream: () => void

  setSources: (s: Source[]) => void
  setImages: (i: RetrievedImage[]) => void
  setCitations: (c: Record<string, CitationEntry>) => void

  createThread: (query: string) => Thread
  addUserMessage: (threadId: string, content: string) => void
  getCurrentThread: () => Thread | null
  deleteThread: (id: string) => void
  clearAll: () => void
  setCurrentThreadId: (id: string | null) => void
  setThreads: (threads: Thread[]) => void
  updateThread: (id: string, thread: Partial<Thread>) => void
}

const DEFAULT_DOCUMENTS: DocumentInfo[] = [
  {
    doc_id: 'doc-rag-tree',
    number: 1,
    filename: 'Hierarchical_Tree_RAG_Architecture.pdf',
    status: 'done',
    node_count: 24,
    image_count: 3,
    page_count: 14,
    size_bytes: 1420500,
    created_at: new Date().toISOString(),
    content: `# Hierarchical Tree-Structured RAG Architecture

## 1. Executive Summary
RAGraph implements a multi-tier hierarchical index combining tree traversal, dense vector retrieval, and BM25 sparse keyword ranking. By structuring documents into semantic trees (Document -> Sections -> Subsections -> Leaf Chunks), queries descend through semantic summaries before expanding candidate context.

## 2. Tree Construction & Summarization
- Level 1: Document level metadata and global executive abstract
- Level 2: Section headers, core theses, and topical outlines
- Level 3: Leaf chunks (384-512 tokens with 64 token semantic overlap)
- Cross-cutting entity edges: Connecting recurring concepts across disparate chapters.

## 3. Dual-Path Retrieval Fallback
When hierarchical beam search fails to cross relevance threshold T_dual (0.72), the pipeline triggers dual-path fallback:
1. Primary beam search through the outline graph
2. Parallel flat vector search across all indexed chunks
3. Reciprocal Rank Fusion (RRF) to merge candidate lists.`
  },
  {
    doc_id: 'doc-graph-reranker',
    number: 2,
    filename: 'Graph_Reranking_and_Context_Expansion.pdf',
    status: 'done',
    node_count: 18,
    image_count: 2,
    page_count: 9,
    size_bytes: 843200,
    created_at: new Date().toISOString(),
    content: `# Graph Reranking and Context Expansion

## 1. Context Expansion Algorithm
Given top-k retrieved nodes, graph context expansion walks neighbor edges in the document tree. If chunk C_i is retrieved, adjacent sibling chunks and parent heading summaries are injected into the prompt context to prevent fragmented reasoning.

## 2. Dynamic MindMap Synthesis
RAGraph generates structured JSON trees representing the unified conceptual ontology across all selected documents. The tree can be viewed as an interactive mind map or a 2D force-directed entity relationship network.

## 3. Citations & Attribution
Every factual assertion in the generated answer is grounded with [Doc X] numbered citations mapped to exact document sections, ensuring verifiable traceability.`
  },
  {
    doc_id: 'doc-hyde-vector',
    number: 3,
    filename: 'HyDE_Dense_Sparse_Hybrid_Search.pdf',
    status: 'done',
    node_count: 16,
    image_count: 1,
    page_count: 7,
    size_bytes: 620100,
    created_at: new Date().toISOString(),
    content: `# Hypothetical Document Embeddings (HyDE) & Hybrid Search

## 1. HyDE Pipeline
For ambiguous or abstract questions, the LLM first generates a hypothetical answer passage. The hypothetical passage is embedded and used to query dense vector spaces, bridging vocabulary gaps between conversational queries and academic prose.

## 2. Sparse & Dense Fusion
- BM25 handles precise identifiers, acronyms, and product codes.
- Dense embeddings capture semantic similarity and conceptual paraphrasing.
- Score normalization applies MinMax scaling followed by weighted reciprocal rank scoring.`
  }
]

export const useSearchStore = create<SearchState>()((set, get) => ({
  user: null,
  token: null,
  session_id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'guest-session-' + Date.now(),
  isAuthLoading: false,
  documentProcessingState: {},
  isUploading: false,
  uploadPct: 0,

  currentThreadId: null,
  threads: [],
  isLoading: false,
  isStreaming: false,
  streamText: '',
  _targetStreamText: '',
  _typingInterval: null,
  abortController: null,
  model: 'openrouter/free',
  focus: 'all',
  sidebarOpen: true,
  useHyde: true,
  useDualPath: true,
  backendOnline: false,
  documents: DEFAULT_DOCUMENTS,
  selectedDocuments: {
    'doc-rag-tree': true,
    'doc-graph-reranker': true,
    'doc-hyde-vector': true,
  },
  _currentSources: [],
  _currentImages: [],
  _currentCitations: {},

  setUser: (user, token) => set({ user, token }),
  logout: () => {
    set({
      user: null,
      token: null,
      session_id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'guest-' + Date.now(),
      threads: [],
      currentThreadId: null,
    })
  },
  getOwnerId: () => {
    const { user, session_id } = get()
    return user ? user.user_id : session_id
  },

  setSessionId: (id: string) => set({ session_id: id }),
  setCurrentThreadId: (id) => set({ currentThreadId: id }),

  setModel: (model) => set({ model }),
  setFocus: (focus) => set({ focus }),
  setUseHyde: (v) => set({ useHyde: v }),
  setUseDualPath: (v) => set({ useDualPath: v }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (v) => set({ sidebarOpen: v }),
  setBackendOnline: (v) => set({ backendOnline: v }),
  setDocuments: (docs) =>
    set((s) => {
      const currentDocs = new Set(docs.map((d) => d.doc_id))
      const nextSelected = { ...s.selectedDocuments }
      Object.keys(nextSelected).forEach((id) => {
        if (!currentDocs.has(id)) delete nextSelected[id]
      })
      return { documents: docs, selectedDocuments: nextSelected }
    }),
  toggleDocumentSelection: (docId) =>
    set((s) => ({
      selectedDocuments: { ...s.selectedDocuments, [docId]: !s.selectedDocuments[docId] },
    })),
  selectAllDocuments: (docIds, select) =>
    set((s) => {
      const next = { ...s.selectedDocuments }
      docIds.forEach((id) => {
        if (select) next[id] = true
        else delete next[id]
      })
      return { selectedDocuments: next }
    }),
  clearDocumentSelection: () => set({ selectedDocuments: {} }),
  setUploading: (v) => set({ isUploading: v }),
  setUploadPct: (v) => set({ uploadPct: v }),

  addProcessingDoc: (docId, info) =>
    set((s) => ({
      documentProcessingState: { ...s.documentProcessingState, [docId]: info },
    })),
  removeProcessingDoc: (docId) =>
    set((s) => {
      const next = { ...s.documentProcessingState }
      delete next[docId]
      return { documentProcessingState: next }
    }),
  updateProcessingDoc: (docId, status) =>
    set((s) => {
      const doc = s.documentProcessingState[docId]
      if (!doc) return s
      return {
        documentProcessingState: {
          ...s.documentProcessingState,
          [docId]: { ...doc, status },
        },
      }
    }),

  setSources: (s) => set({ _currentSources: s }),
  setImages: (i) => set({ _currentImages: i }),
  setCitations: (c) => set({ _currentCitations: c }),

  startStream: () => {
    const ac = new AbortController()

    if (get()._typingInterval) clearInterval(get()._typingInterval!)

    const interval = setInterval(() => {
      const state = get()
      if (state.streamText.length < state._targetStreamText.length) {
        const diff = state._targetStreamText.length - state.streamText.length
        const charsToAdd = Math.max(1, Math.floor(diff / 4))
        const nextChars = state._targetStreamText.substring(
          state.streamText.length,
          state.streamText.length + charsToAdd
        )
        set({ streamText: state.streamText + nextChars })
      }
    }, 16)

    set({
      isStreaming: true,
      isLoading: false,
      streamText: '',
      _targetStreamText: '',
      abortController: ac,
      _typingInterval: interval,
      _currentSources: [],
      _currentImages: [],
      _currentCitations: {},
    })
    return ac
  },

  appendStream: (delta) =>
    set((s) => ({
      _targetStreamText: s._targetStreamText + delta,
    })),

  endStream: (sources, images, related, citations, meta) => {
    if (get()._typingInterval) clearInterval(get()._typingInterval!)

    const { _targetStreamText, currentThreadId, threads } = get()

    set({ streamText: _targetStreamText })

    if (!currentThreadId) return

    const msg: Message = {
      id: generateId(),
      role: 'assistant',
      content: _targetStreamText,
      sources,
      images,
      related_questions: related,
      citation_map: citations,
      timestamp: new Date(),
      meta: meta as Message['meta'],
    }

    const updated = threads.map((t) =>
      t.id === currentThreadId
        ? { ...t, messages: [...t.messages, msg], updatedAt: new Date() }
        : t
    )

    set({
      isStreaming: false,
      streamText: '',
      _targetStreamText: '',
      _typingInterval: null,
      threads: updated,
      abortController: null,
      _currentSources: [],
      _currentImages: [],
      _currentCitations: {},
    })
  },

  cancelStream: () => {
    get().abortController?.abort()
    if (get()._typingInterval) clearInterval(get()._typingInterval!)
    set({
      isStreaming: false,
      isLoading: false,
      streamText: '',
      _targetStreamText: '',
      _typingInterval: null,
      abortController: null,
    })
  },

  createThread: (query) => {
    const thread: Thread = {
      id: generateId(),
      title: query.length > 60 ? query.slice(0, 60) + '…' : query,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      model: get().model,
      focus: get().focus,
    }

    set((s) => ({
      threads: [thread, ...s.threads],
      currentThreadId: thread.id,
    }))

    return thread
  },

  addUserMessage: (threadId, content) => {
    const msg: Message = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: new Date(),
    }

    set((s) => ({
      threads: s.threads.map((t) =>
        t.id === threadId
          ? { ...t, messages: [...t.messages, msg], updatedAt: new Date() }
          : t
      ),
      isLoading: true,
    }))
  },

  getCurrentThread: () => {
    const { threads, currentThreadId } = get()
    return threads.find((t) => t.id === currentThreadId) ?? null
  },

  deleteThread: (id) =>
    set((s) => ({
      threads: s.threads.filter((t) => t.id !== id),
      currentThreadId: s.currentThreadId === id ? null : s.currentThreadId,
    })),

  clearAll: () => set({ threads: [], currentThreadId: null }),

  setThreads: (threads) => set({ threads }),
  updateThread: (id, updates) =>
    set((s) => ({
      threads: s.threads.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),
}))
