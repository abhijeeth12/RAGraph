import { useState, useEffect } from 'react'
import { Layers, Sparkles, LogIn, Compass, ArrowRight, Activity } from 'lucide-react'

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
        backdropFilter: 'blur(16px)',
        background: scrolled ? 'rgba(11, 13, 17, 0.92)' : 'rgba(11, 13, 17, 0.75)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        height: 72,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
        transition: 'background 0.2s ease, border-color 0.2s ease',
      }}
    >
      {/* Brand & Technical Engine Badge */}
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
            style={{ width: 28, height: 28, objectFit: 'contain' }}
          />
          <span
            style={{
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: '-0.025em',
              color: '#f8fafc',
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
            fontFamily: "'JetBrains Mono', monospace",
            color: '#38bdf8',
          }}
        >
          <span>v5.2-ENGINE</span>
        </div>
      </div>

      {/* Navigation Anchor Links */}
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 24,
          fontSize: 13.5,
          color: '#94a3b8',
        }}
        className="hidden md:flex"
      >
        <a
          href="#architecture"
          style={{
            color: 'inherit',
            textDecoration: 'none',
            transition: 'color 0.15s',
          }}
          onMouseOver={(e) => (e.currentTarget.style.color = '#f8fafc')}
          onMouseOut={(e) => (e.currentTarget.style.color = '#94a3b8')}
        >
          Architecture
        </a>
        <a
          href="#benchmarks"
          style={{
            color: 'inherit',
            textDecoration: 'none',
            transition: 'color 0.15s',
          }}
          onMouseOver={(e) => (e.currentTarget.style.color = '#f8fafc')}
          onMouseOut={(e) => (e.currentTarget.style.color = '#94a3b8')}
        >
          Benchmarks
        </a>
        <a
          href="#knowledge-graph"
          style={{
            color: 'inherit',
            textDecoration: 'none',
            transition: 'color 0.15s',
          }}
          onMouseOver={(e) => (e.currentTarget.style.color = '#f8fafc')}
          onMouseOut={(e) => (e.currentTarget.style.color = '#94a3b8')}
        >
          Knowledge Graph
        </a>
        <a
          href="#faq"
          style={{
            color: 'inherit',
            textDecoration: 'none',
            transition: 'color 0.15s',
          }}
          onMouseOver={(e) => (e.currentTarget.style.color = '#f8fafc')}
          onMouseOut={(e) => (e.currentTarget.style.color = '#94a3b8')}
        >
          FAQ
        </a>
      </nav>

      {/* Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {user ? (
          <button
            onClick={onOpenDashboard}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: '#38bdf8',
              color: '#0b0d11',
              padding: '8px 16px',
              borderRadius: 6,
              fontWeight: 600,
              fontSize: 13,
              border: 'none',
              cursor: 'pointer',
              transition: 'opacity 0.15s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.opacity = '0.9')}
            onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
          >
            <Layers size={14} />
            <span>Dashboard</span>
          </button>
        ) : (
          <>
            <button
              onClick={onOpenAuth}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'transparent',
                color: '#cbd5e1',
                padding: '8px 14px',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 500,
                border: '1px solid rgba(255, 255, 255, 0.1)',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)'
                e.currentTarget.style.color = '#ffffff'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                e.currentTarget.style.color = '#cbd5e1'
              }}
            >
              <LogIn size={13} />
              <span>Sign In</span>
            </button>

            <button
              onClick={onStartDemo}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: '#f8fafc',
                color: '#0b0d11',
                padding: '8px 16px',
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 13,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s',
                boxShadow: '0 2px 10px rgba(255, 255, 255, 0.1)',
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = '#ffffff')}
              onMouseOut={(e) => (e.currentTarget.style.background = '#f8fafc')}
            >
              <Sparkles size={14} />
              <span>Guest Sandbox</span>
            </button>
          </>
        )}
      </div>
    </header>
  )
}
