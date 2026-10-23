import { useState, useEffect, useRef } from 'react'
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
  ChevronDown,
  ChevronUp,
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
    title: 'Financial Reports & Statements',
    category: 'FINANCE & ACCOUNTING',
    tags: ['EARNINGS REPORTS', 'BALANCE SHEETS', 'FOOTNOTE LINKS'],
    summary: 'Explore complex financial statements, multi-column balance sheets, and footnote dependencies with exact citation proofs.',
    badge: 'INTERACTIVE DEMO',
    domain: 'SAMPLE NOTEBOOK // FINANCE',
    tint: '#EEF9F5',
    accentColor: '#047857',
    rotateDeg: -3.4,
    icon: <Table size={15} />,
    thumbnails: [
      { label: 'TABLES & SHEETS', detail: 'Balance sheets & income statements kept intact', type: 'ast' },
      { label: 'INSTANT SEARCH', detail: 'Finds specific disclosures & exact numbers', type: 'vector' },
      { label: 'CONCEPT MAP', detail: 'Links earnings, risk factors, and disclosures', type: 'graph' },
    ],
    benchmarks: {
      latency: '38ms response',
      recall: '98.7% accuracy',
      depth: '4 section levels',
      volume: '300+ pages indexed',
    },
    specs: {
      retrievalModel: 'Understands financial and business terminology',
      indexing: 'Preserves multi-column tables and footnote connections',
      fusion: 'Combines conceptual search with exact figure matching',
    },
  },
  {
    id: 'nb-raft-consensus',
    title: 'Computer Science & Algorithms',
    category: 'COMPUTER SCIENCE',
    tags: ['ALGORITHMS', 'SYSTEM ARCHITECTURE', 'STEP-BY-STEP PROOFS'],
    summary: 'Understand complex algorithms, system protocols, and technical whitepapers with clear explanations and verified citations.',
    badge: 'SAMPLE STUDY NOTEBOOK',
    domain: 'SAMPLE NOTEBOOK // COMPUTER SCIENCE',
    tint: '#FFF8F0',
    accentColor: '#D97706',
    rotateDeg: 2.6,
    icon: <Cpu size={15} />,
    thumbnails: [
      { label: 'LOGIC FLOW', detail: 'Explains complex algorithm steps clearly', type: 'ast' },
      { label: 'PINPOINT SEARCH', detail: 'Finds specific theorems and rules instantly', type: 'vector' },
      { label: 'SYSTEM GRAPH', detail: 'Visualizes relationships between components', type: 'graph' },
    ],
    benchmarks: {
      latency: '24ms response',
      recall: '99.4% accuracy',
      depth: '5 section levels',
      volume: '80+ pages indexed',
    },
    specs: {
      retrievalModel: 'Technical paper and mathematics comprehension',
      indexing: 'Preserves formulas, code blocks, and outline structure',
      fusion: 'Semantic concept search plus exact symbol matching',
    },
  },
  {
    id: 'nb-clinical-trials',
    title: 'Medical & Healthcare Research',
    category: 'HEALTHCARE & MEDICINE',
    tags: ['MULTI-PAPER STUDY', 'COMPARISON', 'CLINICAL DATA'],
    summary: 'Compare findings across multiple research studies, highlight differences in results, and verify conclusions against original clinical data.',
    badge: 'MULTI-PAPER SYNTHESIS',
    domain: 'SAMPLE NOTEBOOK // MEDICAL RESEARCH',
    tint: '#F0F3FF',
    accentColor: '#2563EB',
    rotateDeg: -1.8,
    icon: <Activity size={15} />,
    thumbnails: [
      { label: 'CROSS-PAPER VIEW', detail: 'Compares outcomes across multiple studies', type: 'ast' },
      { label: 'TARGETED SEARCH', detail: 'Finds dosage, efficacy, and safety data', type: 'vector' },
      { label: 'RELATION MAP', detail: 'Connects treatments, outcomes, and caveats', type: 'graph' },
    ],
    benchmarks: {
      latency: '42ms response',
      recall: '97.9% accuracy',
      depth: '4 section levels',
      volume: '12 papers indexed',
    },
    specs: {
      retrievalModel: 'Biomedical and scientific terminology understanding',
      indexing: 'Cross-paper topic clustering and contradiction detection',
      fusion: 'Deep medical concept search with exact citation links',
    },
  },
  {
    id: 'nb-robotics-control',
    title: 'Engineering & Hardware Specs',
    category: 'ENGINEERING & ROBOTICS',
    tags: ['HARDWARE SPECS', 'CONTROL SYSTEMS', 'OPERATING LIMITS'],
    summary: 'Navigate dense hardware manuals, control systems, and safety standards without missing critical operating parameters.',
    badge: 'TECHNICAL MANUAL',
    domain: 'SAMPLE NOTEBOOK // ENGINEERING',
    tint: '#F5F0FF',
    accentColor: '#7C3AED',
    rotateDeg: 3.2,
    icon: <FileCode2 size={15} />,
    thumbnails: [
      { label: 'SPECS & TABLES', detail: 'Preserves technical tables and parameter charts', type: 'ast' },
      { label: 'EXACT LOOKUP', detail: 'Locates exact operating limits and units', type: 'vector' },
      { label: 'SYSTEM MAP', detail: 'Tracks connected dependencies and subsystems', type: 'graph' },
    ],
    benchmarks: {
      latency: '18ms response',
      recall: '99.8% accuracy',
      depth: '3 section levels',
      volume: '150+ pages indexed',
    },
    specs: {
      retrievalModel: 'Technical manual and specification comprehension',
      indexing: 'Structured data extraction and parameter outliner',
      fusion: 'Hardware spec lookup with exact threshold verification',
    },
  },
  {
    id: 'nb-legal-msa',
    title: 'Contracts & Legal Agreements',
    category: 'LEGAL & CONTRACTS',
    tags: ['CONTRACT REVIEW', 'CLAUSE NAVIGATION', 'RISK DETECTION'],
    summary: 'Quickly review long contracts, locate key clauses like liability limits and indemnities, and see cross-references between sections.',
    badge: 'AGREEMENT REVIEW',
    domain: 'SAMPLE NOTEBOOK // LEGAL & CONTRACTS',
    tint: '#FFF1F3',
    accentColor: '#E11D48',
    rotateDeg: -2.4,
    icon: <ShieldAlert size={15} />,
    thumbnails: [
      { label: 'CLAUSE NAVIGATION', detail: 'Breaks down key sections and sub-clauses', type: 'ast' },
      { label: 'KEY TERMS', detail: 'Locates indemnity caps, exclusions, and definitions', type: 'vector' },
      { label: 'CROSS-REFERENCES', detail: 'Maps connected clauses and shared definitions', type: 'graph' },
    ],
    benchmarks: {
      latency: '34ms response',
      recall: '98.2% accuracy',
      depth: '4 section levels',
      volume: '60+ pages indexed',
    },
    specs: {
      retrievalModel: 'Legal terminology and contract structure outliner',
      indexing: 'Hierarchical section mapping and cross-clause tracking',
      fusion: 'Contextual clause navigation with keyword precision',
    },
  },
]

interface Props {
  onSelectNotebook: (id: string) => void
  onOpenDashboard: () => void
}

export function ItsuaWorkDeck({ onSelectNotebook, onOpenDashboard }: Props) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const [activeCardIdx, setActiveCardIdx] = useState<number | null>(null)
  const [expandedSpecs, setExpandedSpecs] = useState<boolean>(false)
  const [stackOrder, setStackOrder] = useState<number[]>([0, 1, 2, 3, 4])
  const deckRef = useRef<HTMLDivElement>(null)

  // Listen for outside click to reset card interaction state
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (deckRef.current && !deckRef.current.contains(e.target as Node)) {
        setActiveCardIdx(null)
        setExpandedSpecs(false)
      }
    }
    window.addEventListener('click', handleOutsideClick)
    return () => window.removeEventListener('click', handleOutsideClick)
  }, [])

  const handleCardClick = (idx: number, e: React.MouseEvent) => {
    // If clicking a CTA button, let its handler execute without toggling card state
    if ((e.target as HTMLElement).closest('.deck-cta-btn')) return

    if (activeCardIdx !== idx) {
      // First click on card: activate and bring to top of stack
      setActiveCardIdx(idx)
      setExpandedSpecs(false)
      setStackOrder((prev) => {
        const next = prev.filter((i) => i !== idx)
        next.push(idx)
        return next
      })
    } else {
      // Repeated click on the already active card: toggle expanded specifications
      setExpandedSpecs((prev) => !prev)
    }
  }

  return (
    <section
      id="showcases"
      style={{
        position: 'relative',
        background: '#FFFFFF',
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
              <span style={{ fontWeight: 700, color: '#0E1012' }}>§ 02 — REAL-WORLD EXAMPLES</span>
              <span>/</span>
              <span>EXPLORE INTERACTIVE NOTEBOOKS</span>
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
                  borderRadius: 0,
                  padding: '4px 10px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Sparkles size={12} color="#FF5F14" />
                HOVER TO ROTATE · CLICK TO ELEVATE · CLICK AGAIN TO VIEW DETAILS
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
              borderRadius: 0,
              padding: '9px 18px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: 'none',
              transform: 'none',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#F0F0EE'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#FFFFFF'
            }}
          >
            <span>OPEN NOTEBOOKS WORKSPACE</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {/* ─── ITSUA.COM /work Verified Fanned Deck (Zero Border-Radius, Smooth Z-Axis Rotation) ─── */}
        <div
          ref={deckRef}
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
              const isActive = activeCardIdx === idx
              const isRaised = isHovered || isActive
              const stackRank = stackOrder.indexOf(idx)

              // Stacking hierarchy: active card on top (50), hovered card elevated (45), rest in fan order (10 + rank)
              const zIndex = isActive ? 50 : isHovered ? 45 : 10 + stackRank

              // Verified 2D Z-axis transform:
              // - Active card straightens to 0deg, scales up to 1.14x, and elevates smoothly
              // - Hovered card straightens to 0deg, scales to 1.05x, and elevates
              // - Resting cards fan naturally with deliberate Z-axis rotation angle
              const transform = isActive
                ? 'translateY(-24px) scale(1.14) rotate(0deg)'
                : isHovered
                ? 'translateY(-18px) scale(1.05) rotate(0deg)'
                : `translateY(0px) rotate(${item.rotateDeg}deg)`

              // Drop-shadow depth matching itsua.com
              const boxShadow = isActive
                ? '0 32px 64px rgba(14, 16, 18, 0.24), 0 12px 24px rgba(14, 16, 18, 0.12)'
                : isHovered
                ? '0 25px 50px rgba(14, 16, 18, 0.18), 0 8px 16px rgba(14, 16, 18, 0.08)'
                : '0 10px 28px rgba(14, 16, 18, 0.08), 0 2px 6px rgba(14, 16, 18, 0.04)'

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
                    transition:
                      'transform 0.45s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 0.45s cubic-bezier(0.25, 0.8, 0.25, 1), z-index 0s',
                    transform,
                  }}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  onClick={(e) => handleCardClick(idx, e)}
                >
                  {/* Clean Square Corner Card (Zero Border-Radius) */}
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      minHeight: 'clamp(380px, 44vh, 430px)',
                      background: item.tint,
                      border: isActive ? `2px solid ${item.accentColor}` : 'none',
                      borderRadius: 0,
                      padding: '22px 20px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow,
                      userSelect: 'none',
                      boxSizing: 'border-box',
                      transition: 'border 0.2s ease, box-shadow 0.45s ease',
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
                            borderRadius: 0,
                            padding: '3px 8px',
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
                              borderRadius: 0,
                              background: item.accentColor,
                              display: 'inline-block',
                            }}
                          />
                          {item.badge}
                        </span>
                      </div>

                      {/* Title & Category */}
                      <div style={{ marginBottom: 12 }}>
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

                      {/* Square Micro-Thumbnail Preview Viewports */}
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
                              background: 'rgba(255, 255, 255, 0.85)',
                              border: '1px solid rgba(14, 16, 18, 0.08)',
                              borderRadius: 0,
                              padding: '8px 6px',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              height: 66,
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

                      {/* Tags Pill Bar (Square Corners) */}
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
                              borderRadius: 0,
                              color: '#1A1D20',
                              padding: '3px 7px',
                            }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>

                      {/* Performance Fact Strip (Square Corners) */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(2, 1fr)',
                          gap: 6,
                          background: 'rgba(255, 255, 255, 0.75)',
                          border: '1px solid rgba(14, 16, 18, 0.08)',
                          borderRadius: 0,
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

                      {/* Repeated-Click Architectural Specs Deep-Dive Drawer */}
                      {isActive && expandedSpecs && (
                        <div
                          style={{
                            background: '#FFFFFF',
                            border: '1px solid rgba(14, 16, 18, 0.15)',
                            borderRadius: 0,
                            padding: '10px 10px',
                            marginTop: 8,
                            marginBottom: 8,
                            fontFamily: 'var(--font-mono)',
                            fontSize: 9,
                            color: '#333',
                            lineHeight: 1.4,
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                            animation: 'fadeIn 0.25s ease',
                          }}
                        >
                          <div style={{ fontWeight: 800, color: item.accentColor, marginBottom: 4 }}>
                            ARCHITECTURAL SPECIFICATION:
                          </div>
                          <div>
                            <strong>MODEL:</strong> {item.specs.retrievalModel}
                          </div>
                          <div style={{ marginTop: 2 }}>
                            <strong>INDEX:</strong> {item.specs.indexing}
                          </div>
                          <div style={{ marginTop: 2 }}>
                            <strong>FUSION:</strong> {item.specs.fusion}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Mobile & Tablet Overlapping Stack (<1024px, Zero Border Radius) */}
          <div className="itsua-deck-stage-mobile">
            {SHOWCASES.map((item, idx) => {
              const isActive = activeCardIdx === idx
              return (
                <div
                  key={`m-${item.id}`}
                  className="itsua-mobile-card"
                  style={{
                    background: item.tint,
                    color: '#0E1012',
                    border: isActive ? `2px solid ${item.accentColor}` : 'none',
                    borderRadius: 0,
                    padding: '22px 20px',
                    boxShadow: '0 10px 24px rgba(14, 16, 18, 0.08)',
                    position: 'relative',
                    zIndex: idx + 1,
                    transform: `rotate(${idx % 2 === 0 ? -1.4 : 1.4}deg)`,
                    transition: 'all 0.35s cubic-bezier(0.25, 0.8, 0.25, 1)',
                    cursor: 'pointer',
                    boxSizing: 'border-box',
                  }}
                  onClick={(e) => handleCardClick(idx, e)}
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
                        borderRadius: 0,
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
                          borderRadius: 0,
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
                          borderRadius: 0,
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  {/* Repeated-Click Architectural Specs Deep-Dive Drawer (Mobile) */}
                  {isActive && expandedSpecs && (
                    <div
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid rgba(14, 16, 18, 0.15)',
                        borderRadius: 0,
                        padding: '10px 10px',
                        marginBottom: 14,
                        fontFamily: 'var(--font-mono)',
                        fontSize: 9.5,
                        color: '#333',
                        lineHeight: 1.4,
                      }}
                    >
                      <div style={{ fontWeight: 800, color: item.accentColor, marginBottom: 4 }}>
                        ARCHITECTURAL SPECIFICATION:
                      </div>
                      <div>
                        <strong>MODEL:</strong> {item.specs.retrievalModel}
                      </div>
                      <div style={{ marginTop: 2 }}>
                        <strong>INDEX:</strong> {item.specs.indexing}
                      </div>
                      <div style={{ marginTop: 2 }}>
                        <strong>FUSION:</strong> {item.specs.fusion}
                      </div>
                    </div>
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
