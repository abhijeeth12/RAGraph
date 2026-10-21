'use client'
import { useState } from 'react'
import { ArrowRight, Check, Sparkles } from 'lucide-react'

interface LedgerEntry {
  problem: string
  problemSub: string
  resolution: string
  resolutionDetails: { tag: string; text: string }
  outcome: string
  washColor: string
  accentColor: string
}

const ENTRIES: LedgerEntry[] = [
  {
    problem: 'Multi-page tables & financial disclosures',
    problemSub: 'Flat vector databases truncate rows midway through an EBITDA breakdown, stripping parent headers.',
    resolution: 'Hierarchical AST Table Preservation',
    resolutionDetails: {
      tag: '0 loss',
      text: 'Parses Markdown AST tables as indivisible atomic nodes with ancestral column headers.',
    },
    outcome: 'Deterministic numerical queries without hallucination or severed rows.',
    washColor: 'rgba(47, 76, 255, 0.04)',
    accentColor: '#2F4CFF',
  },
  {
    problem: 'Conflicting cross-document claims',
    problemSub: 'Two scientific papers or quarterly reports offer conflicting statements on efficacy or revenue.',
    resolution: 'Relational Knowledge Graph Reasoning',
    resolutionDetails: {
      tag: 'Multi-hop',
      text: 'Constructs entity nodes across documents and verifies edge claims before synthesis.',
    },
    outcome: 'Side-by-side reconciliation with exact paragraph citations for both positions.',
    washColor: 'rgba(124, 58, 237, 0.04)',
    accentColor: '#7C3AED',
  },
  {
    problem: 'Vague, underspecified research inquiries',
    problemSub: 'Users ask high-level questions where keywords do not match source terminology.',
    resolution: 'Dual-Path HyDE & Reciprocal Rank Fusion',
    resolutionDetails: {
      tag: 'RRF Fused',
      text: 'Dense vectors retrieve semantic themes; BM25 matches IDs; HyDE bridges vocabulary gaps.',
    },
    outcome: '98.4% recall on complex multi-hop discovery questions.',
    washColor: 'rgba(255, 85, 0, 0.04)',
    accentColor: '#FF5500',
  },
  {
    problem: 'Multi-modal charts, diagrams & architecture figures',
    problemSub: 'Pure text embeddings lose critical structural insights trapped inside visual figures.',
    resolution: 'Figure Extraction & Lightbox Indexing',
    resolutionDetails: {
      tag: 'Multimodal',
      text: 'Extracts figures and captions into a dedicated figure ledger with paragraph references.',
    },
    outcome: 'Direct 1-click figure inspection directly within the answer stream.',
    washColor: 'rgba(5, 150, 105, 0.04)',
    accentColor: '#059669',
  },
  {
    problem: 'Context window bloat & high latency',
    problemSub: 'Passing hundreds of raw chunks drowns the model and inflates API costs exponentially.',
    resolution: 'Hierarchical Beam Search Pruning',
    resolutionDetails: {
      tag: '-84% tokens',
      text: 'Chess-engine inspired beam search scores branch outlines and prunes unpromising subtrees.',
    },
    outcome: 'Sub-40ms traversal with 84% lower token expenditure.',
    washColor: 'rgba(17, 18, 21, 0.03)',
    accentColor: 'var(--text-primary)',
  },
]

export function KnowledgeLedgerTable() {
  const [hoveredRow, setHoveredRow] = useState<number | null>(null)

  return (
    <section
      id="ledger"
      style={{
        padding: '72px 24px',
        maxWidth: 1380,
        margin: '0 auto',
        width: '100%',
      }}
    >
      {/* Section Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border)',
          paddingBottom: 24,
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
            }}
          >
            § 02 — ARCHITECTURAL RESOLUTION LEDGER
          </div>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(36px, 4.5vw, 64px)',
              lineHeight: 0.96,
              fontWeight: 600,
              letterSpacing: '-0.04em',
              color: 'var(--text-primary)',
              margin: 0,
            }}
          >
            /ledger
            <span
              style={{
                fontSize: 'clamp(18px, 2.2vw, 32px)',
                color: 'var(--text-secondary)',
                fontWeight: 500,
                marginLeft: 14,
              }}
            >
              Where naive flat chunking fails.
            </span>
          </h2>
        </div>

        <a
          href="#continuous-flow"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--text-primary)',
            textDecoration: 'underline',
            letterSpacing: '0.04em',
          }}
        >
          VIEW CONTINUOUS FLOW →
        </a>
      </div>

      {/* ─── ITSUA-Style Multi-Column Door Table ─────────────────────── */}
      <div
        style={{
          border: '1px solid var(--border)',
          background: '#FFFFFF',
          borderRadius: 8,
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {/* Table Header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(240px, 1.2fr) minmax(260px, 1.3fr) minmax(240px, 1.1fr) 48px',
            background: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border)',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--text-muted)',
            letterSpacing: '0.04em',
          }}
          className="hidden md:grid"
        >
          <div style={{ padding: '14px 20px', borderRight: '1px solid var(--border)' }}>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>01</span> · CHALLENGE / INPUT
          </div>
          <div style={{ padding: '14px 20px', borderRight: '1px solid var(--border)' }}>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>02</span> · RA-GRAPH RESOLUTION
          </div>
          <div style={{ padding: '14px 20px', borderRight: '1px solid var(--border)' }}>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>03</span> · LEADS TO / OUTCOME
          </div>
          <div style={{ padding: '14px 10px', textAlign: 'center' }}>
            DOC
          </div>
        </div>

        {/* Table Rows */}
        {ENTRIES.map((entry, idx) => {
          const isHovered = hoveredRow === idx
          return (
            <div
              key={idx}
              onMouseEnter={() => setHoveredRow(idx)}
              onMouseLeave={() => setHoveredRow(null)}
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(240px, 1.2fr) minmax(260px, 1.3fr) minmax(240px, 1.1fr) 48px',
                borderBottom: idx === ENTRIES.length - 1 ? 'none' : '1px solid var(--border)',
                background: isHovered ? entry.washColor : 'transparent',
                transition: 'background 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                cursor: 'default',
              }}
              className="grid grid-cols-1 md:grid-cols-[1.2fr_1.3fr_1.1fr_48px] divide-y md:divide-y-0"
            >
              {/* Column 01: Challenge */}
              <div
                style={{
                  padding: '22px 20px',
                  borderRight: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: 14.5,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-display)',
                    marginBottom: 4,
                  }}
                >
                  {entry.problem}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {entry.problemSub}
                </div>
              </div>

              {/* Column 02: RA-Graph Resolution */}
              <div
                style={{
                  padding: '22px 20px',
                  borderRight: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: entry.accentColor,
                    fontFamily: 'var(--font-display)',
                    marginBottom: 6,
                  }}
                >
                  {entry.resolution}
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      fontWeight: 700,
                      color: entry.accentColor,
                      background: 'var(--bg-secondary)',
                      padding: '1px 6px',
                      borderRadius: 3,
                      border: '1px solid var(--border)',
                      flexShrink: 0,
                    }}
                  >
                    {entry.resolutionDetails.tag}
                  </span>
                  <span>{entry.resolutionDetails.text}</span>
                </div>
              </div>

              {/* Column 03: Outcome */}
              <div
                style={{
                  padding: '22px 20px',
                  borderRight: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  lineHeight: 1.5,
                }}
              >
                {entry.outcome}
              </div>

              {/* Column 04: Action Indicator */}
              <div
                style={{
                  padding: '22px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isHovered ? entry.accentColor : 'var(--text-muted)',
                  transition: 'color 0.15s ease, transform 0.15s ease',
                  transform: isHovered ? 'translateX(2px)' : 'none',
                }}
                className="hidden md:flex"
              >
                <ArrowRight size={14} />
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

