import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GitBranch, Layers, Cpu, ArrowRight, Play, CheckCircle2 } from 'lucide-react'

interface QueryScenario {
  id: string
  title: string
  query: string
  activePath: string[]
  beamScores: { l1: number; l2: number; l3: number; rrf: number }
  retrievedSnippet: string
  citation: string
  latencyMs: number
}

const SCENARIOS: QueryScenario[] = [
  {
    id: 'beam-tree',
    title: 'Hierarchical Beam Search',
    query: 'How does beam search traverse document outlines without losing context?',
    activePath: ['Document: Tree_RAG_Arch.pdf', '§ 2. Tree Construction', '¶ 2.3 Sibling Overlap'],
    beamScores: { l1: 0.94, l2: 0.89, l3: 0.85, rrf: 0.96 },
    retrievedSnippet: 'Level-2 section summaries qualify candidate subtrees. Rather than evaluating thousands of raw paragraphs, queries cascade through semantic summaries, reducing noise by 74%.',
    citation: '[Doc 1 §2.3]',
    latencyMs: 42,
  },
  {
    id: 'dual-path',
    title: 'Dual-Path RRF Fallback',
    query: 'What happens when beam similarity drops below the coherence threshold?',
    activePath: ['Trigger: T_dual < 0.72', 'Parallel: BM25 Sparse + Dense Qdrant', 'Fusion: Reciprocal Rank Merge'],
    beamScores: { l1: 0.68, l2: 0.71, l3: 0.88, rrf: 0.92 },
    retrievedSnippet: 'When structural coherence drops, the fallback pipeline executes a flat dense sweep merged with exact BM25 keyword matching via Reciprocal Rank Fusion, eliminating blind spots.',
    citation: '[Doc 3 §1.4]',
    latencyMs: 58,
  },
  {
    id: 'graph-rerank',
    title: 'Graph Sibling Expansion',
    query: 'How are extracted image figures linked to structural headings?',
    activePath: ['Entity Edge: Figure_04.png', 'Parent: § 3. Evaluation', 'Context: Multimodal Alignment'],
    beamScores: { l1: 0.91, l2: 0.87, l3: 0.83, rrf: 0.94 },
    retrievedSnippet: 'Extracted visual figures are attached as child nodes to their immediate section header, allowing the generative LLM to refer to diagrams with exact contextual provenance.',
    citation: '[Doc 2 §3.1]',
    latencyMs: 49,
  },
]

interface Props {
  onLaunchDemo?: () => void
}

export function HeroSimulator({ onLaunchDemo }: Props) {
  const [selectedScenario, setSelectedScenario] = useState<QueryScenario>(SCENARIOS[0])
  const [isSimulating, setIsSimulating] = useState(false)

  const handleSelect = (scenario: QueryScenario) => {
    setIsSimulating(true)
    setSelectedScenario(scenario)
    setTimeout(() => setIsSimulating(false), 300)
  }

  return (
    <div
      style={{
        background: 'linear-gradient(180deg, #16181d 0%, #0d0f12 100%)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 20,
        boxShadow: '0 20px 60px -15px rgba(0, 0, 0, 0.8), 0 0 40px rgba(168, 199, 250, 0.08)',
        overflow: 'hidden',
        width: '100%',
      }}
    >
      {/* Simulator Terminal Top Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 18px',
          background: 'rgba(255, 255, 255, 0.03)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f56' }} />
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffbd2e' }} />
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#27c93f' }} />
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8, fontFamily: 'monospace' }}>
            ragraph-engine :: beam-retriever-v5
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 11, color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-green)' }} />
            In-Memory Matmul (0.05ms)
          </span>
        </div>
      </div>

      {/* Interactive Scenario Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          padding: '12px 18px 0',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          overflowX: 'auto',
        }}
      >
        {SCENARIOS.map((sc) => {
          const active = selectedScenario.id === sc.id
          return (
            <button
              key={sc.id}
              onClick={() => handleSelect(sc)}
              style={{
                background: active ? 'rgba(168, 199, 250, 0.12)' : 'transparent',
                color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                border: 'none',
                borderBottom: active ? '2px solid var(--accent-blue)' : '2px solid transparent',
                padding: '8px 14px',
                fontSize: 12.5,
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
            >
              <Play size={11} fill={active ? 'currentColor' : 'none'} />
              {sc.title}
            </button>
          )
        })}
      </div>

      {/* Simulator Content Body */}
      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Active Query Display */}
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.35)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: 12,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <span style={{ color: 'var(--accent-blue)', fontFamily: 'monospace', fontSize: 13 }}>query &gt;</span>
          <span style={{ color: 'var(--text-primary)', fontSize: 13.5, fontWeight: 500 }}>
            "{selectedScenario.query}"
          </span>
          <span
            style={{
              marginLeft: 'auto',
              fontFamily: 'monospace',
              fontSize: 11,
              color: 'var(--text-muted)',
              whiteSpace: 'nowrap',
            }}
          >
            {selectedScenario.latencyMs}ms elapsed
          </span>
        </div>

        {/* Hierarchical Beam Visualization */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 12,
          }}
        >
          {/* L1 Outline Node */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(168, 199, 250, 0.25)',
              borderRadius: 12,
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: 'var(--accent-blue)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Level 1: Document Tree
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                score: {selectedScenario.beamScores.l1}
              </span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, margin: 0 }}>
              {selectedScenario.activePath[0]}
            </p>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Top-level abstract matched
            </span>
          </div>

          {/* L2 Section Node */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(196, 238, 208, 0.25)',
              borderRadius: 12,
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: 'var(--accent-green)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Level 2: Section Beam
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                score: {selectedScenario.beamScores.l2}
              </span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, margin: 0 }}>
              {selectedScenario.activePath[1]}
            </p>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Section thematic budget retained
            </span>
          </div>

          {/* L3 Leaf Node */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 223, 153, 0.25)',
              borderRadius: 12,
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: 'var(--accent-amber)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Level 3: Target Paragraph
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                RRF: {selectedScenario.beamScores.rrf}
              </span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, margin: 0 }}>
              {selectedScenario.activePath[2]}
            </p>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Sibling context expansion injected
            </span>
          </div>
        </div>

        {/* Synthesized Answer Output */}
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.45)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 12,
            padding: '16px 20px',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <CheckCircle2 size={14} style={{ color: 'var(--accent-green)' }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
              Synthesized Grounded Evidence
            </span>
            <span
              style={{
                marginLeft: 'auto',
                background: 'rgba(168, 199, 250, 0.15)',
                color: 'var(--accent-blue)',
                padding: '2px 8px',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {selectedScenario.citation}
            </span>
          </div>

          <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
            {selectedScenario.retrievedSnippet}{' '}
            <strong style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>
              {selectedScenario.citation}
            </strong>
          </p>
        </div>

        {/* Action Footnote */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 }}>
          <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'var(--text-muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <GitBranch size={13} /> Zero flat chunk drift
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Layers size={13} /> Dynamic Mind Map synced
            </span>
          </div>

          <button
            onClick={onLaunchDemo}
            className="btn-primary"
            style={{
              padding: '8px 18px',
              fontSize: 12.5,
              borderRadius: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
            }}
          >
            Try in Interactive Notebook <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}
