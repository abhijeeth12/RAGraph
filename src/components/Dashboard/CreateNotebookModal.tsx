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
            background: 'rgba(17, 24, 39, 0.45)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20,
          }}
        >
          {/* Modal Card — Light, tactile, beautifully rounded squircle */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#FFFFFF',
              border: '1px solid rgba(0, 0, 0, 0.08)',
              borderRadius: 24,
              width: 520,
              maxWidth: '100%',
              overflow: 'hidden',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.14), 0 4px 16px rgba(0, 0, 0, 0.04)',
              position: 'relative',
              color: '#111827',
              fontFamily: "var(--font-body, 'Inter', -apple-system, BlinkMacSystemFont, sans-serif)",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '24px 28px 18px',
                borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                background: '#FAFAFA',
              }}
            >
              <div>
                <h2
                  style={{
                    fontFamily: "var(--font-display, 'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif)",
                    fontSize: 19,
                    fontWeight: 700,
                    color: '#111827',
                    margin: '0 0 4px',
                    letterSpacing: '-0.025em',
                  }}
                >
                  Create notebook
                </h2>
                <p
                  style={{
                    fontSize: 13,
                    color: '#6B7280',
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
                  border: 'none',
                  color: '#6B7280',
                  cursor: 'pointer',
                  padding: 6,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.15s ease, color 0.15s ease',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.06)'
                  e.currentTarget.style.color = '#111827'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = '#6B7280'
                }}
                title="Close"
              >
                <X size={17} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ padding: '22px 28px' }}>
              {error && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 12,
                    background: '#FEE2E2',
                    border: '1px solid #FCA5A5',
                    color: '#991B1B',
                    fontSize: 13,
                    marginBottom: 18,
                    lineHeight: 1.4,
                    fontWeight: 500,
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
                    fontSize: 13,
                    fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)",
                    fontWeight: 700,
                    letterSpacing: '-0.01em',
                    color: '#111827',
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
                    padding: '10px 14px',
                    borderRadius: 12,
                    background: '#F9FAFB',
                    border: '1.5px solid #E5E7EB',
                    color: '#111827',
                    fontSize: 14,
                    outline: 'none',
                    transition: 'border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease',
                    boxSizing: 'border-box',
                    fontFamily: "var(--font-body, 'Inter', sans-serif)",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#111827'
                    e.currentTarget.style.background = '#FFFFFF'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(17, 24, 39, 0.06)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#E5E7EB'
                    e.currentTarget.style.background = '#F9FAFB'
                    e.currentTarget.style.boxShadow = 'none'
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
                      fontSize: 13,
                      fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)",
                      fontWeight: 700,
                      letterSpacing: '-0.01em',
                      color: '#111827',
                    }}
                  >
                    Description
                  </label>
                  <span
                    style={{
                      fontSize: 11,
                      fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                      color: '#9CA3AF',
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
                    padding: '10px 14px',
                    borderRadius: 12,
                    background: '#F9FAFB',
                    border: '1.5px solid #E5E7EB',
                    color: '#111827',
                    fontSize: 13.5,
                    outline: 'none',
                    resize: 'none',
                    transition: 'border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease',
                    boxSizing: 'border-box',
                    lineHeight: 1.45,
                    fontFamily: "var(--font-body, 'Inter', sans-serif)",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#111827'
                    e.currentTarget.style.background = '#FFFFFF'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(17, 24, 39, 0.06)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#E5E7EB'
                    e.currentTarget.style.background = '#F9FAFB'
                    e.currentTarget.style.boxShadow = 'none'
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
                      fontSize: 13,
                      fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)",
                      fontWeight: 700,
                      letterSpacing: '-0.01em',
                      color: '#111827',
                    }}
                  >
                    Research focus
                  </label>
                  <span
                    style={{
                      fontSize: 11,
                      fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                      color: '#9CA3AF',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Optional
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 7 }}>
                  {FOCUS_OPTIONS.map((opt) => {
                    const isSelected = focus === opt.key
                    const Icon = opt.icon
                    return (
                      <div
                        key={opt.key}
                        onClick={() => setFocus(opt.key)}
                        style={{
                          padding: '9px 12px',
                          borderRadius: 12,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          border: isSelected
                            ? '1.5px solid #111827'
                            : '1.5px solid #E5E7EB',
                          background: isSelected
                            ? '#111827'
                            : '#F9FAFB',
                          color: isSelected ? '#FFFFFF' : '#111827',
                          transition: 'background 0.15s ease, border-color 0.15s ease, transform 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.background = '#F3F4F6'
                            e.currentTarget.style.borderColor = '#D1D5DB'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.background = '#F9FAFB'
                            e.currentTarget.style.borderColor = '#E5E7EB'
                          }
                        }}
                      >
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 8,
                            background: isSelected ? 'rgba(255, 255, 255, 0.15)' : '#FFFFFF',
                            color: isSelected ? '#FFFFFF' : '#374151',
                            border: isSelected ? 'none' : '1px solid #E5E7EB',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <Icon size={14} strokeWidth={2.2} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 13,
                              fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)",
                              fontWeight: isSelected ? 700 : 600,
                              letterSpacing: '-0.01em',
                              color: isSelected ? '#FFFFFF' : '#111827',
                              lineHeight: 1.3,
                            }}
                          >
                            {opt.label}
                          </div>
                          <div
                            style={{
                              fontSize: 11.5,
                              color: isSelected ? 'rgba(255, 255, 255, 0.72)' : '#6B7280',
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
                              color: '#111827',
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
                  borderTop: '1px solid rgba(0, 0, 0, 0.06)',
                }}
              >
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: '9px 18px',
                    borderRadius: 20,
                    background: '#F3F4F6',
                    border: 'none',
                    color: '#374151',
                    fontSize: 13,
                    fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)",
                    fontWeight: 600,
                    letterSpacing: '-0.01em',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = '#E5E7EB'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = '#F3F4F6'
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
                    padding: '9px 22px',
                    borderRadius: 20,
                    background: '#111827',
                    color: '#FFFFFF',
                    fontSize: 13,
                    fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)",
                    fontWeight: 700,
                    letterSpacing: '-0.01em',
                    border: 'none',
                    cursor: title.trim() && !isSubmitting ? 'pointer' : 'not-allowed',
                    opacity: title.trim() && !isSubmitting ? 1 : 0.45,
                    boxShadow: title.trim() && !isSubmitting ? '0 4px 12px rgba(0, 0, 0, 0.12)' : 'none',
                    transition: 'background 0.15s ease, opacity 0.15s ease',
                  }}
                  onMouseOver={(e) => {
                    if (title.trim() && !isSubmitting) {
                      e.currentTarget.style.background = '#000000'
                    }
                  }}
                  onMouseOut={(e) => {
                    if (title.trim() && !isSubmitting) {
                      e.currentTarget.style.background = '#111827'
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
