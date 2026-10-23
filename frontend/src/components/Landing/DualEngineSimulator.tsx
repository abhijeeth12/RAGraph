'use client'
import { useState } from 'react'
import {
  GitBranch,
  Zap,
  CheckCircle2,
  XCircle,
  FileText,
  Sliders,
  Database,
  Terminal,
  Activity,
  Maximize2,
} from 'lucide-react'

interface QueryPreset {
  id: string
  label: string
  query: string
  naiveIssues: string[]
  treeAdvantages: string[]
  treeNodes: {
    id: string
    title: string
    level: string
    confidence: number
    snippet: string
    isHit: boolean
  }[]
  finalAnswerSnippet: string
  citations: string[]
}

const PRESETS: QueryPreset[] = [
  {
    id: 'financial',
    label: 'SEC 10-K Filing Table',
    query: 'What was the operating margin change and revenue variance breakdown in Q3?',
    naiveIssues: [
      'Split EBITDA table rows into 3 isolated chunks',
      'Lost column header context: numbers unassociated',
      'Hallucinated 14.2% margin by conflating Q2 & Q3',
    ],
    treeAdvantages: [
      'Preserved entire financial table as single AST node',
      'Parent section header "Consolidated Operating Results" retained',
      'Direct mathematical verification with 100% precision',
    ],
    treeNodes: [
      { id: '1', title: 'Part I · Item 1. Financial Statements', level: 'L1', confidence: 0.94, snippet: 'Consolidated balance sheets, statements of income and cash flows...', isHit: true },
      { id: '2', title: 'Note 3 · Revenue Recognition & Segment Reporting', level: 'L2', confidence: 0.98, snippet: 'Operating margin increased 380 bps to 24.8% due to software delivery efficiency...', isHit: true },
      { id: '3', title: 'Table 4.1 · Q3 Revenue by Segment & Variance', level: 'Leaf', confidence: 0.99, snippet: '| Product | Q3 FY25 | Q3 FY24 | Variance | \n| Cloud | $8.4B | $7.1B | +18.3% |', isHit: true },
      { id: '4', title: 'Item 1A. Risk Factors: Foreign Exchange Volatility', level: 'L2', confidence: 0.32, snippet: 'Currency fluctuations impacted EMEA adjusted margin by -40 bps...', isHit: false },
    ],
    finalAnswerSnippet: 'Operating margin expanded by 380 bps to 24.8% in Q3 FY25. Revenue grew 18.3% YoY to $8.4B driven by enterprise cloud renewals [Doc 1 · Note 3, Table 4.1].',
    citations: ['10K_FY25_Q3.pdf · §Item 1', 'Table 4.1 Segment Breakdown'],
  },
  {
    id: 'systems',
    label: 'Raft Consensus Protocol',
    query: 'How does Raft guarantee state machine safety during split-brain network partitions?',
    naiveIssues: [
      'Extracted term definition without election restriction rule',
      'Missed invariant 5.4.3 located 8 pages away',
      'Incomplete causal chain leading to false theorem',
    ],
    treeAdvantages: [
      'Dual-beam traversal linked election safety to log matching',
      'Cross-linked Leader Completeness invariant to commit rule',
      'Multi-hop proof path extracted with zero hallucination',
    ],
    treeNodes: [
      { id: '1', title: '§ 5 · The Raft Consensus Algorithm', level: 'L1', confidence: 0.92, snippet: 'Raft implements consensus by electing a leader and giving it complete responsibility...', isHit: true },
      { id: '2', title: '§ 5.4 · Safety & Election Restriction', level: 'L2', confidence: 0.97, snippet: 'Voting servers deny vote if candidate log is less up-to-date than own log...', isHit: true },
      { id: '3', title: 'Theorem 5.4.3 · Leader Completeness Invariant', level: 'Leaf', confidence: 0.99, snippet: 'If a log entry is committed in a given term, that entry will be present in leaders for all higher terms...', isHit: true },
      { id: '4', title: '§ 7 · Cluster Membership Changes', level: 'L2', confidence: 0.28, snippet: 'Configuration changes use a joint consensus transition approach...', isHit: false },
    ],
    finalAnswerSnippet: 'State Machine Safety is guaranteed by Election Restriction (§5.4.1): a candidate must receive votes from a majority, ensuring any committed entry exists in the new leader log [Raft-Paper.pdf · Theorem 5.4.3].',
    citations: ['raft-extended.pdf · §5.4.1', 'theorem_5.4.3_proof.md'],
  },
  {
    id: 'biomedical',
    label: 'Clinical Trial Contradictions',
    query: 'Did the Phase III kinase inhibitor trial report cardiac toxicity vs Phase II?',
    naiveIssues: [
      'Found only generic safety summary from Phase II abstract',
      'Confused biomarker acronym with secondary endpoint',
      'Failed to detect 4.1% QT-prolongation caveat in Appendix',
    ],
    treeAdvantages: [
      'Knowledge Graph reconciled cross-paper patient cohorts',
      'Traversed deep into Appendix E safety tables',
      'Flagged dose-dependent escalation variance between phases',
    ],
    treeNodes: [
      { id: '1', title: 'Section 4 · Adverse Event Stratification', level: 'L1', confidence: 0.91, snippet: 'Comprehensive safety monitoring across 1,420 randomized trial participants...', isHit: true },
      { id: '2', title: 'Table 4.3 · Grade 3/4 Cardiovascular Events', level: 'L2', confidence: 0.96, snippet: 'Phase III cohort demonstrated 4.1% QTcF prolongation vs 1.2% in Phase II...', isHit: true },
      { id: '3', title: 'Appendix E · Electrocardiographic Analysis', level: 'Leaf', confidence: 0.99, snippet: 'Median change from baseline in QTcF was +18.4 ms at 400mg daily dosing...', isHit: true },
      { id: '4', title: 'Section 2 · Pharmacokinetics & Absorption', level: 'L2', confidence: 0.35, snippet: 'Peak plasma concentrations achieved at 2.4 hours post-administration...', isHit: false },
    ],
    finalAnswerSnippet: 'Phase III reported a 4.1% incidence of Grade 3 QT prolongation at 400mg dosage (Appendix E), whereas Phase II observed only 1.2% due to lower median duration [Trial_III_NEJM.pdf · Table 4.3].',
    citations: ['Trial_III_Results.pdf · §4.3', 'Appendix_E_ECG.pdf'],
  },
]

export function DualEngineSimulator() {
  const [activePreset, setActivePreset] = useState<QueryPreset>(PRESETS[0])
  const [beamK, setBeamK] = useState(3)
  const [traversalStep, setTraversalStep] = useState(3)
  const [activeNode, setActiveNode] = useState<string | null>('3')
  const [isSimulating, setIsSimulating] = useState(false)

  const triggerSimulation = () => {
    setIsSimulating(true)
    setTraversalStep(1)
    setTimeout(() => setTraversalStep(2), 600)
    setTimeout(() => setTraversalStep(3), 1300)
    setTimeout(() => setIsSimulating(false), 2000)
  }

  return (
    <section
      id="dual-engine"
      style={{
        padding: 'clamp(50px, 8vh, 90px) 24px',
        maxWidth: 1380,
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* ─── Eyebrow & Header ────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          borderBottom: '2px solid #0E1012',
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
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span style={{ fontWeight: 700, color: '#0E1012' }}>§ 04 — HOW IT WORKS</span>
            <span>/</span>
            <span>LIVE INTERACTIVE DEMO</span>
          </div>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(36px, 4.5vw, 64px)',
              lineHeight: 0.96,
              fontWeight: 700,
              letterSpacing: '-0.04em',
              color: '#0E1012',
              margin: 0,
            }}
          >
            /interactive-demo
            <span
              style={{
                fontSize: 'clamp(18px, 2.2vw, 30px)',
                color: 'var(--text-secondary)',
                fontWeight: 500,
                marginLeft: 14,
              }}
            >
              Structured Document Understanding vs Blind Text Slicing.
            </span>
          </h2>
        </div>

        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11.5,
            color: '#0E1012',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontWeight: 700,
          }}
        >
          <span style={{ color: '#2F4CFF' }}>[ INTERACTIVE DEMO READY ]</span>
        </div>
      </div>

      {/* ─── Seamless Dynamic Engine Simulator Card ─────────────────── */}
      <div
        style={{
          background: '#FFFFFF',
          border: '2px solid #0E1012',
          borderRadius: 8,
          boxShadow: '4px 4px 0px #0E1012',
          overflow: 'hidden',
        }}
      >
        {/* Simulator Masthead Bar */}
        <div
          style={{
            padding: '12px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-secondary)',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#EF4444', display: 'inline-block' }} />
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#F59E0B', display: 'inline-block' }} />
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
            </div>

            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--text-primary)',
                letterSpacing: '0.04em',
              }}
            >
              LIVE COMPARISON // SEE WHY DOCUMENT STRUCTURE MATTERS
            </span>
          </div>

          {/* Presets Toggle Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'var(--text-muted)',
                marginRight: 4,
              }}
            >
              SCENARIO:
            </span>
            {PRESETS.map((preset) => {
              const isSelected = activePreset.id === preset.id
              return (
                <button
                  key={preset.id}
                  onClick={() => {
                    setActivePreset(preset)
                    triggerSimulation()
                  }}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10.5,
                    padding: '4px 10px',
                    borderRadius: 4,
                    border: isSelected
                      ? '1px solid var(--accent-blue)'
                      : '1px solid var(--border)',
                    background: isSelected ? 'rgba(47, 76, 255, 0.08)' : '#FFFFFF',
                    color: isSelected ? 'var(--accent-blue)' : 'var(--text-secondary)',
                    fontWeight: isSelected ? 600 : 400,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {preset.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Active Query Banner */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            background: '#FFFFFF',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 260 }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                padding: '3px 8px',
                borderRadius: 4,
                background: 'var(--bg-input)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border)',
              }}
            >
              QUERY_IN
            </span>
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-display)',
              }}
            >
              "{activePreset.query}"
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Beam Width Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10.5,
                  color: 'var(--text-muted)',
                }}
              >
                SEARCH DEPTH (k={beamK}):
              </span>
              <input
                type="range"
                min="1"
                max="4"
                value={beamK}
                onChange={(e) => setBeamK(Number(e.target.value))}
                style={{ width: 70, accentColor: 'var(--accent-blue)', cursor: 'pointer' }}
              />
            </div>

            <button
              onClick={triggerSimulation}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 12px',
                borderRadius: 4,
                background: 'var(--text-primary)',
                color: '#FFFFFF',
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Activity size={12} className={isSimulating ? 'animate-spin' : ''} />
              <span>TEST SEARCH</span>
            </button>
          </div>
        </div>

        {/* Side-by-Side Dual-Engine Comparison Columns */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          }}
          className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-black/[0.08]"
        >
          {/* ── Engine Left: Naive Flat Chunking ──────────────────── */}
          <div style={{ padding: '24px', background: 'rgba(239, 68, 68, 0.015)' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <XCircle size={16} color="#DC2626" />
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#DC2626',
                  }}
                >
                  ORDINARY AI TOOLS &amp; FRAGMENTED SEARCH
                </span>
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  padding: '2px 7px',
                  borderRadius: 3,
                  background: 'rgba(220, 38, 38, 0.08)',
                  color: '#DC2626',
                  border: '1px solid rgba(220, 38, 38, 0.2)',
                }}
              >
                RECALL: ~48%
              </span>
            </div>

            <p
              style={{
                fontSize: 12.5,
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
                marginBottom: 18,
              }}
            >
              Documents are arbitrarily chopped into disconnected slices. Section headings, tables,
              and surrounding context get lost, leading to incomplete or misleading answers.
            </p>

            {/* Naive Failures List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {activePreset.naiveIssues.map((issue, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                    fontSize: 12,
                    color: '#991B1B',
                    background: '#FFF5F5',
                    border: '1px solid rgba(220, 38, 38, 0.15)',
                    padding: '8px 12px',
                    borderRadius: 6,
                  }}
                >
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700 }}>
                    0{idx + 1}
                  </span>
                  <span>{issue}</span>
                </div>
              ))}
            </div>

            {/* Sharded Frag Simulation Box */}
            <div
              style={{
                padding: '12px 14px',
                background: '#FAFAFA',
                border: '1px dashed #DC2626',
                borderRadius: 6,
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: '#7F1D1D',
              }}
            >
              <div style={{ opacity: 0.7, marginBottom: 4 }}>[FRAGMENT #0492 - CHUNK OVERFLOW]</div>
              <div>"...margin for software was [TRUNCATED] ...variance +18.3% compared to previous segment..."</div>
              <div style={{ color: '#DC2626', fontWeight: 600, marginTop: 6 }}>
                ⚠ Error: Cannot resolve which column header applies to +18.3%.
              </div>
            </div>
          </div>

          {/* ── Engine Right: Hierarchical Tree-RAG Beam Search ──── */}
          <div style={{ padding: '24px', background: 'rgba(47, 76, 255, 0.015)' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={16} color="#2F4CFF" />
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#2F4CFF',
                  }}
                >
                  STUDY SPACE STRUCTURED SEARCH
                </span>
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  padding: '2px 7px',
                  borderRadius: 3,
                  background: 'rgba(47, 76, 255, 0.08)',
                  color: '#2F4CFF',
                  border: '1px solid rgba(47, 76, 255, 0.25)',
                  fontWeight: 600,
                }}
              >
                RECALL: 98.4%
              </span>
            </div>

            <p
              style={{
                fontSize: 12.5,
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
                marginBottom: 18,
              }}
            >
              Maintains the natural outline and structure of your documents. Follows headings,
              sections, and tables directly to pinpoint the exact evidence needed for every answer.
            </p>

            {/* Dynamic AST Node Tree Visualizer */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {activePreset.treeNodes.map((node) => {
                const isNodeActive = activeNode === node.id
                return (
                  <div
                    key={node.id}
                    onClick={() => setActiveNode(node.id)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 6,
                      border: isNodeActive
                        ? '1px solid #2F4CFF'
                        : '1px solid var(--border)',
                      background: isNodeActive ? 'rgba(47, 76, 255, 0.05)' : '#FFFFFF',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 4,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 9.5,
                            padding: '1px 5px',
                            borderRadius: 3,
                            background: node.isHit ? 'rgba(4, 120, 87, 0.1)' : 'var(--bg-input)',
                            color: node.isHit ? '#047857' : 'var(--text-muted)',
                            fontWeight: 600,
                          }}
                        >
                          {node.level}
                        </span>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                          }}
                        >
                          {node.title}
                        </span>
                      </div>

                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 10,
                          color: node.isHit ? '#2F4CFF' : 'var(--text-muted)',
                          fontWeight: 600,
                        }}
                      >
                        CONF: {(node.confidence * 100).toFixed(0)}%
                      </span>
                    </div>

                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--text-secondary)',
                        fontFamily: 'var(--font-mono)',
                        whiteSpace: 'pre-line',
                      }}
                    >
                      {node.snippet}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Verified Grounded Output Box */}
            <div
              style={{
                padding: '12px 14px',
                background: '#F0FDF4',
                border: '1px solid #86EFAC',
                borderRadius: 6,
                fontFamily: 'var(--font-body)',
                fontSize: 12,
                color: '#14532D',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#15803D',
                  marginBottom: 4,
                }}
              >
                ✓ VERIFIED ANSWER (BACKED BY DIRECT CITATIONS)
              </div>
              <div style={{ lineHeight: 1.5 }}>{activePreset.finalAnswerSnippet}</div>
              <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {activePreset.citations.map((c, i) => (
                  <span
                    key={i}
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 9.5,
                      background: '#DCFCE7',
                      padding: '1px 6px',
                      borderRadius: 3,
                      color: '#166534',
                      border: '1px solid #BBF7D0',
                    }}
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
