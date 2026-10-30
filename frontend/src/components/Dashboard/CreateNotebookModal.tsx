'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2 } from 'lucide-react'
import type { FocusMode } from '@/lib/types'

interface Props {
  isOpen: boolean
  onClose: () => void
  onCreate: (title: string, description: string, focus: FocusMode) => Promise<void>
}

export function CreateNotebookModal({ isOpen, onClose, onCreate }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || isSubmitting) return

    setIsSubmitting(true)
    setError(null)
    try {
      await onCreate(title.trim(), description.trim(), 'all')
      setTitle('')
      setDescription('')
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
              width: 480,
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
              <div style={{ marginBottom: 24 }}>
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
                  rows={3}
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
