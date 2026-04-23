'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, MessageSquare, X, Files } from 'lucide-react'
import { useSearchStore } from '@/store/useSearchStore'
import { DocumentManager } from './DocumentManager'
import { formatRelativeTime } from '@/lib/utils'
import { useState, useEffect } from 'react'
import { listConversations, getMessages, deleteConversation } from '@/lib/api'

interface Props { onNewSearch: () => void }

export function Sidebar({ onNewSearch }: Props) {
  const { threads, currentThreadId, sidebarOpen, toggleSidebar, setThreads, updateThread, user } = useSearchStore()
  const store = useSearchStore()
  const [tab, setTab] = useState<'threads' | 'docs'>('docs')
  const [hasHydrated, setHasHydrated] = useState(false)

  useEffect(() => {
    // Wait for Zustand persist to finish rehydrating before making API calls.
    // Without this, token is null on first render even for logged-in users.
    if (useSearchStore.persist.hasHydrated()) {
      setTimeout(() => setHasHydrated(true), 0)
    } else {
      return useSearchStore.persist.onFinishHydration(() => setHasHydrated(true))
    }
  }, [])

  useEffect(() => {
    if (hasHydrated && user) {
      listConversations().then((data) => {
        if (data && Array.isArray(data)) {
          // data resembles conversations without messages
          // we merge this with local threads, preserving local messages if they exist
          const merged = data
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map((d: any) => ({
              id: d.id && d.id !== '' ? d.id : crypto.randomUUID(),
              title: d.title,
              model: d.model,
              focus: d.focus,
              createdAt: new Date(d.created_at),
              updatedAt: new Date(d.updated_at),
              messages: []
            }))
            // deduplicate by id — prevents duplicate React keys if API returns repeated ids
            .filter((t, idx, arr) => arr.findIndex(x => x.id === t.id) === idx)
          setThreads(merged)
        }
      }).catch(console.error)
    }
  }, [hasHydrated, user, setThreads])

  const handleDeleteConversation = async (id: string) => {
    store.deleteThread(id)
    if (user) {
      deleteConversation(id).catch(console.error)
    }
  }

  const handleSelectThread = async (id: string) => {
    store.setCurrentThreadId(id)
    if (user) {
      const thread = threads.find(t => t.id === id)
      if (thread && thread.messages.length === 0) {
        // Fetch messages if empty
        const msgs = await getMessages(id)
        if (msgs && Array.isArray(msgs)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const parsedMsgs = msgs.map((m: any, i: number) => ({
            id: m.id && m.id !== '' ? m.id : `msg-api-${i}`,
            role: m.role,
            content: m.content,
            sources: typeof m.sources === 'string' ? JSON.parse(m.sources || '[]') : m.sources,
            images: typeof m.images === 'string' ? JSON.parse(m.images || '[]') : m.images,
            citation_map: typeof m.citations === 'string' ? JSON.parse(m.citations || '{}') : m.citations,
            related_questions: typeof m.related === 'string' ? JSON.parse(m.related || '[]') : m.related,
            meta: typeof m.meta === 'string' ? JSON.parse(m.meta || '{}') : m.meta,
            timestamp: new Date(m.created_at || Date.now())
          }))
          updateThread(id, { messages: parsedMsgs })
        }
      }
    }
  }

  return (
    <AnimatePresence>
      {sidebarOpen && (
        <motion.aside
          key="sidebar-aside"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 270, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{
            height: '100vh', background: 'var(--bg-secondary)',
            borderRight: '1px solid var(--border)',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden', flexShrink: 0,
            position: 'sticky', top: 0,
          }}
        >
          {/* Header */}
          <div style={{
            padding: '16px 16px 12px',
            display: 'flex', alignItems: 'center', gap: 10,
            borderBottom: '1px solid var(--border)',
          }}>
            <div style={{ flex: 1 }}>
              <h1 style={{
                fontFamily: 'var(--font-body)', fontSize: 16,
                fontWeight: 600, letterSpacing: '-0.01em',
              }}>RAGraph</h1>
              <p style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 1 }}>
                Hierarchical RAG
              </p>
            </div>
            <button onClick={toggleSidebar} className="btn-ghost" style={{ padding: 6, borderRadius: 8 }}>
              <X size={14} />
            </button>
          </div>

          {/* Tabs */}
          <div style={{
            display: 'flex', borderBottom: '1px solid var(--border)',
            padding: '8px 12px', gap: 4,
          }}>
            {[
              { key: 'docs', label: 'Documents', icon: <Files size={12} /> },
              { key: 'threads', label: 'History', icon: <MessageSquare size={12} /> },
            ].map(({ key, label, icon }, i) => (
              <button
                key={`sidebar-tab-${i}-${key}`}
                onClick={() => setTab(key as 'threads' | 'docs')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '6px 12px', borderRadius: '6px',
                  background: tab === key ? 'var(--bg-card)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer', fontSize: 12.5, fontWeight: tab === key ? 500 : 400,
                  color: tab === key ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                {icon}{label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {tab === 'docs' ? (
              <DocumentManager />
            ) : (
              <>
                <div style={{ padding: '10px 12px 6px' }}>
                  <button onClick={onNewSearch} style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 12px', background: 'var(--text-primary)', color: 'var(--bg-primary)',
                    border: 'none', borderRadius: 8, cursor: 'pointer',
                    fontSize: 13, fontWeight: 500, fontFamily: 'var(--font-body)',
                  }}>
                    <Plus size={14} /> New search
                  </button>
                </div>

                <div style={{ flex: 1, overflow: 'auto', padding: '4px 8px' }}>
                  {threads.length === 0 ? (
                    <p style={{
                      fontSize: 12, color: 'var(--text-muted)', textAlign: 'center',
                      marginTop: 32, lineHeight: 1.6
                    }}>
                      Search history<br />appears here
                    </p>
                  ) : (
                    threads.map((thread, i) => (
                      <motion.div
                        key={`thread-item-${i}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        style={{
                          display: 'flex', alignItems: 'flex-start', gap: 8,
                          padding: '8px 10px', borderRadius: 6, cursor: 'pointer',
                          background: thread.id === currentThreadId ? 'var(--bg-hover)' : 'transparent',
                          marginBottom: 2,
                        }}
                        onClick={() => handleSelectThread(thread.id)}
                        whileHover={{ backgroundColor: 'rgba(42,41,38,0.5)' }}
                      >
                        <MessageSquare size={13} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 2 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{
                            fontSize: 12.5,
                            fontWeight: thread.id === currentThreadId ? 500 : 400,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {thread.title}
                          </p>
                          <p style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 2 }}>
                            {formatRelativeTime(new Date(thread.updatedAt))}
                          </p>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteConversation(thread.id) }}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: 'var(--text-muted)', display: 'flex', opacity: 0
                          }}
                          className="delete-btn"
                        >
                          <Trash2 size={12} />
                        </button>
                      </motion.div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </motion.aside>
      )}
      <style>{`div:hover .delete-btn { opacity: 1 !important; }`}</style>
    </AnimatePresence>
  )
}