import { Plus, Settings, User, LogIn, Network, Files } from 'lucide-react'
import { useSearchStore } from '@/store/useSearchStore'
import { useState } from 'react'
import AuthModal from './AuthModal'
import SettingsModal from './SettingsModal'
import KnowledgeMapModal from './KnowledgeMapModal'

interface Props {
  onOpenDocManager?: () => void
}

export function Navbar({ onOpenDocManager }: Props) {
  const { user, threads, currentThreadId } = useSearchStore()
  const logout = useSearchStore((s) => s.logout)
  const [authOpen, setAuthOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [knowledgeMapOpen, setKnowledgeMapOpen] = useState(false)

  const currentThread = threads.find((t) => t.id === currentThreadId)
  const title = currentThread ? currentThread.title : 'Untitled notebook'

  return (
    <>
      <header
        style={{
          height: 64,
          background: 'var(--bg-app)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          gap: 16,
          position: 'sticky',
          top: 0,
          zIndex: 100,
          flexShrink: 0,
          width: '100%',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        {/* App Logo & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'transform 0.2s ease',
            }}
            onClick={() => useSearchStore.getState().setCurrentThreadId(null)}
            onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
            onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <img
              src="/logo.png"
              alt="RAGraph Logo"
              style={{
                width: 42,
                height: 42,
                objectFit: 'contain',
                filter: 'drop-shadow(0 2px 8px rgba(168, 199, 250, 0.3))',
              }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 18,
                fontWeight: 500,
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {title}
            </h1>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Hierarchical Graph RAG Workspace
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <button
            className="btn-primary"
            style={{ borderRadius: 24, padding: '7px 16px', gap: 6, fontSize: 13 }}
            onClick={() => useSearchStore.getState().setCurrentThreadId(null)}
          >
            <Plus size={15} /> New Notebook
          </button>

          <button
            className="btn-ghost"
            onClick={() => setKnowledgeMapOpen(true)}
            title="Open interactive knowledge map and mind map"
          >
            <Network size={15} /> Knowledge Map
          </button>

          {onOpenDocManager && (
            <button
              className="btn-ghost"
              onClick={onOpenDocManager}
              title="Manage uploaded documents"
            >
              <Files size={15} /> Documents
            </button>
          )}

          <button className="btn-ghost" onClick={() => setSettingsOpen(true)} title="Settings">
            <Settings size={15} /> Settings
          </button>

          {/* Auth controls */}
          {user ? (
            <button
              className="btn-ghost"
              onClick={logout}
              style={{ marginLeft: 4, padding: '6px 12px', borderRadius: 20 }}
              title={`Logged in as ${user.email} (Click to Logout)`}
            >
              <User size={15} style={{ color: 'var(--accent-blue)' }} />
              <span style={{ fontSize: 12 }}>{user.email.split('@')[0]}</span>
            </button>
          ) : (
            <button
              className="btn-ghost"
              onClick={() => setAuthOpen(true)}
              style={{ marginLeft: 4 }}
            >
              <LogIn size={15} /> Sign In
            </button>
          )}
        </div>
      </header>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <KnowledgeMapModal
        isOpen={knowledgeMapOpen}
        onClose={() => setKnowledgeMapOpen(false)}
      />
    </>
  )
}
