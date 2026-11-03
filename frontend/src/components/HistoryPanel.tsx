'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, MessageSquare, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useSearchStore } from '@/store/useSearchStore'
import { formatRelativeTime } from '@/lib/utils'
import { useState, useEffect } from 'react'
import { listConversations, getMessages, deleteConversation } from '@/lib/api'
import { updateBrowserUrl } from '@/lib/routing'

export function HistoryPanel() {
  const { threads, currentThreadId, setThreads, updateThread, user, activeNotebookId } = useSearchStore()
  const store = useSearchStore()
  const [isOpen, setIsOpen] = useState(true)

  useEffect(() => {
    if (user && activeNotebookId && activeNotebookId !== 'nb-tree-rag') {
      listConversations(activeNotebookId)
        .then((data) => {
          if (data && Array.isArray(data)) {
            const merged = data
              .map((d: any) => ({
                id: d.id && d.id !== '' ? d.id : crypto.randomUUID(),
                notebook_id: activeNotebookId,
                title: d.title,
                model: d.model || 'openrouter/free',
                focus: d.focus || 'all',
                createdAt: new Date(d.created_at || Date.now()),
                updatedAt: new Date(d.updated_at || Date.now()),
                messages: d.messages || [],
                persisted: true,
              }))
              .filter((t, idx, arr) => arr.findIndex((x) => x.id === t.id) === idx)
            setThreads(merged)
          }
        })
        .catch(console.error)
    }
  }, [user, activeNotebookId, setThreads])

  const handleDeleteConversation = async (id: string) => {
    store.deleteThread(id)
  }

  const handleSelectThread = async (id: string) => {
    store.setCurrentThreadId(id)
    if (activeNotebookId) {
      updateBrowserUrl('workspace', activeNotebookId, id, true)
    }
    if (user) {
      const thread = threads.find((t) => t.id === id)
      if (thread && thread.messages.length === 0) {
        const msgs = await getMessages(id)
        if (msgs && Array.isArray(msgs)) {
          const parsedMsgs = msgs.map((m: any, i: number) => ({
            id: m.id && m.id !== '' ? m.id : `msg-api-${i}`,
            role: m.role,
            content: m.content,
            sources:
              typeof m.sources_json === 'string'
                ? JSON.parse(m.sources_json || '[]')
                : typeof m.sources === 'string'
                ? JSON.parse(m.sources || '[]')
                : m.sources || [],
            images:
              typeof m.images_json === 'string'
                ? JSON.parse(m.images_json || '[]')
                : typeof m.images === 'string'
                ? JSON.parse(m.images || '[]')
                : m.images || [],
            citation_map:
              typeof m.citations_json === 'string'
                ? JSON.parse(m.citations_json || '{}')
                : typeof m.citations === 'string'
                ? JSON.parse(m.citations || '{}')
                : m.citations || m.citation_map || {},
            related_questions:
              typeof m.related_json === 'string'
                ? JSON.parse(m.related_json || '[]')
                : typeof m.related === 'string'
                ? JSON.parse(m.related || '[]')
                : m.related || m.related_questions || [],
            meta:
              typeof m.meta_json === 'string'
                ? JSON.parse(m.meta_json || '{}')
                : typeof m.meta === 'string'
                ? JSON.parse(m.meta || '{}')
                : m.meta || {},
            timestamp: new Date(m.created_at || Date.now()),
          }))
          updateThread(id, { messages: parsedMsgs })
        }
      }
    }
  }

  return (
    <motion.div
      className="glass-sidebar history-panel-container"
      initial={false}
      animate={{ width: isOpen ? 250 : 50 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      style={{
        height: '100%',
        padding: '10px 0',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: isOpen ? 'space-between' : 'center',
          padding: isOpen ? '0 12px' : '0',
          marginBottom: 10,
        }}
      >
        <AnimatePresence>
          {isOpen && (
            <motion.h2
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              style={{
                fontSize: 16,
                fontWeight: 500,
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-display)',
                whiteSpace: 'nowrap',
                margin: 0,
              }}
            >
              History
            </motion.h2>
          )}
        </AnimatePresence>
        <button
          className="btn-ghost"
          style={{ padding: 4, border: 'none' }}
          onClick={() => setIsOpen(!isOpen)}
          title={isOpen ? 'Collapse History' : 'Expand History'}
        >
          {isOpen ? <PanelLeftClose size={15} /> : <PanelLeftOpen size={15} />}
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, width: '100%', boxSizing: 'border-box' }}
          >
            <div style={{ padding: '0 10px 10px', boxSizing: 'border-box' }}>
              <button
                onClick={() => store.setCurrentThreadId(null)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '7px 10px',
                  background: 'var(--bg-app)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                  borderRadius: 18,
                  cursor: 'pointer',
                  fontSize: 12.5,
                  fontWeight: 500,
                  transition: 'background 0.2s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                onMouseOut={(e) => (e.currentTarget.style.background = 'var(--bg-app)')}
              >
                <Plus size={14} /> New Chat
              </button>
            </div>

            {/* Thread list */}
            <div style={{ flex: 1, overflow: 'auto', padding: '0 8px' }}>
              {threads.length === 0 ? (
                <p
                  style={{
                    fontSize: 11.5,
                    color: 'var(--text-muted)',
                    textAlign: 'center',
                    marginTop: 28,
                    lineHeight: 1.5,
                  }}
                >
                  Your chat history
                  <br />
                  will appear here.
                </p>
              ) : (
                threads.map((thread, i) => (
                  <motion.div
                    key={`thread-item-${i}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 9px',
                      borderRadius: 6,
                      cursor: 'pointer',
                      background: thread.id === currentThreadId ? 'var(--bg-active)' : 'transparent',
                      marginBottom: 2,
                      transition: 'background 0.2s',
                      position: 'relative',
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
                    <MessageSquare size={13.5} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: 12,
                          fontWeight: thread.id === currentThreadId ? 500 : 400,
                          color: 'var(--text-primary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {thread.title}
                      </p>
                      <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                        {formatRelativeTime(new Date(thread.updatedAt))}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteConversation(thread.id)
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-muted)',
                        padding: 3,
                        display: 'none',
                      }}
                      className="delete-btn"
                      title="Delete Chat"
                    >
                      <Trash2 size={12.5} />
                    </button>
                  </motion.div>
                ))
              )}
            </div>
            <style>{`
              .thread-row:hover .delete-btn { display: block !important; }
              .delete-btn:hover { color: #ef4444 !important; }
            `}</style>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
