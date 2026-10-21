'use client'
import { ArrowRight } from 'lucide-react'

interface Props {
  onStartDemo: () => void
  onOpenDashboard: () => void
}

export function ItsuaFooter({ onStartDemo, onOpenDashboard }: Props) {
  return (
    <footer
      style={{
        borderTop: '2px solid #0E1012',
        background: '#FFFFFF',
        width: '100%',
      }}
    >
      {/* ─── High-Impact Studio Conversion Band ─────────────────────── */}
      <div
        style={{
          padding: 'clamp(50px, 8vh, 90px) 24px',
          maxWidth: 1380,
          margin: '0 auto',
          borderBottom: '2px solid #0E1012',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.8fr) minmax(300px, 1fr)',
          gap: 40,
          alignItems: 'center',
          boxSizing: 'border-box',
        }}
        className="grid grid-cols-1 lg:grid-cols-[1.8fr_1fr]"
      >
        <div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--text-muted)',
              letterSpacing: '0.08em',
              marginBottom: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span style={{ fontWeight: 700, color: '#0E1012' }}>§ 07 — GET STARTED</span>
            <span>/</span>
            <span>NO SETUP OR CREDIT CARD REQUIRED</span>
          </div>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(38px, 5vw, 68px)',
              lineHeight: 1,
              fontWeight: 700,
              letterSpacing: '-0.04em',
              color: '#0E1012',
              margin: 0,
            }}
          >
            Ready to explore<br />
            confident document search?
          </h2>
          <p
            style={{
              fontSize: 16,
              color: 'var(--text-secondary)',
              marginTop: 18,
              maxWidth: 580,
              lineHeight: 1.6,
            }}
          >
            Drop your PDFs, financial disclosures, or research papers into the live sandbox
            and see instant answers with verifiable, clickable citations.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <button onClick={onStartDemo} className="btn-crox-orange" style={{ padding: '16px 28px', fontSize: 13, justifyContent: 'center' }}>
            <span>LAUNCH LIVE DEMO SANDBOX</span>
            <ArrowRight size={15} />
          </button>

          <button onClick={onOpenDashboard} className="btn-outline-studio" style={{ justifyContent: 'center', padding: '14px 24px' }}>
            <span>EXPLORE RESEARCH NOTEBOOKS →</span>
          </button>
        </div>
      </div>

      {/* ─── Bottom Meta Bar (Crox Clean Aesthetic) ────────────────── */}
      <div
        style={{
          padding: '24px',
          maxWidth: 1380,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 20,
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--text-muted)',
        }}
      >
        {/* Left: Brand info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontWeight: 800, color: '#0E1012' }}>RA-GRAPH</span>
          <span>·</span>
          <span>HIERARCHICAL RAG & KNOWLEDGE GRAPH ENGINE</span>
        </div>

        {/* Center: System Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#047857', display: 'inline-block' }} />
            <span style={{ color: '#0E1012', fontWeight: 700 }}>ALL SYSTEMS OPERATIONAL</span>
          </div>
          <span>·</span>
          <span style={{ color: '#0E1012', fontWeight: 600 }}>99.2% GROUNDED CITATIONS</span>
          <span>·</span>
          <span style={{ color: '#0E1012', fontWeight: 600 }}>ENTERPRISE READY</span>
        </div>

        {/* Right: Copyright */}
        <div>
          © {new Date().getFullYear()} RA-GRAPH RESEARCH. ALL RIGHTS RESERVED.
        </div>
      </div>
    </footer>
  )
}
