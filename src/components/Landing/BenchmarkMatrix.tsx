import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, X, Shield, ArrowUpRight, BarChart2, Activity } from 'lucide-react'

interface BenchmarkRow {
  metric: string
  naiveFlat: string
  flatHybrid: string
  ragraph: string
  significance: string
  highlight?: boolean
}

const DATASETS = [
  {
    id: 'technical-specs',
    name: 'Technical Specifications (100k+ tokens)',
    desc: 'Distributed consensus specs, RFC standards, and compiler manuals with deep subsection dependencies.',
    rows: [
      {
        metric: 'Cross-Section Context Retention',
        naiveFlat: '58.4%',
        flatHybrid: '69.1%',
        ragraph: '94.8%',
        significance: 'Preserves ancestral heading context across multi-clause specifications',
        highlight: true,
      },
      {
        metric: 'Multi-Hop Query Accuracy (HotpotQA-style)',
        naiveFlat: '51.2%',
        flatHybrid: '64.8%',
        ragraph: '89.6%',
        significance: 'Follows cross-references between Section 3 and Section 12',
        highlight: true,
      },
      {
        metric: 'Hallucination on Severed Boundaries',
        naiveFlat: '32.6%',
        flatHybrid: '24.1%',
        ragraph: '3.2%',
        significance: 'Zero mid-sentence cuts or severed parameter tables',
        highlight: true,
      },
      {
        metric: 'Citation Coordinate Accuracy',
        naiveFlat: 'None (Random text window)',
        flatHybrid: 'Rough paragraph estimate',
        ragraph: 'Exact [Doc, Section, Paragraph]',
        significance: 'Grounded cryptographic provenance on all responses',
      },
      {
        metric: 'Median Traversal Latency',
        naiveFlat: '65ms',
        flatHybrid: '88ms',
        ragraph: '38ms',
        significance: 'Top-down section pruning skips 75% of noisy leaf comparisons',
      },
    ],
  },
  {
    id: 'legal-financial',
    name: 'Legal & SEC 10-K Filings (80k–150k tokens)',
    desc: 'Complex indemnification covenants, footnote disclosures, and multi-year comparative tables.',
    rows: [
      {
        metric: 'Indemnity / Covenant Cross-Audit',
        naiveFlat: '44.8%',
        flatHybrid: '58.2%',
        ragraph: '92.4%',
        significance: 'Links definitions in Article 1 to obligations in Exhibit C',
        highlight: true,
      },
      {
        metric: 'Financial Table Value Grounding',
        naiveFlat: '62.0%',
        flatHybrid: '71.5%',
        ragraph: '97.1%',
        significance: 'Maintains table header context across pagination breaks',
        highlight: true,
      },
      {
        metric: 'False-Positive Clause Recall',
        naiveFlat: '38.5%',
        flatHybrid: '29.0%',
        ragraph: '4.8%',
        significance: 'Prunes unrelated boilerplate sections before leaf scoring',
        highlight: true,
      },
      {
        metric: 'Verification Anchor Rate',
        naiveFlat: '42.1%',
        flatHybrid: '66.4%',
        ragraph: '99.5%',
        significance: 'Every claim maps to verified document paragraph coordinates',
      },
      {
        metric: 'Median Traversal Latency',
        naiveFlat: '72ms',
        flatHybrid: '95ms',
        ragraph: '41ms',
        significance: 'Fast AST branch filtering speeds up deep queries',
      },
    ],
  },
]

export function BenchmarkMatrix() {
  const [activeDatasetIndex, setActiveDatasetIndex] = useState(0)
  const currentDataset = DATASETS[activeDatasetIndex]

  return (
    <section
      id="benchmarks"
      style={{
        padding: '80px 24px',
        maxWidth: 1320,
        margin: '0 auto',
        width: '100%',
      }}
    >
      {/* Section Header */}
      <div
        style={{
          marginBottom: 44,
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          paddingBottom: 20,
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontFamily: 'var(--font-mono)',
            color: '#34D399',
            marginBottom: 10,
            letterSpacing: '0.05em',
          }}
        >
          § 02 / EMPIRICAL BENCHMARKS
        </div>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(28px, 4vw, 44px)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: '#F8FAFC',
            margin: '0 0 12px',
          }}
        >
          Rigorous Evaluation Against Long-Context Baselines
        </h2>
        <p
          style={{
            fontSize: 16,
            color: '#94A3B8',
            margin: 0,
            maxWidth: 760,
            lineHeight: 1.6,
            fontFamily: 'var(--font-body)',
          }}
        >
          Evaluated across real-world technical whitepapers and multi-section filings. Measured against naive fixed chunking and hybrid dense+BM25 flat search.
        </p>
      </div>

      {/* Dataset Selector Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          marginBottom: 24,
          flexWrap: 'wrap',
        }}
      >
        {DATASETS.map((ds, idx) => {
          const isActive = activeDatasetIndex === idx
          return (
            <button
              key={ds.id}
              onClick={() => setActiveDatasetIndex(idx)}
              style={{
                padding: '9px 18px',
                borderRadius: 8,
                fontSize: 13,
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer',
                border: '1px solid',
                transition: 'all 0.15s ease',
                background: isActive ? '#12151D' : 'rgba(255, 255, 255, 0.02)',
                borderColor: isActive ? 'rgba(52, 211, 153, 0.4)' : 'rgba(255, 255, 255, 0.08)',
                color: isActive ? '#34D399' : '#94A3B8',
                fontWeight: isActive ? 600 : 400,
                boxShadow: isActive ? '0 2px 12px rgba(52, 211, 153, 0.1)' : 'none',
              }}
            >
              {ds.name}
            </button>
          )
        })}
      </div>

      {/* Render-Style Grid Divided Table */}
      <div
        style={{
          background: '#0E1117',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
        }}
      >
        {/* Dataset Description Strip */}
        <div
          style={{
            padding: '16px 24px',
            background: 'rgba(255, 255, 255, 0.02)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 13,
            color: '#94A3B8',
          }}
        >
          <span>Corpus: {currentDataset.desc}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#64748B' }}>
            N=240 COMPLEX QUERIES
          </span>
        </div>

        {/* Table Content */}
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left',
              fontSize: 13.5,
            }}
          >
            <thead>
              <tr
                style={{
                  background: '#08090C',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  fontSize: 11.5,
                  fontFamily: 'var(--font-mono)',
                  color: '#64748B',
                }}
              >
                <th style={{ padding: '16px 24px', fontWeight: 600 }}>EVALUATION METRIC</th>
                <th style={{ padding: '16px 20px', fontWeight: 500 }}>NAIVE FLAT (500t)</th>
                <th style={{ padding: '16px 20px', fontWeight: 500 }}>FLAT HYBRID (VEC+BM25)</th>
                <th
                  style={{
                    padding: '16px 24px',
                    fontWeight: 700,
                    color: '#34D399',
                    background: 'rgba(52, 211, 153, 0.05)',
                  }}
                >
                  RA-GRAPH BEAM SEARCH
                </th>
                <th style={{ padding: '16px 24px', fontWeight: 500 }} className="hidden lg:table-cell">
                  STRUCTURAL SIGNIFICANCE
                </th>
              </tr>
            </thead>
            <tbody>
              {currentDataset.rows.map((row, idx) => (
                <tr
                  key={row.metric}
                  style={{
                    borderBottom:
                      idx < currentDataset.rows.length - 1
                        ? '1px solid rgba(255, 255, 255, 0.05)'
                        : 'none',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)')}
                  onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  {/* Metric Name */}
                  <td
                    style={{
                      padding: '18px 24px',
                      color: '#F8FAFC',
                      fontWeight: 600,
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    {row.metric}
                  </td>

                  {/* Naive Flat */}
                  <td
                    style={{
                      padding: '18px 20px',
                      color: '#F87171',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 13,
                    }}
                  >
                    {row.naiveFlat}
                  </td>

                  {/* Flat Hybrid */}
                  <td
                    style={{
                      padding: '18px 20px',
                      color: '#94A3B8',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 13,
                    }}
                  >
                    {row.flatHybrid}
                  </td>

                  {/* RA-Graph Highlighted Column */}
                  <td
                    style={{
                      padding: '18px 24px',
                      color: '#34D399',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 14,
                      fontWeight: 700,
                      background: 'rgba(52, 211, 153, 0.04)',
                    }}
                  >
                    {row.ragraph}
                  </td>

                  {/* Significance Note */}
                  <td
                    style={{
                      padding: '18px 24px',
                      color: '#94A3B8',
                      fontSize: 12.5,
                      lineHeight: 1.5,
                      fontFamily: 'var(--font-body)',
                    }}
                    className="hidden lg:table-cell"
                  >
                    {row.significance}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
