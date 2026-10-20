'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GitBranch,
  Layers,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Sparkles,
  FileCode,
  ShieldCheck,
  Compass,
} from 'lucide-react'

interface Props {
  onStartDemo: () => void
  onOpenDashboard: () => void
  onOpenWhitepaper?: () => void
}

const SAMPLE_QUERIES = [
  {
    id: 'tree-rag',
    query: 'How does hierarchical beam search prevent cross-section context loss?',
    topic: 'Hierarchical Traversal',
    docSection: 'Section 4.2 · Multi-Scale Tree Descent',
  },
  {
    id: 'raft-consensus',
    query: 'Why do flat vector chunks miss Raft leader election split-brain invariants?',
    topic: 'Distributed Systems',
    docSection: 'Section 5.1 · Invariant Preservation',
  },
  {
    id: 'long-legal',
    query: 'Identify indemnification cross-clauses in Exhibit B referencing Article 14.',
    topic: 'Complex Corpora',
    docSection: 'Section 14.3 · Cross-Article Indemnity',
  },
]

export function ArchitecturalHero({ onStartDemo, onOpenDashboard }: Props) {
  const [activeQueryIndex, setActiveQueryIndex] = useState(0)
  const [activeTab, setActiveTab] = useState<'ragraph' | 'flat'>('ragraph')
  const [traversalStep, setTraversalStep] = useState(2)

  const activeQuery = SAMPLE_QUERIES[activeQueryIndex]

  // Auto-cycle steps for vivid interactive illustration
  useEffect(() => {
    const interval = setInterval(() => {
      setTraversalStep((s) => (s >= 3 ? 0 : s + 1))
    }, 2800)
    return () => clearInterval(interval)
  }, [])

  return (
    <section
      style={{
        position: 'relative',
        padding: '64px 24px 80px',
        maxWidth: 1320,
        margin: '0 auto',
        width: '100%',
      }}
    >
      {/* ─── Architectural Index & Callout Header ─────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          paddingBottom: 16,
          marginBottom: 40,
          fontSize: 12,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          color: '#94a3b8',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: '#38bdf8', fontWeight: 600 }}>[01] SYSTEM MANIFEST</span>
          <span style={{ opacity: 0.4 }}>/</span>
          <span>LATENCY: 38ms</span>
          <span style={{ opacity: 0.4 }}>/</span>
          <span>AST DEPTH: k=4</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              display: 'inline-block',
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: '#34d399',
              boxShadow: '0 0 10px rgba(52, 211, 153, 0.6)',
            }}
          />
          <span style={{ color: '#f1f5f9' }}>ENGINE: PRODUCTION DUAL-PATH</span>
        </div>
      </div>

      {/* ─── Hero Headline & Technical Positioning ────────────────────── */}
      <div style={{ maxWidth: 960, marginBottom: 48 }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '5px 12px',
            borderRadius: 4,
            background: 'rgba(56, 189, 248, 0.08)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            fontSize: 12,
            fontFamily: "'JetBrains Mono', monospace",
            color: '#38bdf8',
            marginBottom: 20,
          }}
        >
          <Compass size={13} />
          <span>BEYOND NAIVE 500-TOKEN CHUNKING</span>
        </div>

        <h1
          style={{
            fontSize: 'clamp(32px, 5.2vw, 58px)',
            fontWeight: 700,
            lineHeight: 1.08,
            letterSpacing: '-0.035em',
            color: '#f8fafc',
            margin: '0 0 24px',
          }}
        >
          Structured Retrieval for Complex Technical Corpora.
        </h1>

        <p
          style={{
            fontSize: 'clamp(16px, 1.8vw, 20px)',
            color: '#94a3b8',
            lineHeight: 1.55,
            margin: 0,
            maxWidth: 780,
          }}
        >
          Flat vector databases shred documents into arbitrary fragments, destroying section hierarchy and relational context. 
          RA-Graph parses corpora into semantic AST trees and traverses structural branches via multi-path beam search.
        </p>

        {/* Primary Action Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginTop: 32,
            flexWrap: 'wrap',
          }}
        >
          <button
            onClick={onStartDemo}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: '#f8fafc',
              color: '#0b0d11',
              padding: '13px 26px',
              borderRadius: 6,
              fontWeight: 600,
              fontSize: 14,
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: '0 2px 12px rgba(255, 255, 255, 0.15)',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#ffffff'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = '#f8fafc'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <Sparkles size={16} />
            <span>Launch Guest Sandbox</span>
            <ArrowRight size={15} />
          </button>

          <button
            onClick={onOpenDashboard}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(255, 255, 255, 0.04)',
              color: '#f1f5f9',
              padding: '13px 22px',
              borderRadius: 6,
              fontWeight: 500,
              fontSize: 14,
              border: '1px solid rgba(255, 255, 255, 0.12)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.4)'
              e.currentTarget.style.background = 'rgba(56, 189, 248, 0.06)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)'
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'
            }}
          >
            <Layers size={16} />
            <span>Open Researcher Notebooks</span>
          </button>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontFamily: "'JetBrains Mono', monospace",
              color: '#64748b',
              marginLeft: 'auto',
            }}
          >
            <span>AST PARSER</span>
            <span style={{ color: '#38bdf8' }}>✓ ACTIVE</span>
            <span>·</span>
            <span>HYDE</span>
            <span style={{ color: '#34d399' }}>✓ DUAL-PATH</span>
          </div>
        </div>
      </div>

      {/* ─── Interactive Comparative Stage ───────────────────────────── */}
      <div
        style={{
          background: '#13161c',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.45)',
        }}
      >
        {/* Stage Top Bar: Query Selector & Mode Switch */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '12px 20px',
            background: 'rgba(11, 13, 17, 0.75)',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          {/* Query pill tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto', maxWidth: '100%' }}>
            <span
              style={{
                fontSize: 11,
                fontFamily: "'JetBrains Mono', monospace",
                color: '#64748b',
                textTransform: 'uppercase',
                marginRight: 4,
              }}
            >
              Test Query:
            </span>
            {SAMPLE_QUERIES.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setActiveQueryIndex(idx)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 4,
                  fontSize: 12,
                  fontFamily: "'JetBrains Mono', monospace",
                  background: activeQueryIndex === idx ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  border:
                    activeQueryIndex === idx
                      ? '1px solid rgba(56, 189, 248, 0.4)'
                      : '1px solid rgba(255, 255, 255, 0.06)',
                  color: activeQueryIndex === idx ? '#38bdf8' : '#94a3b8',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                }}
              >
                {q.topic}
              </button>
            ))}
          </div>

          {/* Engine Mode Toggle */}
          <div
            style={{
              display: 'flex',
              background: 'rgba(0, 0, 0, 0.3)',
              padding: 3,
              borderRadius: 6,
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <button
              onClick={() => setActiveTab('ragraph')}
              style={{
                padding: '6px 14px',
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 600,
                background: activeTab === 'ragraph' ? '#38bdf8' : 'transparent',
                color: activeTab === 'ragraph' ? '#0b0d11' : '#94a3b8',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <GitBranch size={13} />
              <span>RA-Graph Hierarchical AST</span>
            </button>
            <button
              onClick={() => setActiveTab('flat')}
              style={{
                padding: '6px 14px',
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 600,
                background: activeTab === 'flat' ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
                color: activeTab === 'flat' ? '#fca5a5' : '#64748b',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <AlertTriangle size={13} />
              <span>Naive Flat Chunks</span>
            </button>
          </div>
        </div>

        {/* Query Input Simulation Box */}
        <div
          style={{
            padding: '16px 24px',
            background: 'rgba(0, 0, 0, 0.2)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <span style={{ fontFamily: "'JetBrains Mono', monospace", color: '#38bdf8', fontSize: 13 }}>❯</span>
          <span style={{ fontSize: 14.5, color: '#f8fafc', fontWeight: 500 }}>
            {activeQuery.query}
          </span>
          <span
            style={{
              marginLeft: 'auto',
              fontSize: 11,
              fontFamily: "'JetBrains Mono', monospace",
              color: '#64748b',
              background: 'rgba(255, 255, 255, 0.04)',
              padding: '3px 8px',
              borderRadius: 4,
            }}
          >
            Target: {activeQuery.docSection}
          </span>
        </div>

        {/* Visual Comparison Stage Body */}
        <div style={{ padding: '28px 24px' }}>
          <AnimatePresence mode="wait">
            {activeTab === 'ragraph' ? (
              <motion.div
                key="ragraph-view"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {/* Tree Descent Visualizer */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    gap: 16,
                    marginBottom: 24,
                  }}
                >
                  {/* Step 1: Root Document */}
                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: 8,
                      padding: 16,
                      position: 'relative',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: '#64748b' }}>
                        LEVEL 0 · ROOT
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          fontFamily: "'JetBrains Mono', monospace",
                          background: 'rgba(52, 211, 153, 0.1)',
                          color: '#34d399',
                          padding: '2px 6px',
                          borderRadius: 3,
                        }}
                      >
                        RECOGNIZED
                      </span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>
                      Distributed_Raft_Spec.pdf
                    </div>
                    <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 4 }}>
                      Parsed AST: 14 Chapters, 42 Sections, 184 Leaf nodes
                    </div>
                    <div
                      style={{
                        marginTop: 12,
                        height: 3,
                        background: 'rgba(255, 255, 255, 0.08)',
                        borderRadius: 2,
                        overflow: 'hidden',
                      }}
                    >
                      <div style={{ width: '100%', height: '100%', background: '#38bdf8' }} />
                    </div>
                  </div>

                  {/* Step 2: High-Scoring Section Branch */}
                  <div
                    style={{
                      background: 'rgba(56, 189, 248, 0.04)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      borderRadius: 8,
                      padding: 16,
                      position: 'relative',
                      boxShadow: '0 0 20px rgba(56, 189, 248, 0.05)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: '#38bdf8' }}>
                        LEVEL 1 · BEAM ROUTE [Score: 0.94]
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          fontFamily: "'JetBrains Mono', monospace",
                          background: 'rgba(56, 189, 248, 0.15)',
                          color: '#38bdf8',
                          padding: '2px 6px',
                          borderRadius: 3,
                        }}
                      >
                        ACTIVE BEAM
                      </span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>
                      § 4.2 Multi-Scale Tree Descent
                    </div>
                    <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 4 }}>
                      Subtree selected. 3 sister branches pruned to conserve context tokens.
                    </div>
                    <div
                      style={{
                        marginTop: 12,
                        height: 3,
                        background: 'rgba(255, 255, 255, 0.08)',
                        borderRadius: 2,
                        overflow: 'hidden',
                      }}
                    >
                      <div style={{ width: '94%', height: '100%', background: '#38bdf8' }} />
                    </div>
                  </div>

                  {/* Step 3: Verified Leaf Grounding */}
                  <div
                    style={{
                      background: 'rgba(52, 211, 153, 0.04)',
                      border: '1px solid rgba(52, 211, 153, 0.3)',
                      borderRadius: 8,
                      padding: 16,
                      position: 'relative',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: '#34d399' }}>
                        LEVEL 2 · VERIFIED CITATION
                      </span>
                      <ShieldCheck size={14} color="#34d399" />
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>
                      Exact Coordinates: [Doc §4.2, p.14, ¶3]
                    </div>
                    <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 4 }}>
                      Parent summary prepended to chunk. Zero boundary cutoff.
                    </div>
                    <div
                      style={{
                        marginTop: 12,
                        height: 3,
                        background: 'rgba(255, 255, 255, 0.08)',
                        borderRadius: 2,
                        overflow: 'hidden',
                      }}
                    >
                      <div style={{ width: '100%', height: '100%', background: '#34d399' }} />
                    </div>
                  </div>
                </div>

                {/* Synthesis Output Preview */}
                <div
                  style={{
                    background: 'rgba(0, 0, 0, 0.35)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: 8,
                    padding: '16px 20px',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 12.5,
                    lineHeight: 1.6,
                    color: '#e2e8f0',
                  }}
                >
                  <span style={{ color: '#38bdf8' }}>[Synthesis]</span> Tree traversal routed directly into{' '}
                  <span style={{ background: 'rgba(56, 189, 248, 0.15)', padding: '2px 6px', borderRadius: 3, color: '#38bdf8' }}>
                    § 4.2
                  </span>{' '}
                  and aggregated parent section definitions before expanding candidate chunks. Candidate relevance score{' '}
                  <span style={{ color: '#34d399' }}>0.984</span> with verifiable citation coordinates anchored to{' '}
                  <span style={{ borderBottom: '1px dotted #34d399', color: '#34d399' }}>
                    [Doc §4.2, Node #34]
                  </span>
                  .
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="flat-view"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {/* Flat Failure Demonstration */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    gap: 16,
                    marginBottom: 24,
                  }}
                >
                  <div
                    style={{
                      background: 'rgba(239, 68, 68, 0.05)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      borderRadius: 8,
                      padding: 16,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: '#ef4444' }}>
                        CHUNK #108 (500 tokens)
                      </span>
                      <span style={{ fontSize: 10, color: '#ef4444' }}>SEVERED MID-SENTENCE</span>
                    </div>
                    <div style={{ fontSize: 12.5, color: '#cbd5e1', lineHeight: 1.5 }}>
                      "...as established in the prior subsection, the candidate votes must surpass the quorum..."
                    </div>
                    <div style={{ fontSize: 11, color: '#f87171', marginTop: 8 }}>
                      ⚠️ "Prior subsection" severed. LLM has no access to the definition of quorum.
                    </div>
                  </div>

                  <div
                    style={{
                      background: 'rgba(239, 68, 68, 0.05)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      borderRadius: 8,
                      padding: 16,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: '#ef4444' }}>
                        CHUNK #244 (Unrelated Appendix)
                      </span>
                      <span style={{ fontSize: 10, color: '#ef4444' }}>FALSE POSITIVE</span>
                    </div>
                    <div style={{ fontSize: 12.5, color: '#cbd5e1', lineHeight: 1.5 }}>
                      "...Table 7: Hardware benchmarks on AWS c5.4xlarge instances..."
                    </div>
                    <div style={{ fontSize: 11, color: '#f87171', marginTop: 8 }}>
                      ⚠️ High cosine similarity due to keyword matches, polluting generation context.
                    </div>
                  </div>

                  <div
                    style={{
                      background: 'rgba(239, 68, 68, 0.05)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      borderRadius: 8,
                      padding: 16,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: '#ef4444' }}>
                        RESULT
                      </span>
                      <span style={{ fontSize: 10, color: '#ef4444' }}>HALLUCINATION RISK</span>
                    </div>
                    <div style={{ fontSize: 12.5, color: '#cbd5e1', lineHeight: 1.5 }}>
                      Model attempts to fabricate missing context because structural ties are absent.
                    </div>
                    <div style={{ fontSize: 11, color: '#f87171', marginTop: 8 }}>
                      ⚠️ Citation fails verification. Zero hierarchical trace.
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: 8,
                    padding: '16px 20px',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 12.5,
                    lineHeight: 1.6,
                    color: '#fca5a5',
                  }}
                >
                  <span style={{ color: '#ef4444', fontWeight: 600 }}>[Failure Mode]</span> Naive flat chunking lacks awareness of document trees. Sections separated by even 1,000 words are treated as unrelated vectors, causing up to 34% hallucination in multi-clause technical documents.
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Stage Bottom Telemetry Metric Bar */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(11, 13, 17, 0.65)',
          }}
        >
          <div style={{ padding: '14px 20px', borderRight: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: '#64748b' }}>
              CONTEXT RETENTION
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#38bdf8', marginTop: 2 }}>
              94.2% <span style={{ fontSize: 11, fontWeight: 400, color: '#94a3b8' }}>vs 61.8% flat</span>
            </div>
          </div>
          <div style={{ padding: '14px 20px', borderRight: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: '#64748b' }}>
              CITATION PRECISION
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#34d399', marginTop: 2 }}>
              99.1% <span style={{ fontSize: 11, fontWeight: 400, color: '#94a3b8' }}>grounded coordinates</span>
            </div>
          </div>
          <div style={{ padding: '14px 20px', borderRight: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: '#64748b' }}>
              TREE TRAVERSAL LATENCY
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', marginTop: 2 }}>
              38ms <span style={{ fontSize: 11, fontWeight: 400, color: '#94a3b8' }}>beam width k=3</span>
            </div>
          </div>
          <div style={{ padding: '14px 20px' }}>
            <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: '#64748b' }}>
              DUAL-PATH RRF
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#818cf8', marginTop: 2 }}>
              ACTIVE <span style={{ fontSize: 11, fontWeight: 400, color: '#94a3b8' }}>dense + sparse</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
