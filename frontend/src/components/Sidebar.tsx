'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, MessageSquare, X } from 'lucide-react';
import { useSearchStore } from '@/store/useSearchStore';
import { formatRelativeTime, truncate } from '@/lib/utils';

interface Props {
  onNewSearch: () => void;
}

export function Sidebar({ onNewSearch }: Props) {
  const { threads, currentThreadId, sidebarOpen, toggleSidebar, deleteThread } = useSearchStore();

  const store = useSearchStore();

  return (
    <AnimatePresence>
      {sidebarOpen && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 260, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{
            height: '100vh',
            background: 'var(--bg-secondary)',
            borderRight: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            flexShrink: 0,
            position: 'sticky',
            top: 0,
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px 16px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              borderBottom: '1px solid var(--border)',
            }}
          >
            <div style={{ flex: 1 }}>
              <h1
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 18,
                  fontWeight: 400,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em',
                }}
              >
                RAGraph
              </h1>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                Hierarchical RAG
              </p>
            </div>
            <button
              onClick={toggleSidebar}
              className="btn-ghost"
              style={{ padding: 6, borderRadius: 8 }}
            >
              <X size={14} />
            </button>
          </div>

          {/* New thread */}
          <div style={{ padding: '12px 12px 6px' }}>
            <button
              onClick={onNewSearch}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 12px',
                background: 'var(--accent-blue)',
                color: 'white',
                border: 'none',
                borderRadius: 10,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 500,
                fontFamily: 'var(--font-body)',
              }}
            >
              <Plus size={14} />
              New search
            </button>
          </div>

          {/* Thread list */}
          <div style={{ flex: 1, overflow: 'auto', padding: '4px 8px' }}>
            {threads.length === 0 ? (
              <p
                style={{
                  fontSize: 12,
                  color: 'var(--text-muted)',
                  textAlign: 'center',
                  marginTop: 32,
                  lineHeight: 1.6,
                }}
              >
                Your search history<br />will appear here
              </p>
            ) : (
              threads.map((thread) => (
                <motion.div
                  key={thread.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                    padding: '9px 10px',
                    borderRadius: 10,
                    cursor: 'pointer',
                    background: thread.id === currentThreadId ? 'var(--bg-hover)' : 'transparent',
                    marginBottom: 2,
                    group: true,
                  }}
                  onClick={() => store.setState({ currentThreadId: thread.id })}
                  whileHover={{ background: 'var(--bg-hover)' } as any}
                >
                  <MessageSquare
                    size={13}
                    style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 2 }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: 12.5,
                        color: 'var(--text-primary)',
                        fontWeight: thread.id === currentThreadId ? 500 : 400,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        lineHeight: 1.4,
                      }}
                    >
                      {thread.title}
                    </p>
                    <p style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 2 }}>
                      {formatRelativeTime(new Date(thread.updatedAt))}
                    </p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteThread(thread.id); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      opacity: 0,
                      transition: 'opacity 0.15s',
                      display: 'flex',
                      flexShrink: 0,
                    }}
                    className="delete-btn"
                  >
                    <Trash2 size={12} />
                  </button>
                </motion.div>
              ))
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '12px 16px',
              borderTop: '1px solid var(--border)',
              fontSize: 11,
              color: 'var(--text-muted)',
            }}
          >
            {threads.length} thread{threads.length !== 1 ? 's' : ''}
          </div>

          <style>{`
            div:hover .delete-btn { opacity: 1 !important; }
          `}</style>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}