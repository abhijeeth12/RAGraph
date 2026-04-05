'use client'
import { motion } from 'framer-motion'
import { Source } from '@/lib/types'
import { getFaviconUrl } from '@/lib/utils'
import { ExternalLink } from 'lucide-react'

interface Props {
  sources: Source[]
}

export function SourceCard({ sources }: Props) {
  if (!sources.length) return null

  // Deduplicate by snippet text (first 80 chars) to prevent same chunk appearing multiple times
  const seen = new Set<string>()
  const unique = sources.filter((src) => {
    const key = src.snippet.slice(0, 80).trim().toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  if (!unique.length) return null

  return (
    <div style={{ marginBottom: 24 }}>
      <p className="section-label" style={{ marginBottom: 10 }}>
        {unique.length} source{unique.length !== 1 ? 's' : ''}
      </p>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: 10,
      }}>
        {unique.map((src, i) => {
          const faviconUrl = getFaviconUrl(src.url)
          return (
            <motion.a
              key={`${src.id}-${i}`}
              href={src.url.startsWith('#') ? undefined : src.url}
              target={src.url.startsWith('#') ? undefined : '_blank'}
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              style={{
                display: 'flex', flexDirection: 'column', gap: 6,
                padding: '12px 14px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 12, textDecoration: 'none',
                cursor: 'pointer', position: 'relative',
                overflow: 'hidden',
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
              whileHover={{ y: -1 }}
            >
              {/* Relevance bar */}
              <div style={{
                position: 'absolute', top: 0, left: 0, height: 2,
                width: `${Math.min(src.relevance_score * 100, 100)}%`,
                background: 'var(--accent-blue)',
                borderRadius: '12px 0 0 0', opacity: 0.7,
              }} />

              {/* Domain row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {faviconUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={faviconUrl}
                    alt="" width={14} height={14}
                    style={{ borderRadius: 3, flexShrink: 0 }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                )}
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
                  {src.domain}
                </span>
                <ExternalLink size={10} style={{ color: 'var(--text-muted)', marginLeft: 'auto', flexShrink: 0 }} />
              </div>

              {/* Title */}
              <p style={{
                fontSize: 12.5, fontWeight: 500, color: 'var(--text-primary)',
                lineHeight: 1.45, margin: 0,
                display: '-webkit-box', WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>
                {src.title}
              </p>

              {/* Heading path */}
              {src.heading_path?.length > 0 && (
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {src.heading_path.slice(0, 2).map((h, j) => (
                    <span key={`${src.id}-${j}`} style={{
                      fontSize: 10, background: 'var(--bg-secondary)',
                      color: 'var(--text-muted)', borderRadius: 4,
                      padding: '1px 6px', maxWidth: 120,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {h}
                    </span>
                  ))}
                </div>
              )}

              {/* Snippet */}
              <p style={{
                fontSize: 11.5, color: 'var(--text-secondary)',
                lineHeight: 1.5, margin: 0,
                display: '-webkit-box', WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>
                {src.snippet}
              </p>
            </motion.a>
          )
        })}
      </div>
    </div>
  )
}
