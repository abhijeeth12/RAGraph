import { useCallback, useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, FileText, Network, FileBarChart, X, Layers, Cpu, Compass } from 'lucide-react'
import { SearchBar } from '@/components/SearchBar'
import { HistoryPanel } from '@/components/HistoryPanel'
import { SourcesPanel } from '@/components/SourcesPanel'
import { Navbar } from '@/components/Navbar'
import { AnswerCard } from '@/components/AnswerCard'
import { CitationMap } from '@/components/CitationMap'
import { ThinkingIndicator } from '@/components/ThinkingIndicator'
import { DocumentManager } from '@/components/DocumentManager'
import { LandingPage } from '@/components/Landing/LandingPage'
import { NotebookDashboard } from '@/components/Dashboard/NotebookDashboard'
import { useSearchStore } from '@/store/useSearchStore'
import { streamSearch, healthCheck, cleanupSession, createConversation, saveMessage } from '@/lib/api'
import type { Source, RetrievedImage, SearchRequest, CitationEntry } from '@/lib/types'

export default function App() {
  const store = useSearchStore()

  const {
    currentView,
    setAppView,
    user,
    notebooks,
    activeNotebookId,
    setActiveNotebookId,
    ensureActiveNotebookId,
    currentThreadId,
    threads,
    isLoading,
    isStreaming,
    streamText,
    model,
    focus,
    useHyde,
    useDualPath,
    _currentImages,
    _currentCitations,
    setBackendOnline,
    startStream,
    appendStream,
    endStream,
    addUserMessage,
    createThread,
    setSources,
    setImages,
    setCitations,
  } = store

  const [thinkStep, setThinkStep] = useState(0)
  const [docManagerOpen, setDocManagerOpen] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const activeNotebook = notebooks.find((n) => n.id === activeNotebookId)
  const currentThread = threads.find((t) => t.id === currentThreadId) ?? null
  const isHomePage = !currentThreadId

  // Sync hash routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '')
      if (hash === 'dashboard') {
        setAppView('dashboard')
      } else if (hash.startsWith('notebook/')) {
        const nbId = hash.replace('notebook/', '')
        setActiveNotebookId(nbId)
        setAppView('workspace')
      } else if (['features', 'architecture', 'benchmarks', 'faq'].includes(hash)) {
        setAppView('landing')
        setTimeout(() => {
          document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' })
        }, 50)
      } else {
        // Default root view: landing page
        setAppView('landing')
      }
    }

    if (window.location.hash) {
      handleHashChange()
    } else {
      setAppView('landing')
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [setAppView, setActiveNotebookId])

  // Update URL hash on view change
  useEffect(() => {
    if (currentView === 'landing') {
      const hash = window.location.hash.replace('#', '')
      if (!['features', 'architecture', 'benchmarks', 'faq', 'landing'].includes(hash)) {
        window.history.replaceState(null, '', '#landing')
      }
    } else if (currentView === 'dashboard') {
      window.history.replaceState(null, '', '#dashboard')
    } else if (currentView === 'workspace' && activeNotebookId) {
      window.history.replaceState(null, '', `#notebook/${activeNotebookId}`)
    }
  }, [currentView, activeNotebookId])

  useEffect(() => {
    healthCheck()
      .then((ok) => setBackendOnline(ok))
      .catch(() => setBackendOnline(false))
  }, [setBackendOnline])

  useEffect(() => {
    const handleUnload = () => {
      const state = useSearchStore.getState()
      if (!state.user && state.session_id) {
        cleanupSession(state.session_id).catch(() => {})
      }
    }
    window.addEventListener('beforeunload', handleUnload)
    return () => window.removeEventListener('beforeunload', handleUnload)
  }, [])

  useEffect(() => {
    if (isStreaming || isLoading) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [streamText, isStreaming, isLoading])

  useEffect(() => {
    if (!isLoading) {
      setTimeout(() => setThinkStep(0), 0)
      return
    }
    const timers = [400, 900, 1600].map((d, i) =>
      setTimeout(() => setThinkStep(i + 1), d)
    )
    return () => timers.forEach(clearTimeout)
  }, [isLoading])

  const handleSearch = useCallback(
    async (query: string, imageBase64?: string) => {
      // Make sure the active notebook exists server-side before we create a
      // conversation/message scoped to it (same FK guardrail as uploads).
      let persistedNotebookId: string | null = activeNotebookId ?? null
      try {
        persistedNotebookId = await ensureActiveNotebookId()
      } catch (e) {
        console.error('Notebook sync failed:', e)
      }

      let threadId = currentThreadId

      if (!threadId || isHomePage) {
        const thread = createThread(query)
        threadId = thread.id
      }

      addUserMessage(threadId!, query)

      const ownerId = useSearchStore.getState().getOwnerId()
      if (!ownerId) {
        console.error('No owner_id - cannot search')
        return
      }

      const ac = startStream()

      const selected_doc_ids = Object.entries(useSearchStore.getState().selectedDocuments)
        .filter(([_, isSelected]) => isSelected)
        .map(([id]) => id)

      const request: SearchRequest = {
        session_id: ownerId,
        query,
        model,
        focus,
        thread_id: threadId ?? undefined,
        notebook_id: persistedNotebookId ?? undefined,
        image: imageBase64,
        use_hyde: useHyde,
        use_dual_path: useDualPath,
        selected_doc_ids: selected_doc_ids.length > 0 ? selected_doc_ids : undefined,
        conversation_history: currentThread?.messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      }

      let finalSources: Source[] = []
      let finalImages: RetrievedImage[] = []
      let finalRelated: string[] = []
      let finalCitations: Record<string, CitationEntry> = {}
      let finalMeta: Record<string, unknown> = {}
      let hadError = false

      await streamSearch(
        request,
        {
          onText: appendStream,
          onSources: (s) => {
            finalSources = s
            setSources(s)
          },
          onImages: (i) => {
            finalImages = i
            setImages(i)
          },
          onCitations: (c) => {
            finalCitations = c
            setCitations(c)
          },
          onRelated: (r) => {
            finalRelated = r
          },
          onDone: (m) => {
            finalMeta = m
          },
          onError: (e) => {
            console.error('Stream error:', e)
            hadError = true
            appendStream(`⚠️ ${e}`)
            endStream([], [], [], {}, {})
          },
        },
        ac.signal
      )

      if (!hadError) {
        endStream(finalSources, finalImages, finalRelated, finalCitations, finalMeta)

        if (useSearchStore.getState().user) {
          if (!currentThreadId || isHomePage) {
            const newThreadTitle =
              useSearchStore.getState().threads.find((t) => t.id === threadId)?.title ||
              query.slice(0, 60) + '…'
            await createConversation(threadId!, newThreadTitle, request.model, request.focus).catch(
              console.error
            )
          }
          saveMessage(threadId!, {
            role: 'user',
            content: query,
          })
            .then(() => {
              saveMessage(threadId!, {
                role: 'assistant',
                content:
                  useSearchStore
                    .getState()
                    .threads.find((t) => t.id === threadId)
                    ?.messages.slice(-1)[0]?.content || '',
                sources: finalSources,
                images: finalImages,
                citation_map: finalCitations,
                related_questions: finalRelated,
                meta: finalMeta,
              }).catch(console.error)
            })
            .catch(console.error)
        }
      }
    },
    [
      currentThreadId,
      isHomePage,
      currentThread,
      model,
      focus,
      useHyde,
      useDualPath,
      ensureActiveNotebookId,
      createThread,
      addUserMessage,
      startStream,
      appendStream,
      endStream,
      setSources,
      setImages,
      setCitations,
    ]
  )

  const messages = currentThread?.messages ?? []

  // 1. PUBLIC LANDING PAGE VIEW
  if (currentView === 'landing') {
    return (
      <LandingPage
        onStartDemo={() => {
          store.openGuestDemo()
        }}
        onOpenDashboard={() => {
          setAppView('dashboard')
        }}
      />
    )
  }

  // 2. AUTHENTICATED NOTEBOOK DASHBOARD VIEW
  if (currentView === 'dashboard') {
    return (
      <NotebookDashboard
        onSelectNotebook={(id) => {
          setActiveNotebookId(id)
          setAppView('workspace')
        }}
        onBackToLanding={() => {
          setAppView('landing')
        }}
      />
    )
  }

  // 3. WORKSPACE / NOTEBOOK CHAT VIEW
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
        background: 'var(--bg-app)',
      }}
    >
      <Navbar
        onOpenDocManager={() => setDocManagerOpen(true)}
        onBackToDashboard={() => setAppView('dashboard')}
      />

      <main
        className="main-layout"
        style={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
          padding: '16px 24px 24px',
          gap: 16,
        }}
      >
        {/* Left Panel: History */}
        <HistoryPanel />

        {/* Center Panel: Chat */}
        <div
          className="panel-container"
          style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}
        >
          {/* Header for Chat */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 24px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2
                style={{
                  fontSize: 18,
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-display)',
                }}
              >
                {activeNotebook ? activeNotebook.title : 'Chat & Synthesis'}
              </h2>
              {currentThread && (
                <span
                  style={{
                    fontSize: 11,
                    background: 'var(--bg-hover)',
                    color: 'var(--accent-blue)',
                    padding: '2px 8px',
                    borderRadius: 12,
                  }}
                >
                  {currentThread.messages.length} messages
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: 6 }}>
              <button
                className="btn-ghost"
                onClick={() => setDocManagerOpen(true)}
                style={{ fontSize: 12, padding: '4px 10px' }}
              >
                <Layers size={13} /> Manage Docs
              </button>
            </div>
          </div>

          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '24px',
              paddingBottom: 130,
            }}
          >
            {isHomePage ? (
              /* --- NOTEBOOK WELCOME --- */
              <div
                style={{
                  maxWidth: 620,
                  margin: '20px auto 0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 24,
                }}
              >
                <div>
                  <h1
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 34,
                      fontWeight: 600,
                      letterSpacing: '-1px',
                      marginBottom: 16,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      background: 'linear-gradient(135deg, #ffffff 0%, #a8c7fa 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    <Sparkles
                      size={30}
                      color="#a8c7fa"
                      style={{ filter: 'drop-shadow(0 2px 8px rgba(168, 199, 250, 0.4))' }}
                    />
                    {activeNotebook ? activeNotebook.title : 'Welcome to RAGraph.'}
                  </h1>
                  <p
                    style={{
                      fontSize: 14.5,
                      color: 'var(--text-secondary)',
                      lineHeight: 1.6,
                      maxWidth: 580,
                    }}
                  >
                    {activeNotebook?.description ||
                      'Upload documents to construct a dynamic, hierarchical knowledge base. Ask complex questions, synthesize multi-document findings, and let our graph-based retrieval engine surface the exact context you need.'}
                  </p>
                </div>

                {/* Architecture Highlights */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: 12,
                    marginTop: 8,
                  }}
                >
                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border)',
                      borderRadius: 14,
                      padding: '14px',
                    }}
                  >
                    <div style={{ color: 'var(--accent-blue)', marginBottom: 8 }}>
                      <Network size={20} />
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                      Hierarchical Tree
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.4 }}>
                      Beam search down sections from L1 outlines to exact leaf chunks.
                    </p>
                  </div>

                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border)',
                      borderRadius: 14,
                      padding: '14px',
                    }}
                  >
                    <div style={{ color: 'var(--accent-green)', marginBottom: 8 }}>
                      <Cpu size={20} />
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                      HyDE & Dual-Path
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.4 }}>
                      Dense vector search fused with BM25 keyword matching fallback.
                    </p>
                  </div>

                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border)',
                      borderRadius: 14,
                      padding: '14px',
                    }}
                  >
                    <div style={{ color: 'var(--accent-amber)', marginBottom: 8 }}>
                      <Compass size={20} />
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                      Interactive Mind Map
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.4 }}>
                      Explore synthesized ontologies and 2D entity force graphs.
                    </p>
                  </div>
                </div>

                <div style={{ marginTop: 14 }}>
                  <p
                    style={{
                      fontSize: 12,
                      color: 'var(--accent-blue)',
                      fontWeight: 600,
                      marginBottom: 14,
                      textTransform: 'uppercase',
                      letterSpacing: 0.8,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: 'var(--accent-blue)',
                        boxShadow: '0 0 8px var(--accent-blue)',
                      }}
                    />
                    Suggested Research Inquiries
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start' }}>
                    {[
                      {
                        text: 'Summarize the key findings from my uploaded documents',
                        icon: <FileText size={16} />,
                      },
                      {
                        text: 'Explain how dual-path retrieval and HyDE enhance search precision',
                        icon: <Network size={16} />,
                      },
                      {
                        text: 'Cross-reference technical specifications across multiple documents',
                        icon: <FileBarChart size={16} />,
                      },
                    ].map((suggestion, i) => (
                      <button
                        key={i}
                        onClick={() => handleSearch(suggestion.text)}
                        style={{
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: 24,
                          padding: '12px 20px',
                          color: 'var(--text-primary)',
                          fontSize: 13.5,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          backdropFilter: 'blur(10px)',
                          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                          width: '100%',
                          textAlign: 'left',
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.background = 'rgba(168, 199, 250, 0.1)'
                          e.currentTarget.style.borderColor = 'rgba(168, 199, 250, 0.3)'
                          e.currentTarget.style.transform = 'translateY(-1px)'
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'
                          e.currentTarget.style.transform = 'translateY(0)'
                        }}
                      >
                        <div style={{ color: 'var(--accent-blue)', display: 'flex' }}>
                          {suggestion.icon}
                        </div>
                        {suggestion.text}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* --- CHAT MESSAGES --- */
              <div style={{ maxWidth: 760, margin: '0 auto' }}>
                {messages.map((msg, idx) => (
                  <div key={`msg-item-v2-${idx}`} style={{ marginBottom: 32 }}>
                    {msg.role === 'user' ? (
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <div
                          style={{
                            background: 'var(--bg-hover)',
                            padding: '14px 20px',
                            borderRadius: 24,
                            maxWidth: '85%',
                            fontSize: 15,
                            lineHeight: 1.6,
                            color: 'var(--text-primary)',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                          }}
                        >
                          {msg.content}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <AnswerCard
                          content={msg.content}
                          images={msg.images ?? []}
                          relatedQuestions={msg.related_questions ?? []}
                          meta={msg.meta}
                          onFollowUp={handleSearch}
                          onRetry={() => {
                            const lastUser = [...messages]
                              .reverse()
                              .find((m) => m.role === 'user')
                            if (lastUser) handleSearch(lastUser.content)
                          }}
                        />
                        {msg.citation_map && Object.keys(msg.citation_map).length > 0 && (
                          <CitationMap citationMap={msg.citation_map} />
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && !isStreaming && (
                  <ThinkingIndicator visible={true} step={thinkStep} />
                )}

                {isStreaming && (
                  <div style={{ marginBottom: 32 }}>
                    <AnswerCard
                      content={streamText}
                      images={_currentImages}
                      relatedQuestions={[]}
                      isStreaming={true}
                      onFollowUp={handleSearch}
                    />
                    {_currentCitations && Object.keys(_currentCitations).length > 0 && (
                      <CitationMap citationMap={_currentCitations} />
                    )}
                  </div>
                )}

                <div ref={bottomRef} />
              </div>
            )}
          </div>

          {/* Floating Search Bar */}
          <div
            style={{
              position: 'absolute',
              bottom: 24,
              left: 24,
              right: 24,
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <SearchBar
              onSearch={handleSearch}
              onAttachClick={() => setDocManagerOpen(true)}
            />
          </div>
        </div>

        {/* Right Panel: Sources */}
        <SourcesPanel />
      </main>

      {/* Document Manager Drawer Modal */}
      <AnimatePresence>
        {docManagerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(6px)',
              zIndex: 9999,
              display: 'flex',
              justifyContent: 'flex-end',
            }}
            onClick={() => setDocManagerOpen(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 260 }}
              style={{
                width: 440,
                maxWidth: '90vw',
                height: '100%',
                background: 'var(--bg-panel)',
                borderLeft: '1px solid var(--border)',
                boxShadow: '-8px 0 32px rgba(0,0,0,0.5)',
                display: 'flex',
                flexDirection: 'column',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <DocumentManager onClose={() => setDocManagerOpen(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
