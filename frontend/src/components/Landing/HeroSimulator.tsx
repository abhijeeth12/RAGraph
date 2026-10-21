'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GitBranch, Layers, Cpu, ArrowRight, Play, CheckCircle2, Terminal, Activity, FileText, Sparkles } from 'lucide-react'

export interface QueryScenario {
  id: string
  title: string
  command: string
  query: string
  activePath: [string, string, string]
  beamScores: { l1: number; l2: number; l3: number; rrf: number }
  retrievedSnippet: string
  citation: string
  latencyMs: number
  sparklineData1: number[]
  sparklineData2: number[]
  entitiesCount: number
  edgesCount: number
}

const SCENARIOS: QueryScenario[] = [
  {
    id: 'beam-tree',
    title: 'Hierarchical Beam Search',
    command: '$ ragraph ingest --file Tree_RAG_Arch.pdf --beam-search',
    query: 'How does beam search traverse document outlines without losing context?',
    activePath: ['Document: Tree_RAG_Arch.pdf', '§ 2. Tree Construction', '¶ 2.3 Sibling Overlap'],
    beamScores: { l1: 0.94, l2: 0.89, l3: 0.85, rrf: 0.96 },
    retrievedSnippet: 'Level-2 section summaries qualify candidate subtrees before evaluating raw leaf paragraphs, reducing irrelevant retrieval noise by 74% while preserving chapter theses.',
    citation: '[Doc 1 §2.3]',
    latencyMs: 42,
    sparklineData1: [25, 38, 55, 48, 62, 78, 85, 94],
    sparklineData2: [40, 45, 60, 52, 70, 75, 82, 89],
    entitiesCount: 42,
    edgesCount: 68,
  },
  {
    id: 'dual-path',
    title: 'Dual-Path RRF Fallback',
    command: '$ ragraph query --eval-coherence --fallback-rrf',
    query: 'What happens when beam similarity drops below the coherence threshold?',
    activePath: ['Trigger: T_dual < 0.72', 'Parallel: BM25 Sparse + Dense Qdrant', 'Fusion: Reciprocal Rank Merge'],
    beamScores: { l1: 0.68, l2: 0.71, l3: 0.88, rrf: 0.92 },
    retrievedSnippet: 'When structural coherence drops, the fallback pipeline executes a flat dense sweep merged with exact BM25 keyword matching via Reciprocal Rank Fusion, eliminating blind spots.',
    citation: '[Doc 3 §1.4]',
    latencyMs: 58,
    sparklineData1: [68, 62, 70, 65, 75, 82, 88, 92],
    sparklineData2: [30, 42, 55, 60, 68, 74, 82, 91],
    entitiesCount: 36,
    edgesCount: 54,
  },
  {
    id: 'graph-rerank',
    title: 'Graph Sibling Expansion',
    command: '$ ragraph link-entities --multimodal --context-expand',
    query: 'How are extracted image figures linked to structural headings?',
    activePath: ['Entity: Figure_04.png', 'Parent: § 3. Evaluation', 'Context: Multimodal Alignment'],
    beamScores: { l1: 0.91, l2: 0.87, l3: 0.83, rrf: 0.94 },
    retrievedSnippet: 'Extracted visual figures are attached as child nodes to their immediate section header, allowing the generative LLM to refer to diagrams with exact contextual provenance.',
    citation: '[Doc 2 §3.1]',
    latencyMs: 49,
    sparklineData1: [35, 48, 65, 70, 78, 84, 89, 94],
    sparklineData2: [50, 55, 62, 68, 75, 80, 83, 87],
    entitiesCount: 58,
    edgesCount: 92,
  },
]

// Render SVG sparkline curve
function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const width = 110
  const height = 28

  const points = data
    .map((val, idx) => {
      const x = (idx / (data.length - 1)) * width
      const y = height - ((val - min) / range) * (height - 6) - 3
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  return (
    <svg width={width} height={height} className="overflow-visible" aria-hidden="true">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  )
}

interface Props {
  onLaunchDemo?: () => void
}

export function HeroSimulator({ onLaunchDemo }: Props) {
  const [selectedScenario, setSelectedScenario] = useState<QueryScenario>(SCENARIOS[0])
  const [isSimulating, setIsSimulating] = useState(false)

  const handleSelect = (scenario: QueryScenario) => {
    setIsSimulating(true)
    setSelectedScenario(scenario)
    setTimeout(() => setIsSimulating(false), 240)
  }

  return (
    <div className="w-full relative rounded-xl border border-white/10 bg-[#0d1015]/90 backdrop-blur-xl shadow-2xl overflow-hidden font-sans">
      {/* Top Console Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white/[0.02] border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
          </div>
          <span className="text-xs text-neutral-400 font-mono tracking-tight flex items-center gap-1.5">
            <Terminal size={12} className="text-neutral-500" />
            ragraph :: hierarchical-engine-v5
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] text-emerald-400 font-medium font-mono flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            0.05ms Matmul
          </span>
          <span className="text-[11px] text-neutral-500 font-mono">Qdrant 384-d</span>
        </div>
      </div>

      {/* Interactive Scenario Tabs */}
      <div className="flex items-center gap-1 px-3 pt-2 bg-black/20 border-b border-white/[0.06] overflow-x-auto">
        {SCENARIOS.map((sc) => {
          const active = selectedScenario.id === sc.id
          return (
            <button
              key={sc.id}
              onClick={() => handleSelect(sc)}
              className={`px-3 py-1.5 text-xs font-medium rounded-t-md transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer border-b-2 ${
                active
                  ? 'text-white border-violet-500 bg-white/[0.04]'
                  : 'text-neutral-400 border-transparent hover:text-neutral-200 hover:bg-white/[0.02]'
              }`}
            >
              <Play size={10} className={active ? 'fill-violet-400 text-violet-400' : 'text-neutral-500'} />
              {sc.title}
            </button>
          )
        })}
      </div>

      {/* Main Board Canvas */}
      <div className="p-4 md:p-5 flex flex-col gap-4">
        {/* Command + Glowing Branch Line */}
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/[0.04] border border-white/10 font-mono text-xs text-neutral-300">
            <span className="text-violet-400 font-semibold">$</span>
            <span>{selectedScenario.command}</span>
          </div>

          {/* SVG Connector Branch Line (like Render.com's $ git push branching into production services) */}
          <div className="hidden sm:block absolute left-8 top-8 w-12 h-6 border-l-2 border-b-2 border-violet-500/40 rounded-bl-lg pointer-events-none" />
        </div>

        {/* Section Label */}
        <div className="flex items-center justify-between text-[11px] text-neutral-500 tracking-wider font-mono uppercase">
          <span>PIPELINE EXECUTION // LIVE TOPOLOGY</span>
          <span>{selectedScenario.latencyMs}ms elapsed</span>
        </div>

        {/* Live Service Grid (Render-style production cards) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Card 1: Tree Retriever */}
          <div className="rounded-lg p-3.5 bg-black/40 border border-white/[0.08] flex flex-col justify-between hover:border-violet-500/30 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                  <GitBranch size={13} className="text-violet-400" />
                  tree-retriever
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded text-emerald-400 bg-emerald-400/10 font-mono">
                  ✓ Traversing
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 line-clamp-1 mb-2 font-mono">
                {selectedScenario.activePath[0]}
              </p>
            </div>

            <div className="pt-2 border-t border-white/[0.06] flex items-end justify-between">
              <div>
                <span className="text-[10px] text-neutral-500 uppercase font-mono block">Beam Score</span>
                <span className="text-xs font-mono font-medium text-violet-300">
                  {selectedScenario.beamScores.l1}
                </span>
              </div>
              <MiniSparkline data={selectedScenario.sparklineData1} color="#a78bfa" />
            </div>
          </div>

          {/* Card 2: Section Beam & Graph */}
          <div className="rounded-lg p-3.5 bg-black/40 border border-white/[0.08] flex flex-col justify-between hover:border-sky-500/30 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                  <Layers size={13} className="text-sky-400" />
                  graph-ontology
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded text-sky-400 bg-sky-400/10 font-mono">
                  ✓ Coherent
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 line-clamp-1 mb-2 font-mono">
                {selectedScenario.activePath[1]}
              </p>
            </div>

            <div className="pt-2 border-t border-white/[0.06] flex items-end justify-between">
              <div>
                <span className="text-[10px] text-neutral-500 uppercase font-mono block">Section Reciprocal</span>
                <span className="text-xs font-mono font-medium text-sky-300">
                  {selectedScenario.beamScores.l2}
                </span>
              </div>
              <MiniSparkline data={selectedScenario.sparklineData2} color="#38bdf8" />
            </div>
          </div>

          {/* Card 3: Dual-Path Fusion */}
          <div className="rounded-lg p-3.5 bg-black/40 border border-white/[0.08] flex flex-col justify-between hover:border-emerald-500/30 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                  <Cpu size={13} className="text-emerald-400" />
                  dual-path-rrf
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded text-emerald-400 bg-emerald-400/10 font-mono">
                  ✓ Merged
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 line-clamp-1 mb-2 font-mono">
                {selectedScenario.activePath[2]}
              </p>
            </div>

            <div className="pt-2 border-t border-white/[0.06] flex items-end justify-between">
              <div>
                <span className="text-[10px] text-neutral-500 uppercase font-mono block">Fused RRF</span>
                <span className="text-xs font-mono font-medium text-emerald-300">
                  {selectedScenario.beamScores.rrf}
                </span>
              </div>
              <MiniSparkline data={selectedScenario.sparklineData1.slice().reverse()} color="#34d399" />
            </div>
          </div>
        </div>

        {/* Synthesized Output Preview */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedScenario.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="p-3.5 rounded-lg bg-black/50 border border-white/[0.08] flex flex-col gap-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-300 flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-400" />
                Synthesized Grounded Answer
              </span>
              <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-violet-500/15 text-violet-300 border border-violet-500/25">
                {selectedScenario.citation}
              </span>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              {selectedScenario.retrievedSnippet}{' '}
              <strong className="text-violet-400 font-semibold">{selectedScenario.citation}</strong>
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Bottom Interactive Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1 border-t border-white/[0.06]">
          <div className="flex items-center gap-3 text-xs text-neutral-400 font-mono">
            <span>{selectedScenario.entitiesCount} Entities</span>
            <span aria-hidden="true" className="text-neutral-600">·</span>
            <span>{selectedScenario.edgesCount} Concept Edges</span>
            <span aria-hidden="true" className="text-neutral-600">·</span>
            <span className="text-emerald-400">Zero Blind Chunks</span>
          </div>

          {onLaunchDemo && (
            <button
              onClick={onLaunchDemo}
              className="text-xs font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/15 px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ml-auto"
            >
              Launch Demo Workspace <ArrowRight size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
