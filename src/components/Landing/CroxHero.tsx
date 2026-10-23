import { useState } from 'react'
import { Database, GitBranch } from 'lucide-react'
import { useSearchStore } from '@/store/useSearchStore'
import type { AuthUser } from '@/lib/types'

interface Props {
  user?: AuthUser | null
  onStartDemo: () => void
  onOpenDashboard: () => void
  onNewNotebook?: () => void
}

export function CroxHero({ user: propUser, onStartDemo, onOpenDashboard, onNewNotebook }: Props) {
  const storeUser = useSearchStore((s) => s.user)
  const user = propUser !== undefined ? propUser : storeUser
  const [hoveredBadge, setHoveredBadge] = useState(false)
  const [isCtaHovered, setIsCtaHovered] = useState(false)

  return (
    <section
      id="specification"
      className="crox-hero-section"
      style={{
        position: 'relative',
        background: '#E3E7EB',
        color: '#1A1B1C',
        width: '100%',
        minHeight: 'calc(100vh - 60px)',
        boxSizing: 'border-box',
        overflow: 'hidden',
        fontFamily: "'Space Grotesk', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      {/* ─── Architectural 8-Column Vertical Grid Lines (Exact Crox Reference Style) ─── */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 49,
          display: 'grid',
          gridTemplateColumns: 'repeat(8, 1fr)',
          gridTemplateRows: '1fr',
          pointerEvents: 'none',
          zIndex: 0,
        }}
        aria-hidden="true"
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            style={{
              position: 'relative',
              borderLeft: '1px solid rgba(14, 16, 18, 0.08)',
              borderRight: i === 7 ? '1px solid rgba(14, 16, 18, 0.08)' : 'none',
              height: '100%',
            }}
          />
        ))}
      </div>

      {/* ─── Hero Core Content Layer ─── */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 1440,
          width: '100%',
          margin: '0 auto',
          padding: 'clamp(16px, 2.5vh, 32px) clamp(16px, 2.5vw, 40px) 0',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          flex: 1,
          boxSizing: 'border-box',
        }}
      >
        {/* ─── TOP SECTION: Crox 8-Column Asymmetric Editorial Composition ─── */}
        <div
          className="crox-editorial-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(8, 1fr)',
            gap: 'clamp(12px, 1.5vw, 24px)',
            alignItems: 'start',
            marginBottom: 'clamp(12px, 2vh, 28px)',
          }}
        >
          {/* Column 1: Studio Label & Circular Black Badge */}
          <div
            style={{
              gridColumn: 'span 1',
              display: 'flex',
              flexDirection: 'column',
              gap: 'clamp(12px, 1.8vh, 20px)',
            }}
            className="col-span-8 md:col-span-2 lg:col-span-1"
          >
            <div
              style={{
                fontSize: 11,
                fontFamily: "var(--font-mono, monospace)",
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#1A1B1C',
                whiteSpace: 'nowrap',
              }}
            >
              PRECISION REASONING LAB
            </div>

            {/* Signature Solid Black Circle Badge (Proportioned so all text fits comfortably) */}
            <div
              onMouseEnter={() => setHoveredBadge(true)}
              onMouseLeave={() => setHoveredBadge(false)}
              style={{
                width: 'clamp(142px, 16vh, 162px)',
                height: 'clamp(142px, 16vh, 162px)',
                borderRadius: '50%',
                background: '#1A1B1C',
                color: '#FFFFFF',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '16px 12px',
                boxSizing: 'border-box',
                cursor: 'pointer',
                boxShadow: '0 12px 32px rgba(0, 0, 0, 0.18)',
                transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease',
                transform: hoveredBadge ? 'scale(1.05)' : 'scale(1)',
                userSelect: 'none',
              }}
            >
              <div
                style={{
                  fontSize: 'clamp(28px, 3.2vh, 34px)',
                  fontWeight: 800,
                  fontFamily: "'Space Grotesk', sans-serif",
                  lineHeight: 1,
                  letterSpacing: '-0.03em',
                  color: '#FFFFFF',
                }}
              >
                100%
              </div>
              <div
                style={{
                  fontSize: 10.5,
                  fontWeight: 600,
                  color: '#C3C7CF',
                  marginTop: 4,
                  lineHeight: 1.25,
                  fontFamily: "'Space Grotesk', sans-serif",
                }}
              >
                Grounded Citations
              </div>
              <div
                style={{
                  fontSize: 8.5,
                  fontWeight: 800,
                  color: '#FF5F14',
                  marginTop: 4,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  fontFamily: "var(--font-mono, monospace)",
                }}
              >
                0 Hallucinations
              </div>
            </div>
          </div>

          {/* Column 3 & 4: Component 1 (AST Parser & Dual Vector Architecture Stack) */}
          <div
            className="col-span-8 md:col-span-4 lg:col-span-2 lg:col-start-3 crox-hero-col-ast"
            style={{
              paddingTop: 'clamp(34px, 5vh, 56px)',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                alignItems: 'flex-start',
              }}
            >
              <div
                className="ast-text-line"
                style={{
                  fontFamily: "var(--font-mono, monospace)",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  color: '#1A1B1C',
                  lineHeight: 1.45,
                }}
              >
                AST PARSER → DUAL VECTOR INDEX → BEAM SEARCH
              </div>
              <div
                className="ast-subtext-line"
                style={{
                  fontSize: 10.5,
                  fontFamily: "var(--font-mono, monospace)",
                  color: '#60636A',
                  letterSpacing: '0.04em',
                  marginTop: 2,
                }}
              >
                ENGINEERED AS ONE SYSTEM
              </div>
            </div>
          </div>

          {/* Column 6, 7 & 8: Editorial Supporting Copy & Borderless Action Controls */}
          <div
            className="col-span-8 md:col-span-8 lg:col-span-3 crox-hero-col-copy"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'clamp(10px, 1.4vh, 16px)',
              paddingTop: 'clamp(20px, 3.2vh, 36px)',
            }}
          >
            <p
              style={{
                fontSize: 'clamp(13px, 1.4vh, 15px)',
                lineHeight: 1.5,
                color: '#4A4E57',
                margin: 0,
                fontWeight: 400,
              }}
            >
              We engineer hierarchical retrieval and multi-document reasoning for teams who
              can’t afford for citations to fail. AST-aware parsers, dual-vector indexing, and
              beam search prove every claim before anything reaches your models.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(8px, 1vh, 12px)' }}>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  id="hero-primary-cta"
                  data-testid="hero-primary-cta"
                  className={`crox-orange-btn ${isCtaHovered ? 'is-hovered' : ''}`}
                  onClick={() => {
                    if (user) {
                      if (onNewNotebook) {
                        onNewNotebook()
                      } else {
                        onOpenDashboard()
                      }
                    } else {
                      onStartDemo()
                    }
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    background: isCtaHovered ? '#FFFFFF' : '#FF5F14',
                    color: '#0E1012',
                    border: 'none',
                    borderRadius: 3,
                    padding: 'clamp(10px, 1.3vh, 14px) clamp(18px, 2vw, 26px)',
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 12,
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    cursor: 'pointer',
                    boxShadow: 'none',
                    transform: 'none',
                    transition: 'background 0.15s ease, color 0.15s ease',
                  }}
                  onMouseEnter={() => setIsCtaHovered(true)}
                  onMouseLeave={() => setIsCtaHovered(false)}
                >
                  <span>{user ? 'New Notebook' : 'Demo Notebook'} →</span>
                </button>

                <button
                  onClick={onOpenDashboard}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: '#FFFFFF',
                    color: '#0E1012',
                    border: 'none',
                    borderRadius: 3,
                    padding: 'clamp(9px, 1.2vh, 13px) clamp(16px, 1.6vw, 20px)',
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 11.5,
                    fontWeight: 700,
                    cursor: 'pointer',
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
                  <Database size={13} />
                  <span>NOTEBOOKS</span>
                </button>
              </div>

              <div
                style={{
                  fontFamily: "var(--font-mono, monospace)",
                  fontSize: 9.5,
                  color: '#60636A',
                  letterSpacing: '0.04em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span>{user ? '● PERSISTENT NOTEBOOK' : '● INSTANT BROWSER DEMO'}</span>
                <span>·</span>
                <span>{user ? 'ISOLATED VECTOR CONTEXT' : 'NO API KEY REQUIRED'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── MONUMENTAL HEADLINE TYPOGRAPHY (Exact Crox Scale & Impact) ─── */}
        <div
          className="crox-headline-block"
          style={{
            position: 'relative',
            marginTop: 'auto',
            marginBottom: 'clamp(16px, 3vh, 36px)',
            userSelect: 'none',
          }}
        >
          {/* Header Row: RAGRAPH */}
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
            }}
          >
            <div
              style={{
                fontFamily: "'Space Grotesk', 'Inter', sans-serif",
                fontSize: 'clamp(64px, min(13.8vw, 18vh), 198px)',
                fontWeight: 900,
                letterSpacing: '-0.02em',
                lineHeight: 0.9,
                color: '#1A1B1C',
                textTransform: 'uppercase',
                margin: 0,
              }}
            >
              RAGRAPH
            </div>
          </div>

          {/* Second Line: INTELLIGENCE */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 16,
              width: '100%',
              marginTop: 'clamp(4px, 0.8vh, 10px)',
            }}
          >
            <div
              style={{
                fontFamily: "'Space Grotesk', 'Inter', sans-serif",
                fontSize: 'clamp(64px, min(13.8vw, 18vh), 198px)',
                fontWeight: 900,
                letterSpacing: '-0.02em',
                lineHeight: 0.9,
                color: '#1A1B1C',
                textTransform: 'uppercase',
                margin: 0,
              }}
            >
              INTELLIGENCE
            </div>

            {/* Technical Sub-Tag Pill */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 14px',
                border: '1px solid #0E1012',
                background: '#FFFFFF',
                borderRadius: 4,
                fontFamily: "var(--font-mono, monospace)",
                fontSize: 11,
                fontWeight: 700,
                color: '#2F4CFF',
                boxShadow: '1px 1px 0px #0E1012',
                marginBottom: 8,
              }}
            >
              <GitBranch size={14} />
              <span>HIERARCHICAL RAG &amp; KNOWLEDGE GRAPHS</span>
            </div>
          </div>
        </div>

        {/* ─── Bottom Anchor Bar (Seamlessly connects to CroxTickerBar) ─── */}
        <div
          style={{
            borderTop: '1px solid #0E1012',
            padding: '14px 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            fontFamily: "var(--font-mono, monospace)",
            fontSize: 11,
            color: '#60636A',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontWeight: 800, color: '#1A1B1C' }}>[ 00 ] ENGINE SPECIFICATION</span>
            <span>·</span>
            <span>HIERARCHICAL TREE-RAG &amp; KNOWLEDGE MAPPING</span>
          </div>

          <a
            href="#capabilities"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              color: '#1A1B1C',
              textDecoration: 'none',
              fontWeight: 800,
              letterSpacing: '0.04em',
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#FF5F14'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#1A1B1C'
            }}
          >
            <span>SCROLL TO EXPLORE CAPABILITIES</span>
            <span style={{ color: '#FF5F14', fontWeight: 900 }}>↓</span>
          </a>
        </div>
      </div>
    </section>
  )
}
