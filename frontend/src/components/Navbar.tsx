'use client'
import { Plus, Settings, User, LogIn, Network, Files, ArrowLeft, BookOpen } from 'lucide-react'
import { useSearchStore } from '@/store/useSearchStore'
import { useState } from 'react'
import AuthModal from './AuthModal'
import SettingsModal from './SettingsModal'
import KnowledgeMapModal from './KnowledgeMapModal'

interface Props {
  onOpenDocManager?: () => void
  onBackToDashboard?: () => void
}

export function Navbar({ onOpenDocManager, onBackToDashboard }: Props) {
  const { user, threads, currentThreadId, notebooks, activeNotebookId, setAppView } = useSearchStore()
  const logout = useSearchStore((s) => s.logout)
  const [authOpen, setAuthOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [knowledgeMapOpen, setKnowledgeMapOpen] = useState(false)

  const activeNotebook = notebooks.find((n) => n.id === activeNotebookId)
  const currentThread = threads.find((t) => t.id === currentThreadId)
  const title = activeNotebook ? activeNotebook.title : currentThread ? currentThread.title : 'Research Workspace'

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
        {/* Navigation & App Title */}
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
            onClick={() => setAppView('landing')}
            onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
            onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            title="Return to Home / Landing Page"
          >
            <img
              src="/logo.png"
              alt="RAGraph Logo"
              style={{
                width: 36,
                height: 36,
                objectFit: 'contain',
                filter: 'drop-shadow(0 2px 8px rgba(168, 199, 250, 0.3))',
              }}
            />
          </div>

          {/* Breadcrumb Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5 }}>
            <button
              onClick={() => setAppView('landing')}
              className="btn-ghost"
              style={{ padding: '4px 8px', borderRadius: 6, color: 'var(--text-secondary)' }}
              title="Go to Landing Page"
            >
              Home
            </button>
            <span style={{ color: 'var(--text-muted)' }}>/</span>
            {onBackToDashboard && (
              <>
                <button
                  onClick={onBackToDashboard}
                  className="btn-ghost"
                  style={{ padding: '4px 8px', borderRadius: 6, color: 'var(--text-secondary)' }}
                  title="Return to Notebook Dashboard"
                >
                  <ArrowLeft size={13} style={{ marginRight: 4 }} /> Notebooks
                </button>
                <span style={{ color: 'var(--text-muted)' }}>/</span>
              </>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 15,
                fontWeight: 600,
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
              className="btn-primary"
              onClick={() => setAuthOpen(true)}
              style={{ marginLeft: 4, borderRadius: 20, padding: '6px 14px', fontSize: 12.5 }}
            >
              <LogIn size={14} /> Sign In
            </button>
          )}
        </div>
      </header>

      {/* Guest Mode Notice Banner */}
      {!user && (
        <div
          style={{
            background: 'linear-gradient(90deg, rgba(168, 199, 250, 0.1) 0%, rgba(196, 238, 208, 0.08) 100%)',
            borderBottom: '1px solid rgba(168, 199, 250, 0.15)',
            padding: '7px 24px',
            fontSize: 12,
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>
            You are exploring in <strong>Guest Demo Mode</strong>. Documents & chat are temporary in this session.
          </span>
          <button
            onClick={() => setAuthOpen(true)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent-blue)',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: 12,
              textDecoration: 'underline',
            }}
          >
            Sign in to save notebooks
          </button>
        </div>
      )}

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <KnowledgeMapModal
        isOpen={knowledgeMapOpen}
        onClose={() => setKnowledgeMapOpen(false)}
      />
    </>
  )
}