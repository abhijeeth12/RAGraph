'use client'
import { useState, useEffect } from 'react'
import { ArrowRight, LayoutDashboard, Menu, X, Sparkles, LogOut } from 'lucide-react'
import type { AuthUser } from '@/lib/types'
import { useSearchStore } from '@/store/useSearchStore'

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
  { label: 'BENCHMARKS', href: '#benchmarks' },
  { label: 'DUAL ENGINE', href: '#dual-engine' },
  { label: 'FAQ', href: '#faq' },
]

export function CroxHeader({ user, onStartDemo, onOpenDashboard, onOpenAuth }: Props) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('OVERVIEW')
  const [isSignInHovered, setIsSignInHovered] = useState(false)

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
        borderBottom: '1px solid #0E1012',
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
          borderRight: 'none',
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

      {/* ─── Desktop Nav Cells (Shifted right with balanced spacing & borders) ─── */}
      <nav
        className="crox-desktop-nav"
        style={{
          margin: 0,
          padding: 0,
          display: 'flex',
          alignItems: 'stretch',
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
                padding: '0 clamp(14px, 1.3vw, 22px)',
                height: '100%',
                borderLeft: '1px solid #0E1012',
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
          padding: '0 clamp(14px, 1.2vw, 20px)',
          height: '100%',
          borderLeft: '1px solid #0E1012',
          background: '#E3E7EB',
          color: '#0E1012',
          fontWeight: 700,
          fontSize: 11.5,
          letterSpacing: '0.05em',
          cursor: 'pointer',
          borderTop: 'none',
          borderRight: 'none',
          borderBottom: 'none',
          boxShadow: 'none',
          transform: 'none',
          transition: 'background 0.15s ease',
          whiteSpace: 'nowrap',
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

      {/* ─── Far-Right Cell: Restyled SIGN IN Button (Orange Crox Studio Style) or User Cell ─── */}
      {user ? (
        <div
          className="crox-sm-flex"
          style={{
            alignItems: 'center',
            padding: '0 clamp(16px, 1.8vw, 24px)',
            height: '100%',
            borderLeft: '1px solid #0E1012',
            background: '#E3E7EB',
            fontSize: 11.5,
            color: '#0E1012',
            fontWeight: 700,
            fontFamily: "var(--font-mono, monospace)",
            whiteSpace: 'nowrap',
            gap: 8,
          }}
        >
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#047857' }} />
          <span>{user.email.split('@')[0]}</span>
          <button
            onClick={() => useSearchStore.getState().logout()}
            title="Sign out"
            style={{
              background: 'none',
              border: 'none',
              color: '#60636A',
              cursor: 'pointer',
              padding: '2px 4px',
              display: 'inline-flex',
              alignItems: 'center',
              marginLeft: 4,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#EF4444')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#60636A')}
          >
            <LogOut size={13} />
          </button>
        </div>
      ) : (
        <button
          onClick={onOpenAuth}
          className={`crox-orange-btn ${isSignInHovered ? 'is-hovered' : ''}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '0 clamp(20px, 2.2vw, 30px)',
            height: '100%',
            borderLeft: '1px solid #0E1012',
            background: isSignInHovered ? '#FFFFFF' : '#FF5F14',
            color: '#0E1012',
            fontWeight: 800,
            fontSize: 12,
            letterSpacing: '0.06em',
            cursor: 'pointer',
            borderTop: 'none',
            borderRight: 'none',
            borderBottom: 'none',
            boxShadow: 'none',
            transform: 'none',
            transition: 'background 0.15s ease, color 0.15s ease',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
          onMouseEnter={() => setIsSignInHovered(true)}
          onMouseLeave={() => setIsSignInHovered(false)}
        >
          <span>SIGN IN →</span>
        </button>
      )}

      {/* Mobile Menu Hamburger (Visible ONLY on small screens) */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="crox-mobile-burger"
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          width: 50,
          height: '100%',
          borderLeft: '1px solid #0E1012',
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
            borderBottom: '1px solid #0E1012',
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
                color: '#0E1012',
                border: 'none',
                borderRadius: 4,
                boxShadow: 'none',
                transform: 'none',
                fontWeight: 700,
                fontSize: 12,
                cursor: 'pointer',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#F0F0EE'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#FFFFFF'
              }}
            >
              NOTEBOOKS
            </button>
            {user ? (
              <div
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  background: '#D8DDE3',
                  border: '1px solid #0E1012',
                  borderRadius: 4,
                  fontWeight: 700,
                  fontSize: 12,
                  textAlign: 'center',
                  fontFamily: "var(--font-mono, monospace)",
                }}
              >
                {user.email.split('@')[0]}
              </div>
            ) : (
              <button
                onClick={() => {
                  onOpenAuth()
                  setMobileMenuOpen(false)
                }}
                className="crox-orange-btn"
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  background: '#FF5F14',
                  color: '#0E1012',
                  border: 'none',
                  borderRadius: 4,
                  fontWeight: 800,
                  fontSize: 12,
                  cursor: 'pointer',
                  boxShadow: 'none',
                  transform: 'none',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#FFFFFF'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#FF5F14'
                }}
              >
                SIGN IN →
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
