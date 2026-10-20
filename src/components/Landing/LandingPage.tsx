import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Layers, ArrowRight, Compass, ShieldCheck } from 'lucide-react'
import { useSearchStore } from '@/store/useSearchStore'
import AuthModal from '@/components/AuthModal'
import { ArchitecturalHeader } from './ArchitecturalHeader'
import { ArchitecturalHero } from './ArchitecturalHero'
import { BeamSearchPipeline } from './BeamSearchPipeline'
import { BenchmarkMatrix } from './BenchmarkMatrix'
import { KnowledgeGraphSection } from './KnowledgeGraphSection'
import { ArchitecturalFAQ } from './ArchitecturalFAQ'
import { ArchitecturalFooter } from './ArchitecturalFooter'

interface Props {
  onStartDemo: () => void
  onOpenDashboard: () => void
}

export function LandingPage({ onStartDemo, onOpenDashboard }: Props) {
  const { user, openGuestDemo } = useSearchStore()
  const [authOpen, setAuthOpen] = useState(false)

  const handleStartGuest = () => {
    openGuestDemo()
    onStartDemo()
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0b0d11',
        color: '#f8fafc',
        overflowX: 'hidden',
        position: 'relative',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* Precision Hairline Background Grid (Architectural Drafting Vibe) */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(255, 255, 255, 0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.025) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Subtle Blueprint Ambient Radial Light (Subdued, strictly non-neon) */}
      <div
        style={{
          position: 'fixed',
          top: '-15%',
          left: '20%',
          width: '750px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.04) 0%, transparent 70%)',
          filter: 'blur(80px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Main Content Flow */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Masthead Navigation */}
        <ArchitecturalHeader
          user={user}
          onStartDemo={handleStartGuest}
          onOpenDashboard={onOpenDashboard}
          onOpenAuth={() => setAuthOpen(true)}
        />

        {/* Hero Section with Dual-Engine Comparison */}
        <ArchitecturalHero
          onStartDemo={handleStartGuest}
          onOpenDashboard={onOpenDashboard}
        />

        {/* Traversal Pipeline: 4 Stages */}
        <BeamSearchPipeline />

        {/* Empirical Benchmarks: Table Evaluation */}
        <BenchmarkMatrix />

        {/* Knowledge Graph Relational Reasoning */}
        <KnowledgeGraphSection />

        {/* Technical FAQ */}
        <ArchitecturalFAQ />

        {/* ─── Conversion Gateway Banner ─────────────────────────────── */}
        <section
          style={{
            padding: '80px 24px',
            maxWidth: 1320,
            margin: '0 auto',
            width: '100%',
          }}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.08) 0%, rgba(129, 140, 248, 0.04) 100%)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: 16,
              padding: '56px 40px',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.4)',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '4px 12px',
                borderRadius: 4,
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                fontSize: 12,
                fontFamily: "'JetBrains Mono', monospace",
                marginBottom: 20,
              }}
            >
              <ShieldCheck size={14} />
              <span>RESEARCH-GRADE STRUCTURAL GROUNDING</span>
            </div>

            <h2
              style={{
                fontSize: 'clamp(28px, 4.2vw, 46px)',
                fontWeight: 700,
                letterSpacing: '-0.03em',
                color: '#f8fafc',
                margin: '0 auto 16px',
                maxWidth: 780,
                lineHeight: 1.15,
              }}
            >
              Start Researching Beyond Flat Chunking.
            </h2>

            <p
              style={{
                fontSize: 16,
                color: '#94a3b8',
                maxWidth: 620,
                margin: '0 auto 32px',
                lineHeight: 1.6,
              }}
            >
              Launch an immediate interactive sandbox with pre-parsed technical specifications, or create private notebooks for your own corpora.
            </p>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 16,
                flexWrap: 'wrap',
              }}
            >
              <button
                onClick={handleStartGuest}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: '#f8fafc',
                  color: '#0b0d11',
                  padding: '14px 28px',
                  borderRadius: 6,
                  fontWeight: 600,
                  fontSize: 14.5,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: '0 4px 16px rgba(255, 255, 255, 0.15)',
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = '#ffffff')}
                onMouseOut={(e) => (e.currentTarget.style.background = '#f8fafc')}
              >
                <Sparkles size={16} />
                <span>Launch Guest Sandbox</span>
                <ArrowRight size={15} />
              </button>

              <button
                onClick={onOpenDashboard}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: '#f1f5f9',
                  padding: '14px 24px',
                  borderRadius: 6,
                  fontWeight: 500,
                  fontSize: 14.5,
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.4)'
                  e.currentTarget.style.background = 'rgba(56, 189, 248, 0.08)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                }}
              >
                <Layers size={16} />
                <span>Open Notebook Dashboard</span>
              </button>
            </div>
          </div>
        </section>

        {/* Blueprint Footer */}
        <ArchitecturalFooter
          onStartDemo={handleStartGuest}
          onOpenDashboard={onOpenDashboard}
        />
      </div>

      {/* Authentication Modal */}
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  )
}
