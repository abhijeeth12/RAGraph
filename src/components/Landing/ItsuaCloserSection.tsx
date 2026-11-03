import { ArrowRight, Terminal } from 'lucide-react'

interface Props {
  onStartDemo: () => void
  onOpenDashboard: () => void
}

export function ItsuaCloserSection({ onStartDemo, onOpenDashboard }: Props) {
  return (
    <section
      id="closer"
      style={{
        width: '100%',
        backgroundColor: '#0E1012',
        color: '#FFFFFF',
        padding: 'clamp(60px, 8vh, 100px) 24px',
        borderTop: '1px solid #0E1012',
        borderBottom: '1px solid #26292e',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        {/* Eyebrow */}
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'rgba(255, 255, 255, 0.5)',
            letterSpacing: '0.08em',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span style={{ color: '#34d399', fontWeight: 700 }}>§ 04 — SYSTEM READY</span>
          <span>/</span>
          <span>ZERO SETUP OR CREDIT CARD REQUIRED</span>
        </div>

        {/* Display Title */}
        <div style={{ maxWidth: 900, marginBottom: 36 }}>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(38px, 5vw, 68px)',
              fontWeight: 700,
              letterSpacing: '-0.04em',
              lineHeight: 1.05,
              color: '#FFFFFF',
              margin: '0 0 18px 0',
            }}
          >
            Ready when you are.
          </h2>
          <p
            style={{
              fontSize: 'clamp(16px, 1.8vw, 19px)',
              color: 'rgba(255, 255, 255, 0.7)',
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            Launch our interactive sandbox notebook right in your browser, or upload your own dense PDFs to experience grounded research with zero hallucinated facts.
          </p>
        </div>

        {/* Buttons Row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 54 }}>
          <button
            onClick={onStartDemo}
            style={{
              height: 48,
              padding: '0 26px',
              backgroundColor: '#FFFFFF',
              color: '#0E1012',
              fontFamily: 'var(--font-mono)',
              fontSize: 12.5,
              fontWeight: 700,
              border: 'none',
              borderRadius: 2,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              transition: 'background-color 0.15s ease, color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2F4CFF'
              e.currentTarget.style.color = '#FFFFFF'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#FFFFFF'
              e.currentTarget.style.color = '#0E1012'
            }}
          >
            <span>TRY LIVE DEMO</span>
            <ArrowRight size={14} />
          </button>

          <button
            onClick={onOpenDashboard}
            style={{
              height: 48,
              padding: '0 24px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              color: '#FFFFFF',
              fontFamily: 'var(--font-mono)',
              fontSize: 12.5,
              fontWeight: 600,
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: 2,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.16)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'
            }}
          >
            <Terminal size={14} />
            <span>OPEN NOTEBOOKS WORKSPACE</span>
          </button>
        </div>

        {/* Telemetry Strip */}
        <div
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.15)',
            paddingTop: 28,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 20,
            fontFamily: 'var(--font-mono)',
            fontSize: 11.5,
          }}
        >
          <div>
            <span style={{ color: 'rgba(255, 255, 255, 0.4)', display: 'block', marginBottom: 4 }}>
              RETRIEVAL ENGINE
            </span>
            <span style={{ color: '#FFFFFF', fontWeight: 600 }}>Hierarchical Hybrid Engine</span>
          </div>

          <div>
            <span style={{ color: 'rgba(255, 255, 255, 0.4)', display: 'block', marginBottom: 4 }}>
              DEPLOYMENT
            </span>
            <span style={{ color: '#FFFFFF', fontWeight: 600 }}>Vercel Edge + Render</span>
          </div>

          <div>
            <span style={{ color: 'rgba(255, 255, 255, 0.4)', display: 'block', marginBottom: 4 }}>
              SEARCH SPEED
            </span>
            <span style={{ color: '#34d399', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#34d399', display: 'inline-block' }} />
              &lt; 50ms Instant Search
            </span>
          </div>

          <div>
            <span style={{ color: 'rgba(255, 255, 255, 0.4)', display: 'block', marginBottom: 4 }}>
              CITATION FIDELITY
            </span>
            <span style={{ color: '#FFFFFF', fontWeight: 600 }}>100% Grounded</span>
          </div>

          <div>
            <span style={{ color: 'rgba(255, 255, 255, 0.4)', display: 'block', marginBottom: 4 }}>
              SLA GUARANTEE
            </span>
            <span style={{ color: '#34d399', fontWeight: 700 }}>99.9% Production Uptime</span>
          </div>
        </div>
      </div>
    </section>
  )
}
