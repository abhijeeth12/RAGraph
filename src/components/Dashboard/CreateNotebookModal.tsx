import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, BookPlus, Globe, GraduationCap, Code2, LineChart, Image, Sparkles } from 'lucide-react'
import type { FocusMode } from '@/lib/types'

interface Props {
  isOpen: boolean
  onClose: () => void
  onCreate: (title: string, description: string, focus: FocusMode) => Promise<void>
}

const FOCUS_OPTIONS: Array<{ key: FocusMode; label: string; desc: string; icon: any }> = [
  { key: 'all', label: 'All-Purpose', desc: 'General multi-document research', icon: Globe },
  { key: 'academic', label: 'Academic & Papers', desc: 'Theses, abstracts, methodologies', icon: GraduationCap },
  { key: 'code', label: 'Code & Tech Specs', desc: 'Architecture, APIs, technical manuals', icon: Code2 },
  { key: 'finance', label: 'Financial & Reports', desc: '10-Ks, earnings calls, balance sheets', icon: LineChart },
  { key: 'images', label: 'Multimodal Diagrams', desc: 'Figures, flowcharts, architectural schematics', icon: Image },
]

export function CreateNotebookModal({ isOpen, onClose, onCreate }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [focus, setFocus] = useState<FocusMode>('all')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      await onCreate(title, description, focus)
      setTitle('')
      setDescription('')
      setFocus('all')
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="auth-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{ zIndex: 9999 }}
        >
          <motion.div
            className="auth-modal"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            onClick={(e) => e.stopPropagation()}
            style={{ width: 500, maxWidth: '92vw' }}
          >
            <button className="auth-close" onClick={onClose}>
              <X size={18} />
            </button>

            <div className="auth-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}>
                <BookPlus size={20} color="var(--accent-blue)" /> Create New Notebook
              </h2>
              <p>Configure a dedicated hierarchical research workspace</p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Title Input */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--text-primary)' }}>
                  Notebook Title <span style={{ color: 'var(--accent-blue)' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Distributed Consensus Research"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    fontSize: 14,
                  }}
                />
              </div>

              {/* Description Input */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--text-primary)' }}>
                  Description (Optional)
                </label>
                <textarea
                  placeholder="Briefly describe the research thesis or subject..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    fontSize: 13.5,
                    resize: 'none',
                  }}
                />
              </div>

              {/* Research Focus Selector */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 8, color: 'var(--text-primary)' }}>
                  Research Focus Domain
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8 }}>
                  {FOCUS_OPTIONS.map((opt) => {
                    const Icon = opt.icon
                    const isSelected = focus === opt.key
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setFocus(opt.key)}
                        style={{
                          background: isSelected ? 'rgba(168, 199, 250, 0.15)' : 'var(--bg-input)',
                          border: isSelected ? '1px solid var(--accent-blue)' : '1px solid var(--border)',
                          borderRadius: 10,
                          padding: '10px 12px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-start',
                          gap: 4,
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: isSelected ? 'var(--accent-blue)' : 'var(--text-primary)' }}>
                          <Icon size={14} />
                          <span style={{ fontSize: 12.5, fontWeight: 600 }}>{opt.label}</span>
                        </div>
                        <span style={{ fontSize: 10.5, color: 'var(--text-muted)', lineHeight: 1.3 }}>
                          {opt.desc}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-ghost"
                  style={{ borderRadius: 8, padding: '8px 16px', fontSize: 13 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!title.trim() || isSubmitting}
                  className="btn-primary"
                  style={{ borderRadius: 8, padding: '8px 20px', fontSize: 13, opacity: !title.trim() || isSubmitting ? 0.6 : 1 }}
                >
                  {isSubmitting ? 'Creating...' : 'Create Notebook'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
