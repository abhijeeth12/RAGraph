import { create } from 'zustand'
import type {
  Thread,
  Message,
  Source,
  RetrievedImage,
  FocusMode,
  CitationEntry,
  DocumentInfo,
  Notebook,
  AppView,
} from '@/lib/types'
import { generateId } from '@/lib/utils'
import {
  listNotebooks,
  createNotebook as createNotebookApi,
  ensureNotebookPersisted,
  deleteNotebook as deleteNotebookApi,
  updateNotebook as updateNotebookApi,
  listDocuments,
  listConversations,
  createConversation,
  deleteConversation,
  saveMessage,
} from '@/lib/api'

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
  // Navigation / View State
  currentView: AppView
  setAppView: (view: AppView) => void

  // Auth
  user: AuthUser | null
  token: string | null
  session_id: string

  isAuthLoading: boolean
  documentProcessingState: Record<string, DocumentProcessingInfo>

  isUploading: boolean
  uploadPct: number

  // Notebooks
  notebooks: Notebook[]
  activeNotebookId: string | null
  setActiveNotebookId: (id: string | null) => Promise<void>
  createNotebook: (title: string, description?: string, focus?: FocusMode) => Promise<Notebook>
  ensureNotebookId: (id: string | null) => Promise<string | null>
  ensureActiveNotebookId: () => Promise<string | null>
  deleteNotebook: (id: string) => Promise<void>
  renameNotebook: (id: string, newTitle: string) => Promise<void>
  loadNotebooks: () => Promise<void>
  openGuestDemo: () => void

  // Threads & Active Chat
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

export const DEMO_DOCUMENTS: DocumentInfo[] = [
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
  // View mode
  currentView: 'landing',
  setAppView: (currentView) => set({ currentView }),

  user: null,
  token: null,
  session_id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'guest-session-' + Date.now(),
  isAuthLoading: false,
  documentProcessingState: {},
  isUploading: false,
  uploadPct: 0,

  // Notebooks - start empty so no cross-notebook inheritance occurs
  notebooks: [],
  activeNotebookId: null,

  setActiveNotebookId: async (id) => {
    // 1. Immediately isolate state: clear active workspace items to prevent cross-leakage
    set({
      activeNotebookId: id,
      currentThreadId: null,
      streamText: '',
      _targetStreamText: '',
      isLoading: false,
      isStreaming: false,
      documents: [],
      selectedDocuments: {},
      threads: [],
    })

    if (!id) return

    // 2. Demo notebook handler for guest sandbox
    if (id === 'nb-tree-rag' && !get().user) {
      const sel: Record<string, boolean> = {}
      DEMO_DOCUMENTS.forEach((d) => (sel[d.doc_id] = true))
      set({
        documents: DEMO_DOCUMENTS,
        selectedDocuments: sel,
        threads: [
          {
            id: 'demo-thread-1',
            notebook_id: 'nb-tree-rag',
            title: 'Hierarchical tree traversal & dual-path retrieval',
            messages: [
              {
                id: 'demo-msg-1',
                role: 'user',
                content: 'How does hierarchical tree traversal work in RAGraph?',
                timestamp: new Date(Date.now() - 3600 * 1000 * 2),
              },
              {
                id: 'demo-msg-2',
                role: 'assistant',
                content: 'RAGraph structures documents into semantic trees (Document -> Sections -> Leaf Chunks). Queries descend through summaries before candidate expansion with [Doc 1] citations.',
                timestamp: new Date(Date.now() - 3600 * 1000 * 2 + 5000),
              },
            ],
            createdAt: new Date(Date.now() - 3600 * 1000 * 2),
            updatedAt: new Date(Date.now() - 3600 * 1000 * 2),
            model: 'openrouter/free',
            focus: 'academic',
          },
        ],
      })
      return
    }

    // 3. Independent retrieval strictly for this notebook from the persistent database
    try {
      const [docsData, convsData] = await Promise.all([
        listDocuments(id),
        listConversations(id),
      ])

      const fetchedDocs: DocumentInfo[] = docsData?.documents || []
      const sel: Record<string, boolean> = {}
      fetchedDocs.forEach((d) => (sel[d.doc_id] = true))

      const fetchedThreads: Thread[] = (convsData || []).map((c: any) => ({
        id: c.id,
        notebook_id: id,
        title: c.title || 'Conversation',
        messages: (c.messages || []).map((m: any, i: number) => ({
          id: m.id || `msg-${i}`,
          role: m.role,
          content: m.content,
          sources: typeof m.sources_json === 'string' ? JSON.parse(m.sources_json || '[]') : m.sources || [],
          images: typeof m.images_json === 'string' ? JSON.parse(m.images_json || '[]') : m.images || [],
          citation_map: typeof m.citations_json === 'string' ? JSON.parse(m.citations_json || '{}') : m.citations || m.citation_map || {},
          related_questions: typeof m.related_json === 'string' ? JSON.parse(m.related_json || '[]') : m.related || m.related_questions || [],
          meta: typeof m.meta_json === 'string' ? JSON.parse(m.meta_json || '{}') : m.meta || {},
          timestamp: new Date(m.created_at || Date.now()),
        })),
        createdAt: new Date(c.created_at || Date.now()),
        updatedAt: new Date(c.updated_at || Date.now()),
        model: c.model || 'openrouter/free',
        focus: c.focus || 'all',
      }))

      set((s) => ({
        documents: fetchedDocs,
        selectedDocuments: sel,
        threads: fetchedThreads,
        notebooks: s.notebooks.map((nb) =>
          nb.id === id
            ? {
                ...nb,
                documents: fetchedDocs,
                document_count: fetchedDocs.length,
                conversation_count: fetchedThreads.length,
                messageCount: fetchedThreads.length,
              }
            : nb
        ),
      }))
    } catch (err) {
      console.warn('Failed to load notebook data from backend:', err)
    }
  },

  createNotebook: async (title, description, focus = 'all') => {
    // Persistent creation via dedicated backend API. Failures propagate so the
    // UI can surface them instead of fabricating a notebook that does not
    // exist in the database (which would later break document uploads).
    const newNotebook = await createNotebookApi(title, description, get().model, focus)
    const persistedNotebook: Notebook = { ...newNotebook, persisted: true }

    // A brand new notebook MUST always initialize with 0 documents and 0 conversations
    set((s) => ({
      notebooks: [persistedNotebook, ...s.notebooks.filter((n) => n.id !== persistedNotebook.id)],
      activeNotebookId: persistedNotebook.id,
      currentThreadId: null,
      currentView: 'workspace',
      documents: [],
      selectedDocuments: {},
      threads: [],
      streamText: '',
      _targetStreamText: '',
      isLoading: false,
      isStreaming: false,
    }))

    return persistedNotebook
  },

  ensureNotebookId: async (id) => {
    if (!id) return null
    // A notebook is only safe to upload/scope against once the backend has
    // persisted it. The guest demo notebook ("nb-tree-rag") and any notebook
    // created while the API was unreachable exist only client-side, so we
    // synchronise them here through the real notebook workflow (idempotent,
    // ownership-safe). This is what prevents the FK violation on upload.
    const existing = get().notebooks.find((n) => n.id === id)
    if (existing && existing.persisted !== false) return existing.id

    const seed: Notebook =
      existing ?? {
        id,
        title: 'Untitled Notebook',
        model: get().model,
        focus: get().focus,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

    const persisted = await ensureNotebookPersisted(seed, !seed.isGuestDemo)
    const withFlag: Notebook = { ...persisted, persisted: true }

    set((s) => ({
      notebooks: [
        withFlag,
        ...s.notebooks.filter((n) => n.id !== id && n.id !== withFlag.id),
      ],
      activeNotebookId: s.activeNotebookId === id ? withFlag.id : s.activeNotebookId,
    }))
    return withFlag.id
  },

  ensureActiveNotebookId: async () => {
    const { activeNotebookId } = get()
    if (!activeNotebookId) return null
    return await get().ensureNotebookId(activeNotebookId)
  },

  deleteNotebook: async (id) => {
    await deleteNotebookApi(id).catch(console.error)
    set((s) => {
      const isCurrent = s.activeNotebookId === id
      return {
        notebooks: s.notebooks.filter((n) => n.id !== id),
        activeNotebookId: isCurrent ? null : s.activeNotebookId,
        currentView: isCurrent ? 'dashboard' : s.currentView,
        documents: isCurrent ? [] : s.documents,
        selectedDocuments: isCurrent ? {} : s.selectedDocuments,
        threads: isCurrent ? [] : s.threads,
        currentThreadId: isCurrent ? null : s.currentThreadId,
      }
    })
  },

  renameNotebook: async (id, newTitle) => {
    await updateNotebookApi(id, { title: newTitle }).catch(console.error)
    set((s) => ({
      notebooks: s.notebooks.map((n) =>
        n.id === id ? { ...n, title: newTitle, updatedAt: new Date() } : n
      ),
    }))
  },

  loadNotebooks: async () => {
    try {
      const remoteNotebooks = await listNotebooks()
      if (remoteNotebooks && Array.isArray(remoteNotebooks)) {
        set({ notebooks: remoteNotebooks })
      }
    } catch (e) {
      console.warn('Could not load remote notebooks:', e)
    }
  },

  openGuestDemo: () => {
    const demoNotebook: Notebook = {
      id: 'nb-tree-rag',
      title: 'Hierarchical Tree-RAG Architecture',
      description: 'Core benchmarks, beam search budgeting, and section-aware retrieval analysis.',
      documents: DEMO_DOCUMENTS,
      document_count: DEMO_DOCUMENTS.length,
      conversation_count: 1,
      messageCount: 2,
      model: 'openrouter/free',
      focus: 'academic',
      createdAt: new Date(Date.now() - 3600 * 1000 * 48),
      updatedAt: new Date(Date.now() - 3600 * 1000 * 2),
      isGuestDemo: true,
      persisted: false,
    }

    const sel: Record<string, boolean> = {}
    DEMO_DOCUMENTS.forEach((d) => (sel[d.doc_id] = true))

    set((s) => ({
      notebooks: [demoNotebook, ...s.notebooks.filter((n) => n.id !== demoNotebook.id)],
      activeNotebookId: 'nb-tree-rag',
      currentView: 'workspace',
      documents: DEMO_DOCUMENTS,
      selectedDocuments: sel,
    }))
  },

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
  documents: [],
  selectedDocuments: {},
  _currentSources: [],
  _currentImages: [],
  _currentCitations: {},

  setUser: (user, token) => {
    set({
      user,
      token,
      currentView: user ? 'dashboard' : 'landing',
    })
    if (user) {
      get().loadNotebooks()
    }
  },
  logout: () => {
    set({
      user: null,
      token: null,
      currentView: 'landing',
      session_id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'guest-' + Date.now(),
      threads: [],
      currentThreadId: null,
      activeNotebookId: null,
      documents: [],
      selectedDocuments: {},
      notebooks: [],
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
      docs.forEach((d) => {
        if (nextSelected[d.doc_id] === undefined) nextSelected[d.doc_id] = true
      })
      // Update active notebook's document cache and count
      const updatedNotebooks = s.notebooks.map((nb) =>
        nb.id === s.activeNotebookId
          ? {
              ...nb,
              documents: docs,
              document_count: docs.length,
              updatedAt: new Date(),
            }
          : nb
      )
      return { documents: docs, selectedDocuments: nextSelected, notebooks: updatedNotebooks }
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
      const info = s.documentProcessingState[docId]
      if (!info) return s
      return {
        documentProcessingState: {
          ...s.documentProcessingState,
          [docId]: { ...info, status },
        },
      }
    }),

  startStream: () => {
    const ac = new AbortController()
    set({
      isLoading: true,
      isStreaming: true,
      streamText: '',
      _targetStreamText: '',
      abortController: ac,
    })
    return ac
  },

  appendStream: (delta: string) => {
    const { _targetStreamText, _typingInterval } = get()
    const nextTarget = _targetStreamText + delta
    set({ _targetStreamText: nextTarget })

    if (!_typingInterval) {
      const interval = setInterval(() => {
        const state = get()
        if (state.streamText.length < state._targetStreamText.length) {
          const step = Math.min(
            3,
            state._targetStreamText.length - state.streamText.length
          )
          set({
            streamText: state._targetStreamText.slice(
              0,
              state.streamText.length + step
            ),
          })
        }
      }, 16)
      set({ _typingInterval: interval })
    }
  },

  endStream: (sources, images, related, citations, meta) => {
    const {
      _typingInterval,
      _targetStreamText,
      currentThreadId,
      threads,
      activeNotebookId,
      notebooks,
    } = get()

    if (_typingInterval) clearInterval(_typingInterval)

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

    const updatedThreads = threads.map((t) =>
      t.id === currentThreadId
        ? { ...t, messages: [...t.messages, msg], updatedAt: new Date() }
        : t
    )

    const updatedNotebooks = notebooks.map((nb) =>
      nb.id === activeNotebookId
        ? {
            ...nb,
            conversation_count: (nb.conversation_count || 0) + 1,
            messageCount: (nb.messageCount || 0) + 2,
            updatedAt: new Date(),
          }
        : nb
    )

    set({
      isStreaming: false,
      isLoading: false,
      streamText: '',
      _targetStreamText: '',
      _typingInterval: null,
      threads: updatedThreads,
      notebooks: updatedNotebooks,
      abortController: null,
      _currentSources: [],
      _currentImages: [],
      _currentCitations: {},
    })

    // Persist assistant message to backend database
    saveMessage(currentThreadId, {
      role: 'assistant',
      content: _targetStreamText,
      sources,
      images,
      citation_map: citations,
      related_questions: related,
      meta,
    }).catch(console.error)
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

  setSources: (sources) => set({ _currentSources: sources }),
  setImages: (images) => set({ _currentImages: images }),
  setCitations: (citations) => set({ _currentCitations: citations }),

  createThread: (query) => {
    const activeNbId = get().activeNotebookId
    const threadId = generateId()
    const thread: Thread = {
      id: threadId,
      notebook_id: activeNbId || undefined,
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
      notebooks: s.notebooks.map((nb) =>
        nb.id === activeNbId
          ? {
              ...nb,
              conversation_count: (nb.conversation_count || 0) + 1,
              updatedAt: new Date(),
            }
          : nb
      ),
    }))

    // Persist conversation to database scoped to active notebook
    createConversation(threadId, thread.title, get().model, get().focus, activeNbId).catch(console.error)

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

    // Persist user message to database
    saveMessage(threadId, {
      role: 'user',
      content,
    }).catch(console.error)
  },

  getCurrentThread: () => {
    const { threads, currentThreadId } = get()
    return threads.find((t) => t.id === currentThreadId) ?? null
  },

  deleteThread: (id) => {
    deleteConversation(id).catch(console.error)
    set((s) => ({
      threads: s.threads.filter((t) => t.id !== id),
      currentThreadId: s.currentThreadId === id ? null : s.currentThreadId,
      notebooks: s.notebooks.map((nb) =>
        nb.id === s.activeNotebookId
          ? {
              ...nb,
              conversation_count: Math.max(0, (nb.conversation_count || 1) - 1),
              updatedAt: new Date(),
            }
          : nb
      ),
    }))
  },

  clearAll: () => set({ threads: [], currentThreadId: null }),

  setThreads: (threads) => set({ threads }),
  updateThread: (id, updates) =>
    set((s) => ({
      threads: s.threads.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),
}))
