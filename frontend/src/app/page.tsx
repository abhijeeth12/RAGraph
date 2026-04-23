'use client'
import { useCallback, useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { SearchBar }         from '@/components/SearchBar'
import { Sidebar }           from '@/components/Sidebar'
import { Navbar }            from '@/components/Navbar'
import { AnswerCard }        from '@/components/AnswerCard'
import { ThinkingIndicator } from '@/components/ThinkingIndicator'
import { useSearchStore }    from '@/store/useSearchStore'
import { streamSearch, healthCheck, cleanupSession, createConversation, saveMessage } from '@/lib/api'
import type { Source, RetrievedImage, SearchRequest, CitationEntry } from '@/lib/types'

const SUGGESTIONS = [
  'What are the main topics in my documents?',
  'Summarize the key findings',
  'What methodology was used?',
  'What figures are referenced?',
]

export default function Home() {
  const store = useSearchStore()

  const {
    currentThreadId, threads, isLoading, isStreaming, streamText,
    model, focus, useHyde, useDualPath,
    _currentSources, _currentImages, _currentCitations,
    backendOnline,
    startStream, appendStream, endStream,
    addUserMessage, createThread,
    setBackendOnline, setSources, setImages, setCitations,
    setCurrentThreadId,
  } = store

  const [thinkStep, setThinkStep] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)

  const currentThread = threads.find((t) => t.id === currentThreadId) ?? null
  const isHomePage = !currentThreadId

  useEffect(() => {
    healthCheck()
      .then(() => setBackendOnline(true))
      .catch(() => setBackendOnline(false))
  }, [setBackendOnline])

  // Guest cleanup on page unload
  useEffect(() => {
    const handleUnload = () => {
      const state = useSearchStore.getState()
      // Only cleanup if guest (not logged in)
      if (!state.user) {
        cleanupSession(state.session_id)
        // Generate a new session_id for next visit
        state.setSessionId(crypto.randomUUID())
      }
    }
    window.addEventListener('beforeunload', handleUnload)
    return () => window.removeEventListener('beforeunload', handleUnload)
  }, [])

  // Auto-scroll during streaming
  useEffect(() => {
    if (isStreaming || isLoading) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [streamText, isStreaming, isLoading])

  // Thinking step animation
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

  const handleSearch = useCallback(async (query: string, imageBase64?: string) => {
    let threadId = currentThreadId

    if (!threadId || isHomePage) {
      const thread = createThread(query)
      threadId = thread.id
    }

    addUserMessage(threadId!, query)

    const ownerId = useSearchStore.getState().getOwnerId()
    if (!ownerId) {
      console.error("No owner_id - cannot search")
      return
    }

    const ac = startStream()

    const request: SearchRequest = {
      session_id: ownerId,
      query,
      model,
      focus,
      thread_id: threadId ?? undefined,
      image: imageBase64,
      use_hyde: useHyde,
      use_dual_path: useDualPath,
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
        onSources: (s) => { finalSources = s; setSources(s) },
        onImages: (i) => { finalImages = i; setImages(i) },
        onCitations: (c) => {
          finalCitations = c
          setCitations(c)
        },
        onRelated: (r) => { finalRelated = r; },
        onDone: (m) => { finalMeta = m },
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
          const newThreadTitle = useSearchStore.getState().threads.find(t => t.id === threadId)?.title || query.slice(0, 60) + '…'
          createConversation(threadId!, newThreadTitle, request.model, request.focus).catch(console.error)
        }
        // Save user message
        saveMessage(threadId!, {
          role: 'user', content: query
        }).then(() => {
           // Save assistant message
           saveMessage(threadId!, {
             role: 'assistant',
             content: useSearchStore.getState().threads.find(t => t.id === threadId)?.messages.slice(-1)[0]?.content || '',
             sources: finalSources,
             images: finalImages,
             citation_map: finalCitations,
             related_questions: finalRelated,
             meta: finalMeta
           }).catch(console.error)
        }).catch(console.error)
      }
    }
  }, [
    currentThreadId,
    isHomePage,
    currentThread,
    model,
    focus,
    useHyde,
    useDualPath,
    createThread,
    addUserMessage,
    startStream,
    appendStream,
    endStream,
    setSources,
    setImages,
    setCitations,
  ])

  const handleNewSearch = useCallback(() => {
    setCurrentThreadId(null)
  }, [setCurrentThreadId])

  const messages = currentThread?.messages ?? []

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-primary)' }}>
      <Sidebar onNewSearch={handleNewSearch} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Navbar />

        {!backendOnline && (
          <div style={{
            background: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border)',
            padding: '8px 24px',
            fontSize: 12.5,
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <span style={{ color: '#f59e0b' }}>⚠</span>
            Backend offline — run{' '}
            <code style={{ background: 'var(--bg-hover)', padding: '1px 6px', borderRadius: 4 }}>
              uvicorn app.main:app --reload --port 8000
            </code>
          </div>
        )}



        {/* Scrollable content area */}
        <main style={{ flex: 1, overflow: 'auto', padding: '0 0 24px' }}>
          {isHomePage ? (
            /* ─── HOME VIEW ─── */
            <div
              style={{
                maxWidth: 680,
                margin: '0 auto',
                padding: '80px 24px 120px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 32,
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'clamp(32px, 4vw, 44px)',
                    fontWeight: 600,
                    letterSpacing: '-0.02em',
                    lineHeight: 1.15,
                    marginBottom: 16,
                    color: 'var(--text-primary)'
                  }}
                >
                  Search your documents
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  style={{
                    fontSize: 15.5,
                    color: 'var(--text-secondary)',
                    maxWidth: 440,
                    margin: '0 auto',
                    lineHeight: 1.5,
                  }}
                >
                  Ask questions about your uploaded documents to find exactly what you need.
                </motion.p>
              </div>

              {/* Suggestion chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={`suggestion-item-${i}`}
                    onClick={() => handleSearch(s)}
                    style={{
                      padding: '10px 16px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      cursor: 'pointer',
                      fontSize: 13.5,
                      fontWeight: 500,
                      color: 'var(--text-secondary)',
                      fontFamily: 'var(--font-body)',
                      transition: 'background 0.1s, border-color 0.1s',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = 'var(--bg-hover)';
                      e.currentTarget.style.borderColor = 'var(--text-muted)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = 'var(--bg-card)';
                      e.currentTarget.style.borderColor = 'var(--border)';
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* ─── THREAD VIEW ─── */
            <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 24px 0' }}>
              {/* Committed messages */}
              {messages.map((msg, idx) => (
                <div key={`msg-item-v2-${idx}`} style={{ marginBottom: 28 }}>
                  {msg.role === 'user' ? (
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <div style={{
                        background: 'var(--bg-secondary)',
                        padding: '12px 16px',
                        borderRadius: 16,
                        maxWidth: '85%',
                        fontSize: 15,
                        lineHeight: 1.6,
                      }}>
                        {msg.content}
                      </div>
                    </div>
                  ) : (
                    <AnswerCard
                      content={msg.content}
                      sources={msg.sources ?? []}
                      images={msg.images ?? []}
                      relatedQuestions={msg.related_questions ?? []}
                      citationMap={msg.citation_map}
                      meta={msg.meta}
                      onFollowUp={handleSearch}
                    />
                  )}
                </div>
              ))}

              {/* Thinking indicator — shows while waiting for first token */}
              {isLoading && !isStreaming && (
                <ThinkingIndicator visible={true} step={thinkStep} />
              )}

              {/* Live streaming answer — shows while tokens arrive */}
              {isStreaming && (
                <div style={{ marginBottom: 28 }}>
                  <AnswerCard
                    content={streamText}
                    sources={_currentSources}
                    images={_currentImages}
                    relatedQuestions={[]}
                    citationMap={_currentCitations}
                    isStreaming={true}
                    onFollowUp={handleSearch}
                  />
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          )}
        </main>

        {/* ─── ALWAYS-VISIBLE INPUT BAR ─── */}
        <div style={{
          borderTop: '1px solid var(--border)',
          background: 'var(--bg-primary)',
          padding: '14px 24px',
          flexShrink: 0,
        }}>
          <div style={{ maxWidth: isHomePage ? 680 : 760, margin: '0 auto' }}>
            <SearchBar
              onSearch={handleSearch}
              compact={!isHomePage}
              placeholder={isHomePage
                ? 'Ask anything about your documents…'
                : 'Follow-up question…'}
            />
          </div>
        </div>
      </div>
    </div>
  )
}