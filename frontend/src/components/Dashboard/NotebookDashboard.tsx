'use client'
import { useState, useMemo, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Search,
  BookOpen,
  FileText,
  Clock,
  Trash2,
  Layers,
  Sparkles,
  LogOut,
  ArrowLeft,
  GraduationCap,
  Code2,
  LineChart,
  Globe,
  Image,
  LayoutGrid,
  List,
  Edit2,
  Check,
  X,
  Compass,
  Activity,
  LogIn,
  ArrowRight,
  ShieldCheck,
  Terminal,
  RefreshCw,
} from 'lucide-react'
import { useSearchStore } from '@/store/useSearchStore'
import { formatRelativeTime } from '@/lib/utils'
import { healthCheck } from '@/lib/api'
import { CreateNotebookModal } from './CreateNotebookModal'
import AuthModal from '@/components/AuthModal'
import type { Notebook, FocusMode } from '@/lib/types'

interface Props {
  onSelectNotebook: (id: string) => void
  onBackToLanding: () => void
}

const FOCUS_ICON_MAP: Record<FocusMode, any> = {
  all: Globe,
  academic: GraduationCap,
  code: Code2,
  finance: LineChart,
  images: Image,
  news: Globe,
}

const STARTER_SANDBOXES = [
  {
    id: 'tree-rag-demo',
    title: 'Hierarchical Tree-RAG Architecture',
    desc: 'Pre-parsed distributed consensus papers, multi-scale beam search benchmarks, and dual-path RRF analysis.',
    focus: 'academic' as FocusMode,
    docCount: 3,
    nodeCount: 142,
    badge: 'FEATURED SANDBOX',
  },
  {
    id: 'raft-consensus-demo',
    title: 'Distributed Raft Consensus Invariants',
    desc: 'Formal verification proofs, split-brain safety theorems, and state machine replication logs.',
    focus: 'code' as FocusMode,
    docCount: 2,
    nodeCount: 98,
    badge: 'SYSTEMS SPEC',
  },
]

export function NotebookDashboard({ onSelectNotebook, onBackToLanding }: Props) {
  const {
    user,
    logout,
    notebooks,
    createNotebook,
    deleteNotebook,
    renameNotebook,
    setActiveNotebookId,
    loadNotebooks,
    openGuestDemo,
    backendOnline,
    setBackendOnline,
  } = useSearchStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFocus, setSelectedFocus] = useState<FocusMode | 'all-view'>('all-view')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)

  // Inline rename state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')

  // Backend connection checking state
  const [isCheckingHealth, setIsCheckingHealth] = useState(false)
  const [latencyMs, setLatencyMs] = useState<number | null>(null)

  const checkBackendStatus = async () => {
    setIsCheckingHealth(true)
    const t0 = performance.now()
    try {
      const ok = await healthCheck()
      const elapsed = Math.round(performance.now() - t0)
      setLatencyMs(elapsed)
      setBackendOnline(ok)
    } catch {
      setBackendOnline(false)
    } finally {
      setIsCheckingHealth(false)
    }
  }

  // Check health on mount or when dashboard loads
  useEffect(() => {
    checkBackendStatus()
  }, [])

  const searchInputRef = useRef<HTMLInputElement>(null)

  // Keyboard shortcut '/' to focus search, 'n' to create
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
      if ((e.key === 'n' || e.key === 'N') && !e.ctrlKey && !e.metaKey && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault()
        setCreateModalOpen(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Reload notebooks on mount if user is logged in
  useEffect(() => {
    if (user) {
      loadNotebooks()
    }
  }, [user, loadNotebooks])

  const filteredNotebooks = useMemo(() => {
    let result = notebooks

    if (selectedFocus !== 'all-view') {
      result = result.filter((nb) => (nb.focus || 'all') === selectedFocus)
    }

    const q = searchQuery.toLowerCase().trim()
    if (q) {
      result = result.filter(
        (nb) =>
          nb.title.toLowerCase().includes(q) ||
          (nb.description && nb.description.toLowerCase().includes(q))
      )
    }

    return result
  }, [notebooks, selectedFocus, searchQuery])

  // Total statistics across all notebooks
  const totalDocs = useMemo(() => {
    return notebooks.reduce((acc, nb) => acc + (nb.documents?.length || 0), 0)
  }, [notebooks])

  const totalNodes = useMemo(() => {
    return notebooks.reduce(
      (acc, nb) =>
        acc +
        (nb.documents?.reduce((dAcc, d) => dAcc + (d.node_count || 0), 0) || 0),
      0
    )
  }, [notebooks])

  const handleOpenNotebook = (id: string) => {
    setActiveNotebookId(id)
    onSelectNotebook(id)
  }

  const handleDelete = async (e: React.MouseEvent, nb: Notebook) => {
    e.stopPropagation()
    if (window.confirm(`Are you sure you want to delete notebook "${nb.title}"? This cannot be undone.`)) {
      await deleteNotebook(nb.id)
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

  const handleLaunchStarter = (starterId: string) => {
    openGuestDemo()
    onSelectNotebook('nb-tree-rag')
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-app)',
        color: 'var(--text-primary)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "var(--font-body)",
        position: 'relative',
      }}
    >
      {/* Precision Hairline Background Grid */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* ─── Control Header ─────────────────────────────────────────── */}
      <header
        style={{
          height: 72,
          background: 'rgba(14, 17, 23, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1.5px solid var(--border-bold)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
      >
        {/* Left: Back Link & Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={onBackToLanding}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'var(--bg-card)',
              border: '1.5px solid var(--border-bold)',
              color: 'var(--text-secondary)',
              padding: '6px 12px',
              borderRadius: 6,
              fontSize: 12.5,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              fontFamily: "var(--font-mono)",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.color = 'var(--text-primary)'
              e.currentTarget.style.borderColor = 'var(--accent-blue)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary)'
              e.currentTarget.style.borderColor = 'var(--border-bold)'
            }}
            title="Return to Public Landing Page"
          >
            <ArrowLeft size={14} />
            <span>[ 00 ] Landing Page</span>
          </button>

          <span style={{ color: 'var(--border-bold)', fontSize: 13 }}>/</span>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 16,
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
              }}
            >
              Researcher Workspace
            </span>
            <span
              style={{
                fontSize: 11,
                fontFamily: "var(--font-mono)",
                background: 'rgba(56, 189, 248, 0.12)',
                color: 'var(--accent-blue)',
                padding: '2px 7px',
                borderRadius: 4,
                border: '1.5px solid var(--border-bold)',
                fontWeight: 600,
              }}
            >
              FK-SCOPED
            </span>
          </div>
        </div>

        {/* Right: Telemetry & User Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Backend Health Chip */}
          <button
            onClick={() => void checkBackendStatus()}
            disabled={isCheckingHealth}
            title={
              backendOnline
                ? 'Backend connected and responsive. Click to re-ping cluster.'
                : 'Backend unreachable. Click to re-test connection.'
            }
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11.5,
              fontFamily: "var(--font-mono)",
              color: backendOnline ? '#34D399' : '#F87171',
              background: backendOnline
                ? 'rgba(52, 211, 153, 0.12)'
                : 'rgba(239, 68, 68, 0.12)',
              border: `1.5px solid var(--border-bold)`,
              padding: '4px 10px',
              borderRadius: 9999,
              cursor: isCheckingHealth ? 'wait' : 'pointer',
              transition: 'all 0.2s ease',
              outline: 'none',
            }}
          >
            {isCheckingHealth ? (
              <RefreshCw size={11} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: backendOnline ? '#34D399' : '#F87171',
                  boxShadow: backendOnline ? '0 0 8px #34D399' : 'none',
                  flexShrink: 0,
                }}
              />
            )}
            <span>
              {isCheckingHealth
                ? 'PINGING CLUSTER...'
                : backendOnline
                ? `CLUSTER ONLINE [${latencyMs ?? 38}ms]`
                : 'BACKEND OFFLINE · RETRY'}
            </span>
          </button>

          {/* User Profile / Auth State */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '5px 12px',
                  borderRadius: 6,
                  background: 'var(--bg-card)',
                  border: '1.5px solid var(--border-bold)',
                  fontSize: 12.5,
                  color: 'var(--text-primary)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: 'var(--accent-blue)',
                  }}
                />
                <span style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.email}
                </span>
              </div>

              <button
                onClick={logout}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: 6,
                  borderRadius: 6,
                  transition: 'color 0.15s ease',
                }}
                onMouseOver={(e) => (e.currentTarget.style.color = '#EF4444')}
                onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                title="Log out"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'var(--bg-card)',
                border: '1.5px solid var(--border-bold)',
                color: 'var(--text-primary)',
                padding: '6px 14px',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: 'var(--shadow-sm)',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-blue)'
                e.currentTarget.style.background = 'var(--bg-hover)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-bold)'
                e.currentTarget.style.background = 'var(--bg-card)'
              }}
            >
              <LogIn size={14} />
              <span>Sign In / Register</span>
            </button>
          )}
        </div>
      </header>

      {/* ─── Dashboard Main Body ────────────────────────────────────── */}
      <main
        style={{
          flex: 1,
          maxWidth: 1320,
          width: '100%',
          margin: '0 auto',
          padding: '40px 24px 80px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Title & Telemetry Counters */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            marginBottom: 32,
            flexWrap: 'wrap',
            gap: 20,
            borderBottom: '1.5px solid var(--border-bold)',
            paddingBottom: 24,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11.5,
                fontFamily: "var(--font-mono)",
                color: 'var(--accent-blue)',
                marginBottom: 6,
                letterSpacing: '0.05em',
                fontWeight: 600,
              }}
            >
              § 01 / CORPUS REPOSITORY
            </div>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 'clamp(26px, 3.2vw, 36px)',
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: 0,
                letterSpacing: '-0.025em',
              }}
            >
              Active Research Notebooks
            </h1>
          </div>

          {/* Quick Metrics Strip */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: 'var(--bg-card)',
                border: '1.5px solid var(--border-bold)',
                borderRadius: 8,
                padding: '8px 16px',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <BookOpen size={16} color="var(--accent-blue)" />
              <div>
                <div style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: 'var(--text-muted)' }}>
                  NOTEBOOKS
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "var(--font-mono)" }}>
                  {notebooks.length}
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: 'var(--bg-card)',
                border: '1.5px solid var(--border-bold)',
                borderRadius: 8,
                padding: '8px 16px',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <FileText size={16} color="#34D399" />
              <div>
                <div style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: 'var(--text-muted)' }}>
                  DOCUMENTS
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "var(--font-mono)" }}>
                  {totalDocs}
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: 'var(--bg-card)',
                border: '1.5px solid var(--border-bold)',
                borderRadius: 8,
                padding: '8px 16px',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <Activity size={16} color="#818CF8" />
              <div>
                <div style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: 'var(--text-muted)' }}>
                  AST NODES
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "var(--font-mono)" }}>
                  {totalNodes}
                </div>
              </div>
            </div>

            <button
              onClick={() => setCreateModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'var(--accent-blue)',
                color: '#08090C',
                padding: '11px 20px',
                borderRadius: 8,
                fontSize: 13.5,
                fontWeight: 600,
                border: '1.5px solid var(--border-bold)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.25)',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.opacity = '0.9'
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.opacity = '1'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <Plus size={16} />
              <span>New Notebook</span>
              <span
                style={{
                  fontSize: 10.5,
                  padding: '2px 5px',
                  borderRadius: 4,
                  background: 'rgba(0, 0, 0, 0.15)',
                  fontFamily: "var(--font-mono)",
                  fontWeight: 700,
                }}
              >
                N
              </span>
            </button>
          </div>
        </div>

        {/* ─── Control Bar: Search & Focus Filters ─────────────────────── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 28,
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          {/* Search Box */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'var(--bg-card)',
              border: '1.5px solid var(--border-bold)',
              borderRadius: 8,
              padding: '8px 14px',
              minWidth: 280,
              maxWidth: 420,
              flex: 1,
              transition: 'border-color 0.15s ease',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <Search size={15} color="var(--text-muted)" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search notebooks by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: 13.5,
                outline: 'none',
                width: '100%',
                fontFamily: "var(--font-body)",
              }}
            />
            <span
              style={{
                fontSize: 10.5,
                fontFamily: "var(--font-mono)",
                color: 'var(--text-muted)',
                background: 'var(--bg-panel)',
                padding: '2px 6px',
                borderRadius: 4,
                border: '1px solid var(--border-bold)',
              }}
            >
              /
            </span>
          </div>

          {/* Focus Mode Filter Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <button
              onClick={() => setSelectedFocus('all-view')}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                fontSize: 12,
                fontFamily: "var(--font-mono)",
                cursor: 'pointer',
                border: '1.5px solid',
                transition: 'all 0.15s ease',
                background: selectedFocus === 'all-view' ? 'rgba(56, 189, 248, 0.15)' : 'var(--bg-card)',
                borderColor:
                  selectedFocus === 'all-view' ? 'var(--accent-blue)' : 'var(--border-bold)',
                color: selectedFocus === 'all-view' ? 'var(--accent-blue)' : 'var(--text-secondary)',
                fontWeight: selectedFocus === 'all-view' ? 600 : 400,
              }}
            >
              All ({notebooks.length})
            </button>

            {(['academic', 'code', 'finance', 'images'] as FocusMode[]).map((f) => {
              const count = notebooks.filter((n) => n.focus === f).length
              const isActive = selectedFocus === f
              return (
                <button
                  key={f}
                  onClick={() => setSelectedFocus(f)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontFamily: "var(--font-mono)",
                    cursor: 'pointer',
                    border: '1.5px solid',
                    textTransform: 'capitalize',
                    transition: 'all 0.15s ease',
                    background: isActive ? 'rgba(56, 189, 248, 0.15)' : 'var(--bg-card)',
                    borderColor: isActive ? 'var(--accent-blue)' : 'var(--border-bold)',
                    color: isActive ? 'var(--accent-blue)' : 'var(--text-secondary)',
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  {f} ({count})
                </button>
              )
            })}
          </div>

          {/* View Mode Toggle: Grid vs Table */}
          <div
            style={{
              display: 'flex',
              background: 'var(--bg-card)',
              border: '1.5px solid var(--border-bold)',
              borderRadius: 8,
              padding: 3,
            }}
          >
            <button
              onClick={() => setViewMode('grid')}
              style={{
                padding: '6px 10px',
                borderRadius: 6,
                border: 'none',
                background: viewMode === 'grid' ? 'var(--bg-hover)' : 'transparent',
                color: viewMode === 'grid' ? 'var(--accent-blue)' : 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                transition: 'all 0.15s ease',
              }}
              title="Bento Grid View"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              style={{
                padding: '6px 10px',
                borderRadius: 6,
                border: 'none',
                background: viewMode === 'table' ? 'var(--bg-hover)' : 'transparent',
                color: viewMode === 'table' ? 'var(--accent-blue)' : 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                transition: 'all 0.15s ease',
              }}
              title="Dense Table View"
            >
              <List size={15} />
            </button>
          </div>
        </div>

        {/* ─── Starter Research Sandboxes (1-Click Launch) ──────────────── */}
        {filteredNotebooks.length === 0 && searchQuery === '' && (
          <div style={{ marginBottom: 36 }}>
            <div
              style={{
                fontSize: 11,
                fontFamily: "var(--font-mono)",
                color: '#64748B',
                marginBottom: 12,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              Curated Research Sandboxes (Instant Launch)
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: 16,
              }}
            >
              {STARTER_SANDBOXES.map((s) => (
                <div
                  key={s.id}
                  onClick={() => handleLaunchStarter(s.id)}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1.5px solid var(--border-bold)',
                    borderRadius: 12,
                    padding: 24,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent-blue)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 12px 28px rgba(0, 0, 0, 0.4)'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-bold)'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 12,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10.5,
                        fontFamily: "var(--font-mono)",
                        color: 'var(--accent-blue)',
                        background: 'rgba(56, 189, 248, 0.12)',
                        padding: '3px 8px',
                        borderRadius: 4,
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        fontWeight: 600,
                      }}
                    >
                      {s.badge}
                    </span>
                    <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: '#34D399', fontWeight: 600 }}>
                      {s.docCount} DOCS · {s.nodeCount} NODES
                    </span>
                  </div>

                  <h3
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: 17,
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      margin: '0 0 8px',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {s.title}
                  </h3>

                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 16px' }}>
                    {s.desc}
                  </p>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 12,
                      fontFamily: "var(--font-mono)",
                      fontWeight: 600,
                      color: 'var(--accent-blue)',
                    }}
                  >
                    <span>LAUNCH SANDBOX [ → ]</span>
                    <ArrowRight size={13} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Notebook Display: Grid vs Table ─────────────────────────── */}
        {filteredNotebooks.length === 0 && searchQuery !== '' ? (
          <div
            style={{
              padding: '60px 24px',
              textAlign: 'center',
              background: 'var(--bg-card)',
              border: '1.5px solid var(--border-bold)',
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
            }}
          >
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: '0 0 12px' }}>
              No notebooks matched "{searchQuery}"
            </p>
            <button
              onClick={() => setSearchQuery('')}
              style={{
                fontSize: 12,
                fontFamily: "var(--font-mono)",
                color: 'var(--accent-blue)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textDecoration: 'underline',
                fontWeight: 600,
              }}
            >
              [ CLEAR SEARCH FILTER ]
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* ── Bento Grid View ── */
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 20,
            }}
          >
            {filteredNotebooks.map((nb) => {
              const FocusIcon = FOCUS_ICON_MAP[nb.focus || 'all'] || Globe
              const isRenaming = editingId === nb.id

              return (
                <div
                  key={nb.id}
                  onClick={() => handleOpenNotebook(nb.id)}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1.5px solid var(--border-bold)',
                    borderRadius: 12,
                    padding: 24,
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent-blue)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 12px 28px rgba(0, 0, 0, 0.4)'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-bold)'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.2)'
                  }}
                >
                  <div>
                    {/* Header Row: Focus Tag & Action Icons */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 16,
                      }}
                    >
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: 10.5,
                          fontFamily: "var(--font-mono)",
                          color: 'var(--text-secondary)',
                          background: 'var(--bg-panel)',
                          border: '1px solid var(--border-bold)',
                          padding: '3px 8px',
                          borderRadius: 4,
                          textTransform: 'uppercase',
                          fontWeight: 600,
                        }}
                      >
                        <FocusIcon size={12} color="var(--accent-blue)" />
                        <span>{nb.focus || 'all'}</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button
                          onClick={(e) => startRename(e, nb)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: 4,
                            borderRadius: 4,
                            transition: 'color 0.15s',
                          }}
                          onMouseOver={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                          onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                          title="Rename Notebook"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, nb)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: 4,
                            borderRadius: 4,
                            transition: 'color 0.15s',
                          }}
                          onMouseOver={(e) => (e.currentTarget.style.color = '#EF4444')}
                          onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                          title="Delete Notebook"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Title with Inline Rename Support */}
                    {isRenaming ? (
                      <form
                        onSubmit={(e) => saveRename(e, nb.id)}
                        onClick={(e) => e.stopPropagation()}
                        style={{ display: 'flex', gap: 6, marginBottom: 10 }}
                      >
                        <input
                          autoFocus
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          style={{
                            flex: 1,
                            padding: '6px 10px',
                            borderRadius: 6,
                            background: 'var(--bg-input)',
                            border: '1.5px solid var(--accent-blue)',
                            color: 'var(--text-primary)',
                            fontSize: 15,
                            fontFamily: "var(--font-display)",
                            fontWeight: 600,
                            outline: 'none',
                          }}
                        />
                        <button
                          type="submit"
                          style={{
                            background: 'var(--accent-blue)',
                            color: '#08090C',
                            border: 'none',
                            borderRadius: 6,
                            padding: '6px 10px',
                            cursor: 'pointer',
                            fontWeight: 600,
                          }}
                        >
                          <Check size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingId(null)
                          }}
                          style={{
                            background: 'var(--bg-panel)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-bold)',
                            borderRadius: 6,
                            padding: '6px 10px',
                            cursor: 'pointer',
                          }}
                        >
                          <X size={14} />
                        </button>
                      </form>
                    ) : (
                      <h3
                        style={{
                          fontFamily: "var(--font-display)",
                          fontSize: 18,
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                          margin: '0 0 8px',
                          letterSpacing: '-0.015em',
                        }}
                      >
                        {nb.title}
                      </h3>
                    )}

                    <p
                      style={{
                        fontSize: 13,
                        color: 'var(--text-secondary)',
                        lineHeight: 1.5,
                        margin: '0 0 20px',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {nb.description || 'Isolated research corpus with hierarchical document outlines.'}
                    </p>
                  </div>

                  {/* Card Footer: Metadata & Open Button */}
                  <div
                    style={{
                      paddingTop: 16,
                      borderTop: '1px solid var(--border-bold)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: 11.5,
                      fontFamily: "var(--font-mono)",
                      color: 'var(--text-muted)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{nb.documents?.length || nb.document_count || 0} Docs</span>
                      <span>·</span>
                      <span>{nb.conversation_count || 0} Threads</span>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        color: 'var(--accent-blue)',
                        fontWeight: 600,
                      }}
                    >
                      <span>OPEN [ → ]</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* ── Dense Table View ── */
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1.5px solid var(--border-bold)',
              borderRadius: 12,
              overflow: 'hidden',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
            }}
          >
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
                fontSize: 13.5,
              }}
            >
              <thead>
                <tr
                  style={{
                    background: 'var(--bg-panel)',
                    borderBottom: '1.5px solid var(--border-bold)',
                    fontSize: 10.5,
                    fontFamily: "var(--font-mono)",
                    color: 'var(--text-muted)',
                    letterSpacing: '0.04em',
                  }}
                >
                  <th style={{ padding: '14px 20px', fontWeight: 600 }}>TITLE & SCOPE</th>
                  <th style={{ padding: '14px 16px', fontWeight: 500 }}>FOCUS</th>
                  <th style={{ padding: '14px 16px', fontWeight: 500 }}>DOCS</th>
                  <th style={{ padding: '14px 16px', fontWeight: 500 }}>THREADS</th>
                  <th style={{ padding: '14px 16px', fontWeight: 500 }}>CREATED</th>
                  <th style={{ padding: '14px 20px', fontWeight: 500, textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredNotebooks.map((nb, idx) => (
                  <tr
                    key={nb.id}
                    onClick={() => handleOpenNotebook(nb.id)}
                    style={{
                      borderBottom:
                        idx < filteredNotebooks.length - 1
                          ? '1px solid var(--border)'
                          : 'none',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                    onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{nb.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {nb.description || 'No description provided'}
                      </div>
                    </td>
                    <td style={{ padding: '16px 16px' }}>
                      <span
                        style={{
                          fontSize: 10.5,
                          fontFamily: "var(--font-mono)",
                          background: 'var(--bg-panel)',
                          color: 'var(--accent-blue)',
                          padding: '2px 7px',
                          borderRadius: 4,
                          textTransform: 'uppercase',
                          fontWeight: 600,
                          border: '1px solid rgba(56, 189, 248, 0.25)',
                        }}
                      >
                        {nb.focus || 'all'}
                      </span>
                    </td>
                    <td style={{ padding: '16px 16px', fontFamily: "var(--font-mono)", color: 'var(--text-primary)', fontWeight: 600 }}>
                      {nb.documents?.length || nb.document_count || 0}
                    </td>
                    <td style={{ padding: '16px 16px', fontFamily: "var(--font-mono)", color: 'var(--text-secondary)' }}>
                      {nb.conversation_count || 0}
                    </td>
                    <td style={{ padding: '16px 16px', fontSize: 12, color: 'var(--text-secondary)', fontFamily: "var(--font-mono)" }}>
                      {formatRelativeTime(nb.createdAt)}
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleOpenNotebook(nb.id)
                        }}
                        style={{
                          background: 'var(--bg-panel)',
                          color: 'var(--text-primary)',
                          border: '1.5px solid var(--border-bold)',
                          borderRadius: 6,
                          padding: '5px 12px',
                          fontSize: 11.5,
                          fontFamily: "var(--font-mono)",
                          fontWeight: 600,
                          cursor: 'pointer',
                          marginRight: 8,
                          transition: 'all 0.15s',
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--accent-blue)')}
                        onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border-bold)')}
                      >
                        OPEN [ → ]
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, nb)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: 5,
                          transition: 'color 0.15s',
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.color = '#EF4444')}
                        onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                        title="Delete Notebook"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Modals */}
      <CreateNotebookModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreate={async (title, description, focus) => {
          const newNb = await createNotebook(title, description, focus)
          setActiveNotebookId(newNb.id)
          onSelectNotebook(newNb.id)
        }}
      />

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  )
}
