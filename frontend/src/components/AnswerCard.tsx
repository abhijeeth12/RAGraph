'use client'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { SourceCard } from './SourceCard'
import { CitationMap } from './CitationMap'
import { ImageGrid }  from './ImageGrid'
import type { Source, RetrievedImage } from '@/lib/types'
import { Copy, Check, RotateCcw, Zap, GitBranch, Clock, Hash } from 'lucide-react'
import { useState } from 'react'

interface Props {
  content: string
  sources: Source[]
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
  citationMap?: Record<string, import('@/lib/types').CitationEntry>
  onRetry?: () => void
}

export function AnswerCard({
  content, sources, images, relatedQuestions,
  isStreaming, meta, citationMap, onFollowUp, onRetry,
}: Props) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <SourceCard sources={sources} />
      <ImageGrid images={images} />

      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 16, padding: '20px 24px', marginBottom: 16, position: 'relative',
      }}>
        {/* Action buttons */}
        <div style={{ position: 'absolute', top: 14, right: 14, display: 'flex', gap: 6 }}>
          {onRetry && (
            <button onClick={onRetry} className="btn-ghost"
              style={{ padding: '4px 8px', borderRadius: 8 }} title="Retry">
              <RotateCcw size={13} />
            </button>
          )}
          <button onClick={handleCopy} className="btn-ghost"
            style={{ padding: '4px 8px', borderRadius: 8 }} title="Copy">
            {copied
              ? <Check size={13} style={{ color: 'var(--accent-green)' }} />
              : <Copy size={13} />}
          </button>
        </div>

        {/* Meta badges */}
        {meta && !isStreaming && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            {meta.hyde_used && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                fontSize: 10.5, fontWeight: 600, letterSpacing: '0.04em',
                background: 'var(--accent-blue-light)', color: 'var(--accent-blue)',
                padding: '2px 8px', borderRadius: 99,
              }}>
                <Zap size={9} /> HyDE
              </span>
            )}
            {meta.dual_path_fallback_used && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                fontSize: 10.5, fontWeight: 600, letterSpacing: '0.04em',
                background: 'var(--bg-secondary)', color: 'var(--text-muted)',
                padding: '2px 8px', borderRadius: 99,
              }}>
                <GitBranch size={9} /> Dual-path
              </span>
            )}
            {meta.chunks_used !== undefined && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                fontSize: 10.5, color: 'var(--text-muted)',
                padding: '2px 8px', borderRadius: 99,
                background: 'var(--bg-secondary)',
              }}>
                <Hash size={9} /> {meta.chunks_used} chunks
              </span>
            )}
            {meta.time_ms !== undefined && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                fontSize: 10.5, color: 'var(--text-muted)',
                padding: '2px 8px', borderRadius: 99,
                background: 'var(--bg-secondary)',
              }}>
                <Clock size={9} /> {(meta.time_ms / 1000).toFixed(1)}s
              </span>
            )}
          </div>
        )}

        <div className={`prose-answer ${isStreaming ? 'stream-cursor' : ''}`}>
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({ ...props }) => {
                if (props.href?.startsWith('#doc-')) {
                  return (
                    <sup style={{ margin: '0 2px', fontWeight: 600 }}>
                      <a {...props} style={{ textDecoration: 'none', color: 'var(--accent-blue)' }} onClick={(e) => e.preventDefault()} />
                    </sup>
                  )
                }
                return <a {...props} />
              }
            }}
          >
            {content.replace(/\[Doc\s+(\d+)\]/gi, '[[$1]](#doc-$1)')}
          </ReactMarkdown>
        </div>
      </div>

      {relatedQuestions.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <p className="section-label" style={{ marginBottom: 10 }}>Related questions</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {relatedQuestions.map((q, index) => (
              <motion.button
                key={q || `related-${index}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.08 }}
                onClick={() => onFollowUp?.(q)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '11px 16px',
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                  fontSize: 13.5, color: 'var(--text-primary)',
                  fontFamily: 'var(--font-body)', transition: 'background 0.15s',
                }}
                whileHover={{ x: 3 }}
              >
                <span style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>+</span>
                {q}
              </motion.button>
            ))}
          </div>
        </div>
      )}
      {citationMap && Object.keys(citationMap).length > 0 && (
        <CitationMap citationMap={citationMap} />
      )}
    </motion.div>
  )
}
