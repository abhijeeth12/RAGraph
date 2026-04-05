'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
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
  abortController: AbortController | null

  model: string
  focus: FocusMode
  sidebarOpen: boolean
  useHyde: boolean
  useDualPath: boolean
  backendOnline: boolean

  documents: DocumentInfo[]

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

export const useSearchStore = create<SearchState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      session_id: crypto.randomUUID(),
      isAuthLoading: false,
      documentProcessingState: {},
      isUploading: false,
      uploadPct: 0,

      currentThreadId: null,
      threads: [],
      isLoading: false,
      isStreaming: false,
      streamText: '',
      abortController: null,
      model: 'openrouter/free',
      focus: 'all',
      sidebarOpen: true,
      useHyde: true,
      useDualPath: true,
      backendOnline: false,
      documents: [],
      _currentSources: [],
      _currentImages: [],
      _currentCitations: {},

      // Auth: when logged in, owner_id = user_id; when guest, owner_id = session_id
      setUser: (user, token) => set({ user, token }),
      logout: () => {
        // Fire and forget the server-side logout to clear cookies
        import('@/lib/api').then(m => m.logout().catch(() => {}))
        set({
          user: null,
          token: null,
          session_id: crypto.randomUUID(), // new guest session
          threads: [],
          currentThreadId: null,
          documents: [],
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
      setDocuments: (docs) => set({ documents: docs }),
      setUploading: (v) => set({ isUploading: v }),
      setUploadPct: (v) => set({ uploadPct: v }),

      addProcessingDoc: (docId, info) => set((s) => ({
        documentProcessingState: { ...s.documentProcessingState, [docId]: info }
      })),
      removeProcessingDoc: (docId) => set((s) => {
        const next = { ...s.documentProcessingState }
        delete next[docId]
        return { documentProcessingState: next }
      }),
      updateProcessingDoc: (docId, status) => set((s) => {
        const doc = s.documentProcessingState[docId]
        if (!doc) return s
        return { documentProcessingState: { ...s.documentProcessingState, [docId]: { ...doc, status } } }
      }),

      setSources: (s) => set({ _currentSources: s }),
      setImages: (i) => set({ _currentImages: i }),
      setCitations: (c) => set({ _currentCitations: c }),

      startStream: () => {
        const ac = new AbortController()
        set({
          isStreaming: true,
          isLoading: false,
          streamText: '',
          abortController: ac,
          _currentSources: [],
          _currentImages: [],
          _currentCitations: {}
        })
        return ac
      },

      appendStream: (delta) => set((s) => ({
        streamText: s.streamText + delta
      })),

      endStream: (sources, images, related, citations, meta) => {
        const { streamText, currentThreadId, threads } = get()
        if (!currentThreadId) return

        const msg: Message = {
          id: generateId(),
          role: 'assistant',
          content: streamText,
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
          threads: updated,
          abortController: null,
          _currentSources: [],
          _currentImages: [],
          _currentCitations: {}
        })
      },

      cancelStream: () => {
        get().abortController?.abort()
        set({
          isStreaming: false,
          isLoading: false,
          streamText: '',
          abortController: null
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
          currentThreadId: thread.id
        }))

        return thread
      },

      addUserMessage: (threadId, content) => {
        const msg: Message = {
          id: generateId(),
          role: 'user',
          content,
          timestamp: new Date()
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

      deleteThread: (id) => set((s) => ({
        threads: s.threads.filter((t) => t.id !== id),
        currentThreadId: s.currentThreadId === id ? null : s.currentThreadId,
      })),

      clearAll: () => set({ threads: [], currentThreadId: null }),
      
      setThreads: (threads) => set({ threads }),
      updateThread: (id, updates) => set((s) => ({
        threads: s.threads.map(t => Math.random() < 0 ? t : (t.id === id ? { ...t, ...updates } : t))
      })),
    }),
    {
      name: 'ragraph-store',
      partialize: (s) => ({
        session_id: s.session_id,
        user: s.user,
        token: s.token,
      }),
    }
  )
)
