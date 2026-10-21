import { useState } from 'react'
import { ArrowRight, Table, Cpu, Activity, ShieldAlert, FileCode2 } from 'lucide-react'

interface ShowcaseCard {
  id: string
  title: string
  category: string
  tags: string[]
  summary: string
  badge: string
  domain: string
  tint: string
  accentColor: string
  rotateDeg: number
  icon: React.ReactNode
}

const SHOWCASES: ShowcaseCard[] = [
  {
    id: 'nb-tree-rag',
    title: 'SEC 10-K Financial Matrix',
    category: 'FINANCIAL AUDITING',
    tags: ['AST-TABLES', 'BM25-SPARSE', 'VARIANCE-MAP'],
    summary: 'Traverse 300-page earnings filings, nested multi-column tables, and footnotes.',
    badge: 'AUDIT VERIFIED',
    domain: 'CORPUS // SEC-EDGAR',
    tint: '#EEF9F5',
    accentColor: '#047857',
    rotateDeg: -2.8,
    icon: <Table size={15} />,
  },
  {
    id: 'nb-raft-consensus',
    title: 'Distributed Raft Invariants',
    category: 'SYSTEMS RESEARCH',
    tags: ['CODE-AST', 'FORMAL-PROOFS', 'SPLIT-BRAIN'],
    summary: 'Synthesizes formal verification proofs, log compaction theorems, and invariants.',
    badge: 'PEER-REVIEWED',
    domain: 'CORPUS // ACM-SIGCOMM',
    tint: '#FFF8F0',
    accentColor: '#D97706',
    rotateDeg: -1.2,
    icon: <Cpu size={15} />,
  },
  {
    id: 'nb-clinical-trials',
    title: 'Clinical Trial Contradictions',
    category: 'BIOMEDICAL & FDA',
    tags: ['MULTI-DOC', 'CROSS-CITATION', 'PHARMA'],
    summary: 'Cross-analyzes conflicting efficacy endpoints across 12 concurrent clinical trial papers.',
    badge: 'MULTI-PAPER',
    domain: 'CORPUS // PUBMED-PMC',
    tint: '#F0F3FF',
    accentColor: '#2F4CFF',
    rotateDeg: 0,
    icon: <Activity size={15} />,
  },
  {
    id: 'nb-robotics-control',
    title: 'Flight Control Invariants',
    category: 'EMBEDDED ROBOTICS',
    tags: ['REAL-TIME', 'CONTROL-LOOPS', 'C++20'],
    summary: 'Sub-40ms traversal across flight telemetry specs, PID loops, and safety theorems.',
    badge: 'LATENCY BENCHMARK',
    domain: 'CORPUS // IEEE-ROBOTICS',
    tint: '#F5F0FF',
    accentColor: '#7C3AED',
    rotateDeg: 1.5,
    icon: <FileCode2 size={15} />,
  },
  {
    id: 'nb-legal-msa',
    title: 'Master Service Indemnity',
    category: 'ENTERPRISE LEGAL',
    tags: ['LEGAL-AST', 'INDEMNIFICATION', 'LIABILITY'],
    summary: 'Pinpoints ambiguous clause interactions and mutual indemnification liabilities.',
    badge: 'ENTERPRISE RISK',
    domain: 'CORPUS // CONTRACT-REPO',
    tint: '#FFF1F3',
    accentColor: '#E11D48',
    rotateDeg: 3.0,
    icon: <ShieldAlert size={15} />,
  },
]

interface Props {
  onSelectNotebook: (id: string) => void
  onOpenDashboard: () => void
}

export function ItsuaWorkDeck({ onSelectNotebook, onOpenDashboard }: Props) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null)

  return (
    <section
      id="showcases"
      style={{
        position: 'relative',
        background: '#F5F5F3',
        padding: 'clamp(50px, 8vh, 90px) 24px',
        borderBottom: '2px solid #0E1012',
        overflow: 'hidden',
      }}
    >
      <div style={{ maxWidth: 1380, margin: '0 auto' }}>
        {/* Section Header (ITSUA Monumental Style) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            marginBottom: 'clamp(36px, 5vh, 56px)',
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
              <span style={{ fontWeight: 700, color: '#0E1012' }}>§ 02 — CURATED RESEARCH CORPUSES</span>
              <span>/</span>
              <span>INTERACTIVE NOTEBOOK SHOWCASES</span>
            </div>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(38px, 5vw, 68px)',
                fontWeight: 700,
                letterSpacing: '-0.04em',
                color: '#0E1012',
                margin: 0,
                lineHeight: 1,
              }}
            >
              /showcases
            </h2>
          </div>

          <button
            onClick={onOpenDashboard}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              fontWeight: 700,
              color: '#0E1012',
              background: '#FFFFFF',
              border: '1.5px solid #0E1012',
              padding: '8px 16px',
              borderRadius: 4,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '2px 2px 0px #0E1012',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translate(-1px, -1px)'
              e.currentTarget.style.boxShadow = '3px 3px 0px #0E1012'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translate(0, 0)'
              e.currentTarget.style.boxShadow = '2px 2px 0px #0E1012'
            }}
          >
            <span>EXPLORE ALL RESEARCH NOTEBOOKS</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {/* ─── Fanned-Out Interactive Card Deck (Exact ITSUA /work Reproduction) ─── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 20,
            padding: '20px 0 30px',
          }}
        >
          {SHOWCASES.map((item, idx) => {
            const isHovered = activeIdx === idx
            return (
              <div
                key={item.id}
                onMouseEnter={() => setActiveIdx(idx)}
                onMouseLeave={() => setActiveIdx(null)}
                onClick={() => onSelectNotebook(item.id)}
                style={{
                  background: item.tint,
                  border: '2px solid #0E1012',
                  borderRadius: 8,
                  padding: '24px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: 380,
                  cursor: 'pointer',
                  position: 'relative',
                  transform: isHovered
                    ? 'translateY(-12px) rotate(0deg) scale(1.02)'
                    : `rotate(${item.rotateDeg}deg)`,
                  boxShadow: isHovered
                    ? '0 20px 40px rgba(14, 16, 18, 0.14), 4px 4px 0px #0E1012'
                    : '2px 2px 0px #0E1012',
                  zIndex: isHovered ? 20 : idx,
                  transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease',
                }}
              >
                <div>
                  {/* Top Bar: Domain + Badge */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      color: '#0E1012',
                      marginBottom: 16,
                      borderBottom: '1px solid rgba(14, 16, 18, 0.12)',
                      paddingBottom: 10,
                    }}
                  >
                    <span style={{ fontWeight: 700 }}>{item.domain}</span>
                    <span
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid #0E1012',
                        padding: '1px 6px',
                        borderRadius: 3,
                        fontWeight: 700,
                        color: item.accentColor,
                      }}
                    >
                      {item.badge}
                    </span>
                  </div>

                  {/* Simulated Document Preview Panes */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 8,
                      marginBottom: 16,
                    }}
                  >
                    <div
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid rgba(14, 16, 18, 0.15)',
                        borderRadius: 4,
                        padding: 8,
                        height: 64,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-around',
                      }}
                    >
                      <div style={{ height: 4, background: 'rgba(14, 16, 18, 0.1)', width: '70%', borderRadius: 2 }} />
                      <div style={{ height: 4, background: 'rgba(14, 16, 18, 0.08)', width: '90%', borderRadius: 2 }} />
                      <div style={{ height: 4, background: item.accentColor, width: '50%', borderRadius: 2, opacity: 0.6 }} />
                    </div>
                    <div
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid rgba(14, 16, 18, 0.15)',
                        borderRadius: 4,
                        padding: 8,
                        height: 64,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-around',
                      }}
                    >
                      <div style={{ height: 4, background: 'rgba(14, 16, 18, 0.08)', width: '80%', borderRadius: 2 }} />
                      <div style={{ height: 4, background: item.accentColor, width: '60%', borderRadius: 2, opacity: 0.6 }} />
                      <div style={{ height: 4, background: 'rgba(14, 16, 18, 0.1)', width: '40%', borderRadius: 2 }} />
                    </div>
                  </div>

                  {/* Category & Title */}
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      color: item.accentColor,
                      marginBottom: 6,
                    }}
                  >
                    {item.category}
                  </div>

                  <h3
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 19,
                      fontWeight: 700,
                      letterSpacing: '-0.02em',
                      color: '#0E1012',
                      margin: '0 0 10px 0',
                      lineHeight: 1.25,
                    }}
                  >
                    {item.title}
                  </h3>

                  {/* Summary */}
                  <p
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: 12.5,
                      lineHeight: 1.5,
                      color: '#4B505B',
                      margin: '0 0 16px 0',
                    }}
                  >
                    {item.summary}
                  </p>
                </div>

                <div>
                  {/* Tech Tags */}
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 4,
                      marginBottom: 16,
                      fontFamily: 'var(--font-mono)',
                      fontSize: 9.5,
                      color: '#4B505B',
                    }}
                  >
                    {item.tags.map((t, ti) => (
                      <span
                        key={ti}
                        style={{
                          background: 'rgba(14, 16, 18, 0.05)',
                          padding: '2px 5px',
                          borderRadius: 3,
                          border: '1px solid rgba(14, 16, 18, 0.08)',
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  {/* Launch Link Button */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderTop: '1px solid rgba(14, 16, 18, 0.12)',
                      paddingTop: 12,
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#0E1012',
                    }}
                  >
                    <span>LAUNCH NOTEBOOK</span>
                    <ArrowRight
                      size={13}
                      style={{
                        transform: isHovered ? 'translateX(4px)' : 'translateX(0)',
                        transition: 'transform 0.15s ease',
                      }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
