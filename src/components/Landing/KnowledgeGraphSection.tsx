import { useState } from 'react'
import { motion } from 'framer-motion'
import { Network, Share2, Compass, Cpu, Link2, ExternalLink, ShieldCheck } from 'lucide-react'

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
    info: 'Root technical specification [RFC-8447]. 14 chapters, 42 sub-clauses, and formal proofs.',
  },
  {
    id: 'node-leader',
    label: 'Leader Election (§5.2)',
    type: 'section',
    x: 130,
    y: 90,
    connections: ['node-term', 'node-heartbeat'],
    info: 'Section 5.2. Randomized election timeouts prevent split-vote deadlocks across nodes.',
  },
  {
    id: 'node-log',
    label: 'Log Replication (§5.3)',
    type: 'section',
    x: 430,
    y: 100,
    connections: ['node-commit', 'node-append'],
    info: 'Section 5.3. Leader handles client requests and synchronizes state machine replication.',
  },
  {
    id: 'node-safety',
    label: 'Safety Invariants (§5.4)',
    type: 'section',
    x: 280,
    y: 290,
    connections: ['node-election-safety', 'node-leader-completeness'],
    info: 'Section 5.4. Formal inductive proof of state machine consistency across election cycles.',
  },
  {
    id: 'node-term',
    label: 'Term Monotonicity',
    type: 'entity',
    x: 50,
    y: 190,
    connections: [],
    info: 'Logical clock integer exchanged on every RPC exchange to detect stale leaders.',
  },
  {
    id: 'node-heartbeat',
    label: 'Empty AppendEntries',
    type: 'entity',
    x: 150,
    y: 330,
    connections: [],
    info: 'Broadcast periodically to maintain leadership authority and prevent new elections.',
  },
  {
    id: 'node-election-safety',
    label: 'At-Most-One Leader',
    type: 'citation',
    x: 420,
    y: 290,
    connections: [],
    info: 'Theorem 1: At most one leader can be elected in a given term [Doc 1 · p.12].',
  },
  {
    id: 'node-commit',
    label: 'Commit Index (p.8)',
    type: 'entity',
    x: 520,
    y: 190,
    connections: [],
    info: 'Monotonically increasing index of highest committed log entry across a quorum.',
  },
]

export function KnowledgeGraphSection() {
  const [selectedNodeId, setSelectedNodeId] = useState<string>('node-raft')

  const selectedNode =
    GRAPH_NODES.find((n) => n.id === selectedNodeId) || GRAPH_NODES[0]

  const getNodeColor = (type: GraphNode['type']) => {
    switch (type) {
      case 'root':
        return '#818CF8'
      case 'section':
        return '#38BDF8'
      case 'entity':
        return '#34D399'
      case 'citation':
        return '#FBBF24'
    }
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
            color: '#818CF8',
            marginBottom: 10,
            letterSpacing: '0.05em',
          }}
        >
          § 03 / ONTOLOGY & KNOWLEDGE GRAPHS
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
          Dynamic Relational Knowledge Maps
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
          Beyond simple vector lookup. RA-Graph builds multi-document entity graphs and hierarchical mind maps that propagate conceptual relationships across disparate documents.
        </p>
      </div>

      {/* Main Interactive Stage */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 24,
          background: '#0E1117',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 16,
          padding: 24,
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
        }}
      >
        {/* Interactive SVG Graph Canvas */}
        <div
          style={{
            background: '#08090C',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 12,
            position: 'relative',
            minHeight: 400,
            overflow: 'hidden',
          }}
        >
          {/* Subtle Grid Dot Canvas */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage:
                'radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
              pointerEvents: 'none',
            }}
          />

          <svg
            style={{ width: '100%', height: '100%', minHeight: 400 }}
            viewBox="0 0 600 400"
          >
            {/* Draw Connecting Edges */}
            {GRAPH_NODES.map((source) =>
              source.connections.map((targetId) => {
                const target = GRAPH_NODES.find((n) => n.id === targetId)
                if (!target) return null
                const isHighlighted =
                  selectedNode.id === source.id || selectedNode.id === target.id

                return (
                  <line
                    key={`${source.id}-${target.id}`}
                    x1={source.x}
                    y1={source.y}
                    x2={target.x}
                    y2={target.y}
                    stroke={
                      isHighlighted
                        ? 'rgba(56, 189, 248, 0.6)'
                        : 'rgba(255, 255, 255, 0.1)'
                    }
                    strokeWidth={isHighlighted ? 2 : 1}
                    strokeDasharray={isHighlighted ? 'none' : '4 4'}
                    style={{ transition: 'all 0.3s ease' }}
                  />
                )
              })
            )}

            {/* Draw Nodes */}
            {GRAPH_NODES.map((node) => {
              const isSelected = selectedNode.id === node.id
              const color = getNodeColor(node.type)

              return (
                <g
                  key={node.id}
                  onClick={() => setSelectedNodeId(node.id)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Outer Pulsing Ring for Selected Node */}
                  {isSelected && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={18}
                      fill="none"
                      stroke={color}
                      strokeWidth={2}
                      opacity={0.4}
                      className="animate-pulse-glow"
                    />
                  )}

                  {/* Core Node Circle */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={isSelected ? 10 : 7}
                    fill={color}
                    stroke="#08090C"
                    strokeWidth={2}
                    style={{ transition: 'all 0.2s ease' }}
                  />

                  {/* Label Text */}
                  <text
                    x={node.x}
                    y={node.y + (isSelected ? 22 : 18)}
                    textAnchor="middle"
                    fill={isSelected ? '#F8FAFC' : '#94A3B8'}
                    fontSize={isSelected ? 11.5 : 10.5}
                    fontFamily="var(--font-mono)"
                    fontWeight={isSelected ? 600 : 400}
                    style={{ pointerEvents: 'none', transition: 'all 0.2s ease' }}
                  >
                    {node.label}
                  </text>
                </g>
              )
            })}
          </svg>

          {/* Canvas Legend */}
          <div
            style={{
              position: 'absolute',
              bottom: 14,
              left: 16,
              display: 'flex',
              gap: 12,
              fontSize: 10.5,
              fontFamily: 'var(--font-mono)',
              color: '#94A3B8',
              background: 'rgba(8, 9, 12, 0.85)',
              padding: '6px 12px',
              borderRadius: 6,
              border: '1px solid rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#818CF8' }} />
              <span>Root Corpus</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#38BDF8' }} />
              <span>Section AST</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#34D399' }} />
              <span>Entity Node</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#FBBF24' }} />
              <span>Citation</span>
            </div>
          </div>
        </div>

        {/* Selected Node Detailed Inspector */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            background: '#12151D',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 12,
            padding: 24,
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)',
                  color: getNodeColor(selectedNode.type),
                  background: 'rgba(255, 255, 255, 0.03)',
                  padding: '3px 8px',
                  borderRadius: 4,
                  border: `1px solid ${getNodeColor(selectedNode.type)}40`,
                }}
              >
                NODE TYPE: {selectedNode.type.toUpperCase()}
              </span>
              <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#64748B' }}>
                DEGREE: {selectedNode.connections.length + 1}
              </span>
            </div>

            <h3
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 20,
                fontWeight: 700,
                color: '#F8FAFC',
                margin: '0 0 12px',
                letterSpacing: '-0.015em',
              }}
            >
              {selectedNode.label}
            </h3>

            <p style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.6, margin: '0 0 20px' }}>
              {selectedNode.info}
            </p>

            <div
              style={{
                background: '#08090C',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: 8,
                padding: '12px 14px',
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  fontSize: 10.5,
                  fontFamily: 'var(--font-mono)',
                  color: '#64748B',
                  marginBottom: 6,
                }}
              >
                SEMANTIC RELATIONSHIPS
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {selectedNode.connections.length > 0 ? (
                  selectedNode.connections.map((cId) => {
                    const conn = GRAPH_NODES.find((n) => n.id === cId)
                    return (
                      <span
                        key={cId}
                        style={{
                          fontSize: 11,
                          fontFamily: 'var(--font-mono)',
                          background: 'rgba(56, 189, 248, 0.08)',
                          color: '#38BDF8',
                          padding: '2px 8px',
                          borderRadius: 4,
                          border: '1px solid rgba(56, 189, 248, 0.2)',
                        }}
                      >
                        → {conn?.label || cId}
                      </span>
                    )
                  })
                ) : (
                  <span style={{ fontSize: 11, color: '#64748B' }}>
                    Leaf entity node. Linked to parent sections.
                  </span>
                )}
              </div>
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
              fontFamily: 'var(--font-mono)',
              color: '#34D399',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShieldCheck size={14} />
              <span>RELATIONAL PROVENANCE VERIFIED</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
