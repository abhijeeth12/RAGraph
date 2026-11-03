'use client'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ImageGrid } from './ImageGrid'
import { ENABLE_IMAGES } from '@/lib/config'
import type { RetrievedImage } from '@/lib/types'
import { Copy, Check, RotateCcw, Zap, GitBranch, Clock, Hash } from 'lucide-react'
import { useState } from 'react'

interface Props {
  content: string
  images: RetrievedImage[]
  relatedQuestions: string[]
  isStreaming?: boolean
  meta?: {
    time_ms?: number
    tokens?: number
    hyde_used?: boolean
    dual_path_fallback_used?: boolean
    total_candidates?: number
    chunks_used?: number
  }
  onFollowUp?: (q: string) => void
  onRetry?: () => void
}

export function AnswerCard({
  content,
  images,
  relatedQuestions,
  isStreaming,
  meta,
  onFollowUp,
  onRetry,
}: Props) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      {ENABLE_IMAGES && <ImageGrid images={images} />}

      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: '14px 18px',
          marginBottom: 12,
          position: 'relative',
        }}
      >
        {/* Action buttons */}
        <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 4 }}>
          {onRetry && (
            <button
              onClick={onRetry}
              className="btn-ghost"
              style={{ padding: '3px 6px', borderRadius: 6 }}
              title="Retry"
            >
              <RotateCcw size={12} />
            </button>
          )}
          <button
            onClick={handleCopy}
            className="btn-ghost"
            style={{ padding: '3px 6px', borderRadius: 6 }}
            title="Copy"
          >
            {copied ? (
              <Check size={12} style={{ color: 'var(--accent-green)' }} />
            ) : (
              <Copy size={12} />
            )}
          </button>
        </div>

        {/* Meta badges */}
        {meta && !isStreaming && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
            {meta.hyde_used && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  fontSize: 9.5,
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  background: 'var(--accent-blue-light)',
                  color: 'var(--accent-blue)',
                  padding: '2px 6px',
                  borderRadius: 99,
                }}
              >
                <Zap size={8.5} /> HyDE
              </span>
            )}
            {meta.dual_path_fallback_used && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  fontSize: 9.5,
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-muted)',
                  padding: '2px 6px',
                  borderRadius: 99,
                }}
              >
                <GitBranch size={8.5} /> Dual-path
              </span>
            )}
            {meta.chunks_used !== undefined && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  fontSize: 9.5,
                  color: 'var(--text-muted)',
                  padding: '2px 6px',
                  borderRadius: 99,
                  background: 'var(--bg-secondary)',
                }}
              >
                <Hash size={8.5} /> {meta.chunks_used} chunks
              </span>
            )}
            {meta.time_ms !== undefined && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  fontSize: 9.5,
                  color: 'var(--text-muted)',
                  padding: '2px 6px',
                  borderRadius: 99,
                  background: 'var(--bg-secondary)',
                }}
              >
                <Clock size={8.5} /> {meta.time_ms}ms
              </span>
            )}
          </div>
        )}

        {/* Prose text */}
        <div className={`prose-answer ${isStreaming ? 'stream-cursor' : ''}`}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({ href, children }) => {
                if (href?.startsWith('#doc-')) {
                  return (
                    <span
                      style={{
                        color: 'var(--accent-blue)',
                        background: 'rgba(168,199,250,0.15)',
                        padding: '1px 5px',
                        borderRadius: 3,
                        fontSize: '0.9em',
                        fontWeight: 600,
                      }}
                    >
                      {children}
                    </span>
                  )
                }
                return (
                  <a href={href} target="_blank" rel="noopener noreferrer">
                    {children}
                  </a>
                )
              },
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>

      {/* Follow-up related questions */}
      {relatedQuestions.length > 0 && !isStreaming && (
        <div style={{ marginTop: 8, marginBottom: 14 }}>
          <p className="section-label" style={{ marginBottom: 5, color: 'var(--text-muted)', fontSize: 10 }}>
            Related inquiries
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {relatedQuestions.map((q, idx) => (
              <button
                key={`rel-${idx}`}
                onClick={() => onFollowUp?.(q)}
                style={{
                  textAlign: 'left',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: '6px 10px',
                  color: 'var(--text-secondary)',
                  fontSize: 12,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.color = 'var(--text-primary)'
                  e.currentTarget.style.borderColor = 'var(--accent-blue)'
                  e.currentTarget.style.background = 'var(--bg-hover)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.color = 'var(--text-secondary)'
                  e.currentTarget.style.borderColor = 'var(--border)'
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                }}
              >
                → {q}
              </button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}
