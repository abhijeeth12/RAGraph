'use client'
import { useCallback, useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, FileText, Network, FileBarChart } from 'lucide-react'
import { SearchBar }         from '@/components/SearchBar'
import { HistoryPanel }      from '@/components/HistoryPanel'
import { SourcesPanel }      from '@/components/SourcesPanel'
import { Navbar }            from '@/components/Navbar'
import { AnswerCard }        from '@/components/AnswerCard'
import { ThinkingIndicator } from '@/components/ThinkingIndicator'
import { useSearchStore }    from '@/store/useSearchStore'
import { streamSearch, healthCheck, cleanupSession, createConversation, saveMessage } from '@/lib/api'
import type { Source, RetrievedImage, SearchRequest, CitationEntry } from '@/lib/types'

export default function Home() {
  const store = useSearchStore()

  const {
    currentThreadId, threads, isLoading, isStreaming, streamText,
    model, focus, useHyde, useDualPath,
    _currentSources, _currentImages, _currentCitations,
    setBackendOnline,
    startStream, appendStream, endStream,
    addUserMessage, createThread,
    setSources, setImages, setCitations,
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

  useEffect(() => {
    const handleUnload = () => {
      const state = useSearchStore.getState()
      if (!state.user) {
        cleanupSession(state.session_id)
        state.setSessionId(crypto.randomUUID())
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

    const selected_doc_ids = Object.entries(useSearchStore.getState().selectedDocuments)
      .filter(([_, isSelected]) => isSelected)
      .map(([id]) => id)

    const request: SearchRequest = {
      session_id: ownerId,
      query,
      model,
      focus,
      thread_id: threadId ?? undefined,
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
          await createConversation(threadId!, newThreadTitle, request.model, request.focus).catch(console.error)
        }
        saveMessage(threadId!, {
          role: 'user', content: query
        }).then(() => {
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
    currentThreadId, isHomePage, currentThread, model, focus, useHyde, useDualPath,
    createThread, addUserMessage, startStream, appendStream, endStream,
    setSources, setImages, setCitations,
  ])

  const messages = currentThread?.messages ?? []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: 'var(--bg-app)' }}>
      
      <Navbar />

      <main className="main-layout" style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden',
        padding: '16px 24px 24px',
        gap: 16
      }}>
        
        {/* Left Panel: History */}
        <HistoryPanel />

        {/* Center Panel: Chat */}
        <div className="panel-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
          
          {/* Header for Chat */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 0' }}>
            <h2 style={{ fontSize: 20, fontWeight: 400, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
              Chat
            </h2>
            <div style={{ display: 'flex', gap: 4 }}>
              <button className="btn-ghost" style={{ padding: '6px', border: 'none' }}>⋮</button>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '24px', paddingBottom: 120 }}>
            {isHomePage ? (
              /* --- EMPTY STATE --- */
              <div style={{
                maxWidth: 600,
                margin: '20px auto 0',
                display: 'flex',
                flexDirection: 'column',
                gap: 24,
              }}>
                <div>
                  <div style={{
                    marginBottom: 32,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    animation: 'float 6s ease-in-out infinite'
                  }}>
                    <img 
                      src="/logo.png" 
                      alt="RAGraph Logo" 
                      style={{ 
                        width: 160, 
                        height: 160, 
                        objectFit: 'contain', 
                        filter: 'drop-shadow(0 10px 25px rgba(255, 255, 255, 0.2))' 
                      }} 
                    />
                  </div>
                  <h1 style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 42,
                    fontWeight: 600,
                    letterSpacing: '-1px',
                    marginBottom: 16,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    background: 'linear-gradient(135deg, #ffffff 0%, #a8c7fa 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: '0 4px 20px rgba(168, 199, 250, 0.15)'
                  }}>
                    Welcome to RAGraph.
                  </h1>
                  <p style={{
                    fontSize: 16,
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                    maxWidth: 550
                  }}>
                    Upload your documents to construct a dynamic, hierarchical knowledge base. 
                    Ask complex questions, synthesize insights, and let our graph-based retrieval engine surface the exact context you need across your entire dataset.
                  </p>
                </div>
                
                <div style={{ marginTop: 24 }}>
                  <p style={{ 
                    fontSize: 13, 
                    color: 'var(--accent-blue)', 
                    fontWeight: 600, 
                    marginBottom: 16, 
                    textTransform: 'uppercase', 
                    letterSpacing: 0.8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-blue)', boxShadow: '0 0 8px var(--accent-blue)' }}></span>
                    Suggested Actions
                  </p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
                    {[
                      { text: 'Summarize the key findings from my uploaded documents', icon: <FileText size={16} /> }, 
                      { text: 'Cross-reference data points across multiple files', icon: <Network size={16} /> }, 
                      { text: 'Generate a comprehensive technical report', icon: <FileBarChart size={16} /> }
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
                          fontSize: 14,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          backdropFilter: 'blur(10px)',
                          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
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
                        <div style={{
                          background: 'var(--bg-hover)',
                          padding: '14px 20px',
                          borderRadius: 24,
                          maxWidth: '85%',
                          fontSize: 15,
                          lineHeight: 1.6,
                          color: 'var(--text-primary)'
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

                {isLoading && !isStreaming && (
                  <ThinkingIndicator visible={true} step={thinkStep} />
                )}

                {isStreaming && (
                  <div style={{ marginBottom: 32 }}>
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
          </div>

          {/* Floating Search Bar */}
          <div style={{
            position: 'absolute',
            bottom: 24,
            left: 24,
            right: 24,
            display: 'flex',
            justifyContent: 'center'
          }}>
            <SearchBar onSearch={handleSearch} />
          </div>

        </div>

        {/* Right Panel: Sources */}
        <SourcesPanel />

      </main>
    </div>
  )
}