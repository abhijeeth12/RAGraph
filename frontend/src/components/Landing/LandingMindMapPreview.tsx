'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Network, Sparkles, BookOpen, Layers, CheckCircle } from 'lucide-react'

interface ConceptNode {
  id: string
  label: string
  category: 'core' | 'method' | 'evidence' | 'citation'
  x: number
  y: number
  connections: string[]
  description: string
}

const NODES: ConceptNode[] = [
  {
    id: 'hierarchical-index',
    label: 'Hierarchical Tree Index',
    category: 'core',
    x: 50,
    y: 30,
    connections: ['beam-search', 'section-outlines', 'multimodal-schematics'],
    description: 'Document-level semantic outline preserving parent-child section relationships.',
  },
  {
    id: 'beam-search',
    label: 'Section-Aware Beam Search',
    category: 'method',
    x: 24,
    y: 65,
    connections: ['hierarchical-index', 'dual-path-rrf', 'grounded-citation'],
    description: 'Cascades down from L1 abstracts to qualify candidate subtrees before evaluating leaf text.',
  },
  {
    id: 'section-outlines',
    label: 'Heading Summaries',
    category: 'core',
    x: 76,
    y: 65,
    connections: ['hierarchical-index', 'sibling-overlap', 'grounded-citation'],
    description: 'Level-2 topical outlines retaining chapter theses and theoretical context.',
  },
  {
    id: 'dual-path-rrf',
    label: 'Dual-Path RRF Fallback',
    category: 'method',
    x: 14,
    y: 88,
    connections: ['beam-search'],
    description: 'Merges dense Qdrant vectors with sparse BM25 keyword matching for rare terminology.',
  },
  {
    id: 'sibling-overlap',
    label: 'Sibling Context Expansion',
    category: 'evidence',
    x: 50,
    y: 82,
    connections: ['section-outlines', 'grounded-citation'],
    description: 'Injects adjacent paragraph context to prevent fragmented reasoning and lost proofs.',
  },
  {
    id: 'multimodal-schematics',
    label: 'Figure & Diagram Binding',
    category: 'evidence',
    x: 86,
    y: 88,
    connections: ['hierarchical-index', 'grounded-citation'],
    description: 'Binds extracted visual flowcharts and architecture schematics directly to parent headings.',
  },
  {
    id: 'grounded-citation',
    label: 'Verified Citations [Doc 1 §2.3]',
    category: 'citation',
    x: 50,
    y: 100,
    connections: ['beam-search', 'section-outlines', 'sibling-overlap', 'multimodal-schematics'],
    description: 'In-line verifiable provenance linking every assertion to exact document sections and page offsets.',
  },
]

export function LandingMindMapPreview() {
  const [activeNodeId, setActiveNodeId] = useState<string>('hierarchical-index')
  const activeNode = NODES.find((n) => n.id === activeNodeId) || NODES[0]

  return (
    <div className="w-full rounded-2xl border border-[#d4af37]/25 bg-gradient-to-b from-[#12141f] via-[#0e1018] to-[#090b11] p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_24px_rgba(212,175,55,0.06)] relative overflow-hidden">
      {/* Background Archival Radial Glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(212, 175, 55, 0.05) 0%, transparent 70%)',
          filter: 'blur(70px)',
        }}
        aria-hidden="true"
      />

      <div className="flex flex-col lg:flex-row items-stretch gap-8 relative z-10">
        {/* Interactive SVG Network Canvas */}
        <div className="w-full lg:w-3/5 h-[340px] sm:h-[400px] rounded-xl bg-black/40 border border-white/[0.06] p-4 relative flex items-center justify-center overflow-hidden">
          <svg className="w-full h-full" viewBox="0 0 100 110" preserveAspectRatio="xMidYMid meet">
            {/* Draw Connecting Edges */}
            {NODES.map((sourceNode) =>
              sourceNode.connections.map((targetId) => {
                const targetNode = NODES.find((n) => n.id === targetId)
                if (!targetNode) return null
                const isConnectedToActive =
                  sourceNode.id === activeNodeId || targetNode.id === activeNodeId
                return (
                  <line
                    key={`${sourceNode.id}-${targetNode.id}`}
                    x1={sourceNode.x}
                    y1={sourceNode.y}
                    x2={targetNode.x}
                    y2={targetNode.y}
                    stroke={isConnectedToActive ? '#d4af37' : 'rgba(245, 244, 239, 0.12)'}
                    strokeWidth={isConnectedToActive ? '0.75' : '0.35'}
                    strokeDasharray={isConnectedToActive ? 'none' : '1.5 1.5'}
                    className="transition-all duration-300"
                  />
                )
              })
            )}

            {/* Draw Interactive Concept Nodes */}
            {NODES.map((node) => {
              const isActive = node.id === activeNodeId
              const isConnected =
                activeNode.connections.includes(node.id) || node.connections.includes(activeNodeId)
              return (
                <g
                  key={node.id}
                  className="cursor-pointer"
                  onClick={() => setActiveNodeId(node.id)}
                >
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={isActive ? 4 : isConnected ? 3 : 2.2}
                    fill={isActive ? '#d4af37' : isConnected ? '#e5c07b' : '#222530'}
                    stroke={isActive ? '#f5f4ef' : isConnected ? '#d4af37' : 'rgba(255,255,255,0.2)'}
                    strokeWidth={isActive ? '0.8' : '0.4'}
                    className="transition-all duration-200"
                  />
                  <text
                    x={node.x}
                    y={node.y - 4}
                    textAnchor="middle"
                    fill={isActive ? '#f5f4ef' : isConnected ? '#d4af37' : '#92918b'}
                    fontSize={isActive ? '3.4' : '2.8'}
                    fontFamily="sans-serif"
                    fontWeight={isActive ? '600' : '500'}
                    className="select-none transition-all duration-200"
                  >
                    {node.label}
                  </text>
                </g>
              )
            })}
          </svg>

          {/* Canvas Bottom Instruction */}
          <div className="absolute bottom-3 left-4 text-[11px] text-neutral-500 font-mono">
            Click any concept node to inspect relational traversal
          </div>
        </div>

        {/* Node Detail & Provenance Inspector */}
        <div className="w-full lg:w-2/5 flex flex-col justify-between rounded-xl bg-black/30 border border-white/[0.06] p-5 sm:p-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#d4af37] mb-2">
              <Network size={14} />
              <span>Concept Ontology Node</span>
            </div>

            <h3 className="text-xl font-medium text-[#f5f4ef] mb-3">
              {activeNode.label}
            </h3>

            <p className="text-sm text-neutral-300 leading-relaxed mb-6 font-normal">
              {activeNode.description}
            </p>

            <div className="space-y-2">
              <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider block">
                Connected Structural Edges
              </span>
              <div className="flex flex-wrap gap-2">
                {activeNode.connections.map((targetId) => {
                  const target = NODES.find((n) => n.id === targetId)
                  if (!target) return null
                  return (
                    <button
                      key={targetId}
                      onClick={() => setActiveNodeId(targetId)}
                      className="px-2.5 py-1 rounded bg-white/[0.04] hover:bg-[#d4af37]/15 border border-white/[0.08] hover:border-[#d4af37]/30 text-xs text-neutral-300 hover:text-[#f5f4ef] transition-colors cursor-pointer"
                    >
                      → {target.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/[0.06] mt-6 flex items-center justify-between text-xs text-neutral-400 font-mono">
            <span>Dynamic 2D Force Synced</span>
            <span className="text-[#d4af37]">Live In-Memory Graph</span>
          </div>
        </div>
      </div>
    </div>
  )
}
