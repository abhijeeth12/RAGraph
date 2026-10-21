import { useState, useEffect } from 'react'
import { Layers, Sparkles, LogIn, ArrowRight, Activity, Terminal } from 'lucide-react'

interface Props {
  onStartDemo: () => void
  onOpenDashboard: () => void
  onOpenAuth: () => void
  user: { email: string } | null
}

export function ArchitecturalHeader({
  onStartDemo,
  onOpenDashboard,
  onOpenAuth,
  user,
}: Props) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        background: scrolled ? 'rgba(8, 9, 12, 0.92)' : 'rgba(8, 9, 12, 0.75)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        height: 72,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
        transition: 'background 0.2s ease, border-color 0.2s ease',
      }}
    >
      {/* Brand & Technical Manifest Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <a
          href="#landing"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            textDecoration: 'none',
            color: 'inherit',
          }}
        >
          <img
            src="/logo.png"
            alt="RA-Graph"
            style={{ width: 30, height: 30, objectFit: 'contain' }}
          />
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 19,
              fontWeight: 700,
              letterSpacing: '-0.025em',
              color: '#F8FAFC',
            }}
          >
            RA-Graph
          </span>
        </a>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '3px 8px',
            borderRadius: 4,
            background: 'rgba(56, 189, 248, 0.08)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            color: '#38BDF8',
          }}
        >
          <span>v2.4-AST</span>
        </div>
      </div>

      {/* Navigation Anchor Links */}
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 28,
          fontSize: 13.5,
          color: '#94A3B8',
          fontFamily: 'var(--font-body)',
        }}
        className="hidden md:flex"
      >
        <a
          href="#features"
          style={{
            color: 'inherit',
            textDecoration: 'none',
            transition: 'color 0.15s ease',
          }}
          onMouseOver={(e) => (e.currentTarget.style.color = '#F8FAFC')}
          onMouseOut={(e) => (e.currentTarget.style.color = '#94A3B8')}
        >
          Overview
        </a>
        <a
          href="#architecture"
          style={{
            color: 'inherit',
            textDecoration: 'none',
            transition: 'color 0.15s ease',
          }}
          onMouseOver={(e) => (e.currentTarget.style.color = '#F8FAFC')}
          onMouseOut={(e) => (e.currentTarget.style.color = '#94A3B8')}
        >
          Beam Descent
        </a>
        <a
          href="#benchmarks"
          style={{
            color: 'inherit',
            textDecoration: 'none',
            transition: 'color 0.15s ease',
          }}
          onMouseOver={(e) => (e.currentTarget.style.color = '#F8FAFC')}
          onMouseOut={(e) => (e.currentTarget.style.color = '#94A3B8')}
        >
          Ledger
        </a>
        <a
          href="#knowledge-graph"
          style={{
            color: 'inherit',
            textDecoration: 'none',
            transition: 'color 0.15s ease',
          }}
          onMouseOver={(e) => (e.currentTarget.style.color = '#F8FAFC')}
          onMouseOut={(e) => (e.currentTarget.style.color = '#94A3B8')}
        >
          Knowledge Graph
        </a>
        <a
          href="#faq"
          style={{
            color: 'inherit',
            textDecoration: 'none',
            transition: 'color 0.15s ease',
          }}
          onMouseOver={(e) => (e.currentTarget.style.color = '#F8FAFC')}
          onMouseOut={(e) => (e.currentTarget.style.color = '#94A3B8')}
        >
          Specifications
        </a>
      </nav>

      {/* Action Telemetry & CTA Row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Real-time Telemetry Pill */}
        <div
          style={{
            display: 'none',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            borderRadius: 9999,
            background: 'rgba(52, 211, 153, 0.08)',
            border: '1px solid rgba(52, 211, 153, 0.2)',
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            color: '#34D399',
          }}
          className="lg:flex"
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#34D399',
              boxShadow: '0 0 8px #34D399',
            }}
          />
          <span>CLUSTER 38ms</span>
        </div>

        {/* Guest Demo CTA */}
        <button
          onClick={onStartDemo}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 14px',
            borderRadius: 7,
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            fontSize: 13,
            fontWeight: 500,
            color: '#F1F5F9',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            fontFamily: 'var(--font-body)',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.4)'
            e.currentTarget.style.background = 'rgba(56, 189, 248, 0.08)'
            e.currentTarget.style.color = '#38BDF8'
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)'
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'
            e.currentTarget.style.color = '#F1F5F9'
          }}
        >
          <Sparkles size={14} />
          <span>Demo Sandbox</span>
        </button>

        {/* Primary CTA: Dashboard or Login */}
        {user ? (
          <button
            onClick={onOpenDashboard}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              padding: '7px 16px',
              borderRadius: 7,
              background: '#F8FAFC',
              color: '#08090C',
              fontSize: 13,
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              fontFamily: 'var(--font-body)',
              boxShadow: '0 2px 10px rgba(255, 255, 255, 0.15)',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#FFFFFF'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = '#F8FAFC'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <Layers size={14} />
            <span>Workspace</span>
            <ArrowRight size={13} />
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={onOpenAuth}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 12px',
                borderRadius: 7,
                background: 'transparent',
                border: 'none',
                fontSize: 13,
                fontWeight: 500,
                color: '#94A3B8',
                cursor: 'pointer',
                transition: 'color 0.15s ease',
                fontFamily: 'var(--font-body)',
              }}
              onMouseOver={(e) => (e.currentTarget.style.color = '#F8FAFC')}
              onMouseOut={(e) => (e.currentTarget.style.color = '#94A3B8')}
            >
              <LogIn size={14} />
              <span>Sign In</span>
            </button>

            <button
              onClick={onOpenDashboard}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '7px 16px',
                borderRadius: 7,
                background: '#F8FAFC',
                color: '#08090C',
                fontSize: 13,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                fontFamily: 'var(--font-body)',
                boxShadow: '0 2px 10px rgba(255, 255, 255, 0.15)',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = '#FFFFFF'
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = '#F8FAFC'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <span>Get Started</span>
              <ArrowRight size={13} />
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
