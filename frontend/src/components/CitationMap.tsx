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
    <div style={{
      marginTop: 12, padding: '10px 14px',
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border)',
      borderRadius: 10, fontSize: 12,
    }}>
      <p style={{
        fontSize: 10.5, fontWeight: 600, letterSpacing: '0.06em',
        textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8,
      }}>
        Sources used
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {unique.map(([, entry], idx) => (
          <div
            key={`citation-row-${idx}`}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 8, padding: '4px 10px',
            }}>
            <span style={{
              background: 'var(--accent-blue)', color: 'white',
              borderRadius: 4, padding: '1px 6px',
              fontSize: 10, fontWeight: 700,
            }}>
              Doc {entry.doc_number}
            </span>
            <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
              {entry.filename.length > 30
                ? entry.filename.slice(0, 28) + '…'
                : entry.filename}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
