'use client'
import type { CitationEntry } from '@/lib/types'

interface Props {
  citationMap: Record<string, CitationEntry>
}

export function CitationMap({ citationMap }: Props) {
  const entries = Object.entries(citationMap)
  if (!entries.length) return null

  // Deduplicate by doc_number
  const seen = new Set<number>()
  const unique = entries.filter(([, v]) => {
    if (seen.has(v.doc_number)) return false
    seen.add(v.doc_number)
    return true
  })

  return (
    <div
      style={{
        marginTop: 8,
        padding: '7px 11px',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        fontSize: 11,
      }}
    >
      <p
        style={{
          fontSize: 9.5,
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          marginBottom: 6,
        }}
      >
        Sources used
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
        {unique.map(([, entry], idx) => (
          <div
            key={`citation-row-${idx}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              padding: '3px 8px',
            }}
          >
            <span
              style={{
                background: 'var(--accent-blue)',
                color: '#131314',
                borderRadius: 3,
                padding: '1px 5px',
                fontSize: 9.5,
                fontWeight: 700,
              }}
            >
              Doc {entry.doc_number}
            </span>
            <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>
              {entry.filename.length > 30 ? entry.filename.slice(0, 28) + '…' : entry.filename}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
