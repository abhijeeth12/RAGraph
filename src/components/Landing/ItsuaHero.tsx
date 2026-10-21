import {
  ArrowRight,
  GitBranch,
  Zap,
  CheckCircle2,
  Database,
} from 'lucide-react'

interface Props {
  onStartDemo: () => void
  onOpenDashboard: () => void
}

export function ItsuaHero({ onStartDemo, onOpenDashboard }: Props) {
  return (
    <section
      id="specification"
      style={{
        position: 'relative',
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 'clamp(20px, 3vh, 40px) 24px clamp(16px, 2vh, 24px)',
        maxWidth: 1380,
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* ─── Dropping dashed hairline columns (ITSUA Signature) ───────── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
        aria-hidden="true"
      >
        {Array.from({ length: 13 }).map((_, i) => (
          <div
            key={i}
            className="hero-line"
            style={{
              borderLeft: '1px dashed rgba(14, 16, 18, 0.05)',
              animationDelay: `${i * 90}ms`,
              height: '100%',
            }}
          />
        ))}
      </div>

      <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {/* Section Index Marker (ITSUA § 00) */}
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--text-muted)',
            letterSpacing: '0.08em',
            marginBottom: 'clamp(20px, 3vh, 32px)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontWeight: 700, color: '#0E1012' }}>
            § 00 — ENGINE OVERVIEW
          </span>
          <span style={{ color: '#0E1012' }}>/</span>
          <span style={{ color: '#0E1012', fontWeight: 600 }}>NEXT-GEN DOCUMENT REASONING</span>
          <span style={{ color: '#0E1012' }}>/</span>
          <span style={{ color: '#047857', fontWeight: 700 }}>BENCHMARKS VERIFIED</span>
        </div>

        {/* ─── Hero Headline & Abstract Grid (Crox + Itsua Art Direction) ─── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.85fr) minmax(320px, 1fr)',
            gap: 'clamp(32px, 5vw, 64px)',
            alignItems: 'center',
          }}
          className="hero-headline-grid"
        >
          {/* Left Column: Monumental Headline with Circular Focal Badge */}
          <div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'clamp(18px, 2.5vw, 28px)', marginBottom: 20 }}>
              {/* Crox-style bold circular badge */}
              <div
                style={{
                  width: 'clamp(84px, 8vw, 110px)',
                  height: 'clamp(84px, 8vw, 110px)',
                  borderRadius: '50%',
                  background: '#0E1012',
                  color: '#FFFFFF',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  flexShrink: 0,
                  boxShadow: '0 8px 24px rgba(14, 16, 18, 0.15)',
                  border: '2px solid #0E1012',
                  padding: 8,
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'clamp(20px, 2vw, 26px)',
                    fontWeight: 800,
                    lineHeight: 1,
                    letterSpacing: '-0.02em',
                  }}
                >
                  99.2%
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 8.5,
                    letterSpacing: '0.04em',
                    color: 'rgba(255, 255, 255, 0.75)',
                    marginTop: 4,
                    lineHeight: 1.2,
                  }}
                >
                  GROUNDED CITATIONS
                </span>
              </div>

              <div>
                <h1
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'clamp(36px, 4.8vw, 76px)',
                    lineHeight: 0.96,
                    fontWeight: 700,
                    letterSpacing: '-0.04em',
                    color: '#0E1012',
                    margin: 0,
                  }}
                >
                  Hierarchical RAG &<br />
                  Knowledge Graphs.<br />
                  <span
                    style={{
                      fontSize: 'clamp(18px, 2.4vw, 36px)',
                      fontWeight: 500,
                      color: 'var(--text-secondary)',
                      letterSpacing: '-0.03em',
                      display: 'block',
                      marginTop: 8,
                    }}
                  >
                    Search complex documents with 100% confidence.
                  </span>
                </h1>
              </div>
            </div>

            {/* Clean benefit pills */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 10,
                marginTop: 'clamp(16px, 2vh, 24px)',
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 14px',
                  borderRadius: 4,
                  background: '#FFFFFF',
                  border: '1.5px solid #0E1012',
                  color: '#0E1012',
                  fontWeight: 600,
                  boxShadow: '1.5px 1.5px 0px #0E1012',
                }}
              >
                <GitBranch size={13} color="#2F4CFF" />
                <span>FULL TREE CONTEXT</span>
              </div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 14px',
                  borderRadius: 4,
                  background: '#FFFFFF',
                  border: '1.5px solid #0E1012',
                  color: '#0E1012',
                  fontWeight: 600,
                  boxShadow: '1.5px 1.5px 0px #0E1012',
                }}
              >
                <Zap size={13} color="#FF5500" />
                <span>SUB-50ms LATENCY</span>
              </div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 14px',
                  borderRadius: 4,
                  background: 'rgba(4, 120, 87, 0.08)',
                  border: '1.5px solid #047857',
                  color: '#047857',
                  fontWeight: 700,
                }}
              >
                <CheckCircle2 size={13} />
                <span>ZERO HALLUCINATIONS</span>
              </div>
            </div>
          </div>

          {/* Right Column: Abstract & Quick Actions (ITSUA + Crox style) */}
          <div
            style={{
              borderLeft: '2px solid #0E1012',
              paddingLeft: 'clamp(24px, 3.5vw, 36px)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: 240,
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  letterSpacing: '0.12em',
                  color: '#0E1012',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  marginBottom: 10,
                }}
              >
                PRODUCT ABSTRACT
              </div>
              <p
                style={{
                  fontSize: 'clamp(14px, 1.1vw, 15.5px)',
                  lineHeight: 1.65,
                  color: '#4B505B',
                  margin: 0,
                  fontFamily: 'var(--font-body)',
                }}
              >
                Traditional AI search shreds documents into isolated fragments, blinding models to
                nested tables and parent headings. RA-Graph maps the entire document tree—delivering
                exact answers backed by verifiable citations you can audit with a click.
              </p>
            </div>

            {/* Action Buttons */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                marginTop: 'clamp(20px, 3vh, 30px)',
              }}
            >
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button
                  onClick={onStartDemo}
                  className="btn-crox-orange"
                  style={{
                    padding: '12px 24px',
                    fontSize: 12.5,
                    border: '2px solid #0E1012',
                    boxShadow: '3px 3px 0px #0E1012',
                    cursor: 'pointer',
                  }}
                >
                  <span>LAUNCH DEMO SANDBOX</span>
                  <ArrowRight size={14} />
                </button>

                <button
                  onClick={onOpenDashboard}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    background: '#FFFFFF',
                    color: '#0E1012',
                    border: '2px solid #0E1012',
                    borderRadius: 4,
                    padding: '11px 20px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
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
                  <Database size={13} />
                  <span>NOTEBOOKS</span>
                </button>
              </div>

              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10.5,
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span>● ZERO SETUP REQUIRED</span>
                <span>·</span>
                <span>CLIENT-SIDE BROWSER DEMO</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Architectural Bottom Horizon (Crox Bold Black Line) ─── */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          borderTop: '2px solid #0E1012',
          paddingTop: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--text-muted)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ color: '#0E1012', fontWeight: 700 }}>[ 00 ] ENGINE OVERVIEW</span>
          <span>·</span>
          <span>HIERARCHICAL TREE-RAG & KNOWLEDGE MAPPING</span>
        </div>

        <a
          href="#capabilities"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            color: '#0E1012',
            textDecoration: 'none',
            fontWeight: 600,
            transition: 'color 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#2F4CFF')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#0E1012')}
        >
          <span>SCROLL TO EXPLORE CAPABILITIES</span>
          <span>↓</span>
        </a>
      </div>
    </section>
  )
}
