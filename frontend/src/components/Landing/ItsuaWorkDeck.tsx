'use client'
import { useState } from 'react'
import {
  ArrowRight,
  Cpu,
  Activity,
  ShieldAlert,
  FileCode2,
  Table,
  Sparkles,
  GitBranch,
  BarChart3,
  Layers,
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
    rotateDeg: -3.2,
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
    rotateDeg: 1.8,
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
    rotateDeg: -1.2,
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
    rotateDeg: 2.4,
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
    rotateDeg: -1.5,
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

  return (
    <section
      id="showcases"
      style={{
        position: 'relative',
        background: '#F5F5F3',
        padding: 'clamp(48px, 7vh, 84px) 24px',
        borderBottom: '1px solid #0E1012',
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
                  border: 'none',
                  borderRadius: 4,
                  padding: '4px 10px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Sparkles size={12} color="#FF5F14" />
                HOVER TO ELEVATE · CLICK TO LAUNCH RESEARCH NOTEBOOK
              </span>
            </div>
          </div>

          {/* Borderless Header Action Button */}
          <button
            onClick={onOpenDashboard}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              fontWeight: 700,
              color: '#0E1012',
              background: '#FFFFFF',
              border: 'none',
              padding: '9px 18px',
              borderRadius: 4,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translate(-1px, -1px)'
              e.currentTarget.style.background = '#F0F0EE'
              e.currentTarget.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translate(0, 0)'
              e.currentTarget.style.background = '#FFFFFF'
              e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.06)'
            }}
          >
            <span>EXPLORE ALL RESEARCH NOTEBOOKS</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {/* ─── ITSUA.COM /work Verified 2D Fanned Deck (Zero 3D Effects, Zero Borders) ─── */}
        <div
          className="itsua-deck-container"
          style={{
            position: 'relative',
            width: '100%',
          }}
        >
          {/* Desktop Stage (width >= 1024px) */}
          <div className="itsua-deck-stage-desktop">
            {SHOWCASES.map((item, idx) => {
              const isHovered = hoveredIdx === idx

              // Layer hierarchy: hovered card elevated to top (z-index 40), others in natural fan order
              const zIndex = isHovered ? 40 : 10 + idx

              // Verified 2D transform: Hover straightens to 0deg and lifts up; rest fans gently
              const transform = isHovered
                ? 'translateY(-20px) scale(1.02) rotate(0deg)'
                : `translateY(0px) rotate(${item.rotateDeg}deg)`

              // Verified drop-shadow depth: subtle layered at rest, expansive on elevation
              const boxShadow = isHovered
                ? '0 24px 50px rgba(14, 16, 18, 0.18), 0 8px 16px rgba(14, 16, 18, 0.08)'
                : '0 10px 30px rgba(14, 16, 18, 0.09), 0 2px 8px rgba(14, 16, 18, 0.04)'

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
                    transition: 'transform 0.32s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.32s ease, z-index 0s',
                    transform,
                  }}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  onClick={() => onSelectNotebook(item.id)}
                >
                  {/* Entirely Borderless Card Surface */}
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      minHeight: 'clamp(460px, 52vh, 520px)',
                      background: item.tint,
                      border: 'none',
                      borderRadius: 12,
                      padding: '22px 20px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow,
                      userSelect: 'none',
                      transition: 'box-shadow 0.32s ease',
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
                          marginBottom: 14,
                          borderBottom: '1px solid rgba(14, 16, 18, 0.08)',
                          paddingBottom: 8,
                        }}
                      >
                        <span style={{ fontWeight: 700, letterSpacing: '0.04em' }}>{item.domain}</span>
                        <span
                          style={{
                            background: 'rgba(255, 255, 255, 0.85)',
                            border: 'none',
                            padding: '3px 8px',
                            borderRadius: 4,
                            fontSize: 9.5,
                            fontWeight: 700,
                            letterSpacing: '0.04em',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
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

                      {/* itsua.com 3 Micro-Thumbnail Preview Viewports */}
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
                              border: 'none',
                              borderRadius: 6,
                              padding: '8px 6px',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              height: 68,
                              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
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
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
                        {item.tags.map((t) => (
                          <span
                            key={t}
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: 9,
                              fontWeight: 700,
                              background: 'rgba(14, 16, 18, 0.06)',
                              border: 'none',
                              color: '#1A1D20',
                              padding: '3px 7px',
                              borderRadius: 4,
                            }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>

                      {/* Performance Fact Micro-Strip */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(2, 1fr)',
                          gap: 6,
                          background: 'rgba(255, 255, 255, 0.55)',
                          borderRadius: 6,
                          padding: '7px 8px',
                          marginBottom: 8,
                        }}
                      >
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#555' }}>
                          P99: <strong style={{ color: '#0E1012' }}>{item.benchmarks.latency}</strong>
                        </div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#555' }}>
                          RECALL: <strong style={{ color: '#0E1012' }}>{item.benchmarks.recall}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div
                      style={{
                        borderTop: '1px solid rgba(14, 16, 18, 0.08)',
                        paddingTop: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                      }}
                    >
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
                          color: '#FFFFFF',
                          background: '#0E1012',
                          border: 'none',
                          padding: '8px 12px',
                          borderRadius: 6,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#FFFFFF'
                          e.currentTarget.style.color = '#0E1012'
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.12)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#0E1012'
                          e.currentTarget.style.color = '#FFFFFF'
                          e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.15)'
                        }}
                      >
                        <span>LAUNCH NOTEBOOK</span>
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
              return (
                <div
                  key={`m-${item.id}`}
                  className="itsua-mobile-card"
                  style={{
                    background: item.tint,
                    color: '#0E1012',
                    border: 'none',
                    borderRadius: 12,
                    padding: '22px 20px',
                    boxShadow: '0 10px 24px rgba(14, 16, 18, 0.08)',
                    position: 'relative',
                    zIndex: idx + 1,
                    transform: `rotate(${idx % 2 === 0 ? -1.2 : 1.2}deg)`,
                    transition: 'all 0.25s ease',
                    cursor: 'pointer',
                  }}
                  onClick={() => onSelectNotebook(item.id)}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      marginBottom: 10,
                      borderBottom: '1px solid rgba(14, 16, 18, 0.08)',
                      paddingBottom: 6,
                    }}
                  >
                    <span style={{ fontWeight: 700 }}>{item.domain}</span>
                    <span
                      style={{
                        background: 'rgba(255, 255, 255, 0.85)',
                        border: 'none',
                        borderRadius: 4,
                        padding: '3px 8px',
                        fontSize: 9.5,
                        fontWeight: 700,
                        color: item.accentColor,
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

                  <p style={{ fontSize: 12.5, lineHeight: 1.45, margin: '0 0 14px 0', color: '#444' }}>
                    {item.summary}
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
                    {item.tags.map((t) => (
                      <span
                        key={t}
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 9,
                          fontWeight: 700,
                          background: 'rgba(14, 16, 18, 0.06)',
                          color: '#1A1D20',
                          padding: '3px 7px',
                          borderRadius: 4,
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>

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
                      padding: '9px 12px',
                      borderRadius: 6,
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
                    }}
                  >
                    <span>LAUNCH NOTEBOOK</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
