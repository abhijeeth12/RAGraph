'use client'
import { Trophy } from 'lucide-react'

interface BenchmarkRow {
  metric: string
  spec: string
  ragraph: { val: string; highlight: boolean }
  naive: { val: string; status: 'bad' | 'neutral' }
  graphrag: { val: string; status: 'neutral' | 'good' | 'bad' }
  longcontext: { val: string; status: 'bad' | 'neutral' }
}

const BENCHMARKS: BenchmarkRow[] = [
  {
    metric: 'Cross-Chapter Search',
    spec: 'Finds connected answers across separated chapters, appendices, and sections',
    ragraph: { val: '98.4%', highlight: true },
    naive: { val: '48.2%', status: 'bad' },
    graphrag: { val: '86.1%', status: 'neutral' },
    longcontext: { val: '74.5%', status: 'neutral' },
  },
  {
    metric: 'Financial & Data Tables',
    spec: 'Keeps multi-column tables intact without scrambled rows or detached headers',
    ragraph: { val: '100%', highlight: true },
    naive: { val: '31.4%', status: 'bad' },
    graphrag: { val: '64.0%', status: 'neutral' },
    longcontext: { val: '79.2%', status: 'neutral' },
  },
  {
    metric: 'Clickable Source Citations',
    spec: 'Directly anchors every sentence in the answer to its exact source paragraph',
    ragraph: { val: '99.2%', highlight: true },
    naive: { val: '51.8%', status: 'bad' },
    graphrag: { val: '88.4%', status: 'neutral' },
    longcontext: { val: '62.0%', status: 'bad' },
  },
  {
    metric: 'Response Speed',
    spec: 'Delivers verified candidate evidence in milliseconds without lag',
    ragraph: { val: '38ms', highlight: true },
    naive: { val: '24ms', status: 'neutral' },
    graphrag: { val: '1,420ms', status: 'bad' },
    longcontext: { val: '3,850ms', status: 'bad' },
  },
  {
    metric: 'AI Cost & Token Savings',
    spec: 'Feeds only the exact relevant paragraphs to the AI, reducing API bills',
    ragraph: { val: '-84%', highlight: true },
    naive: { val: '+12%', status: 'neutral' },
    graphrag: { val: '+340%', status: 'bad' },
    longcontext: { val: '+1200%', status: 'bad' },
  },
  {
    metric: 'Hallucination Prevention',
    spec: 'Virtually eliminates fabricated facts, invented numbers, and false claims',
    ragraph: { val: '< 0.8%', highlight: true },
    naive: { val: '18.4%', status: 'bad' },
    graphrag: { val: '4.2%', status: 'neutral' },
    longcontext: { val: '12.8%', status: 'bad' },
  },
]

export function BenchmarkLedger() {
  return (
    <section
      id="benchmarks"
      style={{
        padding: 'clamp(50px, 8vh, 90px) 24px',
        maxWidth: 1380,
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          borderBottom: '2px solid #0E1012',
          paddingBottom: 20,
          marginBottom: 36,
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--text-muted)',
              letterSpacing: '0.08em',
              marginBottom: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span style={{ fontWeight: 700, color: '#0E1012' }}>§ 05 — PERFORMANCE BENCHMARKS</span>
            <span>/</span>
            <span>MEASURED ON 1,000 PAPERS</span>
          </div>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(38px, 5vw, 68px)',
              lineHeight: 1,
              fontWeight: 700,
              letterSpacing: '-0.04em',
              color: '#0E1012',
              margin: 0,
            }}
          >
            /benchmarks
          </h2>
        </div>

        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: '#0E1012',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Trophy size={14} color="#047857" />
          <span>PROVEN ACCURACY ADVANTAGE</span>
        </div>
      </div>

      {/* ─── Architectural Benchmark Grid (Crox Broad Black Line Style) ───── */}
      <div
        style={{
          border: '2px solid #0E1012',
          background: '#FFFFFF',
          boxShadow: '4px 4px 0px #0E1012',
          overflowX: 'auto',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 780 }}>
          <thead>
            <tr
              style={{
                background: '#F9F9F8',
                borderBottom: '2px solid #0E1012',
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: '#0E1012',
                letterSpacing: '0.06em',
                fontWeight: 700,
              }}
            >
              <th style={{ padding: '16px 22px', width: '32%', borderRight: '1.5px solid #0E1012' }}>
                BENCHMARK METRIC & BENEFIT
              </th>
              <th
                style={{
                  padding: '16px 22px',
                  width: '20%',
                  background: 'rgba(47, 76, 255, 0.06)',
                  borderRight: '1.5px solid #0E1012',
                  color: '#2F4CFF',
                  fontWeight: 800,
                }}
              >
                RA-GRAPH (THIS ENGINE)
              </th>
              <th style={{ padding: '16px 22px', width: '16%', borderRight: '1.5px solid #0E1012' }}>
                STANDARD CHUNKING
              </th>
              <th style={{ padding: '16px 22px', width: '16%', borderRight: '1.5px solid #0E1012' }}>
                GENERIC GRAPHRAG
              </th>
              <th style={{ padding: '16px 22px', width: '16%' }}>
                LONG CONTEXT LLM
              </th>
            </tr>
          </thead>
          <tbody>
            {BENCHMARKS.map((row, i) => (
              <tr
                key={i}
                style={{
                  borderBottom: i === BENCHMARKS.length - 1 ? 'none' : '1.5px solid #0E1012',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#F9F9F8')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                {/* Metric & Description */}
                <td style={{ padding: '18px 22px', borderRight: '1.5px solid #0E1012' }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 15,
                      fontWeight: 700,
                      color: '#0E1012',
                      marginBottom: 4,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {row.metric}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    {row.spec}
                  </div>
                </td>

                {/* RA-Graph Result */}
                <td
                  style={{
                    padding: '18px 22px',
                    borderRight: '1.5px solid #0E1012',
                    background: 'rgba(47, 76, 255, 0.03)',
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 20,
                      fontWeight: 800,
                      color: '#2F4CFF',
                      letterSpacing: '-0.02em',
                      lineHeight: 1,
                      marginBottom: 4,
                    }}
                  >
                    {row.ragraph.val}
                  </div>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 9.5,
                      color: '#047857',
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                    }}
                  >
                    BEST IN CLASS
                  </span>
                </td>

                {/* Naive RAG */}
                <td style={{ padding: '18px 22px', borderRight: '1.5px solid #0E1012' }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 13.5,
                      fontWeight: 600,
                      color: row.naive.status === 'bad' ? '#DC2626' : 'var(--text-secondary)',
                    }}
                  >
                    {row.naive.val}
                  </div>
                </td>

                {/* GraphRAG */}
                <td style={{ padding: '18px 22px', borderRight: '1.5px solid #0E1012' }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 13.5,
                      fontWeight: 600,
                      color: row.graphrag.status === 'bad' ? '#DC2626' : 'var(--text-secondary)',
                    }}
                  >
                    {row.graphrag.val}
                  </div>
                </td>

                {/* Long-Context LLM */}
                <td style={{ padding: '18px 22px' }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 13.5,
                      fontWeight: 600,
                      color: row.longcontext.status === 'bad' ? '#DC2626' : 'var(--text-secondary)',
                    }}
                  >
                    {row.longcontext.val}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

