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
    number: '[01]',
    title: 'AST Ingestion & Semantic Tree Induction',
    shortDesc: 'Replaces brute-force chunk splitting with document-native structural trees.',
    detail:
      'Incoming PDFs, markdown documents, and tech specs are parsed through layout-aware AST extractors. Headings, chapters, sub-clauses, and tables are preserved as parent-child nodes rather than arbitrary fixed-length byte windows.',
    formula: 'Tree(D) = { R_{root} \\rightarrow S_{chapters} \\rightarrow \\sigma_{sections} \\rightarrow \\kappa_{chunks} }',
    codeSnippet: `// Document AST Parser
const docTree = parser.parseStructure(document, {
  preserveHeadings: true,
  trackCoordinates: true, // p.14, section 4.2
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
    number: '[02]',
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
    number: '[03]',
    title: 'Context-Budgeted Beam Pruning',
    shortDesc: 'Maintains strict token budgets while keeping parent context intact.',
    detail:
      'As search descends into section leaves, parent summaries are dynamically prepended to each candidate chunk. The model always understands which article, theorem, or definition the chunk belongs to.',
    formula: 'Context(chunk) = \\text{Summary}(Parent) \\oplus \\text{Content}(chunk)',
    codeSnippet: `// Contextual Envelope Assembly
const leafContext = candidateLeaves.map(leaf => ({
  content: leaf.text,
  contextEnvelope: leaf.parentSection.summary,
  citationCoordinates: leaf.coordinates // [Doc §4.2, p.14]
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
    number: '[04]',
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
      <div style={{ marginBottom: 44, borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: 20 }}>
        <div
          style={{
            fontSize: 12,
            fontFamily: "'JetBrains Mono', monospace",
            color: '#38bdf8',
            marginBottom: 8,
          }}
        >
          [02] TRAVERSAL PIPELINE
        </div>
        <h2
          style={{
            fontSize: 'clamp(26px, 3.8vw, 42px)',
            fontWeight: 700,
            letterSpacing: '-0.03em',
            color: '#f8fafc',
            margin: '0 0 12px',
          }}
        >
          The Hierarchical Beam Search Engine
        </h2>
        <p style={{ fontSize: 16, color: '#94a3b8', margin: 0, maxWidth: 720, lineHeight: 1.6 }}>
          How RA-Graph routes queries through complex document trees without truncating context or losing section ancestry.
        </p>
      </div>

      {/* Stage Tab Selectors */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 12,
          marginBottom: 32,
        }}
      >
        {PIPELINE_STAGES.map((stage, idx) => {
          const isActive = activeStageIndex === idx
          return (
            <button
              key={stage.id}
              onClick={() => setActiveStageIndex(idx)}
              style={{
                background: isActive ? 'rgba(56, 189, 248, 0.08)' : '#13161c',
                border: isActive
                  ? '1px solid rgba(56, 189, 248, 0.4)'
                  : '1px solid rgba(255, 255, 255, 0.07)',
                borderRadius: 8,
                padding: '18px 20px',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                position: 'relative',
              }}
              onMouseOver={(e) => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'
                  e.currentTarget.style.background = '#181c24'
                }
              }}
              onMouseOut={(e) => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.07)'
                  e.currentTarget.style.background = '#13161c'
                }
              }}
            >
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
                    fontSize: 12,
                    fontFamily: "'JetBrains Mono', monospace",
                    color: isActive ? '#38bdf8' : '#64748b',
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
                      background: '#38bdf8',
                      boxShadow: '0 0 8px #38bdf8',
                    }}
                  />
                )}
              </div>
              <div
                style={{
                  fontSize: 14.5,
                  fontWeight: 600,
                  color: isActive ? '#f8fafc' : '#cbd5e1',
                  marginBottom: 6,
                }}
              >
                {stage.title}
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.45 }}>
                {stage.shortDesc}
              </div>
            </button>
          )
        })}
      </div>

      {/* Active Stage Detailed Breakdown Panel */}
      <div
        style={{
          background: '#13161c',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 12,
          padding: '32px 28px',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.35)',
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
                gap: 32,
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
                      fontSize: 12,
                      fontFamily: "'JetBrains Mono', monospace",
                      background: 'rgba(56, 189, 248, 0.12)',
                      color: '#38bdf8',
                      padding: '3px 8px',
                      borderRadius: 4,
                    }}
                  >
                    PHASE {currentStage.number} SPECIFICATION
                  </span>
                </div>

                <h3
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: '#f8fafc',
                    margin: '0 0 16px',
                  }}
                >
                  {currentStage.title}
                </h3>

                <p
                  style={{
                    fontSize: 14.5,
                    color: '#94a3b8',
                    lineHeight: 1.65,
                    margin: '0 0 24px',
                  }}
                >
                  {currentStage.detail}
                </p>

                {/* Mathematical Invariant Box */}
                <div
                  style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: 6,
                    padding: '14px 18px',
                    marginBottom: 24,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontFamily: "'JetBrains Mono', monospace",
                      color: '#64748b',
                      marginBottom: 6,
                    }}
                  >
                    FORMAL SPECIFICATION
                  </div>
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 13,
                      color: '#38bdf8',
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
                    gap: 12,
                    paddingTop: 16,
                    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  {currentStage.stats.map((st) => (
                    <div key={st.label}>
                      <div
                        style={{
                          fontSize: 10.5,
                          fontFamily: "'JetBrains Mono', monospace",
                          color: '#64748b',
                        }}
                      >
                        {st.label}
                      </div>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: '#f1f5f9',
                          marginTop: 3,
                        }}
                      >
                        {st.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Concrete Implementation Preview */}
              <div>
                <div
                  style={{
                    background: '#0b0d11',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 8,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 16px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                      fontSize: 11.5,
                      fontFamily: "'JetBrains Mono', monospace",
                      color: '#94a3b8',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} />
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
                      <span style={{ marginLeft: 8, color: '#64748b' }}>pipeline_engine.ts</span>
                    </div>
                    <span style={{ color: '#38bdf8' }}>TS v5.7</span>
                  </div>

                  <pre
                    style={{
                      margin: 0,
                      padding: '18px 20px',
                      fontSize: 12.5,
                      lineHeight: 1.6,
                      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                      color: '#cbd5e1',
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
