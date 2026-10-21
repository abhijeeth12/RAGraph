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
  Terminal,
  Zap,
} from 'lucide-react'

interface Props {
  onStartDemo: () => void
  onOpenDashboard: () => void
}

const SAMPLE_QUERIES = [
  {
    id: 'tree-rag',
    query: 'How does hierarchical beam search prevent cross-section context loss?',
    topic: 'Hierarchical Traversal',
    docSection: 'Section 4.2 · Multi-Scale Tree Descent',
    bestScore: '0.964',
    pruneRatio: '78%',
  },
  {
    id: 'raft-consensus',
    query: 'Why do flat vector chunks miss Raft leader election split-brain invariants?',
    topic: 'Distributed Systems',
    docSection: 'Section 5.1 · Invariant Preservation',
    bestScore: '0.982',
    pruneRatio: '84%',
  },
  {
    id: 'long-legal',
    query: 'Identify indemnification cross-clauses in Exhibit B referencing Article 14.',
    topic: 'Complex Corpora',
    docSection: 'Section 14.3 · Cross-Article Indemnity',
    bestScore: '0.948',
    pruneRatio: '72%',
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
    }, 3200)
    return () => clearInterval(interval)
  }, [])

  return (
    <section
      style={{
        position: 'relative',
        padding: '56px 24px 88px',
        maxWidth: 1320,
        margin: '0 auto',
        width: '100%',
      }}
    >
      {/* ─── Architectural Index & Telemetry Header ─────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          paddingBottom: 16,
          marginBottom: 44,
          fontSize: 12,
          fontFamily: 'var(--font-mono)',
          color: '#94A3B8',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ color: '#38BDF8', fontWeight: 600 }}>§ 00 / SYSTEM ARCHITECTURE</span>
          <span style={{ opacity: 0.3 }}>/</span>
          <span>LATENCY: 38ms</span>
          <span style={{ opacity: 0.3 }}>/</span>
          <span>AST DEPTH: k=4</span>
          <span style={{ opacity: 0.3 }}>/</span>
          <span>RECALL@5: 96.8%</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              display: 'inline-block',
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: '#34D399',
              boxShadow: '0 0 10px rgba(52, 211, 153, 0.7)',
            }}
          />
          <span style={{ color: '#F1F5F9', fontWeight: 500 }}>ENGINE: DUAL-PATH PRODUCTION</span>
        </div>
      </div>

      {/* ─── Hero Headline & Technical Positioning ────────────────────── */}
      <div style={{ maxWidth: 1040, marginBottom: 48 }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '5px 12px',
            borderRadius: 9999,
            background: 'rgba(56, 189, 248, 0.08)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            fontSize: 12,
            fontFamily: 'var(--font-mono)',
            color: '#38BDF8',
            marginBottom: 24,
          }}
        >
          <Compass size={13} />
          <span>BEYOND NAIVE 500-TOKEN CHUNKING</span>
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(34px, 5.4vw, 62px)',
            fontWeight: 800,
            lineHeight: 1.06,
            letterSpacing: '-0.035em',
            color: '#F8FAFC',
            margin: '0 0 24px',
          }}
        >
          Hierarchical Document Intelligence for{' '}
          <span className="bg-gradient-to-r from-sky-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
            Complex Technical Corpora
          </span>
          , <span className="text-emerald-400">Knowledge Graphs</span>, and{' '}
          <span className="text-amber-300">Verified Citations</span>.
        </h1>

        <p
          style={{
            fontSize: 'clamp(16px, 1.8vw, 20px)',
            color: '#94A3B8',
            lineHeight: 1.58,
            margin: 0,
            maxWidth: 820,
            fontFamily: 'var(--font-body)',
          }}
        >
          Flat vector databases shred documents into isolated 500-token fragments, blinding language models to parent section hierarchies and tabular context. 
          RA-Graph parses corpora into structural AST trees and descends through ancestral branches via dual-path beam search.
        </p>

        {/* Primary Action Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginTop: 36,
            flexWrap: 'wrap',
          }}
        >
          <button
            onClick={onStartDemo}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: '#F8FAFC',
              color: '#08090C',
              padding: '13px 26px',
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 14.5,
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: '0 4px 16px rgba(255, 255, 255, 0.15)',
              fontFamily: 'var(--font-body)',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#FFFFFF'
              e.currentTarget.style.transform = 'translateY(-1px)'
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 255, 255, 0.25)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = '#F8FAFC'
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(255, 255, 255, 0.15)'
            }}
          >
            <Sparkles size={16} />
            <span>Launch Live Sandbox</span>
            <ArrowRight size={15} />
          </button>

          <button
            onClick={onOpenDashboard}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(255, 255, 255, 0.04)',
              color: '#F1F5F9',
              padding: '13px 24px',
              borderRadius: 8,
              fontWeight: 500,
              fontSize: 14.5,
              border: '1px solid rgba(255, 255, 255, 0.12)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              fontFamily: 'var(--font-body)',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.4)'
              e.currentTarget.style.background = 'rgba(56, 189, 248, 0.08)'
              e.currentTarget.style.color = '#38BDF8'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)'
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'
              e.currentTarget.style.color = '#F1F5F9'
            }}
          >
            <Layers size={16} />
            <span>Open Notebook Dashboard</span>
          </button>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 12,
              fontFamily: 'var(--font-mono)',
              color: '#64748B',
              marginLeft: 'auto',
            }}
          >
            <span style={{ color: '#38BDF8' }}>✓ AST PARSER</span>
            <span>·</span>
            <span style={{ color: '#818CF8' }}>✓ HYDE SYNTHESIS</span>
            <span>·</span>
            <span style={{ color: '#34D399' }}>✓ DUAL-PATH RRF</span>
          </div>
        </div>
      </div>

      {/* ─── Interactive Comparative Stage ───────────────────────────── */}
      <div
        style={{
          background: '#0E1117',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.7)',
        }}
      >
        {/* Stage Header: Query Switcher & Engine Tabs */}
        <div
          style={{
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '18px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            background: 'rgba(255, 255, 255, 0.015)',
            flexWrap: 'wrap',
          }}
        >
          {/* Query Selector Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
                color: '#64748B',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginRight: 4,
              }}
            >
              Select Benchmark Query:
            </span>
            {SAMPLE_QUERIES.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => {
                  setActiveQueryIndex(idx)
                  setTraversalStep(0)
                }}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer',
                  border: '1px solid',
                  transition: 'all 0.15s ease',
                  background:
                    activeQueryIndex === idx ? 'rgba(56, 189, 248, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                  borderColor:
                    activeQueryIndex === idx ? 'rgba(56, 189, 248, 0.4)' : 'rgba(255, 255, 255, 0.06)',
                  color: activeQueryIndex === idx ? '#38BDF8' : '#94A3B8',
                  fontWeight: activeQueryIndex === idx ? 600 : 400,
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
              background: '#08090C',
              padding: 3,
              borderRadius: 8,
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <button
              onClick={() => setActiveTab('ragraph')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
                transition: 'all 0.15s ease',
                background: activeTab === 'ragraph' ? '#161B24' : 'transparent',
                color: activeTab === 'ragraph' ? '#38BDF8' : '#64748B',
                boxShadow: activeTab === 'ragraph' ? '0 1px 4px rgba(0,0,0,0.4)' : 'none',
              }}
            >
              <GitBranch size={13} />
              <span>RA-Graph Hierarchical Beam</span>
            </button>
            <button
              onClick={() => setActiveTab('flat')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
                transition: 'all 0.15s ease',
                background: activeTab === 'flat' ? '#161B24' : 'transparent',
                color: activeTab === 'flat' ? '#F87171' : '#64748B',
                boxShadow: activeTab === 'flat' ? '0 1px 4px rgba(0,0,0,0.4)' : 'none',
              }}
            >
              <AlertTriangle size={13} />
              <span>Naive Flat Chunking</span>
            </button>
          </div>
        </div>

        {/* Current Query Banner */}
        <div
          style={{
            padding: '16px 24px',
            background: 'rgba(255, 255, 255, 0.02)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            fontSize: 13.5,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                color: '#38BDF8',
                fontSize: 11,
                padding: '2px 7px',
                background: 'rgba(56, 189, 248, 0.1)',
                borderRadius: 4,
                border: '1px solid rgba(56, 189, 248, 0.25)',
              }}
            >
              INCOMING QUERY
            </span>
            <span style={{ color: '#F1F5F9', fontWeight: 500 }}>"{activeQuery.query}"</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: '#64748B',
            }}
          >
            <span>PRUNE RATIO: {activeQuery.pruneRatio}</span>
            <span>·</span>
            <span style={{ color: '#34D399' }}>CONFIDENCE: {activeQuery.bestScore}</span>
          </div>
        </div>

        {/* Visualizer Interior Body */}
        <div style={{ padding: '28px 24px' }}>
          <AnimatePresence mode="wait">
            {activeTab === 'ragraph' ? (
              <motion.div
                key="ragraph-tab"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                {/* 3-Tier Hierarchical Descent Pipeline */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: 18,
                    marginBottom: 24,
                  }}
                >
                  {/* Tier 1: Document Root & Outline Ingestion */}
                  <div
                    style={{
                      background: '#12151D',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: 12,
                      padding: 18,
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 12,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          fontFamily: 'var(--font-mono)',
                          color: '#38BDF8',
                          fontWeight: 600,
                        }}
                      >
                        [TIER 1] ROOT OUTLINE
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color: '#34D399',
                          background: 'rgba(52, 211, 153, 0.1)',
                          padding: '2px 6px',
                          borderRadius: 4,
                        }}
                      >
                        LiteParse PDFium
                      </span>
                    </div>

                    <div style={{ fontSize: 13, color: '#E2E8F0', fontWeight: 600, marginBottom: 8 }}>
                      Document Structural Tree (AST)
                    </div>
                    <p style={{ fontSize: 12, color: '#94A3B8', lineHeight: 1.5, margin: '0 0 12px' }}>
                      Identifies chapters, subsections, and tables as connected hierarchy nodes.
                    </p>

                    <div
                      style={{
                        background: '#08090C',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: 8,
                        padding: '10px 12px',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11,
                        color: '#94A3B8',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                      }}
                    >
                      <div style={{ color: '#64748B' }}>├── §1 Background (tokens: 640)</div>
                      <div style={{ color: '#38BDF8', fontWeight: 600 }}>
                        ├── §4 Consensus Architecture (tokens: 2,410)
                      </div>
                      <div style={{ color: '#64748B' }}>├── §7 Related Work (tokens: 890)</div>
                      <div style={{ color: '#64748B' }}>└── §9 Appendices & Tables</div>
                    </div>
                  </div>

                  {/* Tier 2: Top-Down Beam Pruning */}
                  <div
                    style={{
                      background: '#12151D',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      borderRadius: 12,
                      padding: 18,
                      position: 'relative',
                      boxShadow: '0 0 20px rgba(56, 189, 248, 0.08)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 12,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          fontFamily: 'var(--font-mono)',
                          color: '#38BDF8',
                          fontWeight: 600,
                        }}
                      >
                        [TIER 2] BEAM ROUTING
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color: '#38BDF8',
                          background: 'rgba(56, 189, 248, 0.1)',
                          padding: '2px 6px',
                          borderRadius: 4,
                        }}
                      >
                        k=3 Width
                      </span>
                    </div>

                    <div style={{ fontSize: 13, color: '#E2E8F0', fontWeight: 600, marginBottom: 8 }}>
                      Section Semantic Scoring
                    </div>
                    <p style={{ fontSize: 12, color: '#94A3B8', lineHeight: 1.5, margin: '0 0 12px' }}>
                      Branch scoring eliminates unrelated chapters before leaf evaluation.
                    </p>

                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 10px',
                          borderRadius: 6,
                          background: 'rgba(52, 211, 153, 0.08)',
                          border: '1px solid rgba(52, 211, 153, 0.25)',
                          fontSize: 11,
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        <span style={{ color: '#F1F5F9' }}>§4.2 Multi-Scale Descent</span>
                        <span style={{ color: '#34D399', fontWeight: 600 }}>0.942 [TRAVERSED]</span>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 10px',
                          borderRadius: 6,
                          background: 'rgba(239, 68, 68, 0.05)',
                          border: '1px solid rgba(239, 68, 68, 0.15)',
                          fontSize: 11,
                          fontFamily: 'var(--font-mono)',
                          opacity: 0.7,
                        }}
                      >
                        <span style={{ color: '#94A3B8' }}>§1.2 Historical Background</span>
                        <span style={{ color: '#F87171' }}>0.210 [PRUNED]</span>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 10px',
                          borderRadius: 6,
                          background: 'rgba(239, 68, 68, 0.05)',
                          border: '1px solid rgba(239, 68, 68, 0.15)',
                          fontSize: 11,
                          fontFamily: 'var(--font-mono)',
                          opacity: 0.7,
                        }}
                      >
                        <span style={{ color: '#94A3B8' }}>§7.4 Prior Benchmark Specs</span>
                        <span style={{ color: '#F87171' }}>0.315 [PRUNED]</span>
                      </div>
                    </div>
                  </div>

                  {/* Tier 3: Leaf Extraction & Grounded Provenance */}
                  <div
                    style={{
                      background: '#12151D',
                      border: '1px solid rgba(52, 211, 153, 0.3)',
                      borderRadius: 12,
                      padding: 18,
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 12,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          fontFamily: 'var(--font-mono)',
                          color: '#34D399',
                          fontWeight: 600,
                        }}
                      >
                        [TIER 3] FUSED SYNTHESIS
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color: '#34D399',
                          background: 'rgba(52, 211, 153, 0.1)',
                          padding: '2px 6px',
                          borderRadius: 4,
                        }}
                      >
                        Zero Cut Loss
                      </span>
                    </div>

                    <div style={{ fontSize: 13, color: '#E2E8F0', fontWeight: 600, marginBottom: 8 }}>
                      Ancestral Envelope Preserved
                    </div>
                    <p style={{ fontSize: 12, color: '#94A3B8', lineHeight: 1.5, margin: '0 0 12px' }}>
                      Leaf nodes retain ancestor heading coordinates and table context.
                    </p>

                    <div
                      style={{
                        background: '#08090C',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: 8,
                        padding: '10px 12px',
                        fontSize: 12,
                        color: '#CBD5E1',
                        lineHeight: 1.5,
                      }}
                    >
                      "Theorem 3 explicitly prevents leader divergence by evaluating logs across terms{' '}
                      <span
                        style={{
                          display: 'inline-flex',
                          padding: '0 5px',
                          borderRadius: 3,
                          background: 'rgba(56, 189, 248, 0.15)',
                          color: '#38BDF8',
                          fontSize: 10.5,
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 600,
                        }}
                      >
                        [Doc 1 · §4.2 · p.18]
                      </span>
                      ."
                    </div>
                  </div>
                </div>

                {/* Synthesis Outcome Ledger */}
                <div
                  style={{
                    background: '#08090C',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: 10,
                    padding: '14px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 16,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <ShieldCheck size={18} color="#34D399" />
                    <span style={{ fontSize: 13, color: '#F1F5F9', fontWeight: 500 }}>
                      Structural Context Intact: Parent section boundaries, footnotes, and table schemas preserved.
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontFamily: 'var(--font-mono)',
                        color: '#34D399',
                        padding: '3px 8px',
                        borderRadius: 4,
                        background: 'rgba(52, 211, 153, 0.08)',
                        border: '1px solid rgba(52, 211, 153, 0.2)',
                      }}
                    >
                      HALLUCINATION: 3.2%
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontFamily: 'var(--font-mono)',
                        color: '#38BDF8',
                        padding: '3px 8px',
                        borderRadius: 4,
                        background: 'rgba(56, 189, 248, 0.08)',
                        border: '1px solid rgba(56, 189, 248, 0.2)',
                      }}
                    >
                      LATENCY: 38ms
                    </span>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="flat-tab"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                {/* Failure Modes of Naive Chunking */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: 18,
                    marginBottom: 24,
                  }}
                >
                  <div
                    style={{
                      background: '#12151D',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      borderRadius: 12,
                      padding: 18,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 10,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          fontFamily: 'var(--font-mono)',
                          color: '#F87171',
                          fontWeight: 600,
                        }}
                      >
                        [CHUNK #412] SEVERED SENTENCE
                      </span>
                      <span
                        style={{
                          fontSize: 10.5,
                          color: '#F87171',
                          background: 'rgba(239, 68, 68, 0.1)',
                          padding: '2px 6px',
                          borderRadius: 4,
                        }}
                      >
                        Context Lost
                      </span>
                    </div>
                    <div
                      style={{
                        background: '#08090C',
                        border: '1px dashed rgba(239, 68, 68, 0.3)',
                        borderRadius: 6,
                        padding: 10,
                        fontSize: 11.5,
                        fontFamily: 'var(--font-mono)',
                        color: '#FCA5A5',
                        lineHeight: 1.5,
                      }}
                    >
                      "...as specified in paragraph (c) above, the election terms must be strictly evaluated by the [CUT OFF: 500-token boundary reached]"
                    </div>
                    <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 10, margin: '10px 0 0' }}>
                      Model lacks the preceding paragraph definition. Fabricates assumptions about the cut clause.
                    </p>
                  </div>

                  <div
                    style={{
                      background: '#12151D',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      borderRadius: 12,
                      padding: 18,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 10,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          fontFamily: 'var(--font-mono)',
                          color: '#F87171',
                          fontWeight: 600,
                        }}
                      >
                        [CHUNK #413] ORPHANED TABLE
                      </span>
                      <span
                        style={{
                          fontSize: 10.5,
                          color: '#F87171',
                          background: 'rgba(239, 68, 68, 0.1)',
                          padding: '2px 6px',
                          borderRadius: 4,
                        }}
                      >
                        Header Missing
                      </span>
                    </div>
                    <div
                      style={{
                        background: '#08090C',
                        border: '1px dashed rgba(239, 68, 68, 0.3)',
                        borderRadius: 6,
                        padding: 10,
                        fontSize: 11.5,
                        fontFamily: 'var(--font-mono)',
                        color: '#FCA5A5',
                        lineHeight: 1.5,
                      }}
                    >
                      "| 0.45 | 98.2% | Failed | 4.8ms |"
                    </div>
                    <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 10, margin: '10px 0 0' }}>
                      Table columns split across chunks. The model has no idea what metric 0.45 or 98.2% refers to.
                    </p>
                  </div>

                  <div
                    style={{
                      background: '#12151D',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      borderRadius: 12,
                      padding: 18,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 10,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          fontFamily: 'var(--font-mono)',
                          color: '#F87171',
                          fontWeight: 600,
                        }}
                      >
                        [CHUNK #414] ANCHOR DRIFT
                      </span>
                      <span
                        style={{
                          fontSize: 10.5,
                          color: '#F87171',
                          background: 'rgba(239, 68, 68, 0.1)',
                          padding: '2px 6px',
                          borderRadius: 4,
                        }}
                      >
                        False Match
                      </span>
                    </div>
                    <div
                      style={{
                        background: '#08090C',
                        border: '1px dashed rgba(239, 68, 68, 0.3)',
                        borderRadius: 6,
                        padding: 10,
                        fontSize: 11.5,
                        fontFamily: 'var(--font-mono)',
                        color: '#FCA5A5',
                        lineHeight: 1.5,
                      }}
                    >
                      "Section 9.1: In historical consensus experiments from 2008..."
                    </div>
                    <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 10, margin: '10px 0 0' }}>
                      High vector cosine similarity against background history rather than the operative theorem.
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    background: '#08090C',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: 10,
                    padding: '14px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 16,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <AlertTriangle size={18} color="#F87171" />
                    <span style={{ fontSize: 13, color: '#FCA5A5', fontWeight: 500 }}>
                      Naive Flat Vector Chunking creates a 32.6% hallucination rate on multi-page technical corpora.
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontFamily: 'var(--font-mono)',
                        color: '#F87171',
                        padding: '3px 8px',
                        borderRadius: 4,
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                      }}
                    >
                      CONTEXT LOSS: 41.6%
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontFamily: 'var(--font-mono)',
                        color: '#94A3B8',
                        padding: '3px 8px',
                        borderRadius: 4,
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      LATENCY: 65ms
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
