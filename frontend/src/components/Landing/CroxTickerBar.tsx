'use client'
export function CroxTickerBar() {
  const items = [
    'VERIFIED SOURCE CITATIONS',
    'INTERACTIVE KNOWLEDGE MAPS',
    'INSTANT ANSWERS FROM YOUR NOTES',
    'MULTI-DOCUMENT SYNTHESIS',
    'CLICK-TO-SOURCE EVIDENCE',
    'DEEP CONCEPT RELATIONSHIPS',
    'PRIVATE & ORGANIZED NOTEBOOKS',
    'SMART STUDY ASSISTANT',
  ]

  return (
    <div
      style={{
        background: '#0E1012',
        color: '#FFFFFF',
        borderTop: '1px solid #0E1012',
        borderBottom: '1px solid #0E1012',
        padding: '12px 0',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        display: 'flex',
        alignItems: 'center',
        userSelect: 'none',
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          gap: 36,
          animation: 'ticker 28s linear infinite',
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '0.12em',
        }}
      >
        {[...items, ...items, ...items].map((text, idx) => (
          <div key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: 36 }}>
            <span>{text}</span>
            <span style={{ color: '#FF5500', fontWeight: 900 }}>/</span>
          </div>
        ))}
      </div>
    </div>
  )
}
