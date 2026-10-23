'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  Network,
  GitBranch,
  CheckCircle,
  Sliders,
  Sparkles,
  ArrowRight,
  Database,
  Layers,
  Search,
  Code,
  Table,
  Cpu,
  Eye,
} from 'lucide-react'

interface Stage {
  id: string
  step: string
  title: string
  tagline: string
  description: string
  badge: string
  color: string
  metrics: { label: string; value: string }[]
  details: string[]
}

const STAGES: Stage[] = [
  {
    id: 'ingestion',
    step: '01',
    title: 'Hierarchical AST Ingestion',
    tagline: 'Preserving Document Spine & Table Architecture',
    description:
      'Unlike naive chunkers that blindly slice documents every 500 characters, RA-Graph extracts native Markdown AST trees. Section headings, subheadings, multi-column tables, equations, and image captions remain permanently bound to their semantic ancestors.',
    badge: 'STAGE 01 // PARSING',
    color: '#2F4CFF',
    metrics: [
      { label: 'TABLE LOSS', value: '0.0%' },
      { label: 'HEADER ACCURACY', value: '100%' },
      { label: 'PARSER LATENCY', value: '12ms / page' },
    ],
    details: [
      'Zero chunk boundary clipping on multi-row markdown tables',
      'Preserves ancestral breadcrumb paths (Doc > Section > Subsection)',
      'High-performance native structure and figure extraction tied to paragraph references',
    ],
  },
  {
    id: 'dualpath',
    step: '02',
    title: 'Dual-Path Fusion & HyDE',
    tagline: 'Dense Vectors + Sparse Lexical RRF',
    description:
      'Queries are evaluated simultaneously across two distinct retrieval paths: 1536-dim dense cosine embeddings for semantic context, and BM25 sparse indices for exact keyword IDs and variable names. Reciprocal Rank Fusion (RRF) reconciles both candidate streams with optional hypothetical document expansion.',
    badge: 'STAGE 02 // RETRIEVAL',
    color: '#FF5500',
    metrics: [
      { label: 'RECALL GAIN', value: '+34%' },
      { label: 'RRF RECONCILIATION', value: '4ms' },
      { label: 'HYDE EXPANSION', value: 'k=2 drafts' },
    ],
    details: [
      'Dense embeddings handle abstract conceptual queries',
      'BM25 guarantees exact match on acronyms, part numbers, and code symbols',
      'HyDE generates speculative answer vectors to bridge query-document semantic gaps',
    ],
  },
  {
    id: 'beamsearch',
    step: '03',
    title: 'Hierarchical Beam Search',
    tagline: 'Algorithmic Pruning Down Document AST',
    description:
      'Instead of blasting an LLM with hundreds of unrelated chunks, RA-Graph traverses the document tree level by level. It scores major chapter nodes first, prunes irrelevant branches, and focuses beam width k exclusively on the high-entropy leaf nodes containing the exact answer.',
    badge: 'STAGE 03 // TRAVERSAL',
    color: '#7C3AED',
    metrics: [
      { label: 'TOKEN REDUCTION', value: '-84%' },
      { label: 'BEAM DEPTH', value: 'k=4 levels' },
      { label: 'CONTEXT POLLUTION', value: '0.0%' },
    ],
    details: [
      'Tree traversal inspired by chess engine alpha-beta minimax pruning',
      'Never drops table headers or parent qualifying conditions',
      'Eliminates context window bloat and needle-in-a-haystack degradation',
    ],
  },
  {
    id: 'graph',
    step: '04',
    title: 'Relational Graph & Synthesis',
    tagline: 'Entity Cross-Linking & Grounded Citations',
    description:
      'Retrieved leaf nodes are projected into a dynamic knowledge graph. Cross-document entity relations are resolved across multiple papers. The generator produces a synthesized answer where every assertion is backed by a verified paragraph citation and lightbox preview.',
    badge: 'STAGE 04 // GROUNDING',
    color: '#059669',
    metrics: [
      { label: 'GROUNDING PRECISION', value: '99.2%' },
      { label: 'HALLUCINATION RATE', value: '< 0.8%' },
      { label: 'CITATION RESOLUTION', value: 'Deterministic' },
    ],
    details: [
      'Interactive citation badges link directly to source file and line number',
      'Multi-hop reasoning discovers non-obvious entity contradictions',
      'Integrated figure lightbox displays extracted charts and diagrams in context',
    ],
  },
]

export function ContinuousContentFlow() {
  const [activeStageIndex, setActiveStageIndex] = useState(0)
  const [hydeEnabled, setHydeEnabled] = useState(true)
  const [dualPathEnabled, setDualPathEnabled] = useState(true)
  const [selectedFormat, setSelectedFormat] = useState<'10k' | 'spec' | 'paper'>('10k')

  const currentStage = STAGES[activeStageIndex]

  // Auto-play progress timer if user isn't interacting
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStageIndex((prev) => (prev + 1) % STAGES.length)
    }, 9000)
    return () => clearInterval(timer)
  }, [])

  return (
    <section
      id="continuous-flow"
      style={{
        padding: '80px 24px',
        maxWidth: 1380,
        margin: '0 auto',
        width: '100%',
      }}
    >
      {/* Eyebrow & Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border)',
          paddingBottom: 28,
          marginBottom: 40,
          flexWrap: 'wrap',
          gap: 20,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--text-muted)',
              letterSpacing: '0.08em',
              marginBottom: 12,
            }}
          >
            § 01 — CONTINUOUS CONTENT-FLOW PIPELINE
          </div>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(36px, 4.8vw, 68px)',
              lineHeight: 0.96,
              fontWeight: 600,
              letterSpacing: '-0.04em',
              color: 'var(--text-primary)',
              margin: 0,
            }}
          >
            /flow
            <span
              style={{
                fontSize: 'clamp(20px, 2.5vw, 36px)',
                color: 'var(--text-secondary)',
                fontWeight: 500,
                marginLeft: 14,
              }}
            >
              How raw research becomes grounded truth.
            </span>
          </h2>
        </div>

        {/* Step Counter Pill */}
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            color: 'var(--text-primary)',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            padding: '8px 14px',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span style={{ color: currentStage.color, fontWeight: 700 }}>
            [ STAGE 0{activeStageIndex + 1} / 04 ]
          </span>
          <span style={{ color: 'var(--text-muted)' }}>·</span>
          <span>CONTINUOUS STREAM</span>
        </div>
      </div>

      {/* ─── Squared Media Bouncy Stage Navigation Bar ────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 12,
          marginBottom: 36,
        }}
        className="flow-tabs-grid"
      >
        {STAGES.map((stage, idx) => {
          const isActive = idx === activeStageIndex
          return (
            <button
              key={stage.id}
              onClick={() => setActiveStageIndex(idx)}
              style={{
                background: isActive ? '#FFFFFF' : 'var(--bg-card)',
                border: isActive
                  ? `2px solid ${stage.color}`
                  : '1px solid var(--border)',
                borderRadius: 8,
                padding: '16px 18px',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: isActive ? '0 8px 24px -4px rgba(17, 18, 21, 0.08)' : 'none',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Top Progress Line */}
              {isActive && (
                <motion.div
                  layoutId="activeTabUnderline"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                    background: stage.color,
                  }}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 8,
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    fontWeight: 700,
                    color: isActive ? stage.color : 'var(--text-muted)',
                  }}
                >
                  STAGE {stage.step}
                </span>

                <div
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: isActive ? stage.color : 'transparent',
                    border: `1px solid ${isActive ? stage.color : 'var(--border)'}`,
                  }}
                />
              </div>

              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 14,
                  fontWeight: 700,
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  letterSpacing: '-0.02em',
                }}
              >
                {stage.title}
              </div>
            </button>
          )
        })}
      </div>

      {/* ─── Main Interactive Flow Canvas ─────────────────────────── */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          overflow: 'hidden',
          boxShadow: 'var(--shadow-md)',
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 1.1fr) minmax(340px, 1.4fr)',
        }}
        className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-black/[0.08]"
      >
        {/* Left Column: Stage Narrative, Metrics & Controls */}
        <div style={{ padding: '36px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            {/* Stage Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '3px 8px',
                borderRadius: 4,
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                fontWeight: 600,
                color: currentStage.color,
                marginBottom: 16,
              }}
            >
              <span>{currentStage.badge}</span>
            </div>

            <h3
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 26,
                fontWeight: 700,
                letterSpacing: '-0.03em',
                color: 'var(--text-primary)',
                marginBottom: 6,
              }}
            >
              {currentStage.title}
            </h3>

            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: currentStage.color,
                fontFamily: 'var(--font-mono)',
                marginBottom: 16,
              }}
            >
              {currentStage.tagline}
            </div>

            <p
              style={{
                fontSize: 14.5,
                lineHeight: 1.6,
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-body)',
                marginBottom: 24,
              }}
            >
              {currentStage.description}
            </p>

            {/* Stage Specific Bullet Points */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
              {currentStage.details.map((detail, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    fontSize: 12.5,
                    color: 'var(--text-primary)',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      fontWeight: 700,
                      color: currentStage.color,
                      background: 'var(--bg-input)',
                      padding: '2px 5px',
                      borderRadius: 3,
                      border: '1px solid var(--border)',
                    }}
                  >
                    0{idx + 1}
                  </span>
                  <span>{detail}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Metric Ledger for this Stage */}
          <div
            style={{
              paddingTop: 20,
              borderTop: '1px solid var(--border)',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 12,
            }}
          >
            {currentStage.metrics.map((m, idx) => (
              <div key={idx}>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9.5,
                    color: 'var(--text-muted)',
                    marginBottom: 4,
                  }}
                >
                  {m.label}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 18,
                    fontWeight: 700,
                    color: currentStage.color,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {m.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Dynamic Interactive Configurator & Live Canvas */}
        <div
          style={{
            background: 'var(--bg-secondary)',
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
          }}
        >
          {/* Top Configurator Controls (Van3D Inspired) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 24,
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sliders size={13} color="var(--text-muted)" />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600 }}>
                INTERACTIVE PARAMETERS
              </span>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setHydeEnabled(!hydeEnabled)}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  padding: '4px 8px',
                  borderRadius: 4,
                  border: hydeEnabled ? '1px solid #2F4CFF' : '1px solid var(--border)',
                  background: hydeEnabled ? 'rgba(47, 76, 255, 0.08)' : '#FFFFFF',
                  color: hydeEnabled ? '#2F4CFF' : 'var(--text-muted)',
                  fontWeight: hydeEnabled ? 600 : 400,
                  cursor: 'pointer',
                }}
              >
                HyDE: {hydeEnabled ? 'ON' : 'OFF'}
              </button>

              <button
                onClick={() => setDualPathEnabled(!dualPathEnabled)}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  padding: '4px 8px',
                  borderRadius: 4,
                  border: dualPathEnabled ? '1px solid #FF5500' : '1px solid var(--border)',
                  background: dualPathEnabled ? 'rgba(255, 85, 0, 0.08)' : '#FFFFFF',
                  color: dualPathEnabled ? '#FF5500' : 'var(--text-muted)',
                  fontWeight: dualPathEnabled ? 600 : 400,
                  cursor: 'pointer',
                }}
              >
                Dual-Path: {dualPathEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

          {/* Dynamic Stage Canvas Visual */}
          <div
            style={{
              flex: 1,
              background: '#FFFFFF',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              position: 'relative',
              minHeight: 280,
            }}
          >
            <AnimatePresence mode="wait">
              {activeStageIndex === 0 && (
                /* STAGE 1 VISUAL: Document AST Tree Ingestion */
                <motion.div
                  key="stage-0"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
                >
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      color: 'var(--text-muted)',
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>[PARSER AST INSPECTION: PASS]</span>
                    <span style={{ color: '#2F4CFF' }}>DEPTH: 4 LEVELS</span>
                  </div>

                  <div
                    style={{
                      background: 'var(--bg-input)',
                      padding: '12px 14px',
                      borderRadius: 6,
                      border: '1px solid var(--border)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                    }}
                  >
                    <div style={{ color: '#2F4CFF', fontWeight: 600 }}># DocumentRoot (SEC_10K_FY25.pdf)</div>
                    <div style={{ paddingLeft: 12, color: 'var(--text-secondary)' }}>
                      ├── ## Item 1. Business Overview
                    </div>
                    <div style={{ paddingLeft: 24, color: 'var(--text-secondary)' }}>
                      ├── ### Segment Operations & Variance
                    </div>
                    <div style={{ paddingLeft: 36, color: '#059669', background: 'rgba(5, 150, 105, 0.08)', padding: '4px', borderRadius: 4 }}>
                      └── &lt;table&gt; Consolidated Financial Table (Rows: 18, Cols: 5) [BOUND]
                    </div>
                  </div>

                  <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CheckCircle size={13} color="#059669" />
                    <span>Table serialized with Markdown schema intact. No rows severed.</span>
                  </div>
                </motion.div>
              )}

              {activeStageIndex === 1 && (
                /* STAGE 2 VISUAL: Dual-Path Dense + Sparse Fusion */
                <motion.div
                  key="stage-1"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
                >
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
                    [RRF FUSION: RECIPROCAL RANK RECONCILIATION]
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div style={{ padding: '12px', background: 'rgba(47, 76, 255, 0.04)', borderRadius: 6, border: '1px solid rgba(47, 76, 255, 0.2)' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: '#2F4CFF', marginBottom: 4 }}>
                        DENSE VECTOR PATH
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                        Cosine Sim: 0.892<br />
                        Cluster: Operating Margin<br />
                        Weights: 60%
                      </div>
                    </div>

                    <div style={{ padding: '12px', background: 'rgba(255, 85, 0, 0.04)', borderRadius: 6, border: '1px solid rgba(255, 85, 0, 0.2)' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: '#FF5500', marginBottom: 4 }}>
                        BM25 SPARSE PATH
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                        Lexical Match: Q3, EBITDA<br />
                        Hits: 4 exact tokens<br />
                        Weights: 40%
                      </div>
                    </div>
                  </div>

                  <div style={{ padding: '10px 12px', background: '#F8FAFC', borderRadius: 6, border: '1px solid var(--border)', fontSize: 11.5, fontFamily: 'var(--font-mono)' }}>
                    <span>COMBINED RRF SCORE: </span>
                    <span style={{ color: '#059669', fontWeight: 700 }}>0.964 // HIGH CONFIDENCE CANDIDATE</span>
                  </div>
                </motion.div>
              )}

              {activeStageIndex === 2 && (
                /* STAGE 3 VISUAL: Beam Search Descent */
                <motion.div
                  key="stage-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
                >
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
                    [BEAM SEARCH DESCENT // k=3 BEAM WIDTH]
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ padding: '8px 12px', background: 'rgba(124, 58, 237, 0.06)', border: '1px solid #7C3AED', borderRadius: 6, fontSize: 11.5 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', color: '#7C3AED', fontWeight: 700 }}>L0: </span>
                      <span>Item 1A Financial Statements (Score: 0.94) → </span>
                      <span style={{ color: '#059669', fontWeight: 600 }}>EXPLORE</span>
                    </div>

                    <div style={{ padding: '8px 12px', background: '#F5F5F5', border: '1px dashed #D1D5DB', borderRadius: 6, fontSize: 11.5, color: '#9CA3AF' }}>
                      <span style={{ fontFamily: 'var(--font-mono)' }}>L0: </span>
                      <span>Item 1B Risk Factors (Score: 0.18) → </span>
                      <span style={{ color: '#DC2626' }}>PRUNED (-12,000 TOKENS)</span>
                    </div>

                    <div style={{ padding: '8px 12px', background: 'rgba(124, 58, 237, 0.06)', border: '1px solid #7C3AED', borderRadius: 6, fontSize: 11.5 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', color: '#7C3AED', fontWeight: 700 }}>L1: </span>
                      <span>Table 4.1 Variance Breakdown → </span>
                      <span style={{ color: '#059669', fontWeight: 600 }}>LEAF PINPOINTED</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeStageIndex === 3 && (
                /* STAGE 4 VISUAL: Knowledge Graph & Grounded Synthesis */
                <motion.div
                  key="stage-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
                >
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
                    [GROUNDED SYNTHESIS WITH DETERMINISTIC CITATION]
                  </div>

                  <div style={{ padding: '14px', background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 8, fontSize: 12.5, lineHeight: 1.6, color: '#166534' }}>
                    "Q3 operating margin expanded to 24.8% (+380 bps YoY) driven by cloud division scalability,
                    reversing previous EMEA foreign exchange drag."
                    <div style={{ marginTop: 8 }}>
                      <span className="citation-badge">[Doc 1 · §Item 1, Table 4.1]</span>
                      <span className="citation-badge">[Doc 2 · §Note 3]</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#059669', fontFamily: 'var(--font-mono)' }}>
                    <CheckCircle size={13} />
                    <span>100% of claims bound to verifiable document AST byte offsets.</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom Stage Navigation Stepper */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 20,
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
            }}
          >
            <button
              onClick={() => setActiveStageIndex((prev) => (prev > 0 ? prev - 1 : STAGES.length - 1))}
              style={{ color: 'var(--text-muted)', cursor: 'pointer', padding: '4px 8px' }}
            >
              ← PREVIOUS STAGE
            </button>

            <span style={{ color: 'var(--text-muted)' }}>
              STEP {activeStageIndex + 1} OF {STAGES.length}
            </span>

            <button
              onClick={() => setActiveStageIndex((prev) => (prev + 1) % STAGES.length)}
              style={{ color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer', padding: '4px 8px' }}
            >
              NEXT STAGE →
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
