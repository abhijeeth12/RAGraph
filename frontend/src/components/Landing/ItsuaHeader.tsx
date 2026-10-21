'use client'
import { useState, useEffect } from 'react'
import { Sparkles, ArrowRight, Layers, LayoutDashboard, Terminal } from 'lucide-react'
import type { AuthUser } from '@/lib/types'

interface Props {
  user: AuthUser | null
  onStartDemo: () => void
  onOpenDashboard: () => void
  onOpenAuth: () => void
}

const NAV_ITEMS = [
  { label: 'OVERVIEW', href: '#specification', index: '00' },
  { label: 'CAPABILITIES', href: '#capabilities', index: '01' },
  { label: 'SHOWCASES', href: '#showcases', index: '02' },
  { label: 'DUAL ENGINE', href: '#dual-engine', index: '03' },
  { label: 'REVIEWS', href: '#reviews', index: '04' },
  { label: 'BENCHMARKS', href: '#benchmarks', index: '05' },
  { label: 'FAQ', href: '#faq', index: '06' },
]

export function ItsuaHeader({ user, onStartDemo, onOpenDashboard, onOpenAuth }: Props) {
  const [activeSection, setActiveSection] = useState('00')
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        height: 64,
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'stretch',
        background: scrolled ? 'rgba(255, 255, 255, 0.98)' : 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '2px solid #0E1012',
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
        transition: 'background 0.2s ease',
      }}
    >
      {/* Brand & Mark */}
      <a
        href="#specification"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '0 24px',
          borderRight: '1.5px solid #0E1012',
          textDecoration: 'none',
          color: 'var(--text-primary)',
          flexShrink: 0,
        }}
      >
        <img
          src="/logo.png"
          alt="RA-Graph Logo"
          style={{
            width: 28,
            height: 28,
            objectFit: 'contain',
          }}
        />
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 16,
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: '#0E1012',
          }}
        >
          RA-GRAPH
        </span>
        <span
          style={{
            fontSize: 10,
            color: '#0E1012',
            border: '1px solid #0E1012',
            padding: '1px 6px',
            borderRadius: 3,
            background: 'var(--bg-secondary)',
            fontWeight: 600,
          }}
        >
          v2.4
        </span>
      </a>

      {/* Center Nav - Crox + ITSUA bold bracketed cell nav */}
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          flex: 1,
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}
      >
        {NAV_ITEMS.map((item) => {
          const isActive = activeSection === item.index
          return (
            <a
              key={item.index}
              href={item.href}
              onClick={() => setActiveSection(item.index)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '0 20px',
                height: '100%',
                borderRight: '1.5px solid #0E1012',
                textDecoration: 'none',
                color: isActive ? '#0E1012' : 'var(--text-secondary)',
                fontWeight: isActive ? 700 : 500,
                fontSize: 11.5,
                letterSpacing: '0.04em',
                whiteSpace: 'nowrap',
                background: isActive ? '#F5F5F3' : 'transparent',
                transition: 'color 0.15s ease, background 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = '#0E1012'
                  e.currentTarget.style.background = 'rgba(14, 16, 18, 0.04)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = 'var(--text-secondary)'
                  e.currentTarget.style.background = 'transparent'
                }
              }}
            >
              <span style={{ color: '#8E92A2', fontWeight: 500 }}>
                [ {item.index} ]
              </span>
              <span>{item.label}</span>
            </a>
          )
        })}
      </nav>

      {/* Right Action / Telemetry Area */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          gap: 14,
          flexShrink: 0,
        }}
      >
        {/* Status Indicator (ITSUA ● ACCEPTING NEW WORK style) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            fontSize: 11,
            color: '#047857',
            fontWeight: 700,
            letterSpacing: '0.04em',
            paddingRight: 6,
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: '#047857',
              boxShadow: '0 0 8px rgba(4, 120, 87, 0.5)',
              display: 'inline-block',
            }}
          />
          <span className="hidden xl:inline">CLUSTER READY</span>
        </div>

        {/* Crox Orange Launch Demo Button */}
        <button
          onClick={onStartDemo}
          className="btn-crox-orange"
          style={{
            padding: '9px 16px',
            fontSize: 11.5,
            border: '1.5px solid #0E1012',
            boxShadow: '2px 2px 0px #0E1012',
            cursor: 'pointer',
          }}
          title="Start instant live sandbox session"
        >
          <span>DEMO SANDBOX</span>
          <ArrowRight size={13} />
        </button>

        {/* Dashboard / Workspace Link */}
        <button
          onClick={onOpenDashboard}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            borderRadius: 4,
            border: '1.5px solid #0E1012',
            background: '#FFFFFF',
            color: '#0E1012',
            fontSize: 11.5,
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
          <LayoutDashboard size={13} />
          <span className="hidden md:inline">NOTEBOOKS</span>
        </button>

        {user ? (
          <div
            style={{
              fontSize: 11,
              color: 'var(--text-secondary)',
              borderLeft: '1.5px solid #0E1012',
              paddingLeft: 12,
              fontFamily: 'var(--font-mono)',
            }}
          >
            {user.email.split('@')[0]}
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            style={{
              fontSize: 11.5,
              color: '#0E1012',
              cursor: 'pointer',
              fontWeight: 600,
              padding: '6px 4px',
              fontFamily: 'var(--font-mono)',
            }}
          >
            SIGN IN
          </button>
        )}
      </div>
    </header>
  )
}

