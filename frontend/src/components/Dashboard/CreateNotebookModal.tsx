'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Plus,
  Globe,
  GraduationCap,
  Code2,
  LineChart,
  Image,
  Sparkles,
  Layers,
  ArrowRight,
} from 'lucide-react'
import type { FocusMode } from '@/lib/types'

interface Props {
  isOpen: boolean
  onClose: () => void
  onCreate: (title: string, description: string, focus: FocusMode) => Promise<void>
}

interface FocusOption {
  key: FocusMode
  label: string
  desc: string
  icon: any
}

const FOCUS_OPTIONS: FocusOption[] = [
  {
    key: 'all',
    label: 'All-Purpose Research',
    desc: 'Multi-document synthesis across mixed technical corpora',
    icon: Globe,
  },
  {
    key: 'academic',
    label: 'Academic Papers & Theses',
    desc: 'Layout-aware extraction of abstracts, theorems, and citations',
    icon: GraduationCap,
  },
  {
    key: 'code',
    label: 'Code & System Specs',
    desc: 'Architecture manuals, API definitions, and RFC specifications',
    icon: Code2,
  },
  {
    key: 'finance',
    label: 'Financial & Regulatory',
    desc: '10-K disclosures, comparative balance tables, and filings',
    icon: LineChart,
  },
  {
    key: 'images',
    label: 'Multimodal Schematics',
    desc: 'Diagrams, flowcharts, architecture figures, and wireframes',
    icon: Image,
  },
]

export function CreateNotebookModal({ isOpen, onClose, onCreate }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [focus, setFocus] = useState<FocusMode>('all')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || isSubmitting) return

    setIsSubmitting(true)
    setError(null)
    try {
      await onCreate(title.trim(), description.trim(), focus)
      setTitle('')
      setDescription('')
      setFocus('all')
      onClose()
    } catch (err: any) {
      console.error('Failed to create notebook:', err)
      setError(err?.message || 'Failed to initialize notebook on server.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(5, 7, 10, 0.75)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 20,
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#13161c',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 12,
              padding: '32px',
              maxWidth: 580,
              width: '100%',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.5)',
              position: 'relative',
            }}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              style={{
                position: 'absolute',
                top: 20,
                right: 20,
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                padding: 4,
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 0.15s',
              }}
              onMouseOver={(e) => (e.currentTarget.style.color = '#f8fafc')}
              onMouseOut={(e) => (e.currentTarget.style.color = '#64748b')}
              title="Close modal"
            >
              <X size={18} />
            </button>

            {/* Modal Header */}
            <div style={{ marginBottom: 24 }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '3px 8px',
                  borderRadius: 4,
                  background: 'rgba(56, 189, 248, 0.1)',
                  color: '#38bdf8',
                  fontSize: 11,
                  fontFamily: "'JetBrains Mono', monospace",
                  marginBottom: 10,
                }}
              >
                <span>[NEW WORKSPACE MANIFEST]</span>
              </div>
              <h2
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: '#f8fafc',
                  margin: '0 0 6px',
                  letterSpacing: '-0.02em',
                }}
              >
                Initialize Research Notebook
              </h2>
              <p style={{ fontSize: 13.5, color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                Configure a dedicated workspace for hierarchical tree induction and document synthesis.
              </p>
            </div>

            {error && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: 6,
                  padding: '10px 14px',
                  fontSize: 12.5,
                  color: '#fca5a5',
                  marginBottom: 18,
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Title Field */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 12.5,
                    fontFamily: "'JetBrains Mono', monospace",
                    color: '#94a3b8',
                    marginBottom: 8,
                  }}
                >
                  NOTEBOOK TITLE <span style={{ color: '#38bdf8' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Distributed Consensus & Raft Formal Proofs"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: 6,
                    background: '#0b0d11',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#f8fafc',
                    fontSize: 14,
                    outline: 'none',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#38bdf8')}
                  onBlur={(e) => (e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)')}
                />
              </div>

              {/* Description Field */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 12.5,
                    fontFamily: "'JetBrains Mono', monospace",
                    color: '#94a3b8',
                    marginBottom: 8,
                  }}
                >
                  RESEARCH THESIS / DESCRIPTION (OPTIONAL)
                </label>
                <textarea
                  placeholder="Briefly define the scope of documents to be analyzed..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: 6,
                    background: '#0b0d11',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#f8fafc',
                    fontSize: 13.5,
                    outline: 'none',
                    resize: 'none',
                    lineHeight: 1.5,
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#38bdf8')}
                  onBlur={(e) => (e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)')}
                />
              </div>

              {/* Focus Mode Selector */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 12.5,
                    fontFamily: "'JetBrains Mono', monospace",
                    color: '#94a3b8',
                    marginBottom: 10,
                  }}
                >
                  RETRIEVAL OPTIMIZATION PROFILE
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8 }}>
                  {FOCUS_OPTIONS.map((opt) => {
                    const isSelected = focus === opt.key
                    const Icon = opt.icon
                    return (
                      <button
                        type="button"
                        key={opt.key}
                        onClick={() => setFocus(opt.key)}
                        style={{
                          background: isSelected ? 'rgba(56, 189, 248, 0.1)' : '#0b0d11',
                          border: isSelected
                            ? '1px solid rgba(56, 189, 248, 0.4)'
                            : '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: 6,
                          padding: '10px 12px',
                          textAlign: 'left',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <Icon size={14} color={isSelected ? '#38bdf8' : '#94a3b8'} />
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: isSelected ? '#38bdf8' : '#cbd5e1',
                            }}
                          >
                            {opt.label.split(' ')[0]}
                          </span>
                        </div>
                        <div style={{ fontSize: 10.5, color: '#64748b', lineHeight: 1.3 }}>
                          {opt.label}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: '10px 18px',
                    borderRadius: 6,
                    background: 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#94a3b8',
                    fontSize: 13.5,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={!title.trim() || isSubmitting}
                  style={{
                    padding: '10px 22px',
                    borderRadius: 6,
                    background: '#f8fafc',
                    border: 'none',
                    color: '#0b0d11',
                    fontSize: 13.5,
                    fontWeight: 600,
                    cursor: !title.trim() || isSubmitting ? 'not-allowed' : 'pointer',
                    opacity: !title.trim() || isSubmitting ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.15s',
                  }}
                >
                  {isSubmitting ? (
                    <span>Initializing...</span>
                  ) : (
                    <>
                      <Plus size={15} />
                      <span>Create Workspace</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
