import { useState, useEffect, useRef } from 'react'
import { ArrowRight, GitBranch, Zap, Network, ShieldCheck } from 'lucide-react'

interface ServiceModel {
  tag: string
  title: string
  subtitle: string
  features: string[]
  linkText: string
  href: string
  tint: string
  hoverTint: string
  borderColor: string
  accentColor: string
  icon: React.ReactNode
}

const CAPABILITIES: ServiceModel[] = [
  {
    tag: 'CAPABILITY.01',
    title: 'Hierarchical Document AST',
    subtitle: 'Preserves headings, sub-clauses, and nested tables without arbitrary text slicing.',
    features: [
      '100% outline hierarchy preservation',
      'Zero broken sentences or shredded tables',
      'Recursive parent-to-leaf branch traversal',
    ],
    linkText: 'STRUCTURE SPECIFICATION →',
    href: '#specification',
    tint: '#F0F3FF',
    hoverTint: '#E8EDFF',
    borderColor: 'rgba(47, 76, 255, 0.25)',
    accentColor: '#2F4CFF',
    icon: <GitBranch size={16} />,
  },
  {
    tag: 'CAPABILITY.02',
    title: 'Dual-Path Hybrid Retrieval',
    subtitle: 'Combines deep neural semantic embeddings with exact BM25 keyword matching.',
    features: [
      'Beam search down outline trees with width=3',
      'Sparse keyword matching for financial numbers & codes',
      'Reciprocal rank fusion for top-tier relevance',
    ],
    linkText: 'RETRIEVAL MATRIX →',
    href: '#dual-engine',
    tint: '#EEF9F5',
    hoverTint: '#E3F5ED',
    borderColor: 'rgba(4, 120, 87, 0.25)',
    accentColor: '#047857',
    icon: <Zap size={16} />,
  },
  {
    tag: 'CAPABILITY.03',
    title: 'Interactive Knowledge Mind Map',
    subtitle: 'Automatically synthesizes cross-document relationships into an exploreable visual graph.',
    features: [
      'Force-directed 2D entity & concept network',
      'Automatic topic clustering across ingested papers',
      'Direct node-to-source paragraph lookup',
    ],
    linkText: 'EXPLORE MIND MAP →',
    href: '#benchmarks',
    tint: '#FFF8F0',
    hoverTint: '#FFF1DE',
    borderColor: 'rgba(217, 119, 6, 0.25)',
    accentColor: '#D97706',
    icon: <Network size={16} />,
  },
  {
    tag: 'CAPABILITY.04',
    title: 'Zero-Hallucination Citations',
    subtitle: 'Every claim links directly to its verified source with interactive paragraph highlighting.',
    features: [
      '99.2% verifiable grounding accuracy benchmark',
      'Instant side-by-side evidence inspection drawer',
      'Complete regulatory audit trail ready for enterprise',
    ],
    linkText: 'AUDIT ACCURACY →',
    href: '#benchmarks',
    tint: '#FFF1F3',
    hoverTint: '#FFE4E8',
    borderColor: 'rgba(225, 29, 72, 0.25)',
    accentColor: '#E11D48',
    icon: <ShieldCheck size={16} />,
  },
]

export function ItsuaServicesMatrix() {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const [isInView, setIsInView] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
        }
      },
      { threshold: 0.12 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      id="capabilities"
      ref={sectionRef}
      style={{
        position: 'relative',
        background: '#E3E7EB',
        borderTop: '2px solid #0E1012',
        borderBottom: '2px solid #0E1012',
        padding: 'clamp(28px, 4vh, 48px) clamp(16px, 2.5vw, 40px)',
      }}
    >
      <div style={{ maxWidth: 1440, margin: '0 auto' }}>
        {/* Section Header (ITSUA Monumental Style) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            marginBottom: 'clamp(16px, 2.2vh, 24px)',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10.5,
                color: 'var(--text-muted)',
                letterSpacing: '0.08em',
                marginBottom: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span style={{ fontWeight: 700, color: '#0E1012' }}>§ 01 — CORE CAPABILITIES</span>
              <span>/</span>
              <span>FOUR ARCHITECTURAL PILLARS</span>
            </div>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(30px, 3.6vw, 46px)',
                fontWeight: 700,
                letterSpacing: '-0.04em',
                color: '#0E1012',
                margin: 0,
                lineHeight: 1,
              }}
            >
              /capabilities
            </h2>
          </div>

          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: '#0E1012',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span>ENGINEERED FOR ENTERPRISE RAG</span>
            <span style={{ color: 'var(--text-muted)' }}>·</span>
            <span style={{ color: '#047857' }}>● 100% AUDITABLE</span>
          </div>
        </div>

        {/* ─── 2x2 Capabilities Grid (Balanced 2 Columns & 2 Rows on Desktop) ─── */}
        <div
          className="capabilities-2x2-grid"
          style={{
            border: '2px solid #0E1012',
            boxShadow: '4px 4px 0px #0E1012',
            background: '#0E1012',
            gap: '2px',
          }}
        >
          {CAPABILITIES.map((cap, i) => {
            const isHovered = hoveredIdx === i
            return (
              <div
                key={cap.tag}
                className="capability-card"
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                style={{
                  ['--fill' as string]: cap.tint,
                  backgroundColor: cap.tint,
                  padding: 'clamp(24px, 2.6vw, 34px)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: 'clamp(220px, 25vh, 265px)',
                  position: 'relative',
                  cursor: 'pointer',
                }}
              >
                <div>
                  {/* Top Tag & Icon */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 12,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 10.5,
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        color: cap.accentColor,
                      }}
                    >
                      {cap.tag}
                    </span>
                    <div
                      style={{
                        color: cap.accentColor,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      {cap.icon}
                    </div>
                  </div>

                  {/* Heading */}
                  <h3
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 'clamp(18px, 1.8vw, 22px)',
                      fontWeight: 700,
                      letterSpacing: '-0.025em',
                      color: '#0E1012',
                      margin: '0 0 8px 0',
                      lineHeight: 1.15,
                    }}
                  >
                    {cap.title}
                  </h3>

                  {/* Subtitle */}
                  <p
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: 12.5,
                      lineHeight: 1.45,
                      color: '#4B505B',
                      margin: '0 0 14px 0',
                    }}
                  >
                    {cap.subtitle}
                  </p>

                  {/* Hairline Divider */}
                  <div
                    style={{
                      height: 1,
                      background: 'rgba(14, 16, 18, 0.1)',
                      marginBottom: 14,
                    }}
                  />

                  {/* Monospace Bullet Points (ITSUA style) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {cap.features.map((feat, fi) => (
                      <div
                        key={fi}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 8,
                          fontFamily: 'var(--font-mono)',
                          fontSize: 11.5,
                          color: '#282B33',
                          lineHeight: 1.35,
                        }}
                      >
                        <span style={{ color: cap.accentColor, fontWeight: 700 }}>›</span>
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Link with Arrow */}
                <div style={{ marginTop: 16, paddingTop: 6 }}>
                  <a
                    href={cap.href}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      color: cap.accentColor,
                      textDecoration: 'none',
                      borderBottom: `1.5px solid ${cap.accentColor}`,
                      paddingBottom: 2,
                      transition: 'transform 0.15s ease, opacity 0.15s ease',
                      transform: isHovered ? 'translateX(3px)' : 'translateX(0)',
                    }}
                  >
                    <span>{cap.linkText}</span>
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
