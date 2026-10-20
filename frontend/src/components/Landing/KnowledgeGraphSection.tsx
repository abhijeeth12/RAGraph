'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Network, Share2, Compass, Cpu, Link2, ExternalLink } from 'lucide-react'

interface GraphNode {
  id: string
  label: string
  type: 'root' | 'section' | 'entity' | 'citation'
  x: number
  y: number
  connections: string[]
  info: string
}

const GRAPH_NODES: GraphNode[] = [
  {
    id: 'node-raft',
    label: 'Raft Protocol Spec',
    type: 'root',
    x: 280,
    y: 180,
    connections: ['node-leader', 'node-log', 'node-safety'],
    info: 'Root technical specification [RFC-8447]. 14 chapters, 42 sub-clauses.',
  },
  {
    id: 'node-leader',
    label: 'Leader Election (§5.2)',
    type: 'section',
    x: 130,
    y: 90,
    connections: ['node-term', 'node-heartbeat'],
    info: 'Section 5.2. Randomized election timeouts prevent split-vote deadlocks.',
  },
  {
    id: 'node-log',
    label: 'Log Replication (§5.3)',
    type: 'section',
    x: 430,
    y: 100,
    connections: ['node-commit', 'node-append'],
    info: 'Section 5.3. Leader handles client requests and synchronizes state.',
  },
  {
    id: 'node-safety',
    label: 'Safety Invariants (§5.4)',
    type: 'section',
    x: 280,
    y: 290,
    connections: ['node-election-safety', 'node-leader-completeness'],
    info: 'Section 5.4. Formal inductive proof of state machine consistency.',
  },
  {
    id: 'node-term',
    label: 'Term Monotonicity',
    type: 'entity',
    x: 50,
    y: 190,
    connections: [],
    info: 'Logical clock integer exchanged on every RPC exchange.',
  },
  {
    id: 'node-heartbeat',
    label: 'Empty AppendEntries',
    type: 'entity',
    x: 150,
    y: 330,
    connections: [],
    info: 'Broadcast periodically to maintain leadership authority.',
  },
  {
    id: 'node-election-safety',
    label: 'At-Most-One Leader',
    type: 'citation',
    x: 420,
    y: 290,
    connections: [],
    info: 'Theorem 1: At most one leader can be elected in a given term.',
  },
  {
    id: 'node-commit',
    label: 'Commit Index (p.8)',
    type: 'entity',
    x: 520,
    y: 190,
    connections: [],
    info: 'Monotonically increasing index of highest committed log entry.',
  },
]

export function KnowledgeGraphSection() {
  const [selectedNodeId, setSelectedNodeId] = useState<string>('node-raft')

  const selectedNode =
    GRAPH_NODES.find((n) => n.id === selectedNodeId) || GRAPH_NODES[0]

  const isConnected = (sourceId: string, targetId: string) => {
    if (selectedNode.id === sourceId && selectedNode.connections.includes(targetId)) return true
    if (selectedNode.id === targetId && GRAPH_NODES.find((n) => n.id === sourceId)?.connections.includes(targetId))
      return true
    return false
  }

  return (
    <section
      id="knowledge-graph"
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
          [04] RELATIONAL REASONING
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
          Multi-Hop Cross-Document Knowledge Graphs
        </h2>
        <p style={{ fontSize: 16, color: '#94a3b8', margin: 0, maxWidth: 720, lineHeight: 1.6 }}>
          Hierarchical trees capture vertical section depth; knowledge graphs capture horizontal cross-entity relationships across independent corpora.
        </p>
      </div>

      {/* Main Stage Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 28,
          background: '#13161c',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 12,
          padding: '28px',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.35)',
        }}
      >
        {/* Interactive SVG Graph Canvas */}
        <div
          style={{
            background: '#0b0d11',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            borderRadius: 8,
            minHeight: 400,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle Grid Lines */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage:
                'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
              pointerEvents: 'none',
            }}
          />

          <svg
            viewBox="0 0 600 400"
            style={{ width: '100%', height: '100%', display: 'block' }}
          >
            {/* Draw Connecting Edges */}
            {GRAPH_NODES.map((source) =>
              source.connections.map((targetId) => {
                const target = GRAPH_NODES.find((n) => n.id === targetId)
                if (!target) return null
                const active = isConnected(source.id, target.id)
                return (
                  <line
                    key={`${source.id}-${target.id}`}
                    x1={source.x}
                    y1={source.y}
                    x2={target.x}
                    y2={target.y}
                    stroke={active ? '#38bdf8' : 'rgba(255, 255, 255, 0.12)'}
                    strokeWidth={active ? 2 : 1}
                    strokeDasharray={active ? 'none' : '4 4'}
                    style={{ transition: 'stroke 0.2s, stroke-width 0.2s' }}
                  />
                )
              })
            )}

            {/* Draw Interactive Nodes */}
            {GRAPH_NODES.map((node) => {
              const isSelected = selectedNode.id === node.id
              const isNeighbor =
                selectedNode.connections.includes(node.id) ||
                node.connections.includes(selectedNode.id)
              const isHighlighted = isSelected || isNeighbor

              let fillColor = '#1e293b'
              let strokeColor = 'rgba(255, 255, 255, 0.2)'
              if (node.type === 'root') {
                fillColor = isHighlighted ? '#0284c7' : '#0369a1'
                strokeColor = '#38bdf8'
              } else if (node.type === 'section') {
                fillColor = isHighlighted ? '#4f46e5' : '#3730a3'
                strokeColor = '#818cf8'
              } else if (node.type === 'citation') {
                fillColor = isHighlighted ? '#059669' : '#047857'
                strokeColor = '#34d399'
              }

              return (
                <g
                  key={node.id}
                  onClick={() => setSelectedNodeId(node.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={isSelected ? 18 : 13}
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth={isSelected ? 3 : 1.5}
                    style={{ transition: 'all 0.2s ease' }}
                  />
                  {isSelected && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={24}
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth={1}
                      strokeDasharray="3 3"
                    />
                  )}
                  <text
                    x={node.x}
                    y={node.y + (node.y > 200 ? 28 : -22)}
                    textAnchor="middle"
                    fill={isHighlighted ? '#f8fafc' : '#94a3b8'}
                    fontSize={11.5}
                    fontWeight={isHighlighted ? 600 : 400}
                    fontFamily="'JetBrains Mono', monospace"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {node.label}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>

        {/* Selected Entity Inspector Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 4,
                background: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                fontSize: 11.5,
                fontFamily: "'JetBrains Mono', monospace",
                color: '#38bdf8',
                marginBottom: 16,
              }}
            >
              <Network size={13} />
              <span>GRAPH NODE INSPECTOR</span>
            </div>

            <h3
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: '#f8fafc',
                margin: '0 0 10px',
              }}
            >
              {selectedNode.label}
            </h3>

            <div
              style={{
                fontSize: 12,
                fontFamily: "'JetBrains Mono', monospace",
                color: '#64748b',
                marginBottom: 16,
              }}
            >
              NODE TYPE: <span style={{ color: '#cbd5e1' }}>{selectedNode.type.toUpperCase()}</span> ·{' '}
              EDGES: <span style={{ color: '#38bdf8' }}>{selectedNode.connections.length}</span>
            </div>

            <p
              style={{
                fontSize: 14,
                color: '#cbd5e1',
                lineHeight: 1.6,
                margin: '0 0 20px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: 6,
                padding: '14px 16px',
              }}
            >
              {selectedNode.info}
            </p>

            {/* Direct Connected Outgoing Edges */}
            <div style={{ marginBottom: 20 }}>
              <div
                style={{
                  fontSize: 11.5,
                  fontFamily: "'JetBrains Mono', monospace",
                  color: '#64748b',
                  marginBottom: 8,
                }}
              >
                OUTGOING RELATIONS ({selectedNode.connections.length}):
              </div>
              {selectedNode.connections.length === 0 ? (
                <div style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>
                  Leaf entity terminal node with direct paragraph grounding.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {selectedNode.connections.map((targetId) => {
                    const target = GRAPH_NODES.find((n) => n.id === targetId)
                    if (!target) return null
                    return (
                      <div
                        key={targetId}
                        onClick={() => setSelectedNodeId(targetId)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          borderRadius: 4,
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid rgba(255, 255, 255, 0.06)',
                          cursor: 'pointer',
                          fontSize: 12.5,
                          color: '#f1f5f9',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.3)'
                          e.currentTarget.style.background = 'rgba(56, 189, 248, 0.05)'
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)'
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ color: '#38bdf8' }}>→</span>
                          <span>{target.label}</span>
                        </div>
                        <span
                          style={{
                            fontSize: 10.5,
                            fontFamily: "'JetBrains Mono', monospace",
                            color: '#64748b',
                          }}
                        >
                          {target.type}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          <div
            style={{
              paddingTop: 16,
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 12,
              fontFamily: "'JetBrains Mono', monospace",
              color: '#64748b',
            }}
          >
            <span>CLICK NODES TO TRAVERSE GRAPH</span>
            <span style={{ color: '#34d399' }}>✓ ACTIVE PROPAGATION</span>
          </div>
        </div>
      </div>
    </section>
  )
}
