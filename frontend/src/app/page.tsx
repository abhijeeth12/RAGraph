'use client'
import { useCallback, useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SearchBar } from '@/components/SearchBar'
import { Sidebar }   from '@/components/Sidebar'
import { Navbar }    from '@/components/Navbar'
import { AnswerCard } from '@/components/AnswerCard'
import { ThinkingIndicator } from '@/components/ThinkingIndicator'
import { useSearchStore } from '@/store/useSearchStore'
import { streamSearch, healthCheck } from '@/lib/api'
import type { Source, RetrievedImage, SearchRequest } from '@/lib/types'

const SUGGESTIONS = [
  'Explain the key findings in my document',
  'What methodology was used?',
  'Summarize the main sections',
  'What figures are referenced?',
]

export default function Home() {
  const store = useSearchStore()
  const {
    currentThreadId, threads,
    isLoading, isStreaming, streamText,
    model, focus, useHyde, useDualPath,
    _currentSources, _currentImages,
    backendOnline,
    startStream, appendStream, endStream,
    addUserMessage, createThread,
    setBackendOnline, setSources, setImages,
  } = store

  const [related, setRelated] = useState<string[]>([])
  const [thinkStep, setThinkStep] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)

  const currentThread = threads.find((t) => t.id === currentThreadId) ?? null
  const isHomePage = !currentThreadId

  // ── Health check on mount ───────────────────────────────────────────────
  useEffect(() => {
    healthCheck()
      .then(() => setBackendOnline(true))
      .catch(() => setBackendOnline(false))
  }, [setBackendOnline])

  // ── Auto-scroll ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (isStreaming) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [streamText, isStreaming])

  // ── Thinking steps ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoading) { setThinkStep(0); return }
    const timers = [400, 900, 1600].map((d, i) =>
      setTimeout(() => setThinkStep(i + 1), d),
    )
    return () => timers.forEach(clearTimeout)
  }, [isLoading])

  // ── Main search handler ─────────────────────────────────────────────────
  const handleSearch = useCallback(async (query: string, imageBase64?: string) => {
    let threadId = currentThreadId
    if (!threadId || isHomePage) {
      const thread = createThread(query)
      threadId = thread.id
    }

    addUserMessage(threadId!, query)
    setRelated([])

    const ac = startStream()

    const request: SearchRequest = {
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
    let finalMeta: Record<string, unknown> = {}

    await streamSearch(
      request,
      {
        onText: appendStream,
        onSources: (s) => { finalSources = s; setSources(s) },
        onImages:  (i) => { finalImages  = i; setImages(i)  },
        onRelated: (r) => { finalRelated = r; setRelated(r) },
        onDone:    (m) => { finalMeta    = m },
        onError:   (e) => {
          console.error('Stream error:', e)
          endStream([], [], [], {})
        },
      },
      ac.signal,
    )

    endStream(finalSources, finalImages, finalRelated, finalMeta)
  }, [
    currentThreadId, isHomePage, currentThread,
    model, focus, useHyde, useDualPath,
    createThread, addUserMessage, startStream,
    appendStream, endStream, setSources, setImages,
  ])

  const handleNewSearch = useCallback(() => {
    store.setState({ currentThreadId: null })
  }, [store])

  const messages = currentThread?.messages ?? []

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-primary)' }}>
      <Sidebar onNewSearch={handleNewSearch} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Navbar />

        {/* Backend status banner */}
        {!backendOnline && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            style={{
              background: 'var(--bg-secondary)',
              borderBottom: '1px solid var(--border)',
              padding: '8px 24px',
              fontSize: 12.5,
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span style={{ color: '#f59e0b' }}>⚠</span>
            Backend offline — run{' '}
            <code style={{ background: 'var(--bg-hover)', padding: '1px 6px', borderRadius: 4 }}>
              uvicorn app.main:app --reload --port 8000
            </code>
            {' '}in the backend folder
          </motion.div>
        )}

        <main style={{ flex: 1, overflow: 'auto', padding: '0 0 24px' }}>
          <AnimatePresence mode="wait">
            {isHomePage ? (
              <motion.div
                key="home"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  maxWidth: 680, margin: '0 auto',
                  padding: '80px 24px 120px',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: 32,
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 'clamp(36px, 5vw, 52px)',
                      fontWeight: 400,
                      letterSpacing: '-0.03em',
                      lineHeight: 1.15,
                      marginBottom: 14,
                    }}
                  >
                    Ask anything,{' '}
                    <span className="gradient-text">find everything.</span>
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    style={{
                      fontSize: 16,
                      color: 'var(--text-secondary)',
                      maxWidth: 440,
                      margin: '0 auto',
                      lineHeight: 1.6,
                    }}
                  >
                    Powered by hierarchical RAG — heading-aware tree retrieval,
                    HyDE query expansion, and multimodal understanding.
                  </motion.p>

                  {/* HyDE / Dual-path toggles */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    style={{
                      display: 'flex', gap: 12, justifyContent: 'center',
                      marginTop: 16, flexWrap: 'wrap',
                    }}
                  >
                    {[
                      { label: 'HyDE', value: useHyde, set: store.setUseHyde, desc: 'Query expansion' },
                      { label: 'Dual-path', value: useDualPath, set: store.setUseDualPath, desc: 'BM25 fallback' },
                    ].map(({ label, value, set, desc }) => (
                      <button
                        key={label}
                        onClick={() => set(!value)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          padding: '6px 12px',
                          background: value ? 'var(--accent-blue-light)' : 'var(--bg-card)',
                          border: `1px solid ${value ? 'var(--accent-blue)' : 'var(--border)'}`,
                          borderRadius: 99, cursor: 'pointer',
                          fontSize: 12, color: value ? 'var(--accent-blue)' : 'var(--text-secondary)',
                          fontFamily: 'var(--font-body)',
                          transition: 'all 0.15s',
                        }}
                      >
                        <span>{value ? '✓' : '○'}</span>
                        <span style={{ fontWeight: 500 }}>{label}</span>
                        <span style={{ opacity: 0.7 }}>{desc}</span>
                      </button>
                    ))}
                  </motion.div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  style={{ width: '100%' }}
                >
                  <SearchBar onSearch={handleSearch} />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.35 }}
                  style={{ width: '100%' }}
                >
                  <p className="section-label" style={{ marginBottom: 12, textAlign: 'center' }}>
                    Try asking
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
                    {SUGGESTIONS.map((s, i) => (
                      <motion.button
                        key={i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 + i * 0.07 }}
                        onClick={() => handleSearch(s)}
                        style={{
                          padding: '12px 16px',
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border)',
                          borderRadius: 12, cursor: 'pointer',
                          fontSize: 13.5, color: 'var(--text-primary)',
                          textAlign: 'left', fontFamily: 'var(--font-body)',
                          lineHeight: 1.45, transition: 'border-color 0.15s, box-shadow 0.15s',
                        }}
                        whileHover={{ y: -2, boxShadow: 'var(--shadow-md)' }}
                      >
                        {s}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key={currentThreadId}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ maxWidth: 760, margin: '0 auto', padding: '24px 24px 0' }}
              >
                {messages.map((msg) => (
                  <div key={msg.id} style={{ marginBottom: 28 }}>
                    {msg.role === 'user' ? (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}
                      >
                        <div style={{
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border)',
                          borderRadius: '16px 16px 4px 16px',
                          padding: '12px 18px', maxWidth: '80%',
                          fontSize: 15, lineHeight: 1.55,
                        }}>
                          {msg.content}
                        </div>
                      </motion.div>
                    ) : (
                      <AnswerCard
                        content={msg.content}
                        sources={msg.sources ?? []}
                        images={msg.images ?? []}
                        relatedQuestions={msg.related_questions ?? []}
                        meta={msg.meta}
                        onFollowUp={handleSearch}
                      />
                    )}
                  </div>
                ))}

                {(isLoading || isStreaming) && (
                  <div style={{ marginBottom: 28 }}>
                    <ThinkingIndicator visible={isLoading} step={thinkStep} />
                    {isStreaming && (
                      <AnswerCard
                        content={streamText}
                        sources={_currentSources}
                        images={_currentImages}
                        relatedQuestions={[]}
                        isStreaming
                      />
                    )}
                  </div>
                )}
                <div ref={bottomRef} style={{ height: 1 }} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {!isHomePage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              padding: '12px 24px 20px',
              background: 'var(--bg-primary)',
              borderTop: '1px solid var(--border)',
              maxWidth: 760, margin: '0 auto', width: '100%',
            }}
          >
            <SearchBar onSearch={handleSearch} compact placeholder="Ask a follow-up…" />
          </motion.div>
        )}
      </div>
    </div>
  )
}
