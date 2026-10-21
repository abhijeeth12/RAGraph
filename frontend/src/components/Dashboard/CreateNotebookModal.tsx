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
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20,
          }}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 12 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-panel)',
              border: '2px solid var(--border-bold)',
              borderRadius: 16,
              width: 540,
              maxWidth: '100%',
              overflow: 'hidden',
              boxShadow: '0 24px 70px rgba(0, 0, 0, 0.6)',
              position: 'relative',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '24px 28px',
                borderBottom: '1.5px solid var(--border-bold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 11,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--accent-blue)',
                    letterSpacing: '0.05em',
                    marginBottom: 4,
                    fontWeight: 600,
                  }}
                >
                  § 01 / INITIALIZE NOTEBOOK
                </div>
                <h2
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 20,
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    margin: 0,
                    letterSpacing: '-0.02em',
                  }}
                >
                  Create Research Notebook
                </h2>
              </div>

              <button
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: 6,
                  borderRadius: 6,
                  transition: 'color 0.15s ease',
                }}
                onMouseOver={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ padding: '24px 28px' }}>
              {error && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#F87171',
                    fontSize: 13,
                    marginBottom: 20,
                  }}
                >
                  {error}
                </div>
              )}

              {/* Title Field */}
              <div style={{ marginBottom: 20 }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: 11,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-secondary)',
                    marginBottom: 8,
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                  }}
                >
                  NOTEBOOK IDENTIFIER / TITLE *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Distributed Consensus Verification, SEC 10-K Analysis..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: 8,
                    background: 'var(--bg-input)',
                    border: '1.5px solid var(--border-bold)',
                    color: 'var(--text-primary)',
                    fontSize: 14,
                    outline: 'none',
                    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                    fontFamily: 'var(--font-body)',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent-blue)'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(56, 189, 248, 0.15)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-bold)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
              </div>

              {/* Description Field */}
              <div style={{ marginBottom: 20 }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: 11,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-secondary)',
                    marginBottom: 8,
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                  }}
                >
                  RESEARCH SCOPE / DESCRIPTION
                </label>
                <textarea
                  placeholder="Optional brief regarding primary document types or research questions..."
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: 8,
                    background: 'var(--bg-input)',
                    border: '1.5px solid var(--border-bold)',
                    color: 'var(--text-primary)',
                    fontSize: 14,
                    outline: 'none',
                    resize: 'none',
                    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                    fontFamily: 'var(--font-body)',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent-blue)'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(56, 189, 248, 0.15)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-bold)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
              </div>

              {/* Focus Mode Selection */}
              <div style={{ marginBottom: 28 }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: 11,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-secondary)',
                    marginBottom: 10,
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                  }}
                >
                  RETRIEVAL FOCUS PROFILE
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
                  {FOCUS_OPTIONS.map((opt) => {
                    const isSelected = focus === opt.key
                    const Icon = opt.icon
                    return (
                      <div
                        key={opt.key}
                        onClick={() => setFocus(opt.key)}
                        style={{
                          padding: '10px 14px',
                          borderRadius: 8,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          border: isSelected
                            ? '1.5px solid var(--accent-blue)'
                            : '1.5px solid var(--border-bold)',
                          background: isSelected ? 'rgba(56, 189, 248, 0.12)' : 'var(--bg-card)',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div
                          style={{
                            color: isSelected ? 'var(--accent-blue)' : 'var(--text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          <Icon size={18} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: isSelected ? 600 : 500,
                              color: isSelected ? 'var(--accent-blue)' : 'var(--text-primary)',
                            }}
                          >
                            {opt.label}
                          </div>
                          <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                            {opt.desc}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: '9px 18px',
                    borderRadius: 8,
                    background: 'transparent',
                    border: '1.5px solid var(--border-bold)',
                    color: 'var(--text-secondary)',
                    fontSize: 13,
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.color = 'var(--text-primary)'
                    e.currentTarget.style.borderColor = 'var(--text-primary)'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.color = 'var(--text-secondary)'
                    e.currentTarget.style.borderColor = 'var(--border-bold)'
                  }}
                >
                  [ CANCEL ]
                </button>

                <button
                  type="submit"
                  disabled={!title.trim() || isSubmitting}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '9px 20px',
                    borderRadius: 8,
                    background: 'var(--accent-blue)',
                    color: '#08090C',
                    fontSize: 13,
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 600,
                    border: '1.5px solid var(--border-bold)',
                    cursor: title.trim() && !isSubmitting ? 'pointer' : 'not-allowed',
                    opacity: title.trim() && !isSubmitting ? 1 : 0.4,
                    transition: 'opacity 0.15s ease',
                  }}
                >
                  {isSubmitting ? (
                    <span>INITIALIZING AST...</span>
                  ) : (
                    <>
                      <span>CREATE WORKSPACE [ → ]</span>
                      <ArrowRight size={13} />
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

