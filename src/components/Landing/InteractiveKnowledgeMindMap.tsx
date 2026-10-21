import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Network, Layers, ArrowUpRight, Search, Zap, CheckCircle2 } from 'lucide-react'

interface EntityNode {
  id: string
  label: string
  category: 'core' | 'ast' | 'retrieval' | 'finance' | 'proof'
  x: number
  y: number
  connections: string[]
  description: string
  docSource: string
  confidence: number
}

const NODES: EntityNode[] = [
  {
    id: 'tree-rag',
    label: 'Hierarchical Tree-RAG',
    category: 'core',
    x: 48,
    y: 50,
    connections: ['ast-parser', 'rrf-fusion', 'citations', 'beam-prune'],
    description: 'Central engine maintaining document ancestral outlines and executing recursive branch descent.',
    docSource: 'Architecture Spec v2.4 · §1.0',
    confidence: 0.99,
  },
  {
    id: 'ast-parser',
    label: 'Markdown AST Parser',
    category: 'ast',
    x: 22,
    y: 28,
    connections: ['tree-rag', 'table-serializer'],
    description: 'Transforms PDFs and DOCX into structurally preserved AST nodes without breaking table schemas.',
    docSource: 'sec_parser_core.ts',
    confidence: 0.98,
  },
  {
    id: 'table-serializer',
    label: 'Cell-Aligned Tables',
    category: 'ast',
    x: 14,
    y: 68,
    connections: ['ast-parser', 'ebitda-variance'],
    description: 'Guarantees multi-column financials retain ancestral column names across row splits.',
    docSource: '10K_Financial_Engine.md',
    confidence: 0.99,
  },
  {
    id: 'rrf-fusion',
    label: 'Reciprocal Rank Fusion',
    category: 'retrieval',
    x: 48,
    y: 18,
    connections: ['tree-rag', 'hyde-engine', 'bm25-sparse'],
    description: 'Reconciles dense cosine vector similarities with sparse BM25 token frequencies.',
    docSource: 'dual_path_rrf.py',
    confidence: 0.96,
  },
  {
    id: 'hyde-engine',
    label: 'HyDE Query Expansion',
    category: 'retrieval',
    x: 78,
    y: 24,
    connections: ['rrf-fusion', 'tree-rag'],
    description: 'Synthesizes hypothetical answer drafts to retrieve cross-domain research evidence.',
    docSource: 'hyde_generator.ts',
    confidence: 0.94,
  },
  {
    id: 'beam-prune',
    label: 'Beam Search Pruner',
    category: 'core',
    x: 76,
    y: 52,
    connections: ['tree-rag', 'raft-safety'],
    description: 'Prunes 84% of unpromising tree branches before passing candidate leaves to LLM.',
    docSource: 'beam_search_v2.go',
    confidence: 0.97,
  },
  {
    id: 'citations',
    label: 'Deterministic Citations',
    category: 'core',
    x: 52,
    y: 84,
    connections: ['tree-rag', 'ebitda-variance', 'raft-safety'],
    description: 'Direct mathematical verification binding every assertion to exact byte offsets in source text.',
    docSource: 'verifier_subsystem.rs',
    confidence: 0.99,
  },
  {
    id: 'raft-safety',
    label: 'Leader Completeness',
    category: 'proof',
    x: 85,
    y: 78,
    connections: ['beam-prune', 'citations'],
    description: 'Theorem 5.4.3: guarantees state machine invariance across network split-brain partitions.',
    docSource: 'raft_consensus_extended.pdf',
    confidence: 0.99,
  },
  {
    id: 'ebitda-variance',
    label: 'Q3 Operating Margin',
    category: 'finance',
    x: 25,
    y: 88,
    connections: ['table-serializer', 'citations'],
    description: 'Extracted +380 bps variance table grounded in Q3 10-K footnote disclosures.',
    docSource: 'SEC_10K_FY25.pdf · Note 3',
    confidence: 0.99,
  },
]

export function InteractiveKnowledgeMindMap() {
  const [selectedNodeId, setSelectedNodeId] = useState<string>('tree-rag')
  const [activeCategory, setActiveCategory] = useState<string>('all')

  const selectedNode = NODES.find((n) => n.id === selectedNodeId) ?? NODES[0]

  return (
    <section
      id="dual-engine"
      style={{
        padding: '72px 24px',
        maxWidth: 1380,
        margin: '0 auto',
        width: '100%',
      }}
    >
      {/* Header */}
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
            § 04 — RELATIONAL ENTITY KNOWLEDGE GRAPH
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
            /graph
            <span
              style={{
                fontSize: 'clamp(18px, 2.2vw, 32px)',
                color: 'var(--text-secondary)',
                fontWeight: 500,
                marginLeft: 14,
              }}
            >
              Multi-hop entity relations & proof traversal.
            </span>
          </h2>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['all', 'core', 'ast', 'retrieval', 'proof'].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                padding: '5px 12px',
                borderRadius: 4,
                border: activeCategory === cat ? '1px solid var(--accent-blue)' : '1px solid var(--border)',
                background: activeCategory === cat ? 'rgba(47, 76, 255, 0.08)' : '#FFFFFF',
                color: activeCategory === cat ? '#2F4CFF' : 'var(--text-secondary)',
                fontWeight: activeCategory === cat ? 600 : 400,
                cursor: 'pointer',
                textTransform: 'uppercase',
                transition: 'all 0.15s ease',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Mind Map Container ─────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 1.8fr) minmax(280px, 1fr)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          background: '#FFFFFF',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)',
        }}
        className="grid grid-cols-1 lg:grid-cols-[1.8fr_1fr] divide-y lg:divide-y-0 lg:divide-x divide-black/[0.08]"
      >
        {/* Interactive SVG Node Map Canvas */}
        <div
          style={{
            position: 'relative',
            height: 480,
            background: 'radial-gradient(circle at 50% 50%, rgba(0, 76, 232, 0.03) 0%, transparent 70%)',
            overflow: 'hidden',
          }}
        >
          {/* Subtle Background Coordinates */}
          <div
            style={{
              position: 'absolute',
              top: 14,
              left: 20,
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--text-muted)',
              pointerEvents: 'none',
            }}
          >
            RELATIONAL MATRIX // 9 ACTIVE ENTITIES
          </div>

          <svg
            style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {/* Draw Connecting Edges */}
            {NODES.map((source) =>
              source.connections.map((targetId) => {
                const target = NODES.find((n) => n.id === targetId)
                if (!target) return null
                const isHighlighted =
                  source.id === selectedNodeId || target.id === selectedNodeId
                return (
                  <line
                    key={`${source.id}-${target.id}`}
                    x1={source.x}
                    y1={source.y}
                    x2={target.x}
                    y2={target.y}
                    stroke={isHighlighted ? '#2F4CFF' : 'rgba(14, 16, 18, 0.12)'}
                    strokeWidth={isHighlighted ? 0.6 : 0.3}
                    strokeDasharray={isHighlighted ? 'none' : '1, 1'}
                    style={{ transition: 'stroke 0.25s ease, stroke-width 0.25s ease' }}
                  />
                )
              })
            )}
          </svg>

          {/* Interactive HTML Node Elements */}
          {NODES.map((node) => {
            const isSelected = selectedNodeId === node.id
            const isConnected = selectedNode.connections.includes(node.id) || isSelected
            const isDimmed = activeCategory !== 'all' && node.category !== activeCategory

            return (
              <div
                key={node.id}
                onClick={() => setSelectedNodeId(node.id)}
                style={{
                  position: 'absolute',
                  left: `${node.x}%`,
                  top: `${node.y}%`,
                  transform: 'translate(-50%, -50%)',
                  cursor: 'pointer',
                  zIndex: isSelected ? 10 : 2,
                  opacity: isDimmed ? 0.3 : 1,
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: isSelected ? '8px 14px' : '5px 10px',
                    borderRadius: 20,
                    background: isSelected ? '#2F4CFF' : '#FFFFFF',
                    border: isSelected
                      ? '2px solid #2F4CFF'
                      : isConnected
                      ? '1px solid #2F4CFF'
                      : '1px solid var(--border)',
                    boxShadow: isSelected
                      ? '0 6px 18px rgba(47, 76, 255, 0.3)'
                      : '0 2px 6px rgba(0, 0, 0, 0.06)',
                    color: isSelected ? '#FFFFFF' : 'var(--text-primary)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: isSelected ? 11.5 : 10.5,
                    fontWeight: isSelected ? 700 : 500,
                    whiteSpace: 'nowrap',
                    transform: isSelected ? 'scale(1.08)' : 'scale(1)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: isSelected ? '#FFFFFF' : node.confidence > 0.95 ? '#059669' : '#FF5500',
                    }}
                  />
                  <span>{node.label}</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Right Column: Node Inspector Spec */}
        <div style={{ padding: '32px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'var(--text-muted)',
                letterSpacing: '0.08em',
                marginBottom: 14,
              }}
            >
              [NODE INSPECTOR // {selectedNode.category.toUpperCase()}]
            </div>

            <h3
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 22,
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
                marginBottom: 10,
              }}
            >
              {selectedNode.label}
            </h3>

            <p
              style={{
                fontSize: 13.5,
                lineHeight: 1.6,
                color: 'var(--text-secondary)',
                marginBottom: 20,
              }}
            >
              {selectedNode.description}
            </p>

            {/* Telemetry specs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
                <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>CONFIDENCE SCORE:</span>
                <span style={{ fontWeight: 700, color: '#2F4CFF', fontFamily: 'var(--font-mono)' }}>
                  {(selectedNode.confidence * 100).toFixed(1)}%
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
                <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>SOURCE CORPUS:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                  {selectedNode.docSource}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
                <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>EDGE CONNECTIONS:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  {selectedNode.connections.length} active relations
                </span>
              </div>
            </div>
          </div>

          <div
            style={{
              padding: '12px 14px',
              background: 'var(--bg-secondary)',
              borderRadius: 6,
              fontSize: 11.5,
              color: 'var(--text-secondary)',
              marginTop: 24,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <CheckCircle2 size={14} color="#059669" />
            <span>Click any node on canvas to trace graph lineage.</span>
          </div>
        </div>
      </div>
    </section>
  )
}
