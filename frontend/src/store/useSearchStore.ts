'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  Thread, Message, Source, RetrievedImage,
  ModelOption, FocusMode,
} from '@/lib/types'
import { generateId } from '@/lib/utils'

interface SearchState {
  currentThreadId: string | null
  threads: Thread[]
  isLoading: boolean
  isStreaming: boolean
  streamText: string
  abortController: AbortController | null

  model: ModelOption
  focus: FocusMode
  sidebarOpen: boolean
  useHyde: boolean
  useDualPath: boolean

  backendOnline: boolean
  setBackendOnline: (v: boolean) => void

  setModel:       (m: ModelOption) => void
  setFocus:       (f: FocusMode) => void
  setUseHyde:     (v: boolean) => void
  setUseDualPath: (v: boolean) => void
  toggleSidebar:  () => void
  setSidebarOpen: (v: boolean) => void

  startStream:    () => AbortController
  appendStream:   (delta: string) => void
  endStream:      (
    sources: Source[],
    images: RetrievedImage[],
    related: string[],
    meta?: Record<string, unknown>,
  ) => void
  cancelStream:   () => void

  createThread:     (query: string) => Thread
  addUserMessage:   (threadId: string, content: string) => void
  getCurrentThread: () => Thread | null
  deleteThread:     (id: string) => void
  clearAll:         () => void

  _currentSources:  Source[]
  _currentImages:   RetrievedImage[]
  setSources:       (s: Source[]) => void
  setImages:        (i: RetrievedImage[]) => void
}

export const useSearchStore = create<SearchState>()(
  persist(
    (set, get) => ({
      currentThreadId: null,
      threads: [],
      isLoading: false,
      isStreaming: false,
      streamText: '',
      abortController: null,

      model: 'mistralai/mistral-7b-instruct:free',
      focus: 'all',
      sidebarOpen: true,
      useHyde: true,
      useDualPath: true,
      backendOnline: false,

      _currentSources: [],
      _currentImages:  [],

      setBackendOnline: (v) => set({ backendOnline: v }),
      setModel:      (model) => set({ model }),
      setFocus:      (focus) => set({ focus }),
      setUseHyde:    (v) => set({ useHyde: v }),
      setUseDualPath:(v) => set({ useDualPath: v }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen:(v) => set({ sidebarOpen: v }),
      setSources:    (s) => set({ _currentSources: s }),
      setImages:     (i) => set({ _currentImages: i }),

      // ✅ FIX: cancel previous stream before starting new
      startStream: () => {
        const { abortController, isStreaming } = get()

        if (isStreaming && abortController) {
          try { abortController.abort() } catch {}
        }

        const ac = new AbortController()

        set({
          isStreaming: true,
          isLoading: false,
          streamText: '',
          abortController: ac,
          _currentSources: [],
          _currentImages: [],
        })

        return ac
      },

      appendStream: (delta) =>
        set((s) => ({ streamText: s.streamText + delta })),

      endStream: (sources, images, related, meta) => {
        const { streamText, currentThreadId, threads } = get()
        if (!currentThreadId) return

        const assistantMsg: Message = {
          id: generateId(),
          role: 'assistant',
          content: streamText,
          sources,
          images,
          related_questions: related,
          timestamp: new Date(),
          meta: meta as Message['meta'],
        }

        const updated = threads.map((t) =>
          t.id === currentThreadId
            ? { ...t, messages: [...t.messages, assistantMsg], updatedAt: new Date() }
            : t,
        )

        set({
          isStreaming: false,
          isLoading: false,
          streamText: '',
          threads: updated,
          abortController: null,
          _currentSources: [],
          _currentImages: [],
        })
      },

      // ✅ FIX: safe cancel (no unnecessary aborts)
      cancelStream: () => {
        const { abortController, isStreaming } = get()

        if (!isStreaming) return

        if (abortController) {
          try {
            abortController.abort()
          } catch {}
        }

        set({
          isStreaming: false,
          isLoading: false,
          streamText: '',
          abortController: null,
          _currentSources: [],
          _currentImages: [],
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
              : t,
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

      clearAll: () =>
        set({
          threads: [],
          currentThreadId: null,
        }),
    }),
    {
      name: 'ragraph-store',
      partialize: (s) => ({
        threads: s.threads,
        model: s.model,
        focus: s.focus,
        sidebarOpen: s.sidebarOpen,
        useHyde: s.useHyde,
        useDualPath: s.useDualPath,
      }),
    },
  ),
)