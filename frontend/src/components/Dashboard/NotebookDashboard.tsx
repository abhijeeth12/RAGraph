'use client'
import { useState, useMemo, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Search,
  FileText,
  Trash2,
  ArrowLeft,
  Edit2,
  Check,
  X,
  LayoutGrid,
  List,
  AlertCircle,
  RefreshCw,
  User,
  Star,
} from 'lucide-react'
import { useSearchStore } from '@/store/useSearchStore'
import { updateNotebook } from '@/lib/api'
import { CreateNotebookModal } from './CreateNotebookModal'
import AuthModal from '@/components/AuthModal'
import type { Notebook } from '@/lib/types'
import {
  allocateNotebookColors,
  WORKSPACE_PALETTE,
  DOCKET_COLORS,
  selectOptimalColorIndex,
  getStoredColorMap,
  saveStoredColorMap,
  type DocketColor,
  type GridAssignedItem,
} from '@/lib/colorAllocation'

interface Props {
  onSelectNotebook: (id: string) => void
  onBackToLanding: () => void
}

const MAX_CARD_LINES = 5

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

/**
 * Retrieves the full raw text of a notebook card, preserving all newlines.
 * Handles both unified single-text cards and legacy separate title/description cards.
 */
function getCardText(nb: Notebook): string {
  if (!nb.description) return nb.title
  if (nb.description === nb.title || nb.description.startsWith(nb.title)) {
    return nb.description
  }
  return `${nb.title}\n\n${nb.description}`
}

/**
 * Measures the rendered line count of text accounting for font metrics,
 * container width, word-wrapping, and explicit newlines (including consecutive Enter presses).
 */
function measureRenderedLines(
  text: string,
  containerWidth: number
): number {
  if (!text) return 1
  if (typeof document === 'undefined') {
    return text.split('\n').length
  }
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return text.split('\n').length

  ctx.font = "700 18.5px 'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif"
  const paragraphs = text.split('\n')
  let linesCount = 0

  for (const para of paragraphs) {
    if (para.length === 0) {
      linesCount += 1
      continue
    }
    const words = para.split(' ')
    let currentLine = ''

    for (let i = 0; i < words.length; i++) {
      const word = words[i]
      const testLine = currentLine ? `${currentLine} ${word}` : word
      const width = ctx.measureText(testLine).width
      if (width > containerWidth && currentLine) {
        linesCount += 1
        currentLine = word
      } else {
        currentLine = testLine
      }
    }
    if (currentLine) {
      linesCount += 1
    }
  }
  return Math.max(1, linesCount)
}

interface DraftCardState {
  text: string
  color: DocketColor
}

export function NotebookDashboard({ onSelectNotebook, onBackToLanding }: Props) {
  const {
    user,
    notebooks,
    isNotebooksLoading,
    notebooksError,
    createNotebook,
    deleteNotebook,
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
  const [gridCols, setGridCols] = useState(3)

  // In-grid instantaneous new notebook card drafting state
  const [draftCard, setDraftCard] = useState<DraftCardState | null>(null)
  const [draftFeedback, setDraftFeedback] = useState<string | null>(null)
  const draftTextareaRef = useRef<HTMLTextAreaElement>(null)

  // Track responsive grid column count for intelligent 2D spatial color allocation and dynamic text measurement
  useEffect(() => {
    const updateCols = () => {
      if (typeof window === 'undefined') return
      const availWidth = window.innerWidth - 180
      const calculated = Math.max(1, Math.floor(availWidth / 314))
      setGridCols(calculated)
    }
    updateCols()
    window.addEventListener('resize', updateCols)
    return () => window.removeEventListener('resize', updateCols)
  }, [])

  // Responsive text area width measurement based on grid column width
  const cardTextWidth = useMemo(() => {
    if (typeof window === 'undefined') return 240
    const avail = window.innerWidth - 180
    const colW = Math.max(290, Math.floor(avail / gridCols) - 26)
    return Math.max(220, colW - 52)
  }, [gridCols])

  // Dynamic maximum characters based on measured line capacity and width
  const maxCardChars = useMemo(() => {
    const charsPerLine = Math.floor(cardTextWidth / 9.5)
    return Math.min(260, Math.max(160, charsPerLine * MAX_CARD_LINES))
  }, [cardTextWidth])

  // Intelligent 2D perceptual color allocation (persisted, zero flicker on edit/reload)
  const colorMap = useMemo(() => {
    return allocateNotebookColors(notebooks, gridCols)
  }, [notebooks, gridCols])

  // Inline editing state: seamless card editing with multiline Enter support
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')
  const [editFeedback, setEditFeedback] = useState<string | null>(null)
  const editTextareaRef = useRef<HTMLTextAreaElement>(null)

  // Hover states for stationary cards and scale animations on icons
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null)
  const [hoveredStarId, setHoveredStarId] = useState<string | null>(null)
  const [hoveredEditId, setHoveredEditId] = useState<string | null>(null)
  const [hoveredSaveId, setHoveredSaveId] = useState<string | null>(null)

  // Delete confirmation dialog state
  const [deleteTarget, setDeleteTarget] = useState<Notebook | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Starred / pinned notebooks tracking (local state)
  const [starredIds, setStarredIds] = useState<Record<string, boolean>>({
    'nb-tree-rag': true,
  })

  const searchInputRef = useRef<HTMLInputElement>(null)

  // Auto-focus and place text cursor at end when editing begins
  useEffect(() => {
    if (editingId && editTextareaRef.current) {
      const el = editTextareaRef.current
      el.focus()
      const len = el.value.length
      el.setSelectionRange(len, len)
    }
  }, [editingId])

  // Auto-focus when blank draft card is created
  useEffect(() => {
    if (draftCard && draftTextareaRef.current) {
      draftTextareaRef.current.focus()
    }
  }, [draftCard])

  // Trigger instantaneous new blank notebook card inside the grid
  const startNewNotebook = () => {
    // If draft card is already active, simply refocus it without creating duplicates
    if (draftCard) {
      draftTextareaRef.current?.focus()
      return
    }

    if (viewMode !== 'grid') setViewMode('grid')
    if (searchQuery) setSearchQuery('')
    if (selectedColorFilter) setSelectedColorFilter(null)
    if (editingId) setEditingId(null)
    setDraftFeedback(null)

    // Compute optimal color for grid position 0 using 2D Oklab spatial allocation
    const assignedItems: GridAssignedItem[] = notebooks.map((nb, i) => {
      const assigned = colorMap[nb.id]
      const idx = WORKSPACE_PALETTE.findIndex((c) => c.id === assigned?.id)
      return { index: i + 1, colorIdx: idx >= 0 ? idx : 0 }
    })
    const optimalIdx = selectOptimalColorIndex(0, assignedItems, gridCols)
    const chosenColor = WORKSPACE_PALETTE[optimalIdx] || WORKSPACE_PALETTE[0]

    setDraftCard({
      text: '',
      color: chosenColor,
    })
  }

  // Keyboard shortcuts: '/' focuses search, 'n' starts draft card, 'Esc' dismisses
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
        startNewNotebook()
      }
      if (e.key === 'Escape') {
        if (draftCard) {
          setDraftCard(null)
          setDraftFeedback(null)
        }
        if (editingId) {
          setEditingId(null)
          setEditFeedback(null)
        }
        if (deleteTarget) setDeleteTarget(null)
        if (searchQuery) setSearchQuery('')
        if (selectedColorFilter) setSelectedColorFilter(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [editingId, draftCard, deleteTarget, searchQuery, selectedColorFilter, notebooks, gridCols, colorMap, viewMode])

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
      result = result.filter((nb) => {
        const assigned = colorMap[nb.id]
        return assigned && assigned.id === selectedColorFilter
      })
    }

    return result
  }, [notebooks, searchQuery, selectedColorFilter, colorMap])

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

  // Start inline editing: sets initial text to exact raw card text with all newlines intact
  const startEditing = (e: React.MouseEvent, nb: Notebook) => {
    e.stopPropagation()
    if (draftCard && !draftCard.text.trim()) {
      setDraftCard(null)
    }
    if (viewMode !== 'grid') setViewMode('grid')
    setEditingId(nb.id)
    setEditingText(getCardText(nb))
    setEditFeedback(null)
  }

  // Save inline edit: preserves all exact newlines in description, sets clean first-line title
  const handleSaveEdit = async (id: string) => {
    if (!editingId || editingId !== id) return
    const rawText = editingText
    const currentNb = notebooks.find((n) => n.id === id)

    if (rawText.trim() && currentNb) {
      const lines = rawText.split('\n')
      const firstNonEmpty = lines.find((l) => l.trim().length > 0) || 'Untitled Note'
      const title = firstNonEmpty.slice(0, 100).trim()
      const description = rawText

      try {
        await updateNotebook(id, { title, description })
        useSearchStore.setState((s) => ({
          notebooks: s.notebooks.map((n) =>
            n.id === id ? { ...n, title, description, updatedAt: new Date() } : n
          ),
        }))
      } catch (err) {
        console.error('Failed to save edited notebook:', err)
      }
    }
    setEditingId(null)
    setEditFeedback(null)
  }

  // Save new draft card on blur / explicit save button or discard cleanly if left empty
  const handleSaveDraft = async () => {
    if (!draftCard) return
    const rawText = draftCard.text
    if (!rawText.trim()) {
      // Discard blank card cleanly if user entered nothing
      setDraftCard(null)
      setDraftFeedback(null)
      return
    }

    const lines = rawText.split('\n')
    const firstNonEmpty = lines.find((l) => l.trim().length > 0) || 'Untitled Note'
    const title = firstNonEmpty.slice(0, 100).trim()
    const description = rawText
    const assignedColor = draftCard.color

    setDraftCard(null)
    setDraftFeedback(null)

    try {
      const newNb = await createNotebook(title, description, 'all')
      if (newNb?.id) {
        const stored = getStoredColorMap()
        stored[newNb.id] = assignedColor.id
        saveStoredColorMap(stored)
      }
    } catch (err) {
      console.error('Failed to create notebook:', err)
    }
  }

  const handleSignOut = () => {
    setUser(null, null, null)
  }

  const showEmptyState = !isNotebooksLoading && notebooks.length === 0 && !draftCard
  const showSearchEmptyState = !isNotebooksLoading && notebooks.length > 0 && filteredNotebooks.length === 0 && !draftCard

  const draftLinesCount = useMemo(() => {
    return draftCard ? measureRenderedLines(draftCard.text, cardTextWidth) : 1
  }, [draftCard, cardTextWidth])

  const editLinesCount = useMemo(() => {
    return editingId ? measureRenderedLines(editingText, cardTextWidth) : 1
  }, [editingId, editingText, cardTextWidth])

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
      {/* ─── 1. LEFT SIDEBAR (Two-line "Study Space" brand & controls) ───── */}
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
          padding: '26px 0 24px',
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 40,
          boxSizing: 'border-box',
        }}
      >
        {/* Top: Brand & Action Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          {/* Two-Line Brand Title: "Study" on line 1, "Space" directly underneath */}
          <button
            onClick={onBackToLanding}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 6px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              textDecoration: 'none',
              lineHeight: 1.1,
              transition: 'opacity 0.15s ease',
            }}
            onMouseOver={(e) => (e.currentTarget.style.opacity = '0.75')}
            onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
            title="Study Space — Return to Landing Page"
          >
            <span
              style={{
                fontFamily: "var(--font-display, 'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif)",
                fontSize: 16.5,
                fontWeight: 800,
                color: '#111827',
                letterSpacing: '-0.035em',
              }}
            >
              Study
            </span>
            <span
              style={{
                fontFamily: "var(--font-display, 'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif)",
                fontSize: 16.5,
                fontWeight: 800,
                color: '#111827',
                letterSpacing: '-0.035em',
              }}
            >
              Space
            </span>
          </button>

          {/* Prominent Black Circular Action Button (+) -> Immediately creates in-grid blank note card */}
          <button
            onClick={startNewNotebook}
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
              marginTop: 34,
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
            title="New Notebook / Note Card (Press N)"
          >
            <Plus size={22} strokeWidth={2.6} />
          </button>

          {/* Vertical Stack of Signature Pastel Color Dots */}
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
        {/* Top Masthead: Subtle Tinted Search Bar & Header Controls */}
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
          {/* Subtle Search Bar Container with no borders or outlines */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              width: 320,
              maxWidth: '100%',
              position: 'relative',
              background: 'rgba(0, 0, 0, 0.038)',
              borderRadius: 22,
              padding: '8px 16px',
              border: 'none',
              outline: 'none',
              transition: 'background 0.15s ease',
            }}
          >
            <Search size={18} color="#9CA3AF" strokeWidth={2.2} />
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
                fontSize: 15,
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
                  background: 'rgba(0, 0, 0, 0.05)',
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
                    background: WORKSPACE_PALETTE.find((c) => c.id === selectedColorFilter)?.bg,
                  }}
                />
                <span>Clear filter</span>
                <X size={12} />
              </button>
            )}

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

        {/* Heading: Notebooks */}
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
            Notebooks
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
              ? `Showing ${filteredNotebooks.length} of ${notebooks.length} notebooks matching "${searchQuery}"`
              : `${filteredNotebooks.length} workspace notebook${filteredNotebooks.length === 1 ? '' : 's'} with grounded citations`}
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
                gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
                gap: 24,
              }}
            >
              {[1, 2, 3, 4, 5, 6].map((idx) => (
                <div
                  key={`skel-${idx}`}
                  style={{
                    background: WORKSPACE_PALETTE[idx % WORKSPACE_PALETTE.length].bg,
                    borderRadius: 28,
                    height: 270,
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

          {/* Empty State: Only when not loading, no notebooks, and no active draft card */}
          {showEmptyState && (
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
                No notebooks created yet
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
                Create your first workspace notebook to synthesize documents, explore citations, and ask grounded research questions.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
                <button
                  onClick={startNewNotebook}
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
                  + Create notebook
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
                  Try sample notebook
                </button>
              </div>
            </div>
          )}

          {/* Search Empty State */}
          {showSearchEmptyState && (
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
                No notebooks match "{searchQuery}"
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

          {/* ─── GRID VIEW: Stationary on hover with subtle brightness & shadow feedback ─ */}
          {!isNotebooksLoading && (filteredNotebooks.length > 0 || draftCard) && viewMode === 'grid' && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
                gap: 26,
              }}
            >
              {/* ─── IN-GRID NEW BLANK NOTEBOOK CARD (Created on '+' click or 'N' press) ─ */}
              {draftCard && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    background: draftCard.color.bg,
                    borderRadius: 28,
                    padding: '26px 26px 22px 26px',
                    minHeight: 270,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                    boxSizing: 'border-box',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
                    overflow: 'hidden',
                  }}
                >
                  <div>
                    {/* Top row */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 10,
                        minHeight: 32,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: draftCard.color.text,
                          background: 'rgba(0, 0, 0, 0.07)',
                          padding: '2px 8px',
                          borderRadius: 12,
                          letterSpacing: '0.02em',
                        }}
                      >
                        New Note
                      </span>
                    </div>

                    {/* Multiline textarea typing directly on the card with dimension-aware limits */}
                    <textarea
                      ref={draftTextareaRef}
                      placeholder="Type a note..."
                      value={draftCard.text}
                      onChange={(e) => {
                        const val = e.target.value
                        const lines = measureRenderedLines(val, cardTextWidth)
                        if (lines > MAX_CARD_LINES) {
                          setDraftFeedback(`Card limit: max ${MAX_CARD_LINES} lines`)
                          setTimeout(() => setDraftFeedback(null), 2500)
                          return
                        }
                        if (val.length > maxCardChars) {
                          setDraftFeedback(`Character limit reached (${maxCardChars} chars)`)
                          setTimeout(() => setDraftFeedback(null), 2500)
                          return
                        }
                        setDraftFeedback(null)
                        setDraftCard((prev) => (prev ? { ...prev, text: val } : null))
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          e.stopPropagation()
                          setDraftCard(null)
                          setDraftFeedback(null)
                          return
                        }
                        if (e.key === 'Enter') {
                          const el = e.currentTarget
                          const val = el.value
                          const start = el.selectionStart || 0
                          const end = el.selectionEnd || 0
                          const nextVal = val.slice(0, start) + '\n' + val.slice(end)
                          const lines = measureRenderedLines(nextVal, cardTextWidth)
                          if (lines > MAX_CARD_LINES) {
                            e.preventDefault()
                            setDraftFeedback(`Card limit: max ${MAX_CARD_LINES} lines`)
                            setTimeout(() => setDraftFeedback(null), 2500)
                            return
                          }
                          setDraftFeedback(null)
                        }
                      }}
                      onBlur={() => {
                        void handleSaveDraft()
                      }}
                      rows={MAX_CARD_LINES}
                      style={{
                        width: '100%',
                        maxHeight: 135,
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        resize: 'none',
                        fontFamily: "var(--font-display, 'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif)",
                        fontSize: 18.5,
                        fontWeight: 700,
                        color: draftCard.color.text,
                        lineHeight: 1.35,
                        letterSpacing: '-0.02em',
                        padding: 0,
                        margin: 0,
                        boxSizing: 'border-box',
                        overflow: 'hidden',
                      }}
                    />
                  </div>

                  {/* Bottom row: Dynamic line limit indicator & Explicit Save Checkmark */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: 18,
                      paddingTop: 10,
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: draftCard.color.subtext,
                          letterSpacing: '-0.01em',
                        }}
                      >
                        {formatDocketDate(new Date())}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: draftFeedback ? '#DC2626' : draftLinesCount >= MAX_CARD_LINES ? '#D97706' : draftCard.color.subtext,
                          opacity: draftFeedback ? 1 : 0.75,
                          transition: 'color 0.15s ease',
                        }}
                      >
                        {draftFeedback || `${draftLinesCount}/${MAX_CARD_LINES} lines • ${draftCard.text.length}/${maxCardChars}`}
                      </span>
                    </div>

                    {/* Action Badges: Explicit Cancel (X) & Save (Checkmark) */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {/* Cancel Draft Button */}
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={(e) => {
                          e.stopPropagation()
                          setDraftCard(null)
                          setDraftFeedback(null)
                        }}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: 'rgba(0, 0, 0, 0.08)',
                          border: 'none',
                          color: draftCard.color.text,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(0, 0, 0, 0.14)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(0, 0, 0, 0.08)'
                        }}
                        title="Discard note (Esc)"
                      >
                        <X size={14} />
                      </button>

                      {/* Explicit Save Checkmark Button */}
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={(e) => {
                          e.stopPropagation()
                          void handleSaveDraft()
                        }}
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
                          transform: hoveredSaveId === 'draft' ? 'scale(1.12)' : 'scale(1)',
                          transition: 'transform 0.15s ease, background 0.15s ease',
                        }}
                        onMouseEnter={() => setHoveredSaveId('draft')}
                        onMouseLeave={() => setHoveredSaveId(null)}
                        title="Save note"
                      >
                        <Check size={16} strokeWidth={2.6} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ─── EXISTING NOTEBOOK CARDS ─────────────────────────────────── */}
              {filteredNotebooks.map((nb) => {
                const color = colorMap[nb.id] || WORKSPACE_PALETTE[0]
                const isEditingThis = editingId === nb.id
                const isStarred = Boolean(starredIds[nb.id])
                const dateDisplay = formatDocketDate(nb.updatedAt || nb.createdAt)
                const isCardHovered = hoveredCardId === nb.id
                const cardLines = getCardText(nb).split('\n')

                return (
                  <div
                    key={nb.id}
                    onClick={() => {
                      if (!isEditingThis) handleOpenNotebook(nb.id)
                    }}
                    style={{
                      background: color.bg,
                      borderRadius: 28,
                      padding: '26px 26px 22px 26px',
                      minHeight: 270,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      cursor: isEditingThis ? 'default' : 'pointer',
                      position: 'relative',
                      boxSizing: 'border-box',
                      boxShadow: isCardHovered
                        ? '0 8px 24px rgba(0, 0, 0, 0.08)'
                        : '0 4px 14px rgba(0, 0, 0, 0.05)',
                      filter: isCardHovered ? 'brightness(0.96)' : 'brightness(1)',
                      // STRICTLY STATIONARY: No translation or lift on hover!
                      transition: 'filter 0.2s ease, box-shadow 0.2s ease',
                      overflow: 'hidden',
                    }}
                    onMouseEnter={() => setHoveredCardId(nb.id)}
                    onMouseLeave={() => setHoveredCardId(null)}
                  >
                    {/* Top Body Content */}
                    <div>
                      {/* Top Row: Star Pin button aligned top-right */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          marginBottom: 10,
                          minHeight: 32,
                        }}
                      >
                        {/* Top-Right Star Badge (Always visible, scale hover animation) */}
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
                            transform: hoveredStarId === nb.id ? 'scale(1.12)' : 'scale(1)',
                            transition: 'transform 0.15s ease',
                          }}
                          onMouseEnter={() => setHoveredStarId(nb.id)}
                          onMouseLeave={() => setHoveredStarId(null)}
                          title={isStarred ? 'Unpin notebook' : 'Pin notebook'}
                        >
                          <Star size={14} fill={isStarred ? '#FBBF24' : 'none'} strokeWidth={2} />
                        </button>
                      </div>

                      {/* Content: Multiline inline editing OR display note preserving all consecutive line breaks */}
                      {isEditingThis ? (
                        <textarea
                          ref={editTextareaRef}
                          value={editingText}
                          onChange={(e) => {
                            const val = e.target.value
                            const lines = measureRenderedLines(val, cardTextWidth)
                            if (lines > MAX_CARD_LINES) {
                              setEditFeedback(`Card limit: max ${MAX_CARD_LINES} lines`)
                              setTimeout(() => setEditFeedback(null), 2500)
                              return
                            }
                            if (val.length > maxCardChars) {
                              setEditFeedback(`Character limit reached (${maxCardChars} chars)`)
                              setTimeout(() => setEditFeedback(null), 2500)
                              return
                            }
                            setEditFeedback(null)
                            setEditingText(val)
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                              e.stopPropagation()
                              setEditingId(null)
                              setEditFeedback(null)
                              return
                            }
                            if (e.key === 'Enter') {
                              const el = e.currentTarget
                              const val = el.value
                              const start = el.selectionStart || 0
                              const end = el.selectionEnd || 0
                              const nextVal = val.slice(0, start) + '\n' + val.slice(end)
                              const lines = measureRenderedLines(nextVal, cardTextWidth)
                              if (lines > MAX_CARD_LINES) {
                                e.preventDefault()
                                setEditFeedback(`Card limit: max ${MAX_CARD_LINES} lines`)
                                setTimeout(() => setEditFeedback(null), 2500)
                                return
                              }
                              setEditFeedback(null)
                            }
                          }}
                          onBlur={() => {
                            void handleSaveEdit(nb.id)
                          }}
                          onClick={(e) => e.stopPropagation()}
                          rows={MAX_CARD_LINES}
                          style={{
                            width: '100%',
                            maxHeight: 135,
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                            resize: 'none',
                            fontFamily: "var(--font-display, 'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif)",
                            fontSize: 18.5,
                            fontWeight: 700,
                            color: color.text,
                            lineHeight: 1.35,
                            letterSpacing: '-0.02em',
                            padding: 0,
                            margin: 0,
                            boxSizing: 'border-box',
                            overflow: 'hidden',
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            fontSize: 18.5,
                            fontFamily: "var(--font-display, 'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif)",
                            fontWeight: 700,
                            color: color.text,
                            margin: '0 0 8px',
                            letterSpacing: '-0.02em',
                            lineHeight: 1.35,
                            wordBreak: 'break-word',
                            overflowWrap: 'break-word',
                            overflow: 'hidden',
                            maxHeight: 140,
                          }}
                        >
                          {cardLines.map((line, idx) => (
                            <div
                              key={idx}
                              style={{
                                minHeight: line.trim() === '' ? '1.35em' : undefined,
                                lineHeight: 1.35,
                              }}
                            >
                              {line.trim() === '' ? '\u00A0' : line}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Documents snippet if available */}
                      {!isEditingThis && nb.documents && nb.documents.length > 0 && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                            fontSize: 11.5,
                            fontWeight: 600,
                            color: color.text,
                            opacity: 0.85,
                            marginTop: 6,
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

                    {/* Bottom Row: Date stamp & Signature Action Badges */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: 18,
                        paddingTop: 10,
                      }}
                    >
                      {/* Date Stamp & Capacity Indicator in Edit Mode */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                        {isEditingThis && (
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              color: editFeedback ? '#DC2626' : editLinesCount >= MAX_CARD_LINES ? '#D97706' : color.subtext,
                              opacity: editFeedback ? 1 : 0.75,
                              transition: 'color 0.15s ease',
                            }}
                          >
                            {editFeedback || `${editLinesCount}/${MAX_CARD_LINES} lines • ${editingText.length}/${maxCardChars}`}
                          </span>
                        )}
                      </div>

                      {/* Action Badges: Switches to Explicit Cancel & Save Checkmark during edit mode */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {isEditingThis ? (
                          <>
                            {/* Cancel Edit Button */}
                            <button
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={(e) => {
                                e.stopPropagation()
                                setEditingId(null)
                                setEditFeedback(null)
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
                                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.14)'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.08)'
                              }}
                              title="Cancel editing (Esc)"
                            >
                              <X size={14} />
                            </button>

                            {/* Explicit Save Checkmark Button */}
                            <button
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={(e) => {
                                e.stopPropagation()
                                void handleSaveEdit(nb.id)
                              }}
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
                                transform: hoveredSaveId === nb.id ? 'scale(1.12)' : 'scale(1)',
                                transition: 'transform 0.15s ease, background 0.15s ease',
                              }}
                              onMouseEnter={() => setHoveredSaveId(nb.id)}
                              onMouseLeave={() => setHoveredSaveId(null)}
                              title="Save changes"
                            >
                              <Check size={16} strokeWidth={2.6} />
                            </button>
                          </>
                        ) : (
                          <>
                            {/* Delete button (Always visible) */}
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
                              title="Delete notebook"
                            >
                              <Trash2 size={13} />
                            </button>

                            {/* Floating Black Circular Edit Badge ✏️ (Always visible, scale hover animation) */}
                            <button
                              type="button"
                              onClick={(e) => startEditing(e, nb)}
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
                                transform: hoveredEditId === nb.id ? 'scale(1.12)' : 'scale(1)',
                                transition: 'transform 0.15s ease',
                              }}
                              onMouseEnter={() => setHoveredEditId(nb.id)}
                              onMouseLeave={() => setHoveredEditId(null)}
                              title="Edit note"
                            >
                              <Edit2 size={13} strokeWidth={2.4} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ─── LIST VIEW MODE (Clean, without category/focus column) ───────── */}
          {!isNotebooksLoading && filteredNotebooks.length > 0 && viewMode === 'list' && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              {filteredNotebooks.map((nb) => {
                const color = colorMap[nb.id] || WORKSPACE_PALETTE[0]
                const docCount = nb.documents?.length || nb.document_count || 0
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
                      transition: 'box-shadow 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.07)'
                    }}
                    onMouseLeave={(e) => {
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
                        title={isStarred ? 'Unpin notebook' : 'Pin notebook'}
                      >
                        <Star size={16} fill={isStarred ? '#FBBF24' : 'none'} />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => startEditing(e, nb)}
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
                        title="Edit notebook"
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
                Delete notebook?
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
        onCreate={async (title, desc) => {
          const newNb = await createNotebook(title, desc, 'all')
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
