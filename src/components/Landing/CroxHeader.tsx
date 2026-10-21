import { useState, useEffect } from 'react'
import { ArrowRight, LayoutDashboard, Menu, X, Sparkles } from 'lucide-react'
import type { AuthUser } from '@/lib/types'

interface Props {
  user: AuthUser | null
  onStartDemo: () => void
  onOpenDashboard: () => void
  onOpenAuth: () => void
}

const NAV_ITEMS = [
  { label: 'OVERVIEW', href: '#specification' },
  { label: 'CAPABILITIES', href: '#capabilities' },
  { label: 'SHOWCASES', href: '#showcases' },
  { label: 'DUAL ENGINE', href: '#dual-engine' },
  { label: 'BENCHMARKS', href: '#benchmarks' },
  { label: 'FAQ', href: '#faq' },
]

export function CroxHeader({ user, onStartDemo, onOpenDashboard, onOpenAuth }: Props) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('OVERVIEW')

  useEffect(() => {
    const handleScroll = () => {
      // Light scroll detection if needed
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 60,
        height: 60,
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'stretch',
        background: '#E3E7EB',
        borderBottom: '2px solid #0E1012',
        fontFamily: "'Space Grotesk', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        fontSize: 12,
        userSelect: 'none',
      }}
    >
      {/* ─── Brand & Logo Cell ─── */}
      <a
        href="#specification"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '0 22px',
          borderRight: '2px solid #0E1012',
          textDecoration: 'none',
          color: '#0E1012',
          flexShrink: 0,
          background: '#E3E7EB',
          transition: 'background 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#D8DDE3'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#E3E7EB'
        }}
      >
        <img
          src="/logo.png"
          alt="RAGraph Logo"
          style={{
            width: 26,
            height: 26,
            objectFit: 'contain',
          }}
        />
        <span
          style={{
            fontFamily: "'Space Grotesk', 'Inter', sans-serif",
            fontSize: 17,
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: '#0E1012',
          }}
        >
          RAGRAPH
        </span>
      </a>

      {/* Spacer pushing nav items to the right, matching Crox's generous central negative space */}
      <div style={{ flex: 1 }} />

      {/* ─── Desktop Nav Cells (Crox signature right-aligned boxed segments) ─── */}
      <nav
        className="crox-desktop-nav"
        style={{
          margin: 0,
          padding: 0,
        }}
      >
        {NAV_ITEMS.map((item) => {
          const isActive = activeSection === item.label
          return (
            <a
              key={item.label}
              href={item.href}
              onClick={() => setActiveSection(item.label)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '0 20px',
                height: '100%',
                borderLeft: '2px solid #0E1012',
                textDecoration: 'none',
                color: '#0E1012',
                fontWeight: isActive ? 800 : 700,
                fontSize: 11.5,
                letterSpacing: '0.06em',
                whiteSpace: 'nowrap',
                background: isActive ? '#D8DDE3' : 'transparent',
                transition: 'background 0.15s ease, color 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = '#D8DDE3'
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = 'transparent'
              }}
            >
              {item.label}
            </a>
          )
        })}
      </nav>

      {/* ─── Notebooks Workspace Cell ─── */}
      <button
        onClick={onOpenDashboard}
        className="crox-md-flex"
        style={{
          alignItems: 'center',
          gap: 6,
          padding: '0 18px',
          height: '100%',
          borderLeft: '2px solid #0E1012',
          background: '#E3E7EB',
          color: '#0E1012',
          fontWeight: 700,
          fontSize: 11.5,
          letterSpacing: '0.05em',
          cursor: 'pointer',
          borderTop: 'none',
          borderRight: 'none',
          borderBottom: 'none',
          transition: 'background 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#D8DDE3'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#E3E7EB'
        }}
      >
        <LayoutDashboard size={13} />
        <span>NOTEBOOKS</span>
      </button>

      {/* ─── Sign In / User Cell ─── */}
      {user ? (
        <div
          className="crox-sm-flex"
          style={{
            alignItems: 'center',
            padding: '0 18px',
            borderLeft: '2px solid #0E1012',
            fontSize: 11,
            color: '#0E1012',
            fontWeight: 700,
            fontFamily: "var(--font-mono, monospace)",
          }}
        >
          {user.email.split('@')[0]}
        </div>
      ) : (
        <button
          onClick={onOpenAuth}
          className="crox-sm-flex"
          style={{
            alignItems: 'center',
            padding: '0 18px',
            height: '100%',
            borderLeft: '2px solid #0E1012',
            background: '#E3E7EB',
            color: '#0E1012',
            fontWeight: 700,
            fontSize: 11.5,
            letterSpacing: '0.05em',
            cursor: 'pointer',
            borderTop: 'none',
            borderRight: 'none',
            borderBottom: 'none',
            transition: 'background 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#D8DDE3'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#E3E7EB'
          }}
        >
          SIGN IN
        </button>
      )}

      {/* ─── Crox Signature Far-Right Orange Boxed CTA Cell ─── */}
      <button
        onClick={onStartDemo}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '0 26px',
          height: '100%',
          borderLeft: '2px solid #0E1012',
          background: '#FF5F14',
          color: '#0E1012',
          fontWeight: 800,
          fontSize: 12,
          letterSpacing: '0.06em',
          cursor: 'pointer',
          borderTop: 'none',
          borderRight: 'none',
          borderBottom: 'none',
          transition: 'background 0.15s ease',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#FF4500'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#FF5F14'
        }}
      >
        <span>GET IN TOUCH →</span>
      </button>

      {/* Mobile Menu Hamburger (Visible ONLY on small screens) */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="crox-mobile-burger"
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          width: 50,
          height: '100%',
          borderLeft: '2px solid #0E1012',
          background: '#E3E7EB',
          color: '#0E1012',
          cursor: 'pointer',
          borderTop: 'none',
          borderRight: 'none',
          borderBottom: 'none',
        }}
        aria-label="Toggle Navigation Menu"
      >
        {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          style={{
            position: 'absolute',
            top: 60,
            left: 0,
            right: 0,
            background: '#E3E7EB',
            borderBottom: '2px solid #0E1012',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 100,
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.15)',
          }}
        >
          {NAV_ITEMS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={() => {
                setActiveSection(item.label)
                setMobileMenuOpen(false)
              }}
              style={{
                padding: '14px 24px',
                borderBottom: '1px solid rgba(14, 16, 18, 0.15)',
                color: '#0E1012',
                fontWeight: 700,
                fontSize: 13,
                textDecoration: 'none',
                letterSpacing: '0.04em',
              }}
            >
              {item.label}
            </a>
          ))}
          <div
            style={{
              padding: '14px 24px',
              display: 'flex',
              gap: 12,
              background: '#D8DDE3',
            }}
          >
            <button
              onClick={() => {
                onOpenDashboard()
                setMobileMenuOpen(false)
              }}
              style={{
                flex: 1,
                padding: '10px 14px',
                background: '#FFFFFF',
                border: '2px solid #0E1012',
                fontWeight: 700,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              NOTEBOOKS
            </button>
            <button
              onClick={() => {
                onStartDemo()
                setMobileMenuOpen(false)
              }}
              style={{
                flex: 1,
                padding: '10px 14px',
                background: '#FF5F14',
                color: '#0E1012',
                border: '2px solid #0E1012',
                fontWeight: 800,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              LAUNCH DEMO →
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
