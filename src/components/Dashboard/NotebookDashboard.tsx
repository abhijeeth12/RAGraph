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
  LayoutGrid,
  List,
  AlertCircle,
  RefreshCw,
  LogOut,
  User,
  Star,
  Sparkles,
  Layers,
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

// 6 Signature Docket pastel palette colors from reference image
export interface DocketColor {
  id: string
  name: string
  bg: string
  text: string
  subtext: string
  badgeBg: string
  badgeText: string
  starColor?: string
}

export const DOCKET_COLORS: DocketColor[] = [
  {
    id: 'peach',
    name: 'Peach',
    bg: '#ff9f76',
    text: '#111827',
    subtext: 'rgba(17, 24, 39, 0.78)',
    badgeBg: '#111827',
    badgeText: '#ffffff',
  },
  {
    id: 'yellow',
    name: 'Amber Yellow',
    bg: '#fec868',
    text: '#111827',
    subtext: 'rgba(17, 24, 39, 0.78)',
    badgeBg: '#111827',
    badgeText: '#ffffff',
  },
  {
    id: 'coral',
    name: 'Coral Red',
    bg: '#ff8b70',
    text: '#111827',
    subtext: 'rgba(17, 24, 39, 0.78)',
    badgeBg: '#111827',
    badgeText: '#ffffff',
  },
  {
    id: 'purple',
    name: 'Lilac Purple',
    bg: '#a88beb',
    text: '#111827',
    subtext: 'rgba(17, 24, 39, 0.78)',
    badgeBg: '#111827',
    badgeText: '#ffffff',
    starColor: '#ffd700',
  },
  {
    id: 'lime',
    name: 'Lime Green',
    bg: '#d8f78f',
    text: '#111827',
    subtext: 'rgba(17, 24, 39, 0.78)',
    badgeBg: '#111827',
    badgeText: '#ffffff',
  },
  {
    id: 'cyan',
    name: 'Sky Cyan',
    bg: '#32d6f5',
    text: '#111827',
    subtext: 'rgba(17, 24, 39, 0.78)',
    badgeBg: '#111827',
    badgeText: '#ffffff',
  },
]

// Map notebook index to Docket color
function getNotebookDocketColor(index: number, notebookId?: string): DocketColor {
  if (notebookId) {
    let hash = 0
    for (let i = 0; i < notebookId.length; i++) {
      hash = (hash << 5) - hash + notebookId.charCodeAt(i)
      hash |= 0
    }
    return DOCKET_COLORS[Math.abs(hash) % DOCKET_COLORS.length]
  }
  return DOCKET_COLORS[index % DOCKET_COLORS.length]
}

// Format date nicely like "May 21, 2020" or fallback to relative
function formatDocketDate(dateVal?: string | Date): string {
  if (!dateVal) return 'Recently updated'
  try {
    const d = typeof dateVal === 'string' ? new Date(dateVal) : dateVal
    if (isNaN(d.getTime())) return String(dateVal)
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return String(dateVal)
  }
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
  const [selectedColorFilter, setSelectedColorFilter] = useState<string | null>(null)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Inline rename state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')

  // Delete confirmation dialog state
  const [deleteTarget, setDeleteTarget] = useState<Notebook | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Starred / pinned notebooks tracking (local state)
  const [starredIds, setStarredIds] = useState<Record<string, boolean>>({
    'nb-tree-rag': true,
  })

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
        if (selectedColorFilter) setSelectedColorFilter(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [editingId, deleteTarget, searchQuery, selectedColorFilter])

  // Reload notebooks on mount if user is logged in
  useEffect(() => {
    if (user) {
      loadNotebooks()
    }
  }, [user, loadNotebooks])

  // Filter notebooks by search query and color swatch filter
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

    if (selectedColorFilter) {
      result = result.filter((nb, idx) => {
        const color = getNotebookDocketColor(idx, nb.id)
        return color.id === selectedColorFilter
      })
    }

    return result
  }, [notebooks, searchQuery, selectedColorFilter])

  const handleOpenNotebook = (id: string) => {
    setActiveNotebookId(id)
    onSelectNotebook(id)
  }

  const toggleStar = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setStarredIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
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
        background: '#FFFFFF',
        color: '#111827',
        display: 'flex',
        fontFamily: "var(--font-body, 'Inter', -apple-system, BlinkMacSystemFont, sans-serif)",
        position: 'relative',
        overflowX: 'hidden',
      }}
    >
      {/* ─── 1. LEFT SIDEBAR (Docket Reference Layout) ───────────────────── */}
      <aside
        style={{
          width: 90,
          flexShrink: 0,
          background: '#FFFFFF',
          borderRight: '1px solid rgba(0, 0, 0, 0.07)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '28px 0 24px',
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 40,
          boxSizing: 'border-box',
        }}
      >
        {/* Top: Brand & Action Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          {/* Logo / Brand Name */}
          <button
            onClick={onBackToLanding}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 8px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textDecoration: 'none',
              transition: 'opacity 0.15s ease',
            }}
            onMouseOver={(e) => (e.currentTarget.style.opacity = '0.75')}
            onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
            title="Return to Landing Page"
          >
            <span
              style={{
                fontFamily: "var(--font-display, 'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif)",
                fontSize: 19,
                fontWeight: 800,
                color: '#111827',
                letterSpacing: '-0.04em',
                lineHeight: 1,
              }}
            >
              Docket
            </span>
          </button>

          {/* Prominent Black Circular Action Button (+) */}
          <button
            onClick={() => setCreateModalOpen(true)}
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: '#111827',
              color: '#FFFFFF',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              marginTop: 36,
              boxShadow: '0 6px 18px rgba(0, 0, 0, 0.14)',
              transition: 'transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.18s ease, background 0.18s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'scale(1.08)'
              e.currentTarget.style.boxShadow = '0 10px 24px rgba(0, 0, 0, 0.22)'
              e.currentTarget.style.background = '#000000'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.boxShadow = '0 6px 18px rgba(0, 0, 0, 0.14)'
              e.currentTarget.style.background = '#111827'
            }}
            title="New Notebook / Workspace (Press N)"
          >
            <Plus size={22} strokeWidth={2.6} />
          </button>

          {/* Vertical Stack of Signature Docket Pastel Dots */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
              marginTop: 28,
            }}
          >
            {DOCKET_COLORS.slice(0, 5).map((color) => {
              const isSelected = selectedColorFilter === color.id
              return (
                <button
                  key={color.id}
                  onClick={() => {
                    setSelectedColorFilter(isSelected ? null : color.id)
                  }}
                  style={{
                    width: 17,
                    height: 17,
                    borderRadius: '50%',
                    background: color.bg,
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    outline: 'none',
                    transform: isSelected ? 'scale(1.25)' : 'scale(1)',
                    boxShadow: isSelected
                      ? `0 0 0 2px #FFFFFF, 0 0 0 4px #111827, 0 4px 10px ${color.bg}88`
                      : '0 2px 4px rgba(0,0,0,0.06)',
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                  }}
                  onMouseOver={(e) => {
                    if (!isSelected) e.currentTarget.style.transform = 'scale(1.2)'
                  }}
                  onMouseOut={(e) => {
                    if (!isSelected) e.currentTarget.style.transform = 'scale(1)'
                  }}
                  title={isSelected ? `Clear filter: ${color.name}` : `Filter by ${color.name}`}
                />
              )
            })}
          </div>
        </div>

        {/* Bottom Sidebar: Return to Landing, User Info */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 14,
            width: '100%',
          }}
        >
          {/* Back / Overview button */}
          <button
            onClick={onBackToLanding}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'rgba(0, 0, 0, 0.04)',
              border: 'none',
              color: '#4B5563',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.08)'
              e.currentTarget.style.color = '#111827'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.04)'
              e.currentTarget.style.color = '#4B5563'
            }}
            title="Return to Home Overview"
          >
            <ArrowLeft size={16} />
          </button>

          {/* User Sign In / Profile */}
          {user ? (
            <button
              onClick={handleSignOut}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: '#111827',
                border: 'none',
                color: '#FFFFFF',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 700,
                transition: 'opacity 0.15s ease',
              }}
              onMouseOver={(e) => (e.currentTarget.style.opacity = '0.85')}
              onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
              title={`Signed in as ${user.email} (Click to sign out)`}
            >
              {user.email.charAt(0).toUpperCase()}
            </button>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'rgba(0, 0, 0, 0.04)',
                border: 'none',
                color: '#4B5563',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.08)'
                e.currentTarget.style.color = '#111827'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.04)'
                e.currentTarget.style.color = '#4B5563'
              }}
              title="Sign in"
            >
              <User size={16} />
            </button>
          )}
        </div>
      </aside>

      {/* ─── 2. MAIN WORKSPACE CONTENT AREA ──────────────────────────────── */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          background: '#FFFFFF',
          boxSizing: 'border-box',
        }}
      >
        {/* Top Masthead: Minimal Search Bar & Controls */}
        <header
          style={{
            padding: '24px 44px 0 clamp(24px, 4vw, 56px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          {/* Reference Search Bar: Q Search */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              width: 320,
              maxWidth: '100%',
              position: 'relative',
            }}
          >
            <Search size={19} color="#9CA3AF" strokeWidth={2.2} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#111827',
                fontSize: 16,
                outline: 'none',
                width: '100%',
                fontFamily: "var(--font-body, 'Inter', sans-serif)",
                fontWeight: 500,
                letterSpacing: '-0.01em',
              }}
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#9CA3AF',
                  cursor: 'pointer',
                  padding: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="Clear search"
              >
                <X size={15} />
              </button>
            ) : (
              <span
                style={{
                  fontSize: 11,
                  fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                  color: '#9CA3AF',
                  background: 'rgba(0, 0, 0, 0.04)',
                  padding: '2px 6px',
                  borderRadius: 4,
                }}
              >
                /
              </span>
            )}
          </div>

          {/* Right Header Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {/* Color Filter Indicator (if active) */}
            {selectedColorFilter && (
              <button
                onClick={() => setSelectedColorFilter(null)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  borderRadius: 20,
                  background: 'rgba(0, 0, 0, 0.05)',
                  border: '1px solid rgba(0, 0, 0, 0.08)',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#111827',
                  cursor: 'pointer',
                }}
                title="Clear color filter"
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: DOCKET_COLORS.find((c) => c.id === selectedColorFilter)?.bg,
                  }}
                />
                <span>Clear filter</span>
                <X size={12} />
              </button>
            )}

            {/* Try Sample Notebook button */}
            <button
              onClick={() => loadDemoNotebook()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 20,
                background: 'rgba(0, 0, 0, 0.04)',
                border: '1px solid rgba(0, 0, 0, 0.06)',
                color: '#374151',
                fontSize: 12.5,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.08)'
                e.currentTarget.style.color = '#111827'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.04)'
                e.currentTarget.style.color = '#374151'
              }}
              title="Load demo sample notebook"
            >
              <Sparkles size={13} color="#D97706" />
              <span>Sample Note</span>
            </button>

            {/* View Mode Switcher: Grid vs List */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(0, 0, 0, 0.04)',
                borderRadius: 20,
                padding: 3,
              }}
            >
              <button
                onClick={() => setViewMode('grid')}
                style={{
                  background: viewMode === 'grid' ? '#FFFFFF' : 'transparent',
                  border: 'none',
                  color: viewMode === 'grid' ? '#111827' : '#6B7280',
                  cursor: 'pointer',
                  padding: '5px 8px',
                  borderRadius: 16,
                  display: 'flex',
                  alignItems: 'center',
                  boxShadow: viewMode === 'grid' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s ease',
                }}
                title="Grid view"
              >
                <LayoutGrid size={14} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                style={{
                  background: viewMode === 'list' ? '#FFFFFF' : 'transparent',
                  border: 'none',
                  color: viewMode === 'list' ? '#111827' : '#6B7280',
                  cursor: 'pointer',
                  padding: '5px 8px',
                  borderRadius: 16,
                  display: 'flex',
                  alignItems: 'center',
                  boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s ease',
                }}
                title="List view"
              >
                <List size={14} />
              </button>
            </div>

            {/* Reload Button */}
            {user && (
              <button
                onClick={() => void loadNotebooks()}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#6B7280',
                  cursor: 'pointer',
                  padding: 6,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'color 0.15s ease',
                }}
                onMouseOver={(e) => (e.currentTarget.style.color = '#111827')}
                onMouseOut={(e) => (e.currentTarget.style.color = '#6B7280')}
                title="Refresh notebooks"
              >
                <RefreshCw size={14} className={isNotebooksLoading ? 'animate-spin' : ''} />
              </button>
            )}
          </div>
        </header>

        {/* Heading: Notes (Reference Image Signature) */}
        <div
          style={{
            padding: '28px 44px 16px clamp(24px, 4vw, 56px)',
          }}
        >
          <h1
            style={{
              fontFamily: "var(--font-display, 'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif)",
              fontSize: 'clamp(36px, 4.4vw, 48px)',
              fontWeight: 800,
              color: '#111827',
              margin: '0 0 6px',
              letterSpacing: '-0.04em',
              lineHeight: 1.1,
            }}
          >
            Notes
          </h1>
          <p
            style={{
              fontSize: 14,
              color: '#6B7280',
              margin: 0,
              fontWeight: 500,
            }}
          >
            {searchQuery
              ? `Showing ${filteredNotebooks.length} of ${notebooks.length} notes matching "${searchQuery}"`
              : `${filteredNotebooks.length} workspace note${filteredNotebooks.length === 1 ? '' : 's'} with grounded citations`}
          </p>
        </div>

        {/* ─── 3. CARD GRID / LIST CONTENT ─────────────────────────────────── */}
        <div
          style={{
            padding: '12px 44px 64px clamp(24px, 4vw, 56px)',
            flex: 1,
          }}
        >
          {/* Skeleton loading */}
          {isNotebooksLoading && notebooks.length === 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 24,
              }}
            >
              {[1, 2, 3, 4, 5, 6].map((idx) => (
                <div
                  key={`skel-${idx}`}
                  style={{
                    background: DOCKET_COLORS[idx % DOCKET_COLORS.length].bg,
                    borderRadius: 28,
                    height: 250,
                    opacity: 0.6,
                    boxShadow: '0 4px 14px rgba(0,0,0,0.04)',
                  }}
                />
              ))}
            </div>
          )}

          {/* Error notice */}
          {!isNotebooksLoading && notebooksError && (
            <div
              style={{
                padding: '18px 22px',
                background: '#FEE2E2',
                border: '1px solid #FCA5A5',
                borderRadius: 16,
                marginBottom: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <AlertCircle size={18} color="#DC2626" />
                <div style={{ fontSize: 13, color: '#991B1B', fontWeight: 600 }}>
                  {notebooksError}
                </div>
              </div>
              <button
                onClick={() => void loadNotebooks()}
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  background: '#111827',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Try again
              </button>
            </div>
          )}

          {/* Empty State */}
          {!isNotebooksLoading && notebooks.length === 0 && (
            <div
              style={{
                padding: '72px 28px',
                textAlign: 'center',
                background: '#F9FAFB',
                border: '1.5px dashed #E5E7EB',
                borderRadius: 28,
                maxWidth: 540,
                margin: '28px auto',
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  background: '#111827',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 18px',
                }}
              >
                <Plus size={22} strokeWidth={2.5} />
              </div>
              <h3
                style={{
                  fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)",
                  fontSize: 22,
                  fontWeight: 800,
                  color: '#111827',
                  margin: '0 0 8px',
                  letterSpacing: '-0.025em',
                }}
              >
                No notes created yet
              </h3>
              <p
                style={{
                  color: '#6B7280',
                  fontSize: 14,
                  maxWidth: 400,
                  margin: '0 auto 24px',
                  lineHeight: 1.5,
                }}
              >
                Create your first workspace note to synthesize documents, explore citations, and ask grounded research questions.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
                <button
                  onClick={() => setCreateModalOpen(true)}
                  style={{
                    background: '#111827',
                    color: '#FFFFFF',
                    padding: '10px 22px',
                    borderRadius: 24,
                    fontSize: 13,
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                  }}
                >
                  + Create note
                </button>
                <button
                  onClick={() => loadDemoNotebook()}
                  style={{
                    background: '#FFFFFF',
                    color: '#111827',
                    padding: '10px 20px',
                    borderRadius: 24,
                    fontSize: 13,
                    fontWeight: 600,
                    border: '1px solid #E5E7EB',
                    cursor: 'pointer',
                  }}
                >
                  Try sample note
                </button>
              </div>
            </div>
          )}

          {/* Search Empty State */}
          {!isNotebooksLoading && notebooks.length > 0 && filteredNotebooks.length === 0 && (
            <div
              style={{
                padding: '48px 24px',
                textAlign: 'center',
                background: '#F9FAFB',
                border: '1px solid #E5E7EB',
                borderRadius: 24,
                maxWidth: 440,
                margin: '36px auto',
              }}
            >
              <p style={{ color: '#4B5563', fontSize: 14, margin: '0 0 16px' }}>
                No notes match "{searchQuery}"
              </p>
              <button
                onClick={() => {
                  setSearchQuery('')
                  setSelectedColorFilter(null)
                }}
                style={{
                  background: '#111827',
                  color: '#FFFFFF',
                  padding: '7px 16px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Clear filters
              </button>
            </div>
          )}

          {/* ─── DOCKET GRID VIEW ────────────────────────────────────────── */}
          {!isNotebooksLoading && filteredNotebooks.length > 0 && viewMode === 'grid' && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
                gap: 26,
              }}
            >
              {filteredNotebooks.map((nb, idx) => {
                const color = getNotebookDocketColor(idx, nb.id)
                const isRenaming = editingId === nb.id
                const docCount = nb.documents?.length || nb.document_count || 0
                const discussionCount = nb.conversation_count ?? nb.messageCount ?? 0
                const isStarred = Boolean(starredIds[nb.id])
                const focusInfo = nb.focus ? FOCUS_INFO_MAP[nb.focus] : null
                const dateDisplay = formatDocketDate(nb.updatedAt || nb.createdAt)

                return (
                  <div
                    key={nb.id}
                    onClick={() => handleOpenNotebook(nb.id)}
                    style={{
                      background: color.bg,
                      borderRadius: 28,
                      padding: '26px 26px 22px 26px',
                      minHeight: 250,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      position: 'relative',
                      boxSizing: 'border-box',
                      boxShadow: '0 4px 14px rgba(0, 0, 0, 0.05)',
                      transition: 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.22s ease',
                      overflow: 'hidden',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-5px)'
                      e.currentTarget.style.boxShadow = '0 16px 36px rgba(0, 0, 0, 0.12)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 0, 0, 0.05)'
                    }}
                  >
                    {/* Top Body Content */}
                    <div>
                      {/* Top Badges / Star row */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: 12,
                        }}
                      >
                        {/* Focus tag */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {focusInfo ? (
                            <span
                              style={{
                                fontSize: 10.5,
                                fontWeight: 700,
                                color: color.text,
                                background: 'rgba(0, 0, 0, 0.07)',
                                padding: '2px 8px',
                                borderRadius: 12,
                                letterSpacing: '0.02em',
                              }}
                            >
                              {focusInfo.label}
                            </span>
                          ) : (
                            <span
                              style={{
                                fontSize: 10.5,
                                fontWeight: 700,
                                color: color.text,
                                background: 'rgba(0, 0, 0, 0.07)',
                                padding: '2px 8px',
                                borderRadius: 12,
                              }}
                            >
                              Workspace
                            </span>
                          )}

                          {nb.isGuestDemo && (
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                color: color.text,
                                background: 'rgba(0, 0, 0, 0.09)',
                                padding: '2px 7px',
                                borderRadius: 12,
                              }}
                            >
                              Sample
                            </span>
                          )}
                        </div>

                        {/* Top-Right Badge (Star ⭐ badge matching card 4 of reference) */}
                        <button
                          type="button"
                          onClick={(e) => toggleStar(e, nb.id)}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: '#111827',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: isStarred ? '#FBBF24' : '#9CA3AF',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.14)',
                            transition: 'transform 0.15s ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.12)')}
                          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                          title={isStarred ? 'Unpin note' : 'Pin note'}
                        >
                          <Star size={14} fill={isStarred ? '#FBBF24' : 'none'} strokeWidth={2} />
                        </button>
                      </div>

                      {/* Title: prominent bold sans-serif text */}
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
                              borderRadius: 8,
                              background: '#FFFFFF',
                              border: '1.5px solid #111827',
                              color: '#111827',
                              fontSize: 16,
                              fontWeight: 700,
                              outline: 'none',
                            }}
                          />
                          <button
                            type="submit"
                            style={{
                              background: '#111827',
                              color: '#FFFFFF',
                              border: 'none',
                              borderRadius: 8,
                              padding: '5px 8px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                            title="Save"
                          >
                            <Check size={14} strokeWidth={2.5} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingId(null)
                            }}
                            style={{
                              background: 'rgba(0, 0, 0, 0.1)',
                              color: '#111827',
                              border: 'none',
                              borderRadius: 8,
                              padding: '5px 8px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                            title="Cancel"
                          >
                            <X size={14} />
                          </button>
                        </form>
                      ) : (
                        <h3
                          style={{
                            fontSize: 18.5,
                            fontFamily: "var(--font-display, 'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif)",
                            fontWeight: 700,
                            color: color.text,
                            margin: '0 0 8px',
                            letterSpacing: '-0.02em',
                            lineHeight: 1.32,
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {nb.title}
                        </h3>
                      )}

                      {/* Excerpt / Description text */}
                      {nb.description && (
                        <p
                          style={{
                            fontSize: 13.5,
                            color: color.subtext,
                            lineHeight: 1.45,
                            margin: '0 0 10px',
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {nb.description}
                        </p>
                      )}

                      {/* Documents snippet if available */}
                      {nb.documents && nb.documents.length > 0 && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                            fontSize: 11.5,
                            fontWeight: 600,
                            color: color.text,
                            opacity: 0.85,
                            marginTop: 4,
                          }}
                        >
                          <FileText size={12} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {nb.documents[0].filename}
                            {nb.documents.length > 1 ? ` +${nb.documents.length - 1} more` : ''}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Bottom Row: Date stamp & Signature Black Circular Edit Badge */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: 18,
                        paddingTop: 10,
                      }}
                    >
                      {/* Date Stamp (e.g., "May 21, 2020" as seen in screenshot) */}
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: color.subtext,
                          letterSpacing: '-0.01em',
                        }}
                      >
                        {dateDisplay}
                      </span>

                      {/* Action Badges */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {/* Delete button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeleteTarget(nb)
                          }}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: 'rgba(0, 0, 0, 0.08)',
                            border: 'none',
                            color: color.text,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#EF4444'
                            e.currentTarget.style.color = '#FFFFFF'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.08)'
                            e.currentTarget.style.color = color.text
                          }}
                          title="Delete note"
                        >
                          <Trash2 size={13} />
                        </button>

                        {/* Signature Floating Black Circular Edit Badge ✏️ (Card 2 reference) */}
                        <button
                          type="button"
                          onClick={(e) => startRename(e, nb)}
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: '50%',
                            background: '#111827',
                            border: 'none',
                            color: '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.16)',
                            transition: 'transform 0.15s ease, background 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.12)'
                            e.currentTarget.style.background = '#000000'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)'
                            e.currentTarget.style.background = '#111827'
                          }}
                          title="Edit note"
                        >
                          <Edit2 size={13} strokeWidth={2.4} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ─── LIST VIEW MODE ─────────────────────────────────────────── */}
          {!isNotebooksLoading && filteredNotebooks.length > 0 && viewMode === 'list' && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              {filteredNotebooks.map((nb, idx) => {
                const color = getNotebookDocketColor(idx, nb.id)
                const docCount = nb.documents?.length || nb.document_count || 0
                const discussionCount = nb.conversation_count ?? nb.messageCount ?? 0
                const isStarred = Boolean(starredIds[nb.id])
                const dateDisplay = formatDocketDate(nb.updatedAt || nb.createdAt)

                return (
                  <div
                    key={nb.id}
                    onClick={() => handleOpenNotebook(nb.id)}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #E5E7EB',
                      borderRadius: 18,
                      padding: '16px 22px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 8px 18px rgba(0,0,0,0.06)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.03)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      {/* Pastel Color Swatch Tag */}
                      <div
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: '50%',
                          background: color.bg,
                          flexShrink: 0,
                          boxShadow: `0 0 0 3px ${color.bg}44`,
                        }}
                      />

                      <div>
                        <div
                          style={{
                            fontSize: 16,
                            fontWeight: 700,
                            color: '#111827',
                            marginBottom: 2,
                          }}
                        >
                          {nb.title}
                        </div>
                        {nb.description && (
                          <div style={{ fontSize: 13, color: '#6B7280' }}>
                            {nb.description}
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                      <span style={{ fontSize: 12, color: '#6B7280' }}>
                        {docCount} {docCount === 1 ? 'doc' : 'docs'}
                      </span>
                      <span style={{ fontSize: 12, color: '#6B7280' }}>
                        {dateDisplay}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => toggleStar(e, nb.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: isStarred ? '#FBBF24' : '#D1D5DB',
                          cursor: 'pointer',
                        }}
                      >
                        <Star size={16} fill={isStarred ? '#FBBF24' : 'none'} />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => startRename(e, nb)}
                        style={{
                          background: '#111827',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '50%',
                          width: 28,
                          height: 28,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                        }}
                      >
                        <Edit2 size={12} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
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
              background: 'rgba(17, 24, 39, 0.45)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1100,
              padding: 20,
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#FFFFFF',
                borderRadius: 20,
                width: 420,
                maxWidth: '100%',
                padding: '24px',
                boxShadow: '0 20px 48px rgba(0, 0, 0, 0.15)',
                color: '#111827',
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: '#FEE2E2',
                  color: '#DC2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 14,
                }}
              >
                <Trash2 size={18} />
              </div>

              <h3
                style={{
                  fontSize: 19,
                  fontWeight: 700,
                  margin: '0 0 6px',
                  letterSpacing: '-0.02em',
                }}
              >
                Delete note?
              </h3>

              <p style={{ fontSize: 13.5, color: '#4B5563', margin: '0 0 20px', lineHeight: 1.45 }}>
                Are you sure you want to delete <strong>"{deleteTarget.title}"</strong>? All associated documents and synthesis will be permanently removed.
              </p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  disabled={isDeleting}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 20,
                    background: '#F3F4F6',
                    border: 'none',
                    color: '#374151',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 20,
                    background: '#EF4444',
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: isDeleting ? 'wait' : 'pointer',
                  }}
                >
                  {isDeleting ? 'Deleting...' : 'Delete note'}
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
