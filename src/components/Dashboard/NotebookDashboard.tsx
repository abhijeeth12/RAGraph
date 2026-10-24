import { useState, useMemo, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Search,
  BookOpen,
  FileText,
  Clock,
  Trash2,
  ArrowLeft,
  GraduationCap,
  Code2,
  LineChart,
  Globe,
  Image as ImageIcon,
  Edit2,
  Check,
  X,
  ArrowRight,
  MessageSquare,
  LayoutGrid,
  List,
  AlertCircle,
  RefreshCw,
  LogOut,
  User,
} from 'lucide-react'
import { useSearchStore } from '@/store/useSearchStore'
import { formatRelativeTime } from '@/lib/utils'
import { CreateNotebookModal } from './CreateNotebookModal'
import AuthModal from '@/components/AuthModal'
import type { Notebook, FocusMode } from '@/lib/types'

interface Props {
  onSelectNotebook: (id: string) => void
  onBackToLanding: () => void
}

const FOCUS_INFO_MAP: Record<FocusMode, { label: string; icon: typeof Globe }> = {
  all: { label: 'General', icon: Globe },
  academic: { label: 'Academic', icon: GraduationCap },
  code: { label: 'Code', icon: Code2 },
  finance: { label: 'Finance', icon: LineChart },
  images: { label: 'Visual', icon: ImageIcon },
  news: { label: 'News', icon: Globe },
}

export function NotebookDashboard({ onSelectNotebook, onBackToLanding }: Props) {
  const {
    user,
    notebooks,
    isNotebooksLoading,
    notebooksError,
    createNotebook,
    deleteNotebook,
    renameNotebook,
    setActiveNotebookId,
    loadNotebooks,
    loadDemoNotebook,
    setUser,
  } = useSearchStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Inline rename state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')

  // Delete confirmation dialog state
  const [deleteTarget, setDeleteTarget] = useState<Notebook | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const searchInputRef = useRef<HTMLInputElement>(null)

  // Keyboard shortcuts: '/' focuses search, 'n' opens create modal, 'Esc' dismisses
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement !== searchInputRef.current &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
      if (
        (e.key === 'n' || e.key === 'N') &&
        !e.ctrlKey &&
        !e.metaKey &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault()
        setCreateModalOpen(true)
      }
      if (e.key === 'Escape') {
        if (editingId) setEditingId(null)
        if (deleteTarget) setDeleteTarget(null)
        if (searchQuery) setSearchQuery('')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [editingId, deleteTarget, searchQuery])

  // Reload notebooks on mount if user is logged in
  useEffect(() => {
    if (user) {
      loadNotebooks()
    }
  }, [user, loadNotebooks])

  // Filter notebooks by search query
  const filteredNotebooks = useMemo(() => {
    let result = notebooks

    const q = searchQuery.toLowerCase().trim()
    if (q) {
      result = result.filter(
        (nb) =>
          nb.title.toLowerCase().includes(q) ||
          (nb.description && nb.description.toLowerCase().includes(q))
      )
    }

    return result
  }, [notebooks, searchQuery])

  const handleOpenNotebook = (id: string) => {
    setActiveNotebookId(id)
    onSelectNotebook(id)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      await deleteNotebook(deleteTarget.id)
      setDeleteTarget(null)
    } finally {
      setIsDeleting(false)
    }
  }

  const startRename = (e: React.MouseEvent, nb: Notebook) => {
    e.stopPropagation()
    setEditingId(nb.id)
    setEditingTitle(nb.title)
  }

  const saveRename = async (e: React.MouseEvent | React.FormEvent, id: string) => {
    e.stopPropagation()
    e.preventDefault()
    if (editingTitle.trim()) {
      await renameNotebook(id, editingTitle.trim())
    }
    setEditingId(null)
  }

  const handleSignOut = () => {
    setUser(null, null, null)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#090A0D',
        color: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "var(--font-body, 'Inter', -apple-system, BlinkMacSystemFont, sans-serif)",
        position: 'relative',
      }}
    >
      {/* ─── Top Masthead / Navigation ─────────────────────────────────── */}
      <header
        style={{
          minHeight: 56,
          background: 'rgba(10, 11, 15, 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 clamp(16px, 3vw, 36px)',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        {/* Left: Brand & Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            onClick={onBackToLanding}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'transparent',
              border: 'none',
              color: '#9CA3AF',
              fontSize: 12.5,
              fontFamily: "var(--font-display, 'Space Grotesk', -apple-system, sans-serif)",
              fontWeight: 600,
              letterSpacing: '-0.01em',
              cursor: 'pointer',
              padding: '6px 8px',
              borderRadius: 6,
              transition: 'color 0.15s ease, background 0.15s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.color = '#FFFFFF'
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.color = '#9CA3AF'
              e.currentTarget.style.background = 'transparent'
            }}
            title="Return to home page"
          >
            <ArrowLeft size={15} />
            <span>Overview</span>
          </button>

          <div
            style={{
              width: 1,
              height: 16,
              background: 'rgba(255, 255, 255, 0.12)',
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <img
              src="/logo.png"
              alt="Study Space"
              style={{
                width: 20,
                height: 20,
                objectFit: 'contain',
              }}
            />
            <span
              style={{
                fontFamily: "var(--font-display, 'Space Grotesk', -apple-system, sans-serif)",
                fontSize: 16,
                fontWeight: 800,
                color: '#FFFFFF',
                letterSpacing: '-0.03em',
              }}
            >
              studyspace
            </span>
          </div>
        </div>

        {/* Right: Search, View Switcher, New Notebook & User */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Integrated Search Box */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(255, 255, 255, 0.035)',
              border: '1px solid rgba(255, 255, 255, 0.09)',
              borderRadius: 7,
              padding: '6px 11px',
              width: 240,
              maxWidth: '100%',
              transition: 'border-color 0.15s ease, background 0.15s ease',
            }}
          >
            <Search size={14} color="#71717A" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search notebooks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#FFFFFF',
                fontSize: 12.5,
                outline: 'none',
                width: '100%',
                fontFamily: "var(--font-body, 'Inter', sans-serif)",
              }}
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                onMouseDown={(e) => {
                  e.preventDefault()
                  setSearchQuery('')
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#9CA3AF',
                  cursor: 'pointer',
                  padding: 2,
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="Clear search"
              >
                <X size={14} />
              </button>
            ) : (
              <span
                style={{
                  fontSize: 10,
                  fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                  color: '#71717A',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  padding: '1px 5px',
                  borderRadius: 3,
                }}
              >
                /
              </span>
            )}
          </div>

          {/* Grid / List Switcher */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 6,
              padding: 2,
            }}
          >
            <button
              onClick={() => setViewMode('grid')}
              style={{
                background: viewMode === 'grid' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                border: 'none',
                color: viewMode === 'grid' ? '#FFFFFF' : '#71717A',
                cursor: 'pointer',
                padding: '4px 6px',
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                transition: 'background 0.15s ease, color 0.15s ease',
              }}
              title="Grid view"
            >
              <LayoutGrid size={14} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              style={{
                background: viewMode === 'list' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                border: 'none',
                color: viewMode === 'list' ? '#FFFFFF' : '#71717A',
                cursor: 'pointer',
                padding: '4px 6px',
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                transition: 'background 0.15s ease, color 0.15s ease',
              }}
              title="List view"
            >
              <List size={14} />
            </button>
          </div>

          {/* "+ New Notebook" Button */}
          <button
            onClick={() => setCreateModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              borderRadius: 7,
              background: '#FFFFFF',
              color: '#090A0D',
              border: 'none',
              fontSize: 12.5,
              fontFamily: "var(--font-display, 'Space Grotesk', -apple-system, sans-serif)",
              fontWeight: 700,
              letterSpacing: '-0.01em',
              cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#E5E7EB'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = '#FFFFFF'
            }}
          >
            <Plus size={14} strokeWidth={2.5} />
            <span>New notebook</span>
          </button>

          {/* User Account / Sign In */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 10px',
                  borderRadius: 6,
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  fontSize: 12,
                  fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                  color: '#D1D5DB',
                }}
              >
                <User size={13} color="#9CA3AF" />
                <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.email.split('@')[0]}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#71717A',
                  cursor: 'pointer',
                  padding: 6,
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'color 0.15s ease',
                }}
                onMouseOver={(e) => (e.currentTarget.style.color = '#FFFFFF')}
                onMouseOut={(e) => (e.currentTarget.style.color = '#71717A')}
                title="Sign out"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                color: '#D1D5DB',
                fontSize: 12,
                fontFamily: "var(--font-display, 'Space Grotesk', -apple-system, sans-serif)",
                fontWeight: 600,
                letterSpacing: '-0.01em',
                cursor: 'pointer',
                transition: 'background 0.15s ease, color 0.15s ease',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'
                e.currentTarget.style.color = '#FFFFFF'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = '#D1D5DB'
              }}
            >
              Sign in
            </button>
          )}
        </div>
      </header>

      {/* ─── Dashboard Overview Bar ────────────────────────────────────── */}
      <section
        style={{
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          background: 'rgba(255, 255, 255, 0.01)',
          position: 'relative',
        }}
      >
        <div
          style={{
            maxWidth: 1400,
            margin: '0 auto',
            padding: '28px clamp(16px, 3vw, 36px) 24px',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: "var(--font-display, 'Space Grotesk', -apple-system, sans-serif)",
                fontSize: 'clamp(24px, 2.4vw, 32px)',
                fontWeight: 700,
                color: '#FFFFFF',
                margin: '0 0 6px',
                letterSpacing: '-0.03em',
              }}
            >
              Notebooks
            </h1>
            <p
              style={{
                fontFamily: "var(--font-body, 'Inter', sans-serif)",
                fontSize: 13.5,
                color: '#9CA3AF',
                margin: 0,
                lineHeight: 1.45,
              }}
            >
              Research workspaces for your documents, notes, and grounded citations.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                fontSize: 11.5,
                fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                color: '#71717A',
                fontWeight: 500,
                letterSpacing: '0.04em',
              }}
            >
              {searchQuery
                ? `Showing ${filteredNotebooks.length} of ${notebooks.length} notebooks`
                : `${notebooks.length} notebook${notebooks.length === 1 ? '' : 's'}`}
            </span>

            {user && (
              <button
                onClick={() => void loadNotebooks()}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: '#9CA3AF',
                  padding: '5px 8px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 11.5,
                  fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)",
                  fontWeight: 600,
                  transition: 'color 0.15s ease, border-color 0.15s ease',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.color = '#FFFFFF'
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.color = '#9CA3AF'
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'
                }}
                title="Refresh notebooks list"
              >
                <RefreshCw size={12} className={isNotebooksLoading ? 'animate-spin' : ''} />
                <span>Refresh</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ─── Main Content Area ─────────────────────────────────────────── */}
      <main
        style={{
          flex: 1,
          maxWidth: 1400,
          width: '100%',
          margin: '0 auto',
          padding: '24px clamp(16px, 3vw, 36px) 64px',
          boxSizing: 'border-box',
        }}
      >
        {/* Loading Skeletons — Stationary opacity pulse, no shifting */}
        {isNotebooksLoading && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: 18,
            }}
          >
            {[1, 2, 3].map((idx) => (
              <div
                key={`skel-${idx}`}
                style={{
                  background: 'rgba(255, 255, 255, 0.025)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: 12,
                  padding: 22,
                  minHeight: 220,
                  opacity: 0.6,
                }}
              />
            ))}
          </div>
        )}

        {/* Error Notice */}
        {!isNotebooksLoading && notebooksError && (
          <div
            style={{
              padding: '18px 22px',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: 10,
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertCircle size={18} color="#F87171" />
              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)",
                    fontWeight: 600,
                    color: '#FCA5A5',
                    marginBottom: 2,
                  }}
                >
                  Unable to load notebooks
                </div>
                <div style={{ fontSize: 12.5, fontFamily: "var(--font-body, 'Inter', sans-serif)", color: '#9CA3AF' }}>
                  {notebooksError}
                </div>
              </div>
            </div>
            <button
              onClick={() => void loadNotebooks()}
              style={{
                padding: '6px 14px',
                borderRadius: 6,
                background: '#FFFFFF',
                color: '#090A0D',
                border: 'none',
                fontSize: 12,
                fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)",
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty State (when user has no notebooks) */}
        {!isNotebooksLoading && notebooks.length === 0 && (
          <div
            style={{
              padding: '72px 28px',
              textAlign: 'center',
              background: 'rgba(16, 18, 24, 0.6)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              borderRadius: 14,
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 8px 32px rgba(0, 0, 0, 0.4)',
              maxWidth: 580,
              margin: '36px auto',
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.09)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 18px',
                color: '#FFFFFF',
              }}
            >
              <BookOpen size={22} strokeWidth={1.75} />
            </div>
            <h3
              style={{
                fontFamily: "var(--font-display, 'Space Grotesk', -apple-system, sans-serif)",
                fontSize: 20,
                fontWeight: 700,
                color: '#FFFFFF',
                margin: '0 0 8px',
                letterSpacing: '-0.025em',
              }}
            >
              No notebooks yet
            </h3>
            <p
              style={{
                color: '#9CA3AF',
                fontFamily: "var(--font-body, 'Inter', sans-serif)",
                fontSize: 13.5,
                maxWidth: 420,
                margin: '0 auto 24px',
                lineHeight: 1.5,
              }}
            >
              Create a notebook to organize documents, ask questions, and explore synthesis grounded in citations.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
              <button
                onClick={() => setCreateModalOpen(true)}
                style={{
                  background: '#FFFFFF',
                  color: '#090A0D',
                  padding: '9px 18px',
                  borderRadius: 7,
                  fontSize: 12.5,
                  fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)",
                  fontWeight: 700,
                  letterSpacing: '-0.01em',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = '#E5E7EB')}
                onMouseOut={(e) => (e.currentTarget.style.background = '#FFFFFF')}
              >
                + Create notebook
              </button>
              <button
                onClick={() => loadDemoNotebook()}
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  color: '#FFFFFF',
                  padding: '9px 18px',
                  borderRadius: 7,
                  fontSize: 12.5,
                  fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)",
                  fontWeight: 600,
                  letterSpacing: '-0.01em',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease, border-color 0.15s ease',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.22)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)'
                }}
              >
                Try sample notebook
              </button>
            </div>
          </div>
        )}

        {/* Search empty state */}
        {!isNotebooksLoading && notebooks.length > 0 && filteredNotebooks.length === 0 && (
          <div
            style={{
              padding: '48px 24px',
              textAlign: 'center',
              background: 'rgba(16, 18, 24, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              borderRadius: 10,
              maxWidth: 440,
              margin: '36px auto',
            }}
          >
            <p style={{ color: '#9CA3AF', fontFamily: "var(--font-body, 'Inter', sans-serif)", fontSize: 13.5, margin: '0 0 14px' }}>
              No notebooks match "{searchQuery}"
            </p>
            <button
              onClick={() => setSearchQuery('')}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#FFFFFF',
                padding: '6px 14px',
                borderRadius: 6,
                fontSize: 12,
                fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)",
                fontWeight: 600,
                border: '1px solid rgba(255, 255, 255, 0.14)',
                cursor: 'pointer',
              }}
            >
              Clear search
            </button>
          </div>
        )}

        {/* ─── GRID VIEW ──────────────────────────────────────────────── */}
        {!isNotebooksLoading && filteredNotebooks.length > 0 && viewMode === 'grid' && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: 18,
            }}
          >
            {/* Create Action Card (only when not searching) */}
            {!searchQuery && (
              <div
                onClick={() => setCreateModalOpen(true)}
                style={{
                  background: 'rgba(255, 255, 255, 0.015)',
                  border: '1px dashed rgba(255, 255, 255, 0.15)',
                  borderRadius: 14,
                  padding: 24,
                  minHeight: 230,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'background 0.18s ease, border-color 0.18s ease',
                  boxSizing: 'border-box',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.32)'
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.035)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.015)'
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: '#FFFFFF',
                    color: '#090A0D',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 12,
                  }}
                >
                  <Plus size={18} strokeWidth={2.5} />
                </div>
                <div
                  style={{
                    fontSize: 15.5,
                    fontFamily: "var(--font-display, 'Space Grotesk', -apple-system, sans-serif)",
                    fontWeight: 700,
                    color: '#FFFFFF',
                    marginBottom: 4,
                    letterSpacing: '-0.02em',
                  }}
                >
                  New notebook
                </div>
                <p
                  style={{
                    fontSize: 12.5,
                    fontFamily: "var(--font-body, 'Inter', sans-serif)",
                    color: '#9CA3AF',
                    margin: '0 0 12px',
                    maxWidth: 220,
                    lineHeight: 1.4,
                  }}
                >
                  Create an isolated space for documents and research questions.
                </p>
                <span
                  style={{
                    fontSize: 10,
                    fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                    color: '#71717A',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    padding: '2px 7px',
                    borderRadius: 4,
                    background: 'rgba(255, 255, 255, 0.03)',
                    letterSpacing: '0.04em',
                  }}
                >
                  Press N
                </span>
              </div>
            )}

            {/* Individual Notebook Cards */}
            {filteredNotebooks.map((nb) => {
              const focusInfo = nb.focus ? FOCUS_INFO_MAP[nb.focus] : null
              const FocusIcon = focusInfo ? focusInfo.icon : null
              const isRenaming = editingId === nb.id
              const docCount = nb.documents?.length || nb.document_count || 0
              const discussionCount = nb.conversation_count ?? nb.messageCount ?? 0
              const docsList = nb.documents || []
              const updatedStr = nb.updatedAt ? formatRelativeTime(new Date(nb.updatedAt)) : ''

              return (
                <div
                  key={nb.id}
                  onClick={() => handleOpenNotebook(nb.id)}
                  style={{
                    background: 'rgba(15, 17, 23, 0.72)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255, 255, 255, 0.075)',
                    borderRadius: 14,
                    padding: '22px 24px',
                    minHeight: 230,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'background 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease',
                    position: 'relative',
                    boxSizing: 'border-box',
                    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 4px 20px rgba(0, 0, 0, 0.35)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.18)'
                    e.currentTarget.style.background = 'rgba(22, 25, 34, 0.85)'
                    e.currentTarget.style.boxShadow =
                      'inset 0 1px 0 rgba(255, 255, 255, 0.09), 0 8px 30px rgba(0, 0, 0, 0.5)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.075)'
                    e.currentTarget.style.background = 'rgba(15, 17, 23, 0.72)'
                    e.currentTarget.style.boxShadow =
                      'inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 4px 20px rgba(0, 0, 0, 0.35)'
                  }}
                >
                  <div>
                    {/* Top Row: Focus Chip & Actions */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 12,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {focusInfo && FocusIcon ? (
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              fontSize: 10.5,
                              fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                              fontWeight: 600,
                              color: '#D1D5DB',
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid rgba(255, 255, 255, 0.09)',
                              padding: '2px 8px',
                              borderRadius: 4,
                              letterSpacing: '0.03em',
                            }}
                          >
                            <FocusIcon size={12} />
                            <span>{focusInfo.label}</span>
                          </div>
                        ) : (
                          <div
                            style={{
                              fontSize: 10.5,
                              fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                              color: '#71717A',
                              letterSpacing: '0.03em',
                            }}
                          >
                            Notebook
                          </div>
                        )}

                        {nb.isGuestDemo && (
                          <span
                            style={{
                              fontSize: 9.5,
                              fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                              fontWeight: 700,
                              color: '#A1A1AA',
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid rgba(255, 255, 255, 0.09)',
                              padding: '1px 6px',
                              borderRadius: 3,
                              letterSpacing: '0.05em',
                            }}
                          >
                            Sample
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <button
                          onClick={(e) => startRename(e, nb)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#71717A',
                            cursor: 'pointer',
                            padding: 5,
                            borderRadius: 4,
                            display: 'flex',
                            alignItems: 'center',
                            transition: 'color 0.15s ease, background 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = '#FFFFFF'
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = '#71717A'
                            e.currentTarget.style.background = 'transparent'
                          }}
                          title="Rename notebook"
                        >
                          <Edit2 size={13} />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeleteTarget(nb)
                          }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#71717A',
                            cursor: 'pointer',
                            padding: 5,
                            borderRadius: 4,
                            display: 'flex',
                            alignItems: 'center',
                            transition: 'color 0.15s ease, background 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = '#F87171'
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = '#71717A'
                            e.currentTarget.style.background = 'transparent'
                          }}
                          title="Delete notebook"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Title with Inline Rename */}
                    {isRenaming ? (
                      <form
                        onSubmit={(e) => saveRename(e, nb.id)}
                        onClick={(e) => e.stopPropagation()}
                        style={{ display: 'flex', gap: 6, marginBottom: 8 }}
                      >
                        <input
                          autoFocus
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          style={{
                            flex: 1,
                            padding: '5px 8px',
                            borderRadius: 5,
                            background: '#090A0D',
                            border: '1px solid #FFFFFF',
                            color: '#FFFFFF',
                            fontSize: 14,
                            fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)",
                            fontWeight: 700,
                            outline: 'none',
                          }}
                        />
                        <button
                          type="submit"
                          style={{
                            background: '#FFFFFF',
                            color: '#090A0D',
                            border: 'none',
                            borderRadius: 5,
                            padding: '5px 8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                          title="Save"
                        >
                          <Check size={13} strokeWidth={2.5} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingId(null)
                          }}
                          style={{
                            background: 'rgba(255, 255, 255, 0.08)',
                            color: '#9CA3AF',
                            border: 'none',
                            borderRadius: 5,
                            padding: '5px 8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                          title="Cancel"
                        >
                          <X size={13} />
                        </button>
                      </form>
                    ) : (
                      <h3
                        style={{
                          fontSize: 16.5,
                          fontFamily: "var(--font-display, 'Space Grotesk', -apple-system, sans-serif)",
                          fontWeight: 700,
                          color: '#FFFFFF',
                          margin: '0 0 6px',
                          letterSpacing: '-0.02em',
                          lineHeight: 1.35,
                        }}
                      >
                        {nb.title}
                      </h3>
                    )}

                    {/* Description */}
                    <p
                      style={{
                        fontSize: 13,
                        fontFamily: "var(--font-body, 'Inter', sans-serif)",
                        color: '#9CA3AF',
                        lineHeight: 1.45,
                        margin: '0 0 14px',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {nb.description || 'Workspace for documents and synthesis.'}
                    </p>

                    {/* Document Previews */}
                    {docsList.length > 0 && (
                      <div
                        style={{
                          background: 'rgba(0, 0, 0, 0.25)',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                          borderRadius: 6,
                          padding: '7px 10px',
                          marginBottom: 14,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 4,
                        }}
                      >
                        {docsList.slice(0, 2).map((doc) => (
                          <div
                            key={doc.doc_id}
                            style={{
                              fontSize: 11,
                              fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                              color: '#D1D5DB',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                            }}
                          >
                            <FileText size={11} color="#9CA3AF" />
                            <span
                              style={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {doc.filename}
                            </span>
                          </div>
                        ))}
                        {docsList.length > 2 && (
                          <div style={{ fontSize: 10, fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)", color: '#71717A', paddingLeft: 17 }}>
                            +{docsList.length - 2} more document{docsList.length - 2 === 1 ? '' : 's'}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div
                    style={{
                      paddingTop: 12,
                      borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: 11,
                      fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                      color: '#71717A',
                      letterSpacing: '0.02em',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>{docCount} {docCount === 1 ? 'doc' : 'docs'}</span>
                      <span>•</span>
                      <span>{discussionCount} {discussionCount === 1 ? 'thread' : 'threads'}</span>
                      {updatedStr && (
                        <>
                          <span>•</span>
                          <span>{updatedStr}</span>
                        </>
                      )}
                    </div>

                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        color: '#D1D5DB',
                        fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)",
                        fontWeight: 700,
                        fontSize: 12,
                        letterSpacing: '-0.01em',
                      }}
                    >
                      <span>Open</span>
                      <ArrowRight size={12} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ─── LIST VIEW ──────────────────────────────────────────────── */}
        {!isNotebooksLoading && filteredNotebooks.length > 0 && viewMode === 'list' && (
          <div
            style={{
              background: 'rgba(15, 17, 23, 0.65)',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              borderRadius: 12,
              overflowX: 'auto',
            }}
          >
            <div style={{ minWidth: 640 }}>
              {/* Header row */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(220px, 2fr) 110px 100px 90px 100px 70px',
                  padding: '10px 18px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                  fontSize: 10.5,
                  fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: '#71717A',
                  background: 'rgba(255, 255, 255, 0.01)',
                }}
              >
                <span>Notebook</span>
                <span>Focus</span>
                <span>Documents</span>
                <span>Threads</span>
                <span>Updated</span>
                <span style={{ textAlign: 'right' }}>Actions</span>
              </div>

              {filteredNotebooks.map((nb) => {
                const focusInfo = nb.focus ? FOCUS_INFO_MAP[nb.focus] : null
                const docCount = nb.documents?.length || nb.document_count || 0
                const discussionCount = nb.conversation_count ?? nb.messageCount ?? 0
                const updatedStr = nb.updatedAt ? formatRelativeTime(new Date(nb.updatedAt)) : '—'

                return (
                  <div
                    key={nb.id}
                    onClick={() => handleOpenNotebook(nb.id)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'minmax(220px, 2fr) 110px 100px 90px 100px 70px',
                      padding: '14px 18px',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      alignItems: 'center',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ paddingRight: 16 }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontFamily: "var(--font-display, 'Space Grotesk', -apple-system, sans-serif)",
                          fontWeight: 700,
                          letterSpacing: '-0.015em',
                          color: '#FFFFFF',
                          marginBottom: 2,
                        }}
                      >
                        {nb.title}
                      </div>
                      {nb.description && (
                        <div
                          style={{
                            fontSize: 12,
                            fontFamily: "var(--font-body, 'Inter', sans-serif)",
                            color: '#9CA3AF',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {nb.description}
                        </div>
                      )}
                    </div>

                    <div>
                      <span
                        style={{
                          fontSize: 10.5,
                          fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                          fontWeight: 600,
                          color: '#D1D5DB',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          padding: '2px 7px',
                          borderRadius: 4,
                          letterSpacing: '0.03em',
                        }}
                      >
                        {focusInfo?.label || 'General'}
                      </span>
                    </div>

                    <div style={{ fontSize: 11.5, fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)", color: '#9CA3AF' }}>
                      {docCount} {docCount === 1 ? 'doc' : 'docs'}
                    </div>

                    <div style={{ fontSize: 11.5, fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)", color: '#9CA3AF' }}>
                      {discussionCount}
                    </div>

                    <div style={{ fontSize: 11, fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)", color: '#71717A' }}>
                      {updatedStr}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: 4,
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={(e) => startRename(e, nb)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#71717A',
                          cursor: 'pointer',
                          padding: 4,
                          borderRadius: 4,
                          transition: 'color 0.15s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#71717A')}
                        title="Rename"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteTarget(nb)
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#71717A',
                          cursor: 'pointer',
                          padding: 4,
                          borderRadius: 4,
                          transition: 'color 0.15s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#F87171')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#71717A')}
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>

      {/* ─── Delete Confirmation Modal ──────────────────────────────────── */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setDeleteTarget(null)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(4, 5, 8, 0.78)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1100,
              padding: 20,
            }}
          >
            {/* Modal Card — Strictly stationary appearance, zero translate or scale */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#0E1015',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 14,
                width: 420,
                maxWidth: '100%',
                padding: '24px',
                boxShadow: '0 24px 64px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
                color: '#FFFFFF',
                fontFamily: "var(--font-body, 'Inter', sans-serif)",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: 'rgba(239, 68, 68, 0.12)',
                  color: '#F87171',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 14,
                }}
              >
                <Trash2 size={17} />
              </div>

              <h3
                style={{
                  fontSize: 18,
                  fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)",
                  fontWeight: 700,
                  margin: '0 0 6px',
                  letterSpacing: '-0.02em',
                }}
              >
                Delete notebook?
              </h3>

              <p style={{ fontSize: 13, fontFamily: "var(--font-body, 'Inter', sans-serif)", color: '#9CA3AF', margin: '0 0 20px', lineHeight: 1.45 }}>
                Are you sure you want to delete <strong style={{ color: '#FFFFFF' }}>"{deleteTarget.title}"</strong>? All associated documents and conversations will be permanently removed.
              </p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  disabled={isDeleting}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 7,
                    background: 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#9CA3AF',
                    fontSize: 12.5,
                    fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)",
                    fontWeight: 600,
                    letterSpacing: '-0.01em',
                    cursor: 'pointer',
                    transition: 'color 0.15s ease, border-color 0.15s ease',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.color = '#FFFFFF'
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.color = '#9CA3AF'
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)'
                  }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 16px',
                    borderRadius: 7,
                    background: '#EF4444',
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: 12.5,
                    fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)",
                    fontWeight: 700,
                    letterSpacing: '-0.01em',
                    cursor: isDeleting ? 'wait' : 'pointer',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.background = '#DC2626')}
                  onMouseOut={(e) => (e.currentTarget.style.background = '#EF4444')}
                >
                  {isDeleting ? 'Deleting...' : 'Delete notebook'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Modals: Create Notebook & Auth ────────────────────────────── */}
      <CreateNotebookModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreate={async (title, desc, focus) => {
          const newNb = await createNotebook(title, desc, focus)
          handleOpenNotebook(newNb.id)
        }}
      />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </div>
  )
}
