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
  } = useSearchStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFocus, setSelectedFocus] = useState<FocusMode | 'all-view'>('all-view')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)

  // Inline rename state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')

  const searchInputRef = useRef<HTMLInputElement>(null)

  // Keyboard shortcut '/' to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault()
        searchInputRef.current?.focus()
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
        background: '#0b0d11',
        color: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        position: 'relative',
      }}
    >
      {/* Precision Hairline Background Grid */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(255, 255, 255, 0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.025) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* ─── Control Header ─────────────────────────────────────────── */}
      <header
        style={{
          height: 72,
          background: 'rgba(11, 13, 17, 0.92)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
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
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#94a3b8',
              padding: '6px 12px',
              borderRadius: 6,
              fontSize: 12.5,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.color = '#f8fafc'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.color = '#94a3b8'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
            }}
            title="Return to Public Landing Page"
          >
            <ArrowLeft size={14} />
            <span>Landing</span>
          </button>

          <div style={{ height: 20, width: 1, background: 'rgba(255, 255, 255, 0.1)' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/logo.png" alt="RA-Graph" style={{ width: 26, height: 26, objectFit: 'contain' }} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.02em' }}>
                  Researcher Workspaces
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontFamily: "'JetBrains Mono', monospace",
                    color: '#38bdf8',
                    background: 'rgba(56, 189, 248, 0.1)',
                    padding: '2px 6px',
                    borderRadius: 3,
                  }}
                >
                  ENGINE v5.2
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Engine Telemetry & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Live Ping Status Indicator */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              fontSize: 12,
              fontFamily: "'JetBrains Mono', monospace",
              color: '#64748b',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              padding: '6px 12px',
              borderRadius: 6,
            }}
            className="hidden md:flex"
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: backendOnline ? '#34d399' : '#f59e0b',
                boxShadow: backendOnline ? '0 0 8px #34d399' : 'none',
              }}
            />
            <span style={{ color: backendOnline ? '#cbd5e1' : '#f59e0b' }}>
              {backendOnline ? 'ENGINE READY · 38ms' : 'CONNECTING...'}
            </span>
          </div>

          {/* New Notebook CTA */}
          <button
            onClick={() => setCreateModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: '#f8fafc',
              color: '#0b0d11',
              padding: '8px 16px',
              borderRadius: 6,
              fontWeight: 600,
              fontSize: 13,
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: '0 2px 10px rgba(255, 255, 255, 0.1)',
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = '#ffffff')}
            onMouseOut={(e) => (e.currentTarget.style.background = '#f8fafc')}
          >
            <Plus size={15} />
            <span>New Notebook</span>
          </button>

          {/* User Profile / Logout */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12.5, color: '#94a3b8' }} className="hidden lg:inline">
                {user.email}
              </span>
              <button
                onClick={logout}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#94a3b8',
                  padding: '7px 11px',
                  borderRadius: 6,
                  fontSize: 12.5,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.color = '#ef4444')}
                onMouseOut={(e) => (e.currentTarget.style.color = '#94a3b8')}
                title="Sign out"
              >
                <LogOut size={13} />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                color: '#38bdf8',
                padding: '7px 13px',
                borderRadius: 6,
                fontSize: 12.5,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(56, 189, 248, 0.18)')}
              onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(56, 189, 248, 0.1)')}
            >
              <LogIn size={13} />
              <span>Sign In to Save</span>
            </button>
          )}
        </div>
      </header>

      {/* ─── Main Content Canvas ──────────────────────────────────────── */}
      <main
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 1320,
          width: '100%',
          margin: '0 auto',
          padding: '36px 32px 80px',
          display: 'flex',
          flexDirection: 'column',
          gap: 32,
        }}
      >
        {/* ─── Telemetry Overview Band ─────────────────────────────────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16,
            background: '#13161c',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 10,
            padding: '16px 20px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
          }}
        >
          <div>
            <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: '#64748b' }}>
              RESEARCH NOTEBOOKS
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#f8fafc', marginTop: 2 }}>
              {notebooks.length}{' '}
              <span style={{ fontSize: 12, fontWeight: 400, color: '#94a3b8' }}>
                workspace{notebooks.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: '#64748b' }}>
              INDEXED DOCUMENTS
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#38bdf8', marginTop: 2 }}>
              {totalDocs}{' '}
              <span style={{ fontSize: 12, fontWeight: 400, color: '#94a3b8' }}>files</span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: '#64748b' }}>
              AST TREE NODES
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#34d399', marginTop: 2 }}>
              {totalNodes > 0 ? totalNodes : 'Active'}{' '}
              <span style={{ fontSize: 12, fontWeight: 400, color: '#94a3b8' }}>semantic blocks</span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: '#64748b' }}>
              RETRIEVAL PROFILE
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#818cf8', marginTop: 2 }}>
              Dual-Path RRF <span style={{ fontSize: 12, fontWeight: 400, color: '#94a3b8' }}>k=3</span>
            </div>
          </div>
        </div>

        {/* ─── Starter Sandboxes Section (if < 3 notebooks) ───────────── */}
        {notebooks.length < 3 && (
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 12,
                fontFamily: "'JetBrains Mono', monospace",
                color: '#64748b',
                marginBottom: 12,
                textTransform: 'uppercase',
              }}
            >
              <Compass size={14} color="#38bdf8" />
              <span>Recommended Pre-Parsed Research Sandboxes</span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: 16,
              }}
            >
              {STARTER_SANDBOXES.map((sb) => (
                <div
                  key={sb.id}
                  onClick={() => handleLaunchStarter(sb.id)}
                  style={{
                    background: 'rgba(56, 189, 248, 0.03)',
                    border: '1px solid rgba(56, 189, 248, 0.2)',
                    borderRadius: 10,
                    padding: '18px 20px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.5)'
                    e.currentTarget.style.background = 'rgba(56, 189, 248, 0.06)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.2)'
                    e.currentTarget.style.background = 'rgba(56, 189, 248, 0.03)'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 10,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 10.5,
                          fontFamily: "'JetBrains Mono', monospace",
                          background: 'rgba(56, 189, 248, 0.15)',
                          color: '#38bdf8',
                          padding: '2px 7px',
                          borderRadius: 3,
                          fontWeight: 600,
                        }}
                      >
                        {sb.badge}
                      </span>
                      <span style={{ fontSize: 12, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: 4 }}>
                        Launch Sandbox <ArrowRight size={13} />
                      </span>
                    </div>

                    <h4 style={{ fontSize: 15.5, fontWeight: 600, color: '#f8fafc', margin: '0 0 6px' }}>
                      {sb.title}
                    </h4>
                    <p style={{ fontSize: 13, color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                      {sb.desc}
                    </p>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      marginTop: 16,
                      paddingTop: 12,
                      borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                      fontSize: 11.5,
                      fontFamily: "'JetBrains Mono', monospace",
                      color: '#64748b',
                    }}
                  >
                    <span>{sb.docCount} DOCUMENTS</span>
                    <span>·</span>
                    <span>{sb.nodeCount} TREE NODES</span>
                    <span>·</span>
                    <span style={{ color: '#34d399' }}>✓ CITATIONS READY</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Search, Filter Pills & View Mode Bar ──────────────────── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            paddingBottom: 18,
          }}
        >
          {/* Category Filter Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={() => setSelectedFocus('all-view')}
              style={{
                padding: '6px 14px',
                borderRadius: 4,
                fontSize: 12.5,
                fontFamily: "'JetBrains Mono', monospace",
                background: selectedFocus === 'all-view' ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)',
                color: selectedFocus === 'all-view' ? '#0b0d11' : '#94a3b8',
                border:
                  selectedFocus === 'all-view'
                    ? '1px solid #f8fafc'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                cursor: 'pointer',
                fontWeight: 600,
                transition: 'all 0.15s',
              }}
            >
              ALL WORKSPACES ({notebooks.length})
            </button>

            <button
              onClick={() => setSelectedFocus('academic')}
              style={{
                padding: '6px 14px',
                borderRadius: 4,
                fontSize: 12.5,
                fontFamily: "'JetBrains Mono', monospace",
                background: selectedFocus === 'academic' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                color: selectedFocus === 'academic' ? '#38bdf8' : '#94a3b8',
                border:
                  selectedFocus === 'academic'
                    ? '1px solid rgba(56, 189, 248, 0.4)'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                cursor: 'pointer',
                fontWeight: 500,
                transition: 'all 0.15s',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <GraduationCap size={13} />
              <span>ACADEMIC</span>
            </button>

            <button
              onClick={() => setSelectedFocus('code')}
              style={{
                padding: '6px 14px',
                borderRadius: 4,
                fontSize: 12.5,
                fontFamily: "'JetBrains Mono', monospace",
                background: selectedFocus === 'code' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                color: selectedFocus === 'code' ? '#38bdf8' : '#94a3b8',
                border:
                  selectedFocus === 'code'
                    ? '1px solid rgba(56, 189, 248, 0.4)'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                cursor: 'pointer',
                fontWeight: 500,
                transition: 'all 0.15s',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Code2 size={13} />
              <span>SYSTEMS</span>
            </button>

            <button
              onClick={() => setSelectedFocus('finance')}
              style={{
                padding: '6px 14px',
                borderRadius: 4,
                fontSize: 12.5,
                fontFamily: "'JetBrains Mono', monospace",
                background: selectedFocus === 'finance' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                color: selectedFocus === 'finance' ? '#38bdf8' : '#94a3b8',
                border:
                  selectedFocus === 'finance'
                    ? '1px solid rgba(56, 189, 248, 0.4)'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                cursor: 'pointer',
                fontWeight: 500,
                transition: 'all 0.15s',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <LineChart size={13} />
              <span>10-K / FINANCIAL</span>
            </button>
          </div>

          {/* Search Input & View Mode Toggles */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Search Input */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: '#13161c',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 6,
                padding: '7px 12px',
                width: 260,
              }}
            >
              <Search size={14} style={{ color: '#64748b' }} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Filter workspaces (press /)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#f8fafc',
                  fontSize: 13,
                  width: '100%',
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ background: 'none', border: 'none', padding: 0, color: '#64748b', cursor: 'pointer' }}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* View Mode Toggle: Grid vs Table */}
            <div
              style={{
                display: 'flex',
                background: '#13161c',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 6,
                padding: 2,
              }}
            >
              <button
                onClick={() => setViewMode('grid')}
                style={{
                  padding: '6px 8px',
                  borderRadius: 4,
                  background: viewMode === 'grid' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                  color: viewMode === 'grid' ? '#38bdf8' : '#64748b',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="Bento Grid View"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                onClick={() => setViewMode('table')}
                style={{
                  padding: '6px 8px',
                  borderRadius: 4,
                  background: viewMode === 'table' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                  color: viewMode === 'table' ? '#38bdf8' : '#64748b',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="Dense Ledger Table View"
              >
                <List size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* ─── Notebooks List Display (Empty State / Grid / Table) ───── */}
        {filteredNotebooks.length === 0 ? (
          /* Architectural Blueprint Empty State */
          <div
            style={{
              background: '#13161c',
              border: '1px dashed rgba(255, 255, 255, 0.15)',
              borderRadius: 12,
              padding: '64px 24px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 8,
                background: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BookOpen size={24} />
            </div>

            <div style={{ maxWidth: 440 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#f8fafc', margin: '0 0 8px' }}>
                {searchQuery ? 'No Matching Workspaces' : 'No Research Notebooks Initialized'}
              </h3>
              <p style={{ fontSize: 13.5, color: '#94a3b8', margin: 0, lineHeight: 1.6 }}>
                {searchQuery
                  ? `No notebook titles or descriptions matched "${searchQuery}". Clear query or initialize a new workspace.`
                  : 'Create a dedicated notebook to ingest technical PDFs, induce semantic AST trees, and run grounded multi-path queries.'}
              </p>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    padding: '9px 18px',
                    borderRadius: 6,
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#f8fafc',
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  Clear Search
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setCreateModalOpen(true)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '9px 20px',
                      borderRadius: 6,
                      background: '#f8fafc',
                      color: '#0b0d11',
                      fontSize: 13.5,
                      fontWeight: 600,
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <Plus size={15} />
                    <span>Create Notebook</span>
                  </button>
                  <button
                    onClick={() => handleLaunchStarter('tree-rag-demo')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '9px 18px',
                      borderRadius: 6,
                      background: 'rgba(56, 189, 248, 0.1)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      color: '#38bdf8',
                      fontSize: 13,
                      cursor: 'pointer',
                    }}
                  >
                    <Sparkles size={14} />
                    <span>Open Sample Sandbox</span>
                  </button>
                </>
              )}
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          /* Bento Binder Matrix Grid */
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 20,
            }}
          >
            {/* New Notebook Blank Tile */}
            <div
              onClick={() => setCreateModalOpen(true)}
              style={{
                background: '#0e1117',
                border: '1px dashed rgba(255, 255, 255, 0.15)',
                borderRadius: 10,
                padding: '24px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                minHeight: 220,
                textAlign: 'center',
                transition: 'all 0.15s ease',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.5)'
                e.currentTarget.style.background = 'rgba(56, 189, 248, 0.03)'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'
                e.currentTarget.style.background = '#0e1117'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 8,
                  background: 'rgba(56, 189, 248, 0.1)',
                  color: '#38bdf8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Plus size={20} />
              </div>
              <div>
                <div style={{ fontSize: 14.5, fontWeight: 600, color: '#f8fafc' }}>
                  Initialize New Workspace
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                  Upload PDFs, DOCX, or research papers
                </div>
              </div>
            </div>

            {/* Individual Notebook Binders */}
            {filteredNotebooks.map((nb) => {
              const docCount = nb.documents?.length || 0
              const nodeCount = nb.documents?.reduce((acc, d) => acc + (d.node_count || 0), 0) || 0
              const FocusIcon = FOCUS_ICON_MAP[nb.focus || 'all'] || Globe
              const isEditing = editingId === nb.id

              return (
                <div
                  key={nb.id}
                  onClick={() => handleOpenNotebook(nb.id)}
                  style={{
                    background: '#13161c',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 10,
                    padding: '22px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: 220,
                    position: 'relative',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.35)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.45)'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.3)'
                  }}
                >
                  {/* Card Header: Focus Tag & Menu Actions */}
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 12,
                      }}
                    >
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          fontSize: 11,
                          fontFamily: "'JetBrains Mono', monospace",
                          color: '#38bdf8',
                          background: 'rgba(56, 189, 248, 0.1)',
                          padding: '3px 8px',
                          borderRadius: 4,
                          textTransform: 'uppercase',
                        }}
                      >
                        <FocusIcon size={12} />
                        <span>{nb.focus || 'GENERAL'}</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => startRename(e, nb)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#64748b',
                            cursor: 'pointer',
                            padding: 4,
                            borderRadius: 4,
                            transition: 'color 0.15s',
                          }}
                          onMouseOver={(e) => (e.currentTarget.style.color = '#38bdf8')}
                          onMouseOut={(e) => (e.currentTarget.style.color = '#64748b')}
                          title="Rename notebook"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, nb)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#64748b',
                            cursor: 'pointer',
                            padding: 4,
                            borderRadius: 4,
                            transition: 'color 0.15s',
                          }}
                          onMouseOver={(e) => (e.currentTarget.style.color = '#ef4444')}
                          onMouseOut={(e) => (e.currentTarget.style.color = '#64748b')}
                          title="Delete notebook"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Inline Rename Form or Display Title */}
                    {isEditing ? (
                      <form
                        onSubmit={(e) => saveRename(e, nb.id)}
                        onClick={(e) => e.stopPropagation()}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}
                      >
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          autoFocus
                          style={{
                            flex: 1,
                            padding: '4px 8px',
                            background: '#0b0d11',
                            border: '1px solid #38bdf8',
                            borderRadius: 4,
                            color: '#f8fafc',
                            fontSize: 14,
                            outline: 'none',
                          }}
                        />
                        <button
                          type="submit"
                          style={{
                            background: '#38bdf8',
                            border: 'none',
                            color: '#0b0d11',
                            borderRadius: 4,
                            padding: '5px',
                            cursor: 'pointer',
                          }}
                        >
                          <Check size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#64748b',
                            borderRadius: 4,
                            padding: '5px',
                            cursor: 'pointer',
                          }}
                        >
                          <X size={13} />
                        </button>
                      </form>
                    ) : (
                      <h4
                        style={{
                          fontSize: 16,
                          fontWeight: 600,
                          color: '#f8fafc',
                          margin: '0 0 6px',
                          lineHeight: 1.35,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {nb.title}
                      </h4>
                    )}

                    {/* Description preview */}
                    {nb.description && !isEditing && (
                      <p
                        style={{
                          fontSize: 12.5,
                          color: '#94a3b8',
                          margin: 0,
                          lineHeight: 1.5,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {nb.description}
                      </p>
                    )}
                  </div>

                  {/* Card Bottom: Metadata & Open Link */}
                  <div
                    style={{
                      marginTop: 18,
                      paddingTop: 12,
                      borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: 11.5,
                      fontFamily: "'JetBrains Mono', monospace",
                      color: '#64748b',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <FileText size={12} color="#38bdf8" />
                      <span>{docCount} DOCS</span>
                      {nodeCount > 0 && <span>· {nodeCount} NODES</span>}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Clock size={11} />
                      <span>{formatRelativeTime(new Date(nb.updatedAt))}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* Dense Ledger Table View */
          <div
            style={{
              background: '#13161c',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 10,
              overflowX: 'auto',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.3)',
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
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    background: 'rgba(11, 13, 17, 0.75)',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11.5,
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  <th style={{ padding: '14px 20px', width: '35%' }}>Workspace Title & Scope</th>
                  <th style={{ padding: '14px 18px', width: '15%' }}>Focus Profile</th>
                  <th style={{ padding: '14px 18px', width: '12%' }}>Documents</th>
                  <th style={{ padding: '14px 18px', width: '12%' }}>AST Nodes</th>
                  <th style={{ padding: '14px 18px', width: '14%' }}>Last Modified</th>
                  <th style={{ padding: '14px 20px', width: '12%', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredNotebooks.map((nb, idx) => {
                  const docCount = nb.documents?.length || 0
                  const nodeCount = nb.documents?.reduce((acc, d) => acc + (d.node_count || 0), 0) || 0
                  const FocusIcon = FOCUS_ICON_MAP[nb.focus || 'all'] || Globe

                  return (
                    <tr
                      key={nb.id}
                      onClick={() => handleOpenNotebook(nb.id)}
                      style={{
                        borderBottom:
                          idx !== filteredNotebooks.length - 1
                            ? '1px solid rgba(255, 255, 255, 0.05)'
                            : 'none',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.025)'
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'transparent'
                      }}
                    >
                      {/* Title & Description */}
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ fontWeight: 600, color: '#f8fafc' }}>
                          {nb.title}
                        </div>
                        {nb.description && (
                          <div
                            style={{
                              fontSize: 12,
                              color: '#64748b',
                              marginTop: 2,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: 380,
                            }}
                          >
                            {nb.description}
                          </div>
                        )}
                      </td>

                      {/* Focus Profile */}
                      <td style={{ padding: '14px 18px' }}>
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            fontSize: 11,
                            fontFamily: "'JetBrains Mono', monospace",
                            color: '#38bdf8',
                            background: 'rgba(56, 189, 248, 0.1)',
                            padding: '3px 8px',
                            borderRadius: 4,
                          }}
                        >
                          <FocusIcon size={12} />
                          <span style={{ textTransform: 'capitalize' }}>{nb.focus || 'All'}</span>
                        </div>
                      </td>

                      {/* Documents */}
                      <td
                        style={{
                          padding: '14px 18px',
                          fontFamily: "'JetBrains Mono', monospace",
                          color: '#cbd5e1',
                        }}
                      >
                        {docCount} files
                      </td>

                      {/* AST Nodes */}
                      <td
                        style={{
                          padding: '14px 18px',
                          fontFamily: "'JetBrains Mono', monospace",
                          color: '#34d399',
                        }}
                      >
                        {nodeCount > 0 ? `${nodeCount} nodes` : '—'}
                      </td>

                      {/* Last Modified */}
                      <td
                        style={{
                          padding: '14px 18px',
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 12,
                          color: '#64748b',
                        }}
                      >
                        {formatRelativeTime(new Date(nb.updatedAt))}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <div
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => handleOpenNotebook(nb.id)}
                            style={{
                              padding: '5px 10px',
                              borderRadius: 4,
                              background: 'rgba(56, 189, 248, 0.1)',
                              border: '1px solid rgba(56, 189, 248, 0.25)',
                              color: '#38bdf8',
                              fontSize: 11.5,
                              fontFamily: "'JetBrains Mono', monospace",
                              cursor: 'pointer',
                            }}
                          >
                            OPEN →
                          </button>
                          <button
                            onClick={(e) => handleDelete(e, nb)}
                            style={{
                              padding: '5px',
                              borderRadius: 4,
                              background: 'transparent',
                              border: 'none',
                              color: '#64748b',
                              cursor: 'pointer',
                            }}
                            onMouseOver={(e) => (e.currentTarget.style.color = '#ef4444')}
                            onMouseOut={(e) => (e.currentTarget.style.color = '#64748b')}
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Create Notebook Modal */}
      <CreateNotebookModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreate={async (title, desc, focus) => {
          await createNotebook(title, desc, focus)
        }}
      />

      {/* Auth Modal for Sign In */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  )
}
