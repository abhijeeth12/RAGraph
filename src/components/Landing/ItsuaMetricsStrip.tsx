import { motion } from 'framer-motion'

interface MetricPillar {
  label: string
  value: string
  sub: string
  accentColor: string
}

const METRICS: MetricPillar[] = [
  {
    label: 'AST DEPTH',
    value: 'k=4',
    sub: 'OUTLINE LEVELS RETAINED',
    accentColor: 'var(--text-primary)',
  },
  {
    label: 'GROUNDING',
    value: '99.2%',
    sub: 'MATHEMATICAL CITATION PRECISION',
    accentColor: '#2F4CFF',
  },
  {
    label: 'LATENCY',
    value: '38ms',
    sub: 'DUAL-PATH BEAM TRAVERSAL',
    accentColor: '#FF5500',
  },
  {
    label: 'RECALL@5',
    value: '98.4%',
    sub: 'MULTI-HOP EVIDENCE DISCOVERY',
    accentColor: '#047857',
  },
  {
    label: 'CAPACITY',
    value: '50M+',
    sub: 'TOKENS PER UNIFIED GRAPH',
    accentColor: 'var(--text-primary)',
  },
]

export function ItsuaMetricsStrip() {
  return (
    <div
      style={{
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
        background: '#FFFFFF',
        width: '100%',
      }}
    >
      <div
        style={{
          maxWidth: 1380,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        }}
        className="divide-y md:divide-y-0 md:divide-x divide-black/[0.08]"
      >
        {METRICS.map((metric, i) => (
          <div
            key={i}
            style={{
              padding: '36px 28px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Top Eyebrow */}
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                fontWeight: 600,
                color: metric.accentColor,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: 8,
              }}
            >
              {metric.label}
            </span>

            {/* Monumental Counter */}
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(36px, 4.5vw, 56px)',
                lineHeight: 1,
                fontWeight: 600,
                letterSpacing: '-0.04em',
                color: metric.accentColor,
                margin: '6px 0',
              }}
            >
              {metric.value}
            </div>

            {/* Bottom Subtitle */}
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'var(--text-muted)',
                letterSpacing: '0.05em',
                marginTop: 6,
              }}
            >
              {metric.sub}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
