'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Settings2, Sliders, Cpu, Sparkles } from 'lucide-react'
import { useSearchStore } from '@/store/useSearchStore'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function SettingsModal({ isOpen, onClose }: Props) {
  const {
    model,
    setModel,
    focus,
    setFocus,
    useHyde,
    setUseHyde,
    useDualPath,
    setUseDualPath,
  } = useSearchStore()

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
            style={{ width: 440 }}
          >
            <button className="auth-close" onClick={onClose}>
              <X size={18} />
            </button>

            <div className="auth-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}>
                <Settings2 size={18} color="var(--accent-blue)" /> RAGraph Settings
              </h2>
              <p>Configure retrieval engines and model parameters</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Language Model */}
              <div>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 13,
                    fontWeight: 500,
                    marginBottom: 8,
                    color: 'var(--text-primary)',
                  }}
                >
                  <Cpu size={14} /> Language Model
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
                    fontSize: 13.5,
                  }}
                >
                  <option value="openrouter/free">Auto Free (OpenRouter)</option>
                  <option value="gpt-4o">GPT-4o (OpenAI)</option>
                  <option value="claude-3-5-sonnet">Claude 3.5 Sonnet (Anthropic)</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro (Google)</option>
                  <option value="meta-llama/llama-3.3-70b-instruct:free">Llama 3.3 70B (Free)</option>
                  <option value="google/gemma-3-27b-it:free">Gemma 3 27B (Free)</option>
                </select>
              </div>

              {/* Search Focus */}
              <div>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 13,
                    fontWeight: 500,
                    marginBottom: 8,
                    color: 'var(--text-primary)',
                  }}
                >
                  <Sliders size={14} /> Search Focus
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
                    fontSize: 13.5,
                  }}
                >
                  <option value="all">All Documents (Unconstrained)</option>
                  <option value="academic">Academic & Research Papers</option>
                  <option value="code">Code & Technical Specs</option>
                  <option value="finance">Financial & Executive Reports</option>
                  <option value="images">Diagrams & Figure Analysis</option>
                </select>
              </div>

              {/* Advanced Retrieval Features */}
              <div
                style={{
                  borderTop: '1px solid var(--border)',
                  paddingTop: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Retrieval Engine Strategies
                </p>

                {/* HyDE toggle */}
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    fontSize: 13,
                    color: 'var(--text-primary)',
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 500 }}>HyDE (Hypothetical Embeddings)</span>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      Hallucinates a candidate answer to traverse dense vector space
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={useHyde}
                    onChange={(e) => setUseHyde(e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: 'var(--accent-blue)', cursor: 'pointer' }}
                  />
                </label>

                {/* Dual-Path Fallback toggle */}
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    fontSize: 13,
                    color: 'var(--text-primary)',
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 500 }}>Dual-Path Fallback Search</span>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      Fuses tree beam search with flat BM25 when threshold drops
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={useDualPath}
                    onChange={(e) => setUseDualPath(e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: 'var(--accent-blue)', cursor: 'pointer' }}
                  />
                </label>
              </div>
            </div>

            <div style={{ marginTop: 20, textAlign: 'right' }}>
              <button className="btn-primary" onClick={onClose} style={{ marginLeft: 'auto' }}>
                Done
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
