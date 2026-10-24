import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Globe,
  GraduationCap,
  Code2,
  LineChart,
  Image as ImageIcon,
  Check,
  Loader2,
} from 'lucide-react'
import type { FocusMode } from '@/lib/types'
import { ENABLE_IMAGES } from '@/lib/config'

interface Props {
  isOpen: boolean
  onClose: () => void
  onCreate: (title: string, description: string, focus: FocusMode) => Promise<void>
}

interface FocusOption {
  key: FocusMode
  label: string
  desc: string
  icon: typeof Globe
}

const ALL_FOCUS_OPTIONS: FocusOption[] = [
  {
    key: 'all',
    label: 'General',
    desc: 'Versatile search across diverse documents and notes',
    icon: Globe,
  },
  {
    key: 'academic',
    label: 'Academic',
    desc: 'Optimized for research papers, studies, and citations',
    icon: GraduationCap,
  },
  {
    key: 'code',
    label: 'Code & Tech',
    desc: 'Structured for codebases, technical docs, and manuals',
    icon: Code2,
  },
  {
    key: 'finance',
    label: 'Finance',
    desc: 'Tailored for financial reports, earnings, and tables',
    icon: LineChart,
  },
  {
    key: 'images',
    label: 'Visual',
    desc: 'Focused on diagrams, schematics, and figures',
    icon: ImageIcon,
  },
]

const FOCUS_OPTIONS: FocusOption[] = ENABLE_IMAGES
  ? ALL_FOCUS_OPTIONS
  : ALL_FOCUS_OPTIONS.filter((o) => o.key !== 'images')

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
      setError(err?.message || 'Unable to create notebook. Please try again.')
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
          transition={{ duration: 0.15, ease: 'easeOut' }}
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(4, 5, 8, 0.78)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20,
          }}
        >
          {/* Modal Card — Strictly stationary appearance, zero translate or scale */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#0E1015',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 14,
              width: 520,
              maxWidth: '100%',
              overflow: 'hidden',
              boxShadow: '0 24px 64px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
              position: 'relative',
              color: '#FFFFFF',
              fontFamily: "var(--font-body, 'Inter', -apple-system, BlinkMacSystemFont, sans-serif)",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '22px 24px 18px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                background: 'rgba(255, 255, 255, 0.02)',
              }}
            >
              <div>
                <h2
                  style={{
                    fontFamily: "var(--font-display, 'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif)",
                    fontSize: 18.5,
                    fontWeight: 700,
                    color: '#FFFFFF',
                    margin: '0 0 4px',
                    letterSpacing: '-0.025em',
                  }}
                >
                  Create notebook
                </h2>
                <p
                  style={{
                    fontFamily: "var(--font-body, 'Inter', sans-serif)",
                    fontSize: 13,
                    color: '#9CA3AF',
                    margin: 0,
                    lineHeight: 1.4,
                  }}
                >
                  Set up a dedicated workspace for your documents and synthesis.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: '#9CA3AF',
                  cursor: 'pointer',
                  padding: 6,
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.15s ease, border-color 0.15s ease, color 0.15s ease',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.color = '#FFFFFF'
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.color = '#9CA3AF'
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'
                  e.currentTarget.style.background = 'transparent'
                }}
                title="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ padding: '22px 24px' }}>
              {error && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    color: '#FCA5A5',
                    fontSize: 13,
                    marginBottom: 18,
                    lineHeight: 1.4,
                    fontFamily: "var(--font-body, 'Inter', sans-serif)",
                  }}
                >
                  {error}
                </div>
              )}

              {/* Title Field */}
              <div style={{ marginBottom: 18 }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: 12.5,
                    fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)",
                    fontWeight: 600,
                    letterSpacing: '-0.01em',
                    color: '#E5E7EB',
                    marginBottom: 7,
                  }}
                >
                  Notebook name
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g., Quantum Computing or Market Research"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 13px',
                    borderRadius: 8,
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#FFFFFF',
                    fontSize: 13.5,
                    outline: 'none',
                    transition: 'border-color 0.15s ease, background 0.15s ease',
                    boxSizing: 'border-box',
                    fontFamily: "var(--font-body, 'Inter', sans-serif)",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.35)'
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)'
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                  }}
                />
              </div>

              {/* Description Field */}
              <div style={{ marginBottom: 20 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 7,
                  }}
                >
                  <label
                    style={{
                      fontSize: 12.5,
                      fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)",
                      fontWeight: 600,
                      letterSpacing: '-0.01em',
                      color: '#E5E7EB',
                    }}
                  >
                    Description
                  </label>
                  <span
                    style={{
                      fontSize: 11,
                      fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                      color: '#6B7280',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Optional
                  </span>
                </div>
                <textarea
                  placeholder="What is this workspace for?"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 13px',
                    borderRadius: 8,
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#FFFFFF',
                    fontSize: 13,
                    outline: 'none',
                    resize: 'none',
                    transition: 'border-color 0.15s ease, background 0.15s ease',
                    boxSizing: 'border-box',
                    lineHeight: 1.45,
                    fontFamily: "var(--font-body, 'Inter', sans-serif)",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.35)'
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)'
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                  }}
                />
              </div>

              {/* Focus Mode Selection */}
              <div style={{ marginBottom: 24 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 8,
                  }}
                >
                  <label
                    style={{
                      fontSize: 12.5,
                      fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)",
                      fontWeight: 600,
                      letterSpacing: '-0.01em',
                      color: '#E5E7EB',
                    }}
                  >
                    Research focus
                  </label>
                  <span
                    style={{
                      fontSize: 11,
                      fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                      color: '#6B7280',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Optional
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 6 }}>
                  {FOCUS_OPTIONS.map((opt) => {
                    const isSelected = focus === opt.key
                    const Icon = opt.icon
                    return (
                      <div
                        key={opt.key}
                        onClick={() => setFocus(opt.key)}
                        style={{
                          padding: '9px 12px',
                          borderRadius: 8,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          border: isSelected
                            ? '1px solid rgba(255, 255, 255, 0.3)'
                            : '1px solid rgba(255, 255, 255, 0.06)',
                          background: isSelected
                            ? 'rgba(255, 255, 255, 0.08)'
                            : 'rgba(255, 255, 255, 0.02)',
                          transition: 'background 0.15s ease, border-color 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)'
                          }
                        }}
                      >
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 6,
                            background: isSelected ? '#FFFFFF' : 'rgba(255, 255, 255, 0.05)',
                            color: isSelected ? '#0A0B0E' : '#9CA3AF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            transition: 'background 0.15s ease, color 0.15s ease',
                          }}
                        >
                          <Icon size={14} strokeWidth={2} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 13,
                              fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)",
                              fontWeight: isSelected ? 700 : 600,
                              letterSpacing: '-0.01em',
                              color: isSelected ? '#FFFFFF' : '#D1D5DB',
                              lineHeight: 1.3,
                            }}
                          >
                            {opt.label}
                          </div>
                          <div
                            style={{
                              fontSize: 11.5,
                              fontFamily: "var(--font-body, 'Inter', sans-serif)",
                              color: '#9CA3AF',
                              lineHeight: 1.3,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {opt.desc}
                          </div>
                        </div>

                        {isSelected && (
                          <div
                            style={{
                              width: 18,
                              height: 18,
                              borderRadius: '50%',
                              background: '#FFFFFF',
                              color: '#0A0B0E',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <Check size={11} strokeWidth={3} />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Actions */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: 10,
                  paddingTop: 16,
                  borderTop: '1px solid rgba(255, 255, 255, 0.07)',
                }}
              >
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
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
                  type="submit"
                  disabled={!title.trim() || isSubmitting}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 7,
                    padding: '8px 18px',
                    borderRadius: 8,
                    background: '#FFFFFF',
                    color: '#0A0B0E',
                    fontSize: 12.5,
                    fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)",
                    fontWeight: 700,
                    letterSpacing: '-0.01em',
                    border: 'none',
                    cursor: title.trim() && !isSubmitting ? 'pointer' : 'not-allowed',
                    opacity: title.trim() && !isSubmitting ? 1 : 0.45,
                    transition: 'background 0.15s ease, opacity 0.15s ease',
                  }}
                  onMouseOver={(e) => {
                    if (title.trim() && !isSubmitting) {
                      e.currentTarget.style.background = '#E5E7EB'
                    }
                  }}
                  onMouseOut={(e) => {
                    if (title.trim() && !isSubmitting) {
                      e.currentTarget.style.background = '#FFFFFF'
                    }
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create notebook</span>
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
