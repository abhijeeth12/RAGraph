import { useState, useRef, useEffect, MouseEvent } from 'react'
import {
  ArrowRight,
  RotateCw,
  Cpu,
  Activity,
  ShieldAlert,
  FileCode2,
  Table,
  CheckCircle2,
  ExternalLink,
  Layers,
  Sparkles,
  GitBranch,
  BarChart3,
  Search,
} from 'lucide-react'

interface PreviewThumbnail {
  label: string
  detail: string
  type: 'ast' | 'vector' | 'graph'
}

interface ShowcaseCard {
  id: string
  title: string
  category: string
  tags: string[]
  summary: string
  badge: string
  domain: string
  tint: string
  accentColor: string
  rotateDeg: number
  icon: React.ReactNode
  thumbnails: PreviewThumbnail[]
  benchmarks: {
    latency: string
    recall: string
    depth: string
    volume: string
  }
  specs: {
    retrievalModel: string
    indexing: string
    fusion: string
  }
}

const SHOWCASES: ShowcaseCard[] = [
  {
    id: 'nb-tree-rag',
    title: 'SEC 10-K Financial Matrix',
    category: 'FINANCIAL AUDITING',
    tags: ['AST-TABLES', 'BM25-SPARSE', 'VARIANCE-MAP'],
    summary: 'Traverse 300-page earnings filings, nested multi-column tables, balance sheets, and footnote dependencies.',
    badge: 'AUDIT VERIFIED',
    domain: 'CORPUS // SEC-EDGAR',
    tint: '#EEF9F5',
    accentColor: '#047857',
    rotateDeg: -3.4,
    icon: <Table size={15} />,
    thumbnails: [
      { label: 'TABLE AST', detail: 'Consolidated Statements L1-L3', type: 'ast' },
      { label: 'DENSE RANK', detail: '0.942 Cosine @ Section Item 7', type: 'vector' },
      { label: 'TOPOLOGY', detail: '142 Balance Lineage Edges', type: 'graph' },
    ],
    benchmarks: {
      latency: '38ms P99',
      recall: '98.7% @ 10',
      depth: '4 Levels',
      volume: '3,420 Chunks',
    },
    specs: {
      retrievalModel: 'Text-Embedding-3-Large (3072d)',
      indexing: 'Recursive HTML Table AST + Footnote Resolver',
      fusion: 'Reciprocal Rank Fusion (k=60) + BM25 Sparse',
    },
  },
  {
    id: 'nb-raft-consensus',
    title: 'Distributed Raft Invariants',
    category: 'SYSTEMS RESEARCH',
    tags: ['CODE-AST', 'FORMAL-PROOFS', 'SPLIT-BRAIN'],
    summary: 'Synthesizes formal verification proofs, log compaction theorems, and state machine replication logs.',
    badge: 'PEER-REVIEWED',
    domain: 'CORPUS // ACM-SIGCOMM',
    tint: '#FFF8F0',
    accentColor: '#D97706',
    rotateDeg: 2.6,
    icon: <Cpu size={15} />,
    thumbnails: [
      { label: 'TLA+ PROOFS', detail: 'LeaderElectionInv Verified', type: 'ast' },
      { label: 'LOG QUORUM', detail: '3-Node Replication Window', type: 'vector' },
      { label: 'STATE GRAPH', detail: 'Candidate -> Leader State Machine', type: 'graph' },
    ],
    benchmarks: {
      latency: '24ms P99',
      recall: '99.4% @ 5',
      depth: '5 Levels',
      volume: '1,890 Chunks',
    },
    specs: {
      retrievalModel: 'NV-Embed-v2 + Cross-Encoder Rerank',
      indexing: 'Tree-sitter C++ & TLA+ Grammar Parser',
      fusion: 'Dual-Path AST Path Traversal + Exact Symbol Index',
    },
  },
  {
    id: 'nb-clinical-trials',
    title: 'Clinical Trial Contradictions',
    category: 'BIOMEDICAL & FDA',
    tags: ['MULTI-DOC', 'CROSS-CITATION', 'PHARMA'],
    summary: 'Cross-analyzes conflicting efficacy endpoints across 12 concurrent clinical trial oncology papers.',
    badge: 'MULTI-PAPER',
    domain: 'CORPUS // PUBMED-PMC',
    tint: '#F0F3FF',
    accentColor: '#2563EB',
    rotateDeg: -1.8,
    icon: <Activity size={15} />,
    thumbnails: [
      { label: 'COHORT DIFF', detail: 'Phase III Kaplan-Meier Curves', type: 'ast' },
      { label: 'HyDE HYPOTHESIS', detail: 'Synthetic Endpoint Alignment', type: 'vector' },
      { label: 'DRUG ONTOLOGY', detail: '18 Conflict Edges Flagged', type: 'graph' },
    ],
    benchmarks: {
      latency: '42ms P99',
      recall: '97.9% @ 10',
      depth: '4 Levels',
      volume: '4,150 Chunks',
    },
    specs: {
      retrievalModel: 'BioLinkBERT-Large + BGE-Reranker-Large',
      indexing: 'Medical Entity Extraction + MeSH Ontology',
      fusion: 'Contradiction Hypothesis Vector + BM25 Fallback',
    },
  },
  {
    id: 'nb-robotics-control',
    title: 'Flight Control Invariants',
    category: 'EMBEDDED ROBOTICS',
    tags: ['REAL-TIME', 'CONTROL-LOOPS', 'C++20'],
    summary: 'Sub-40ms traversal across flight telemetry specs, PID control loops, and DO-178C safety certification.',
    badge: 'LATENCY BENCH',
    domain: 'CORPUS // IEEE-ROBOTICS',
    tint: '#F5F0FF',
    accentColor: '#7C3AED',
    rotateDeg: 3.2,
    icon: <FileCode2 size={15} />,
    thumbnails: [
      { label: 'TELEMETRY AST', detail: '1000Hz IMU Loop Contract', type: 'ast' },
      { label: 'SPARSE INDEX', detail: 'Memory-Safe Pointer Trace', type: 'vector' },
      { label: 'FAULT GRAPH', detail: 'Fail-Operational Sensor Fallback', type: 'graph' },
    ],
    benchmarks: {
      latency: '18ms P99',
      recall: '99.8% @ 5',
      depth: '3 Levels',
      volume: '2,240 Chunks',
    },
    specs: {
      retrievalModel: 'FastEmbed BGE-Small (In-Memory Quantized)',
      indexing: 'Deterministic C++ Control Flow Graph',
      fusion: 'Hardware Telemetry Vector + Exact Struct Match',
    },
  },
  {
    id: 'nb-legal-msa',
    title: 'Master Service Indemnity',
    category: 'ENTERPRISE LEGAL',
    tags: ['LEGAL-AST', 'INDEMNIFICATION', 'LIABILITY'],
    summary: 'Pinpoints ambiguous clause interactions, cross-liability exclusions, and indemnification caps.',
    badge: 'ENTERPRISE RISK',
    domain: 'CORPUS // CONTRACT-REPO',
    tint: '#FFF1F3',
    accentColor: '#E11D48',
    rotateDeg: -2.4,
    icon: <ShieldAlert size={15} />,
    thumbnails: [
      { label: 'CLAUSE AST', detail: 'Section 14.2 Limitation Cap', type: 'ast' },
      { label: 'RISK SCORE', detail: 'High Ambiguity Index (0.87)', type: 'vector' },
      { label: 'LIABILITY MAP', detail: 'Mutual Hold-Harmless Links', type: 'graph' },
    ],
    benchmarks: {
      latency: '34ms P99',
      recall: '98.2% @ 10',
      depth: '4 Levels',
      volume: '1,680 Chunks',
    },
    specs: {
      retrievalModel: 'Cohere-Embed-v3 + Legal-Rerank',
      indexing: 'Hierarchical Legal Paragraph Outliner',
      fusion: 'Cross-Clause Reference Matrix + Lexical Keyword',
    },
  },
]

interface Props {
  onSelectNotebook: (id: string) => void
  onOpenDashboard: () => void
}

export function ItsuaWorkDeck({ onSelectNotebook, onOpenDashboard }: Props) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const [activeIdx, setActiveIdx] = useState<number | null>(null)
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({})
  const [mouseOffsets, setMouseOffsets] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const deckRef = useRef<HTMLDivElement>(null)

  // Double-click toggle flip
  const handleDoubleClick = (idx: number, e: MouseEvent) => {
    e.stopPropagation()
    setFlippedCards((prev) => ({ ...prev, [idx]: !prev[idx] }))
    setActiveIdx(idx)
  }

  // Single-click flip toggle button
  const handleFlipToggle = (idx: number, e: MouseEvent) => {
    e.stopPropagation()
    setFlippedCards((prev) => ({ ...prev, [idx]: !prev[idx] }))
    setActiveIdx(idx)
  }

  // Pointer move 3D tilt tracking
  const handleMouseMove = (e: MouseEvent<HTMLDivElement>, idx: number) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2 // -1 to 1
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2 // -1 to 1
    setMouseOffsets({ x, y })
    setHoveredIdx(idx)
  }

  const handleMouseLeave = () => {
    setHoveredIdx(null)
    setMouseOffsets({ x: 0, y: 0 })
  }

  // Close active card on outside click
  useEffect(() => {
    const handleWindowClick = (e: globalThis.MouseEvent) => {
      if (deckRef.current && !deckRef.current.contains(e.target as Node)) {
        setActiveIdx(null)
      }
    }
    window.addEventListener('click', handleWindowClick)
    return () => window.removeEventListener('click', handleWindowClick)
  }, [])

  return (
    <section
      id="showcases"
      style={{
        position: 'relative',
        background: '#F5F5F3',
        padding: 'clamp(48px, 7vh, 84px) 24px',
        borderBottom: '2px solid #0E1012',
        overflow: 'hidden',
      }}
    >
      <div style={{ maxWidth: 1380, margin: '0 auto' }}>
        {/* Section Header (ITSUA Monumental Style) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            marginBottom: 'clamp(28px, 4vh, 44px)',
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
                marginBottom: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span style={{ fontWeight: 700, color: '#0E1012' }}>§ 02 — CURATED RESEARCH CORPUSES</span>
              <span>/</span>
              <span>INTERACTIVE NOTEBOOK SHOWCASES</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 18, flexWrap: 'wrap' }}>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(36px, 4.8vw, 64px)',
                  fontWeight: 700,
                  letterSpacing: '-0.04em',
                  color: '#0E1012',
                  margin: 0,
                  lineHeight: 1,
                }}
              >
                /showcases
              </h2>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: '#666',
                  background: '#EAEAE7',
                  border: '1px solid #D5D5CE',
                  borderRadius: 4,
                  padding: '4px 10px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Sparkles size={12} color="#FF5F14" />
                HOVER TO ELEVATE · CLICK TO RAISE · DOUBLE-CLICK TO FLIP SPEC ↻
              </span>
            </div>
          </div>

          <button
            onClick={onOpenDashboard}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              fontWeight: 700,
              color: '#0E1012',
              background: '#FFFFFF',
              border: '2px solid #0E1012',
              padding: '8px 16px',
              borderRadius: 4,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '2px 2px 0px #0E1012',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translate(-1px, -1px)'
              e.currentTarget.style.boxShadow = '3px 3px 0px #0E1012'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translate(0, 0)'
              e.currentTarget.style.boxShadow = '2px 2px 0px #0E1012'
            }}
          >
            <span>EXPLORE ALL RESEARCH NOTEBOOKS</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {/* ─── ITSUA.COM /work True Fanned 3D Deck ─────────────────── */}
        <div
          ref={deckRef}
          className="itsua-deck-container"
          style={{
            position: 'relative',
            width: '100%',
            perspective: '1200px',
            perspectiveOrigin: 'center center',
          }}
        >
          {/* Desktop Stage (width >= 1024px) */}
          <div className="itsua-deck-stage-desktop">
            {SHOWCASES.map((item, idx) => {
              const isHovered = hoveredIdx === idx
              const isActive = activeIdx === idx
              const isFlipped = !!flippedCards[idx]

              // Dynamic 3D tilt tracking when hovered
              const tiltX = isHovered ? -mouseOffsets.y * 7 : 0
              const tiltY = isHovered ? mouseOffsets.x * 7 : 0

              // Z-Index hierarchy: Active card on top, then Hovered, then natural index order
              const zIndex = isActive ? 60 : isHovered ? 45 : idx + 2

              // Elevation & Rotation calculations
              let transform = ''
              if (isActive) {
                transform = `translateY(-28px) scale(1.02) rotate(0deg)`
              } else if (isHovered) {
                transform = `translateY(-20px) scale(1.015) rotate(0deg)`
              } else {
                transform = `translateY(0px) rotate(${item.rotateDeg}deg)`
              }

              return (
                <div
                  key={item.id}
                  className="itsua-card-slot"
                  style={{
                    position: 'absolute',
                    top: 20,
                    left: `calc(${idx} * ((100% - var(--deck-card-w)) / 4))`,
                    width: 'var(--deck-card-w)',
                    zIndex,
                    cursor: 'pointer',
                    transition: 'z-index 0s, transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                    transform,
                  }}
                  onMouseMove={(e) => handleMouseMove(e, idx)}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={handleMouseLeave}
                  onClick={() => setActiveIdx(idx)}
                  onDoubleClick={(e) => handleDoubleClick(idx, e)}
                >
                  {/* Card 3D Inner with Flip Mechanics */}
                  <div
                    className="itsua-card-inner"
                    style={{
                      position: 'relative',
                      width: '100%',
                      height: 'clamp(460px, 52vh, 520px)',
                      borderRadius: 10,
                      transformStyle: 'preserve-3d',
                      transition: 'transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.3s ease',
                      transform: isFlipped
                        ? `rotateY(180deg)`
                        : `rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
                      boxShadow: isActive
                        ? '0 24px 48px rgba(14, 16, 18, 0.18), 4px 6px 0px #0E1012'
                        : isHovered
                        ? '0 18px 36px rgba(14, 16, 18, 0.14), 4px 4px 0px #0E1012'
                        : '2px 2px 0px #0E1012',
                    }}
                  >
                    {/* ─── FRONT FACE ─────────────────────────────────── */}
                    <div
                      className="itsua-card-face itsua-card-front"
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: item.tint,
                        border: '2px solid #0E1012',
                        borderRadius: 10,
                        padding: '18px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        userSelect: 'none',
                      }}
                    >
                      {/* Top Header */}
                      <div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontFamily: 'var(--font-mono)',
                            fontSize: 10,
                            color: '#0E1012',
                            marginBottom: 12,
                            borderBottom: '1px solid rgba(14, 16, 18, 0.12)',
                            paddingBottom: 8,
                          }}
                        >
                          <span style={{ fontWeight: 700, letterSpacing: '0.04em' }}>{item.domain}</span>
                          <span
                            style={{
                              background: '#FFFFFF',
                              border: '1px solid #0E1012',
                              padding: '2px 7px',
                              borderRadius: 3,
                              fontSize: 9.5,
                              fontWeight: 700,
                              letterSpacing: '0.04em',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                            }}
                          >
                            <span
                              style={{
                                width: 5,
                                height: 5,
                                borderRadius: '50%',
                                background: item.accentColor,
                                display: 'inline-block',
                              }}
                            />
                            {item.badge}
                          </span>
                        </div>

                        {/* Title & Category */}
                        <div style={{ marginBottom: 14 }}>
                          <span
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: 10,
                              fontWeight: 700,
                              color: item.accentColor,
                              letterSpacing: '0.06em',
                              display: 'block',
                              marginBottom: 4,
                            }}
                          >
                            {item.category}
                          </span>
                          <h3
                            style={{
                              fontFamily: 'var(--font-display)',
                              fontSize: 'clamp(18px, 1.7vw, 22px)',
                              fontWeight: 700,
                              letterSpacing: '-0.025em',
                              color: '#0E1012',
                              margin: '0 0 6px 0',
                              lineHeight: 1.15,
                            }}
                          >
                            {item.title}
                          </h3>
                          <p
                            style={{
                              fontFamily: 'var(--font-body)',
                              fontSize: 12,
                              color: '#444',
                              lineHeight: 1.45,
                              margin: 0,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {item.summary}
                          </p>
                        </div>

                        {/* itsua.com 3 Micro-Thumbnail Viewports */}
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: 6,
                            marginBottom: 12,
                          }}
                        >
                          {item.thumbnails.map((t, tIdx) => (
                            <div
                              key={tIdx}
                              style={{
                                background: 'rgba(255, 255, 255, 0.75)',
                                border: '1px solid rgba(14, 16, 18, 0.15)',
                                borderRadius: 6,
                                padding: '8px 6px',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                height: 68,
                              }}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  fontFamily: 'var(--font-mono)',
                                  fontSize: 8.5,
                                  fontWeight: 700,
                                  color: item.accentColor,
                                }}
                              >
                                {t.type === 'ast' && <Table size={10} />}
                                {t.type === 'vector' && <BarChart3 size={10} />}
                                {t.type === 'graph' && <GitBranch size={10} />}
                                <span>{t.label}</span>
                              </div>
                              <div
                                style={{
                                  fontFamily: 'var(--font-mono)',
                                  fontSize: 9,
                                  color: '#333',
                                  lineHeight: 1.25,
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                }}
                              >
                                {t.detail}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Tags Pill Bar */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
                          {item.tags.map((t) => (
                            <span
                              key={t}
                              style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: 9,
                                fontWeight: 700,
                                background: 'rgba(14, 16, 18, 0.05)',
                                border: '1px solid rgba(14, 16, 18, 0.1)',
                                color: '#1A1D20',
                                padding: '2px 6px',
                                borderRadius: 3,
                              }}
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Bottom Action Footer */}
                      <div
                        style={{
                          borderTop: '1px solid rgba(14, 16, 18, 0.12)',
                          paddingTop: 10,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 8,
                        }}
                      >
                        <button
                          onClick={(e) => handleFlipToggle(idx, e)}
                          title="Flip card to view deep specifications"
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 10,
                            fontWeight: 700,
                            color: '#0E1012',
                            background: '#FFFFFF',
                            border: '1.5px solid #0E1012',
                            padding: '6px 9px',
                            borderRadius: 4,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            boxShadow: '1px 1px 0px #0E1012',
                            transition: 'all 0.12s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translate(-1px, -1px)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translate(0, 0)'
                          }}
                        >
                          <RotateCw size={11} />
                          <span>SPEC ↻</span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onSelectNotebook(item.id)
                          }}
                          style={{
                            flex: 1,
                            fontFamily: 'var(--font-mono)',
                            fontSize: 10.5,
                            fontWeight: 800,
                            color: '#FFFFFF',
                            background: '#0E1012',
                            border: '1.5px solid #0E1012',
                            padding: '6px 10px',
                            borderRadius: 4,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            boxShadow: '2px 2px 0px rgba(0,0,0,0.2)',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#FF5F14'
                            e.currentTarget.style.borderColor = '#FF5F14'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#0E1012'
                            e.currentTarget.style.borderColor = '#0E1012'
                          }}
                        >
                          <span>LAUNCH NOTEBOOK</span>
                          <ArrowRight size={12} />
                        </button>
                      </div>
                    </div>

                    {/* ─── BACK FACE (Deep Technical Specs) ──────────── */}
                    <div
                      className="itsua-card-face itsua-card-back"
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: '#121417',
                        border: '2px solid #0E1012',
                        borderRadius: 10,
                        padding: '18px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        transform: 'rotateY(180deg)',
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        color: '#F3F4F6',
                        userSelect: 'none',
                      }}
                    >
                      {/* Back Header */}
                      <div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontFamily: 'var(--font-mono)',
                            fontSize: 10,
                            color: 'var(--text-muted)',
                            marginBottom: 10,
                            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                            paddingBottom: 8,
                          }}
                        >
                          <span style={{ fontWeight: 700, color: '#A0AEC0' }}>
                            § ARCHITECTURE BLUEPRINT
                          </span>
                          <button
                            onClick={(e) => handleFlipToggle(idx, e)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#FF5F14',
                              fontFamily: 'var(--font-mono)',
                              fontSize: 10,
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <RotateCw size={11} />
                            <span>FLIP BACK</span>
                          </button>
                        </div>

                        <h4
                          style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 16,
                            fontWeight: 700,
                            color: '#FFFFFF',
                            margin: '0 0 6px 0',
                          }}
                        >
                          {item.title}
                        </h4>

                        {/* 4-Fact Metrics Grid */}
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: 8,
                            margin: '12px 0',
                          }}
                        >
                          <div
                            style={{
                              background: 'rgba(255, 255, 255, 0.04)',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                              borderRadius: 6,
                              padding: '6px 8px',
                            }}
                          >
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#9CA3AF' }}>
                              RETRIEVAL LATENCY
                            </div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: '#34D399' }}>
                              {item.benchmarks.latency}
                            </div>
                          </div>

                          <div
                            style={{
                              background: 'rgba(255, 255, 255, 0.04)',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                              borderRadius: 6,
                              padding: '6px 8px',
                            }}
                          >
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#9CA3AF' }}>
                              PRECISION RECALL
                            </div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: '#60A5FA' }}>
                              {item.benchmarks.recall}
                            </div>
                          </div>

                          <div
                            style={{
                              background: 'rgba(255, 255, 255, 0.04)',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                              borderRadius: 6,
                              padding: '6px 8px',
                            }}
                          >
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#9CA3AF' }}>
                              HIERARCHY DEPTH
                            </div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: '#FBBF24' }}>
                              {item.benchmarks.depth}
                            </div>
                          </div>

                          <div
                            style={{
                              background: 'rgba(255, 255, 255, 0.04)',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                              borderRadius: 6,
                              padding: '6px 8px',
                            }}
                          >
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#9CA3AF' }}>
                              INDEXED VOLUME
                            </div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: '#F472B6' }}>
                              {item.benchmarks.volume}
                            </div>
                          </div>
                        </div>

                        {/* Pipeline Specs List */}
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 5,
                            fontFamily: 'var(--font-mono)',
                            fontSize: 10,
                            color: '#D1D5DB',
                            margin: '10px 0',
                          }}
                        >
                          <div>
                            <span style={{ color: '#9CA3AF' }}>MODEL: </span>
                            <span>{item.specs.retrievalModel}</span>
                          </div>
                          <div>
                            <span style={{ color: '#9CA3AF' }}>PARSER: </span>
                            <span>{item.specs.indexing}</span>
                          </div>
                          <div>
                            <span style={{ color: '#9CA3AF' }}>FUSION: </span>
                            <span>{item.specs.fusion}</span>
                          </div>
                        </div>
                      </div>

                      {/* Back Bottom CTA */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onSelectNotebook(item.id)
                        }}
                        style={{
                          width: '100%',
                          fontFamily: 'var(--font-mono)',
                          fontSize: 11,
                          fontWeight: 800,
                          color: '#0E1012',
                          background: '#FF5F14',
                          border: '2px solid #FF5F14',
                          padding: '10px',
                          borderRadius: 6,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                          boxShadow: '0 4px 14px rgba(255, 95, 20, 0.35)',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#FF4500'
                          e.currentTarget.style.borderColor = '#FF4500'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#FF5F14'
                          e.currentTarget.style.borderColor = '#FF5F14'
                        }}
                      >
                        <span>LAUNCH NOTEBOOK EXPERIMENT</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Mobile & Tablet Vertical Overlapping Stack (<1024px) */}
          <div className="itsua-deck-stage-mobile">
            {SHOWCASES.map((item, idx) => {
              const isFlipped = !!flippedCards[idx]
              return (
                <div
                  key={`m-${item.id}`}
                  className="itsua-mobile-card"
                  style={{
                    background: isFlipped ? '#121417' : item.tint,
                    color: isFlipped ? '#F3F4F6' : '#0E1012',
                    border: '2px solid #0E1012',
                    borderRadius: 10,
                    padding: '20px',
                    boxShadow: '3px 3px 0px #0E1012',
                    position: 'relative',
                    zIndex: idx + 1,
                    transform: `rotate(${idx % 2 === 0 ? -1.2 : 1.2}deg)`,
                    transition: 'all 0.25s ease',
                  }}
                  onClick={() => handleFlipToggle(idx, {} as any)}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      marginBottom: 10,
                    }}
                  >
                    <span style={{ fontWeight: 700 }}>{item.domain}</span>
                    <button
                      onClick={(e) => handleFlipToggle(idx, e)}
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid #0E1012',
                        borderRadius: 3,
                        padding: '2px 6px',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 9.5,
                        fontWeight: 700,
                        color: '#0E1012',
                        cursor: 'pointer',
                      }}
                    >
                      {isFlipped ? 'VIEW SUMMARY ↻' : 'VIEW SPECS ↻'}
                    </button>
                  </div>

                  <h3
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 20,
                      fontWeight: 700,
                      margin: '0 0 6px 0',
                    }}
                  >
                    {item.title}
                  </h3>

                  {!isFlipped ? (
                    <>
                      <p style={{ fontSize: 12.5, lineHeight: 1.45, margin: '0 0 14px 0', color: '#444' }}>
                        {item.summary}
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onSelectNotebook(item.id)
                        }}
                        style={{
                          width: '100%',
                          background: '#0E1012',
                          color: '#FFFFFF',
                          border: 'none',
                          padding: '8px 12px',
                          borderRadius: 4,
                          fontFamily: 'var(--font-mono)',
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                        }}
                      >
                        <span>LAUNCH NOTEBOOK</span>
                        <ArrowRight size={13} />
                      </button>
                    </>
                  ) : (
                    <>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(2, 1fr)',
                          gap: 6,
                          margin: '10px 0',
                        }}
                      >
                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: 6, borderRadius: 4 }}>
                          <div style={{ fontSize: 9, color: '#9CA3AF' }}>LATENCY</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#34D399' }}>
                            {item.benchmarks.latency}
                          </div>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: 6, borderRadius: 4 }}>
                          <div style={{ fontSize: 9, color: '#9CA3AF' }}>RECALL</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#60A5FA' }}>
                            {item.benchmarks.recall}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onSelectNotebook(item.id)
                        }}
                        style={{
                          width: '100%',
                          background: '#FF5F14',
                          color: '#0E1012',
                          border: 'none',
                          padding: '8px 12px',
                          borderRadius: 4,
                          fontFamily: 'var(--font-mono)',
                          fontSize: 11,
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                        }}
                      >
                        <span>LAUNCH NOTEBOOK</span>
                        <ArrowRight size={13} />
                      </button>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
