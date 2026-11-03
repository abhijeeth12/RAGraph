import { useState, useEffect, useRef } from 'react'
import { ArrowRight, LayoutDashboard } from 'lucide-react'
import type { AuthUser } from '@/lib/types'

interface Props {
  user: AuthUser | null
  onStartDemo: () => void
  onOpenDashboard: () => void
  onOpenAuth: () => void
}

interface NavItem {
  label: string
  href: string
  id: string
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Features', href: '#start', id: 'start' },
  { label: 'Use Cases', href: '#work', id: 'work' },
  { label: 'Reviews', href: '#reviews', id: 'reviews' },
  { label: 'Get Started', href: '#closer', id: 'closer' },
]

export function ItsuaHeader({ user, onStartDemo, onOpenDashboard, onOpenAuth }: Props) {
  const [activeId, setActiveId] = useState<string>('')
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)

      const scrollPos = window.scrollY + 140
      for (let i = NAV_ITEMS.length - 1; i >= 0; i--) {
        const sec = document.querySelector(NAV_ITEMS[i].href) as HTMLElement | null
        if (sec && sec.offsetTop <= scrollPos) {
          setActiveId(NAV_ITEMS[i].id)
          return
        }
      }
      if (window.scrollY < 200) {
        setActiveId('')
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault()
    const target = document.querySelector(href)
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <header
      className={`sticky top-0 z-50 h-[58px] sm:h-[62px] w-full bg-white/95 backdrop-blur-md transition-all duration-200 ${scrolled ? 'border-b border-[#E5E7EB] shadow-[0_1px_4px_rgba(0,0,0,0.03)]' : 'border-b border-[#ECECEE]'
        }`}
    >
      <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-10">
        {/* ─── Clean Study Space Brand Mark ─── */}
        <a
          href="#specification"
          onClick={(e) => handleNavClick(e, '#specification')}
          className="group flex items-center gap-2 sm:gap-2.5 text-decoration-none select-none shrink-0"
        >
          <img
            src="/logo.png"
            alt="Study Space Logo"
            className="h-6 w-6 sm:h-7 sm:w-7 object-contain transition-transform duration-200 group-hover:scale-105"
          />
          <span className="font-display text-[15.5px] sm:text-[17px] font-bold tracking-tight text-[#0E1012] whitespace-nowrap">
            Study Space
          </span>
        </a>

        {/* ─── Modern Sleek Pill Navigation Links (Desktop / Large Screens) ─── */}
        <nav className="hidden lg:flex items-center gap-1 rounded-full bg-[#F5F5F3] p-1 border border-[#E8E8E6]">
          {NAV_ITEMS.map((item) => {
            const isActive = activeId === item.id
            return (
              <a
                key={item.id}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href)}
                className={`rounded-full px-3 py-1.5 text-[12px] xl:text-[12.5px] font-medium transition-all duration-150 text-decoration-none select-none ${isActive
                    ? 'bg-white text-[#0E1012] font-semibold shadow-xs'
                    : 'text-[#60636A] hover:text-[#0E1012] hover:bg-white/60'
                  }`}
              >
                {item.label}
              </a>
            )
          })}
        </nav>

        {/* ─── Refined CTA Buttons & Auth ─── */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Open Workspaces CTA */}
          <button
            type="button"
            onClick={onOpenDashboard}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-[#D9DADD] bg-white px-3.5 py-1.5 sm:px-4 sm:py-2 text-[12px] sm:text-[12.5px] font-semibold text-[#0E1012] shadow-xs transition-colors hover:border-[#0E1012] hover:bg-[#F9F9F8] cursor-pointer whitespace-nowrap"
          >
            <LayoutDashboard size={13} className="text-[#60636A]" />
            <span>Open Workspaces</span>
          </button>

          {/* Try Interactive Demo CTA */}
          <button
            type="button"
            onClick={onStartDemo}
            className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-[#0E1012] px-3.5 py-1.5 sm:px-4 sm:py-2 text-[12px] sm:text-[12.5px] font-semibold text-white shadow-xs transition-colors hover:bg-[#2F4CFF] cursor-pointer whitespace-nowrap"
          >
            <span className="hidden sm:inline">Try Interactive Demo</span>
            <span className="sm:hidden">Try Demo</span>
            <ArrowRight size={12} />
          </button>

          {/* User Profile or Sign In */}
          {user ? (
            <span className="hidden xl:inline-block rounded-full bg-[#F5F5F3] px-3 py-1 font-mono text-[11px] text-[#60636A] border border-[#E8E8E6]">
              {user.email.split('@')[0]}
            </span>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="text-[12px] sm:text-[12.5px] font-semibold text-[#60636A] hover:text-[#0E1012] px-1.5 sm:px-2 py-1 transition-colors cursor-pointer whitespace-nowrap"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
