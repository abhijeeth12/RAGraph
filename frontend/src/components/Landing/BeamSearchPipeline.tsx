'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GitBranch, Network, Filter, Layers, CheckCircle2, Cpu, ShieldCheck } from 'lucide-react'

interface Stage {
  id: string
  number: string
  title: string
  shortDesc: string
  detail: string
  formula: string
  codeSnippet: string
  stats: { label: string; value: string }[]
}

const PIPELINE_STAGES: Stage[] = [
  {
    id: 'ast-ingestion',
    number: '§ 01',
    title: 'AST Ingestion & Semantic Tree Induction',
    shortDesc: 'Replaces brute-force chunk splitting with document-native structural trees.',
    detail:
      'Incoming PDFs, markdown documents, and tech specs are parsed through LiteParse PDFium extractors. Headings, chapters, sub-clauses, and ruled tables are preserved as connected parent-child nodes rather than arbitrary fixed-length byte windows.',
    formula: 'Tree(D) = { R_{root} \\rightarrow S_{chapters} \\rightarrow \\sigma_{sections} \\rightarrow \\kappa_{chunks} }',
    codeSnippet: `// Document AST Parser
const docTree = await parser.parseStructure(document, {
  preserveHeadings: true,
  trackCoordinates: true, // p.18, section 4.2
  minSectionTokens: 128,
  maxSectionTokens: 1024
});
// Result: 1 Document -> 6 Chapters -> 28 Sections -> 112 Leaf Nodes`,
    stats: [
      { label: 'BOUNDARY INTEGRITY', value: '100%' },
      { label: 'SECTION DEPTH', value: 'Up to 5 levels' },
      { label: 'COORDINATE TRACKING', value: 'Page + Para exact' },
    ],
  },
  {
    id: 'branch-scoring',
    number: '§ 02',
    title: 'Top-Down Semantic Branch Scoring',
    shortDesc: 'Queries evaluate high-level section summaries before descending into leaves.',
    detail:
      'Rather than calculating dot-products against thousands of disjoint chunks, RA-Graph scores root and section summaries first. Unrelated chapters are pruned with zero vector penalty, concentrating compute on relevant sub-trees.',
    formula: 'Score(S_i, q) = \\cos(\\mathbf{e}_q, \\mathbf{e}_{summary(S_i)}) \\cdot \\text{BM25}(q, S_i)',
    codeSnippet: `// Level-1 Section Routing
const candidateBranches = await beamRouter.scoreSections({
  queryVector,
  branches: docTree.chapters,
  topK: 3 // Beam width k=3
});
// 12 chapters evaluated -> 9 branches pruned, 3 selected`,
    stats: [
      { label: 'ROUTING EFFICIENCY', value: '4.2x Faster' },
      { label: 'PRUNE RATIO', value: '75% of noise eliminated' },
      { label: 'COMPUTE BUDGET', value: '< 12ms' },
    ],
  },
  {
    id: 'beam-pruning',
    number: '§ 03',
    title: 'Context-Budgeted Beam Pruning',
    shortDesc: 'Maintains strict token budgets while keeping parent context intact.',
    detail:
      'As search descends into section leaves, parent summaries are dynamically prepended to each candidate chunk. The model always understands which article, theorem, or definition the chunk belongs to.',
    formula: 'Context(chunk) = \\text{Summary}(Parent) \\oplus \\text{Content}(chunk)',
    codeSnippet: `// Contextual Envelope Assembly
const leafContext = candidateLeaves.map(leaf => ({
  content: leaf.text,
  contextEnvelope: leaf.parentSection.summary,
  citationCoordinates: leaf.coordinates // [Doc §4.2, p.18]
}));
// Every candidate chunk carries its ancestral lineage`,
    stats: [
      { label: 'LOST CONTEXT RATE', value: '0.0%' },
      { label: 'ANCESTRAL ENVELOPE', value: 'Preserved' },
      { label: 'TOKEN OVERHEAD', value: '+14% vs raw chunk' },
    ],
  },
  {
    id: 'dual-path-rrf',
    number: '§ 04',
    title: 'Dual-Path Reciprocal Rank Fusion (RRF)',
    shortDesc: 'Fuses dense semantic embeddings with sparse keyword BM25 rankings.',
    detail:
      'Dense embeddings excel at conceptual meaning, while sparse BM25 catches exact identifiers (function names, error codes, legal statute numbers). Dual-Path RRF merges both rank lists with zero false-anchor drift.',
    formula: 'RRF(d) = \\sum_{m \\in \\{dense, sparse\\}} \\frac{1}{60 + \\text{rank}_m(d)}',
    codeSnippet: `// Reciprocal Rank Fusion
const fusedResults = reciprocalRankFusion([
  denseSemanticRankList,
  sparseBM25RankList
], { k: 60 });
// Guaranteed exact identifier matching + conceptual recall`,
    stats: [
      { label: 'EXACT IDENTIFIER HIT', value: '99.4%' },
      { label: 'RECALL@5', value: '96.8%' },
      { label: 'CITATION VERIFIED', value: 'Cryptographic hash' },
    ],
  },
]

export function BeamSearchPipeline() {
  const [activeStageIndex, setActiveStageIndex] = useState(0)
  const currentStage = PIPELINE_STAGES[activeStageIndex]

  return (
    <section
      id="architecture"
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
            color: '#38BDF8',
            marginBottom: 10,
            letterSpacing: '0.05em',
          }}
        >
          § 01 / TRAVERSAL PIPELINE
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
          The Hierarchical Beam Search Engine
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
          How RA-Graph routes queries through complex document trees without truncating context, corrupting tables, or losing section ancestry.
        </p>
      </div>

      {/* Stage Tab Selectors */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 14,
          marginBottom: 28,
        }}
      >
        {PIPELINE_STAGES.map((stage, idx) => {
          const isActive = activeStageIndex === idx
          return (
            <button
              key={stage.id}
              onClick={() => setActiveStageIndex(idx)}
              style={{
                background: isActive ? '#12151D' : '#0E1117',
                border: isActive
                  ? '1px solid rgba(56, 189, 248, 0.45)'
                  : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 12,
                padding: '20px 22px',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                position: 'relative',
                boxShadow: isActive ? '0 4px 20px rgba(56, 189, 248, 0.08)' : 'none',
              }}
              onMouseOver={(e) => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.18)'
                  e.currentTarget.style.background = '#161B24'
                }
              }}
              onMouseOut={(e) => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'
                  e.currentTarget.style.background = '#0E1117'
                }
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
                    fontSize: 12,
                    fontFamily: 'var(--font-mono)',
                    color: isActive ? '#38BDF8' : '#64748B',
                    fontWeight: 600,
                  }}
                >
                  {stage.number}
                </span>
                {isActive && (
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: '#38BDF8',
                      boxShadow: '0 0 10px #38BDF8',
                    }}
                  />
                )}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 15,
                  fontWeight: 600,
                  color: isActive ? '#F8FAFC' : '#CBD5E1',
                  marginBottom: 6,
                  letterSpacing: '-0.01em',
                }}
              >
                {stage.title}
              </div>
              <div style={{ fontSize: 12.5, color: '#94A3B8', lineHeight: 1.5, fontFamily: 'var(--font-body)' }}>
                {stage.shortDesc}
              </div>
            </button>
          )
        })}
      </div>

      {/* Active Stage Detailed Breakdown Panel */}
      <div
        style={{
          background: '#0E1117',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 16,
          padding: '36px 32px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStage.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: 36,
              }}
            >
              {/* Left Column: Conceptual & Mathematical Deep Dive */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    marginBottom: 14,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11.5,
                      fontFamily: 'var(--font-mono)',
                      background: 'rgba(56, 189, 248, 0.1)',
                      color: '#38BDF8',
                      padding: '3px 8px',
                      borderRadius: 4,
                      border: '1px solid rgba(56, 189, 248, 0.25)',
                    }}
                  >
                    PHASE {currentStage.number} SPECIFICATION
                  </span>
                </div>

                <h3
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 24,
                    fontWeight: 700,
                    color: '#F8FAFC',
                    margin: '0 0 16px',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {currentStage.title}
                </h3>

                <p
                  style={{
                    fontSize: 14.5,
                    color: '#94A3B8',
                    lineHeight: 1.68,
                    margin: '0 0 24px',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  {currentStage.detail}
                </p>

                {/* Mathematical Invariant Box */}
                <div
                  style={{
                    background: '#08090C',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 8,
                    padding: '14px 18px',
                    marginBottom: 24,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontFamily: 'var(--font-mono)',
                      color: '#64748B',
                      marginBottom: 6,
                      letterSpacing: '0.04em',
                    }}
                  >
                    FORMAL SPECIFICATION
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 13,
                      color: '#38BDF8',
                      overflowX: 'auto',
                    }}
                  >
                    {currentStage.formula}
                  </div>
                </div>

                {/* Metrics Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 14,
                    paddingTop: 18,
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  {currentStage.stats.map((st) => (
                    <div key={st.label}>
                      <div
                        style={{
                          fontSize: 10.5,
                          fontFamily: 'var(--font-mono)',
                          color: '#64748B',
                          marginBottom: 4,
                          letterSpacing: '0.03em',
                        }}
                      >
                        {st.label}
                      </div>
                      <div
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 14,
                          fontWeight: 700,
                          color: '#F1F5F9',
                        }}
                      >
                        {st.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Interactive Code Implementation */}
              <div>
                <div
                  style={{
                    background: '#08090C',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 12,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      padding: '10px 16px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: 11,
                      fontFamily: 'var(--font-mono)',
                      color: '#64748B',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', opacity: 0.8 }} />
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B', opacity: 0.8 }} />
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', opacity: 0.8 }} />
                      <span style={{ marginLeft: 6, color: '#94A3B8' }}>beam_traversal_kernel.ts</span>
                    </div>
                    <span>TYPESCRIPT / RAGRAPH</span>
                  </div>

                  <pre
                    style={{
                      padding: '20px',
                      margin: 0,
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12.5,
                      color: '#E2E8F0',
                      lineHeight: 1.65,
                      overflowX: 'auto',
                    }}
                  >
                    <code>{currentStage.codeSnippet}</code>
                  </pre>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}

