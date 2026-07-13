'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, MessageSquare, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useSearchStore } from '@/store/useSearchStore'
import { formatRelativeTime } from '@/lib/utils'
import { useState, useEffect } from 'react'
import { listConversations, getMessages, deleteConversation } from '@/lib/api'

export function HistoryPanel() {
  const { threads, currentThreadId, setThreads, updateThread, user } = useSearchStore()
  const store = useSearchStore()
  const [hasHydrated, setHasHydrated] = useState(false)
  const [isOpen, setIsOpen] = useState(true)

  useEffect(() => {
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
          const merged = data
            .map((d: any) => ({
              id: d.id && d.id !== '' ? d.id : crypto.randomUUID(),
              title: d.title,
              model: d.model,
              focus: d.focus,
              createdAt: new Date(d.created_at),
              updatedAt: new Date(d.updated_at),
              messages: []
            }))
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
        const msgs = await getMessages(id)
        if (msgs && Array.isArray(msgs)) {
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

  if (!isOpen) {
    return (
      <div className="panel-container" style={{ width: 64, height: '100%', padding: '20px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <button className="btn-ghost" style={{ padding: 6, border: 'none' }} onClick={() => setIsOpen(true)} title="Expand History">
          <PanelLeftOpen size={18} />
        </button>
      </div>
    )
  }

  return (
    <div className="panel-container" style={{ width: 320, height: '100%', padding: '20px 0', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 400, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
          History
        </h2>
        <button className="btn-ghost" style={{ padding: 6, border: 'none' }} onClick={() => setIsOpen(false)} title="Collapse History">
          <PanelLeftClose size={18} />
        </button>
      </div>

      <div style={{ padding: '0 20px 16px' }}>
        <button onClick={() => store.setCurrentThreadId(null)} style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '10px 12px', background: 'var(--bg-app)', color: 'var(--text-primary)',
          border: '1px solid var(--border)', borderRadius: 24, cursor: 'pointer',
          fontSize: 14, fontWeight: 500, transition: 'background 0.2s',
        }}
        onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
        onMouseOut={(e) => e.currentTarget.style.background = 'var(--bg-app)'}
        >
          <Plus size={16} /> New Chat
        </button>
      </div>

      {/* Thread list */}
      <div style={{ flex: 1, overflow: 'auto', padding: '0 12px' }}>
        {threads.length === 0 ? (
          <p style={{
            fontSize: 13, color: 'var(--text-muted)', textAlign: 'center',
            marginTop: 40, lineHeight: 1.6
          }}>
            Your chat history<br />will appear here.
          </p>
        ) : (
          threads.map((thread, i) => (
            <motion.div
              key={`thread-item-${i}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                background: thread.id === currentThreadId ? 'var(--bg-active)' : 'transparent',
                marginBottom: 4,
                transition: 'background 0.2s',
                position: 'relative'
              }}
              onClick={() => handleSelectThread(thread.id)}
              onMouseOver={(e) => {
                if (thread.id !== currentThreadId) e.currentTarget.style.background = 'var(--bg-hover)'
              }}
              onMouseOut={(e) => {
                if (thread.id !== currentThreadId) e.currentTarget.style.background = 'transparent'
              }}
              className="thread-row"
            >
              <MessageSquare size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize: 13,
                  fontWeight: thread.id === currentThreadId ? 500 : 400,
                  color: 'var(--text-primary)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {thread.title}
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  {formatRelativeTime(new Date(thread.updatedAt))}
                </p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleDeleteConversation(thread.id) }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', padding: 4, display: 'none',
                }}
                className="delete-btn"
                title="Delete Chat"
              >
                <Trash2 size={14} />
              </button>
            </motion.div>
          ))
        )}
      </div>
      <style>{`
        .thread-row:hover .delete-btn { display: block !important; }
        .delete-btn:hover { color: #ef4444 !important; }
      `}</style>
    </div>
  )
}
