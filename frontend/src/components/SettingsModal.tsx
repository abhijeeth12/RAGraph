'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Settings2 } from 'lucide-react'
import { useSearchStore } from '@/store/useSearchStore'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function SettingsModal({ isOpen, onClose }: Props) {
  const { model, setModel, focus, setFocus } = useSearchStore()

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="auth-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="auth-modal"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            style={{ width: 400 }}
          >
            <button className="auth-close" onClick={onClose}>
              <X size={18} />
            </button>

            <div className="auth-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Settings2 size={18} /> RAGraph Settings
              </h2>
              <p>Configure your workspace experience</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 8, color: 'var(--text-primary)' }}>
                  Language Model
                </label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    fontSize: 14,
                  }}
                >
                  <option value="openrouter/free">OpenRouter (Free)</option>
                  <option value="gpt-4o">GPT-4o (OpenAI)</option>
                  <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 8, color: 'var(--text-primary)' }}>
                  Search Focus
                </label>
                <select
                  value={focus}
                  onChange={(e) => setFocus(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    fontSize: 14,
                  }}
                >
                  <option value="all">All Documents</option>
                  <option value="academic">Academic Search</option>
                  <option value="finance">Financial Reports</option>
                  <option value="code">Codebase</option>
                </select>
              </div>
            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
