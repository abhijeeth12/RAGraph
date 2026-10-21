'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GitBranch,
  Search,
  CheckCircle2,
  ArrowRight,
  Play,
  Pause,
  RotateCcw,
} from 'lucide-react'

export interface ResearchScenario {
  id: string
  label: string
  shortLabel: string
  query: string
  documentName: string
  pageCount: number
  hierarchyPath: {
    l1: { title: string; score: number; type: string }
    l2: { title: string; score: number; type: string }
    l3: { title: string; score: number; type: string }
  }
  synthesizedAnswer: string
  citationTag: string
  citationDetails: {
    heading: string
    page: number
    cosineSimilarity: number
    paragraphExcerpt: string
  }
  latencyMs: number
}

const RESEARCH_SCENARIOS: ResearchScenario[] = [
  {
    id: 'beam-tree',
    label: 'Outline Beam Search',
    shortLabel: 'Beam Search',
    query: 'How does section-aware beam search preserve context across 60-page research papers?',
    documentName: 'Tree_RAG_Architecture.pdf',
    pageCount: 64,
    hierarchyPath: {
      l1: { title: '1. Executive Abstract: Multi-Tier Indexing', score: 0.95, type: 'Section' },
      l2: { title: '§ 2. Tree Construction & Outlines', score: 0.91, type: 'Subsection' },
      l3: { title: '¶ 2.3 Sibling Overlap & Context Budgeting', score: 0.88, type: 'Leaf Paragraph' },
    },
    synthesizedAnswer:
      'Rather than querying thousands of disconnected chunks, beam search first qualifies candidate section outlines. Sibling paragraphs and parent heading summaries are injected into context, reducing irrelevant retrieval noise by 74% while preserving chapter theses.',
    citationTag: '[Doc 1 §2.3]',
    citationDetails: {
      heading: '§ 2.3 Sibling Overlap & Context Budgeting',
      page: 18,
      cosineSimilarity: 0.948,
      paragraphExcerpt:
        '"Level-2 section summaries qualify candidate subtrees before evaluating leaf paragraphs. Sibling overlap ensures uninterrupted logical continuity across complex multi-step proofs."',
    },
    latencyMs: 42,
  },
  {
    id: 'dual-path',
    label: 'Dual-Path RRF Gate',
    shortLabel: 'Dual-Path RRF',
    query: 'What safeguards prevent blind spots when queries contain rare technical acronyms?',
    documentName: 'HyDE_Hybrid_Search.pdf',
    pageCount: 38,
    hierarchyPath: {
      l1: { title: '1. Hybrid Retrieval Strategy', score: 0.84, type: 'Section' },
      l2: { title: '§ 3. Dual-Path Coherence Gate', score: 0.81, type: 'Subsection' },
      l3: { title: '¶ 3.2 Reciprocal Rank Fusion (BM25 + Dense)', score: 0.95, type: 'Leaf Paragraph' },
    },
    synthesizedAnswer:
      'When query semantic similarity falls below threshold (T = 0.72), the engine fires a parallel BM25 exact keyword sweep merged with dense vectors via Reciprocal Rank Fusion, guaranteeing domain-specific jargon is never overlooked.',
    citationTag: '[Doc 3 §3.2]',
    citationDetails: {
      heading: '§ 3.2 Reciprocal Rank Fusion of Sparse BM25',
      page: 24,
      cosineSimilarity: 0.962,
      paragraphExcerpt:
        '"Reciprocal Rank Fusion merges sparse inverted indices with dense manifold vectors, effectively removing the vocabulary gap for specialized domain jargon."',
    },
    latencyMs: 54,
  },
  {
    id: 'multimodal',
    label: 'Multimodal Schematics',
    shortLabel: 'Multimodal',
    query: 'How are architectural figures and diagrams bound to theoretical proofs?',
    documentName: 'Graph_Reranking.pdf',
    pageCount: 46,
    hierarchyPath: {
      l1: { title: '1. Multimodal Document Geometry', score: 0.93, type: 'Section' },
      l2: { title: '§ 4. Visual Schematic Ingestion', score: 0.89, type: 'Subsection' },
      l3: { title: '¶ Figure 04: Vector Space Manifold Binding', score: 0.96, type: 'Leaf Paragraph' },
    },
    synthesizedAnswer:
      'Extracted visual diagrams, flowcharts, and figures are indexed as dedicated child nodes bound to their parent section headers. This preserves the exact theoretical prose accompanying each diagram, enabling grounded multimodal synthesis.',
    citationTag: '[Doc 2 §4.1]',
    citationDetails: {
      heading: '§ 4.1 Visual Schematic Ingestion & Node Binding',
      page: 31,
      cosineSimilarity: 0.971,
      paragraphExcerpt:
        '"Figures are not isolated raster blobs; each is embedded as an entity child of its immediate heading node, carrying full topical provenance."',
    },
    latencyMs: 48,
  },
]

interface Props {
  onLaunchDemo?: () => void
}

export function EvidenceTransformationHero({ onLaunchDemo }: Props) {
  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState(0)
  const [activeStage, setActiveStage] = useState<1 | 2 | 3>(3) // 1: Ingest, 2: Traverse, 3: Synthesize
  const [isPlaying, setIsPlaying] = useState(true)
  const [showProvenanceDrawer, setShowProvenanceDrawer] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const scenario = RESEARCH_SCENARIOS[selectedScenarioIndex]

  // Automated stage progression when playing
  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }

    timerRef.current = setInterval(() => {
      setActiveStage((prevStage) => {
        if (prevStage === 1) return 2
        if (prevStage === 2) return 3
        // If at stage 3, move to next scenario after pause
        setSelectedScenarioIndex((prevIdx) => (prevIdx + 1) % RESEARCH_SCENARIOS.length)
        return 1
      })
    }, 4500)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isPlaying])

  const handleSelectScenario = (index: number) => {
    setSelectedScenarioIndex(index)
    setActiveStage(3)
    setShowProvenanceDrawer(false)
  }

  const handleTogglePlay = () => {
    setIsPlaying(!isPlaying)
  }

  return (
    <div className="w-full relative rounded-2xl border border-[#d4af37]/35 bg-gradient-to-b from-[#131522] via-[#0f111a] to-[#0a0c13] shadow-[0_24px_50px_rgba(0,0,0,0.85),0_0_30px_rgba(212,175,55,0.1)] overflow-hidden font-sans text-neutral-200">
      {/* Subtle Archival Warm Ambient Glow */}
      <div
        className="absolute -top-12 -right-12 w-96 h-96 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(212, 175, 55, 0.09) 0%, transparent 65%)',
          filter: 'blur(60px)',
        }}
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-16 -left-16 w-80 h-80 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(126, 200, 163, 0.05) 0%, transparent 70%)',
          filter: 'blur(70px)',
        }}
        aria-hidden="true"
      />

      {/* ─── Top Control Bar: Status, Scenarios, and Simulation Controls ─── */}
      <div className="p-4 sm:p-5 border-b border-white/[0.08] relative z-10 bg-black/30">
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#d4af37] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#d4af37]" />
            </span>
            <span className="font-mono uppercase tracking-widest text-[#d4af37] font-semibold text-[11px]">
              Hierarchical Tree Engine
            </span>
            <span className="text-neutral-600 font-mono text-xs">|</span>
            <span className="font-mono text-emerald-400 text-[11px] bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20">
              {scenario.latencyMs}ms in-memory matmul
            </span>
          </div>

          {/* Simulation Playback Toggle & Reset */}
          <div className="flex items-center gap-1 bg-white/[0.04] p-1 rounded-md border border-white/[0.06]">
            <button
              onClick={handleTogglePlay}
              className="px-2 py-0.5 text-[11px] font-mono text-neutral-300 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
              title={isPlaying ? 'Pause auto-simulation' : 'Resume auto-simulation'}
            >
              {isPlaying ? <Pause size={11} className="text-[#d4af37]" /> : <Play size={11} className="text-[#d4af37]" />}
              <span>{isPlaying ? 'Auto' : 'Paused'}</span>
            </button>
            <button
              onClick={() => {
                setActiveStage(1)
              }}
              className="p-1 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              title="Re-run simulation"
            >
              <RotateCcw size={10} />
            </button>
          </div>
        </div>

        {/* Clean Responsive Scenario Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-lg bg-black/60 border border-white/[0.08]">
          {RESEARCH_SCENARIOS.map((sc, idx) => {
            const active = selectedScenarioIndex === idx
            return (
              <button
                key={sc.id}
                onClick={() => handleSelectScenario(idx)}
                className={`py-1.5 px-2 text-xs font-medium rounded-md transition-all text-center truncate cursor-pointer ${
                  active
                    ? 'bg-[#181a24] text-[#f5f4ef] border border-[#d4af37]/40 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.03]'
                }`}
              >
                <span className="hidden sm:inline">{sc.label}</span>
                <span className="inline sm:hidden">{sc.shortLabel}</span>
              </button>
            )
          })}
        </div>

        {/* Visual Stage Progress Indicator */}
        <div className="flex items-center justify-between pt-3 text-[11px] font-mono text-neutral-400">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveStage(1)}
              className={`flex items-center gap-1 cursor-pointer transition-colors ${
                activeStage >= 1 ? 'text-[#e5c07b] font-medium' : 'text-neutral-500'
              }`}
            >
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                activeStage >= 1 ? 'bg-[#d4af37]/20 border border-[#d4af37]/60 text-[#d4af37]' : 'bg-white/5 border border-white/10'
              }`}>
                1
              </span>
              <span>Inquiry</span>
            </button>

            <span className="text-neutral-700">──</span>

            <button
              onClick={() => setActiveStage(2)}
              className={`flex items-center gap-1 cursor-pointer transition-colors ${
                activeStage >= 2 ? 'text-[#e5c07b] font-medium' : 'text-neutral-500'
              }`}
            >
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                activeStage >= 2 ? 'bg-[#d4af37]/20 border border-[#d4af37]/60 text-[#d4af37]' : 'bg-white/5 border border-white/10'
              }`}>
                2
              </span>
              <span>Beam Tree</span>
            </button>

            <span className="text-neutral-700">──</span>

            <button
              onClick={() => setActiveStage(3)}
              className={`flex items-center gap-1 cursor-pointer transition-colors ${
                activeStage >= 3 ? 'text-[#e5c07b] font-medium' : 'text-neutral-500'
              }`}
            >
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                activeStage >= 3 ? 'bg-[#d4af37]/20 border border-[#d4af37]/60 text-[#d4af37]' : 'bg-white/5 border border-white/10'
              }`}>
                3
              </span>
              <span>Evidence</span>
            </button>
          </div>

          <span className="text-[10px] text-neutral-500 hidden sm:inline">
            Step {activeStage} of 3
          </span>
        </div>
      </div>

      {/* ─── Card Body: Inquiry, Tree Traversal, and Evidence ─── */}
      <div className="p-4 sm:p-6 space-y-4 relative z-10 min-h-[440px] flex flex-col justify-between">
        <div className="space-y-4">
          {/* Step 1: Research Inquiry (Query Ingestion) */}
          <motion.div
            animate={{ opacity: activeStage >= 1 ? 1 : 0.4 }}
            className="p-3.5 sm:p-4 rounded-xl bg-black/50 border border-white/[0.07] relative overflow-hidden"
          >
            <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono mb-1.5">
              <span className="flex items-center gap-1.5 text-[#d4af37] font-semibold">
                <Search size={12} />
                RESEARCH PROMPT
              </span>
              <span className="text-neutral-400 font-mono truncate max-w-[220px]">
                {scenario.documentName} ({scenario.pageCount} pages)
              </span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-[#f5f4ef] leading-relaxed">
              "{scenario.query}"
            </p>
          </motion.div>

          {/* Step 2: Connected Hierarchical Tree Spine (No arbitrary stair-stepping) */}
          <motion.div
            animate={{ opacity: activeStage >= 2 ? 1 : 0.4 }}
            className="p-3.5 sm:p-4 rounded-xl bg-black/40 border border-white/[0.07] relative"
          >
            <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 mb-3">
              <span className="flex items-center gap-1.5 text-neutral-300 font-semibold">
                <GitBranch size={12} className="text-[#d4af37]" />
                CASCADING OUTLINE TRAVERSAL
              </span>
              <span className="text-neutral-500 text-[10px]">Zero Blind Chunking</span>
            </div>

            {/* Tree Container with an SVG Hierarchical Spine */}
            <div className="relative pl-6 space-y-2">
              {/* Vertical Trunk Line */}
              <div
                className="absolute left-2.5 top-2 bottom-3 w-[1.5px] bg-gradient-to-b from-[#d4af37]/60 via-emerald-400/50 to-[#d4af37]"
                aria-hidden="true"
              />

              {/* Node 1: Section Abstract */}
              <div className="relative flex items-center justify-between text-xs p-2 rounded-lg bg-[#12141c] border border-white/[0.06]">
                {/* Horizontal stem connecting to vertical trunk */}
                <div
                  className="absolute -left-3.5 top-1/2 w-3.5 h-[1.5px] bg-[#d4af37]/60"
                  aria-hidden="true"
                />
                <div className="flex items-center gap-2 text-neutral-300 truncate pr-2">
                  <span className="w-2 h-2 rounded-full bg-[#d4af37] shrink-0 shadow-[0_0_8px_rgba(212,175,55,0.8)]" />
                  <span className="font-mono text-[10px] text-[#e5c07b] font-semibold shrink-0">L1:</span>
                  <span className="font-medium text-[#f5f4ef] text-xs truncate">
                    {scenario.hierarchyPath.l1.title}
                  </span>
                </div>
                <span className="font-mono text-[10px] text-neutral-400 shrink-0 bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.06]">
                  rel {scenario.hierarchyPath.l1.score}
                </span>
              </div>

              {/* Node 2: Subsection */}
              <div className="relative flex items-center justify-between text-xs p-2 rounded-lg bg-[#12141c] border border-white/[0.06]">
                <div
                  className="absolute -left-3.5 top-1/2 w-3.5 h-[1.5px] bg-emerald-400/50"
                  aria-hidden="true"
                />
                <div className="flex items-center gap-2 text-neutral-300 truncate pr-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                  <span className="font-mono text-[10px] text-emerald-400 font-semibold shrink-0">L2:</span>
                  <span className="font-medium text-[#f5f4ef] text-xs truncate">
                    {scenario.hierarchyPath.l2.title}
                  </span>
                </div>
                <span className="font-mono text-[10px] text-emerald-400 shrink-0 bg-emerald-400/10 px-1.5 py-0.5 rounded border border-emerald-400/20">
                  rel {scenario.hierarchyPath.l2.score}
                </span>
              </div>

              {/* Node 3: Leaf Paragraph with Provenance Tag */}
              <div className="relative flex items-center justify-between text-xs p-2 rounded-lg bg-[#171924] border border-[#d4af37]/35 shadow-sm">
                <div
                  className="absolute -left-3.5 top-1/2 w-3.5 h-[1.5px] bg-[#d4af37]"
                  aria-hidden="true"
                />
                <div className="flex items-center gap-2 text-neutral-300 truncate pr-2">
                  <span className="w-2 h-2 rounded-full bg-[#d4af37] shrink-0 animate-pulse" />
                  <span className="font-mono text-[10px] text-[#d4af37] font-bold shrink-0">Leaf:</span>
                  <span className="font-medium text-[#f5f4ef] text-xs truncate">
                    {scenario.hierarchyPath.l3.title}
                  </span>
                </div>
                <span className="font-mono text-[10px] font-semibold text-[#d4af37] shrink-0 bg-[#d4af37]/15 px-2 py-0.5 rounded border border-[#d4af37]/30">
                  provenance match
                </span>
              </div>
            </div>
          </motion.div>

          {/* Step 3: Grounded Synthesized Evidence & Provenance */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${scenario.id}-${activeStage}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: activeStage >= 3 ? 1 : 0.4, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="p-4 rounded-xl bg-[#13151f] border border-[#d4af37]/30 relative shadow-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-emerald-400" />
                  <span className="text-[11px] font-semibold text-[#f5f4ef] uppercase tracking-wider font-mono">
                    Synthesized Grounded Evidence
                  </span>
                </div>

                {/* Clickable Citation Badge */}
                <button
                  onClick={() => setShowProvenanceDrawer(!showProvenanceDrawer)}
                  className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-[#d4af37]/15 hover:bg-[#d4af37]/25 text-[#e5c07b] border border-[#d4af37]/40 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                  title="Click to view exact source document excerpt and citation proof"
                >
                  <span>{scenario.citationTag}</span>
                  <span className="text-[10px] text-[#d4af37]">Inspect ↗</span>
                </button>
              </div>

              <p className="text-xs sm:text-sm text-neutral-200 leading-relaxed font-normal">
                {scenario.synthesizedAnswer}{' '}
                <button
                  onClick={() => setShowProvenanceDrawer(true)}
                  className="text-[#e5c07b] font-semibold hover:underline cursor-pointer inline-flex items-center gap-0.5 font-mono text-xs"
                >
                  {scenario.citationTag}
                </button>
              </p>

              {/* Provenance Inspection Popover Drawer */}
              {showProvenanceDrawer && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 p-3.5 rounded-lg bg-black/90 border border-[#d4af37]/45 text-xs space-y-2 relative"
                >
                  <div className="flex items-center justify-between text-neutral-400 font-mono text-[11px] border-b border-white/[0.08] pb-1.5">
                    <span className="text-[#e5c07b] font-semibold truncate max-w-[260px]">
                      {scenario.citationDetails.heading}
                    </span>
                    <span className="text-neutral-400 shrink-0">Page {scenario.citationDetails.page}</span>
                  </div>
                  <p className="text-neutral-300 italic font-serif leading-relaxed text-[12px] bg-white/[0.02] p-2.5 rounded border border-white/[0.04]">
                    {scenario.citationDetails.paragraphExcerpt}
                  </p>
                  <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 pt-0.5">
                    <span>
                      Cosine Similarity:{' '}
                      <strong className="text-[#d4af37] font-semibold">
                        {scenario.citationDetails.cosineSimilarity}
                      </strong>
                    </span>
                    <span className="text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded border border-emerald-400/20">
                      Heading Attribution 100%
                    </span>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ─── Bottom Footer: Provenance Stats & CTA ─── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-white/[0.08] text-xs text-neutral-400 font-mono">
          <div className="flex items-center gap-2.5 text-[11px]">
            <span className="text-[#e5c07b]">0% blind chunk drift</span>
            <span aria-hidden="true" className="text-neutral-600">·</span>
            <span>100% chapter provenance</span>
          </div>

          {onLaunchDemo && (
            <button
              onClick={onLaunchDemo}
              className="text-xs font-semibold text-[#0a0c12] hover:text-black bg-[#f5f4ef] hover:bg-white px-4 py-2 rounded-full transition-all flex items-center gap-1.5 cursor-pointer ml-auto shadow-md hover:shadow-[#d4af37]/25 hover:-translate-y-0.5"
            >
              Open in Notebook <ArrowRight size={13} className="text-[#997715]" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

