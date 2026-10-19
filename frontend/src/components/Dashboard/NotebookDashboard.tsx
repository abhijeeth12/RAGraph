'use client'
import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Search,
  BookOpen,
  FileText,
  Clock,
  Trash2,
  ExternalLink,
  Layers,
  Sparkles,
  LogOut,
  ArrowLeft,
  GraduationCap,
  Code2,
  LineChart,
  Globe,
  Image,
} from 'lucide-react'
import { useSearchStore } from '@/store/useSearchStore'
import { formatRelativeTime } from '@/lib/utils'
import { CreateNotebookModal } from './CreateNotebookModal'
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

export function NotebookDashboard({ onSelectNotebook, onBackToLanding }: Props) {
  const {
    user,
    logout,
    notebooks,
    createNotebook,
    deleteNotebook,
    setActiveNotebookId,
    setAppView,
  } = useSearchStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [createModalOpen, setCreateModalOpen] = useState(false)

  const filteredNotebooks = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return notebooks
    return notebooks.filter(
      (nb) =>
        nb.title.toLowerCase().includes(q) ||
        (nb.description && nb.description.toLowerCase().includes(q))
    )
  }, [notebooks, searchQuery])

  const handleOpenNotebook = (id: string) => {
    setActiveNotebookId(id)
    onSelectNotebook(id)
  }

  const handleDelete = async (e: React.MouseEvent, nb: Notebook) => {
    e.stopPropagation()
    if (window.confirm(`Delete notebook "${nb.title}"?`)) {
      await deleteNotebook(nb.id)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0b0e13',
        color: 'var(--text-primary)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'var(--font-body)',
      }}
    >
      {/* Background Subtle Grid */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)',
          backgroundSize: '36px 36px',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* ─── Dashboard Header ─────────────────────────────────────────── */}
      <header
        style={{
          height: 76,
          background: 'rgba(17, 18, 21, 0.85)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 36px',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <button
            onClick={onBackToLanding}
            className="btn-ghost"
            style={{ padding: '8px 12px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 7, fontSize: 13.5 }}
            title="Return to public landing page"
          >
            <ArrowLeft size={16} /> Landing
          </button>

          <div
            style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
            onClick={onBackToLanding}
            title="Return to Landing Page"
          >
            <img src="/logo.png" alt="RA-Graph" style={{ width: 32, height: 32, objectFit: 'contain' }} />
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 600, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                Notebooks
              </h1>
              <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                {user ? user.email : 'Personal Workspace'}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Create Notebook CTA */}
          <button
            onClick={() => setCreateModalOpen(true)}
            className="btn-primary"
            style={{
              borderRadius: 22,
              padding: '10px 20px',
              fontSize: 14,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 7,
            }}
          >
            <Plus size={17} /> New Notebook
          </button>

          {/* User Profile / Logout */}
          <button
            onClick={logout}
            className="btn-ghost"
            style={{ padding: '8px 14px', borderRadius: 8, fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 7 }}
            title="Sign out of RA-Graph"
          >
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </header>

      {/* ─── Main Content Canvas ──────────────────────────────────────── */}
      <main
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 1280,
          width: '100%',
          margin: '0 auto',
          padding: '36px 32px 80px',
          display: 'flex',
          flexDirection: 'column',
          gap: 28,
        }}
      >
        {/* Search & Statistics Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          {/* Filter Search Input */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 24,
              padding: '8px 16px',
              width: '100%',
              maxWidth: 360,
            }}
          >
            <Search size={15} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search your notebooks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-primary)',
                fontSize: 13.5,
                width: '100%',
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--text-muted)' }}>
            <span>{notebooks.length} total notebook{notebooks.length !== 1 ? 's' : ''}</span>
            <span aria-hidden="true">·</span>
            <span>Hierarchical RAG v5</span>
          </div>
        </div>

        {/* Notebook Cards Grid */}
        {filteredNotebooks.length === 0 ? (
          /* Empty State */
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px dashed rgba(255, 255, 255, 0.12)',
              borderRadius: 20,
              padding: '60px 24px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 14,
              marginTop: 20,
            }}
          >
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: '50%',
                background: 'rgba(168, 199, 250, 0.1)',
                color: 'var(--accent-blue)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 6,
              }}
            >
              <BookOpen size={24} />
            </div>

            <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
              {searchQuery ? 'No matching notebooks found' : 'No research notebooks yet'}
            </h3>

            <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', maxWidth: 460, margin: 0, lineHeight: 1.6 }}>
              {searchQuery
                ? 'Try searching with different keywords, or clear the search input.'
                : 'Create your first notebook to upload PDFs, reconstruct document trees, and ask grounded questions.'}
            </p>

            <button
              onClick={() => setCreateModalOpen(true)}
              className="btn-primary"
              style={{ borderRadius: 20, padding: '9px 22px', fontSize: 13.5, fontWeight: 600, marginTop: 10 }}
            >
              <Plus size={16} /> Create Notebook
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
              gap: 18,
            }}
          >
            {/* New Notebook Blank Tile */}
            <motion.div
              whileHover={{ y: -3, borderColor: 'rgba(168, 199, 250, 0.4)' }}
              transition={{ duration: 0.15 }}
              onClick={() => setCreateModalOpen(true)}
              style={{
                background: 'rgba(255, 255, 255, 0.015)',
                border: '1px dashed rgba(255, 255, 255, 0.15)',
                borderRadius: 16,
                padding: '24px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                minHeight: 200,
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: '50%',
                  background: 'rgba(168, 199, 250, 0.12)',
                  color: 'var(--accent-blue)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Plus size={20} />
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                New Notebook
              </span>
              <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                Upload PDFs, DOCX, or text files
              </span>
            </motion.div>

            {/* Notebook Cards */}
            {filteredNotebooks.map((nb) => {
              const docCount = nb.documents?.length || 0
              const totalNodes = nb.documents?.reduce((acc, d) => acc + (d.node_count || 0), 0) || 0
              const FocusIcon = FOCUS_ICON_MAP[nb.focus || 'all'] || Globe

              return (
                <motion.div
                  key={nb.id}
                  whileHover={{ y: -3 }}
                  transition={{ duration: 0.15 }}
                  onClick={() => handleOpenNotebook(nb.id)}
                  style={{
                    background: 'rgba(30, 31, 34, 0.7)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 16,
                    padding: '22px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: 200,
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(168, 199, 250, 0.35)'
                    e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(168, 199, 250, 0.06)'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.25)'
                  }}
                >
                  {/* Top Bar with Focus Icon & Actions */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: 11,
                          fontWeight: 600,
                          color: 'var(--accent-blue)',
                        }}
                      >
                        <FocusIcon size={13} />
                        <span style={{ textTransform: 'capitalize' }}>{nb.focus || 'Research'}</span>
                      </div>

                      <button
                        onClick={(e) => handleDelete(e, nb)}
                        className="btn-ghost"
                        style={{
                          padding: 5,
                          borderRadius: 6,
                          border: 'none',
                          color: 'var(--text-muted)',
                          opacity: 0.7,
                          transition: 'opacity 0.15s, color 0.15s',
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.opacity = '1'
                          e.currentTarget.style.color = '#ef4444'
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.opacity = '0.7'
                          e.currentTarget.style.color = 'var(--text-muted)'
                        }}
                        title="Delete Notebook"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    {/* Notebook Title */}
                    <h4
                      style={{
                        fontSize: 16,
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        margin: 0,
                        lineHeight: 1.4,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {nb.title}
                    </h4>

                    {/* Description preview */}
                    {nb.description && (
                      <p
                        style={{
                          fontSize: 12.5,
                          color: 'var(--text-secondary)',
                          marginTop: 6,
                          marginBottom: 0,
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

                  {/* Bottom Metadata: Documents & Timestamp */}
                  <div
                    style={{
                      marginTop: 18,
                      paddingTop: 12,
                      borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: 11.5,
                      color: 'var(--text-muted)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <FileText size={12} style={{ color: 'var(--accent-blue)' }} />
                      <span>{docCount} document{docCount !== 1 ? 's' : ''}</span>
                      {totalNodes > 0 && <span>· {totalNodes} chunks</span>}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={11} />
                      <span>{formatRelativeTime(new Date(nb.updatedAt))}</span>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </main>

      <CreateNotebookModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreate={async (title, desc, focus) => {
          await createNotebook(title, desc, focus)
        }}
      />
    </div>
  )
}
