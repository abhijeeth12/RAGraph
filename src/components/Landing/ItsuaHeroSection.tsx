import { useEffect, useRef } from 'react'

interface Props {
  onStartDemo: () => void
  onOpenDashboard: () => void
}

export function ItsuaHeroSection({ onStartDemo, onOpenDashboard }: Props) {
  const heroRef = useRef<HTMLDivElement>(null)
  const linesRef = useRef<(HTMLDivElement | null)[]>([])

  // Authentic Itsua Kinetic Animation: Staggered Scroll Exit Parallax
  // Formula: progress = max(0, min(1, (h - (12 - 1 - idx) * 14) / 150)) * 1200px
  useEffect(() => {
    let animFrame: number | null = null

    const handleScroll = () => {
      if (animFrame !== null) return
      animFrame = requestAnimationFrame(() => {
        animFrame = null
        const hero = heroRef.current
        if (!hero) return
        const rect = hero.getBoundingClientRect()
        const scrollDist = Math.max(0, -rect.top)
        const count = 12
        const stagger = 14
        const travelWindow = 150
        const maxOffset = 1200

        linesRef.current.forEach((line, idx) => {
          if (!line) return
          const progress = Math.max(
            0,
            Math.min(1, (scrollDist - (count - 1 - idx) * stagger) / travelWindow)
          )
          const offset = -progress * maxOffset
          line.style.transform = `translateY(${offset.toFixed(2)}px)`
        })
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll)
    handleScroll()

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
      if (animFrame !== null) cancelAnimationFrame(animFrame)
    }
  }, [])

  return (
    <div
      ref={heroRef}
      id="specification"
      className="relative bg-white border-b border-line overflow-hidden min-h-[calc(100vh-58px)] flex flex-col justify-center"
    >
      {/* ─── 12 Staggered Kinetic Parallax Lines (#hero-lines) ─── */}
      <div
        id="hero-lines"
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 hidden grid-cols-12 md:grid"
      >
        {Array.from({ length: 12 }).map((_, idx) => (
          <div
            key={idx}
            ref={(el) => {
              linesRef.current[idx] = el
            }}
            className={`hero-line border-l border-dashed border-line ${
              idx === 0 ? 'border-l-0' : ''
            }`}
            style={{
              willChange: 'transform',
            }}
          />
        ))}
      </div>

      {/* ─── Section Content ─── */}
      <div className="relative z-10 px-6 py-8 md:px-14 lg:py-12 max-w-[1440px] mx-auto w-full">
        {/* Section Meta Marker */}
        <div className="font-mono text-[12px] uppercase tracking-wider text-sub mb-6 md:mb-8 font-medium">
          § 00 — STUDY WORKSPACE SPECIFICATION
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid gap-8 lg:grid-cols-[3fr_1.1fr] lg:gap-16 items-start">
          {/* Main Display Headline */}
          <h1 className="m-0 text-[40px] leading-[0.98] font-medium tracking-[-0.04em] sm:text-[56px] md:text-[76px] lg:text-[88px] xl:text-[98px] font-display text-[#0E1012]">
            Understand your
            <br />
            documents & notes
            <span className="text-[20px] sm:text-[28px] md:text-[38px] lg:text-[44px] xl:text-[48px] text-sub font-normal tracking-[-0.02em] block mt-2">
              Answers you can actually verify
            </span>
          </h1>

          {/* Abstract Sidebar */}
          <div className="border-l border-line pl-6 lg:ml-2">
            <div className="font-mono text-[11px] uppercase tracking-widest text-sub font-semibold">
              ABSTRACT
            </div>
            <p className="mt-3 text-[14px] leading-[1.65] text-[#0E1012]">
              Study Space turns complex textbooks, research papers, and technical documents into
              interactive, visual knowledge trees. Ask questions in plain English, get instant answers
              backed by direct quotes from your materials, and see how ideas connect across everything
              you read.
            </p>

            {/* Authentic Itsua 2-Tone CTA Buttons with perfectly balanced heights */}
            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                type="button"
                onClick={onStartDemo}
                className="inline-flex items-stretch h-[46px] rounded-[3px] overflow-hidden group border border-[#0E1012] shadow-sm hover:shadow-md transition-all cursor-pointer p-0 bg-[#0E1012]"
              >
                <span className="w-[46px] h-full flex items-center justify-center bg-[#2F4CFF] text-white font-bold text-[15px] group-hover:bg-[#253dcc] transition-colors shrink-0">
                  →
                </span>
                <span className="px-5 h-full flex items-center text-white font-mono text-[12px] font-bold tracking-wider uppercase whitespace-nowrap group-hover:bg-[#1a1e22] transition-colors">
                  TRY INTERACTIVE DEMO
                </span>
              </button>

              <button
                type="button"
                onClick={onOpenDashboard}
                className="inline-flex items-center justify-center h-[46px] px-5 rounded-[3px] border border-line bg-white hover:bg-paper font-mono text-[12px] font-bold text-[#0E1012] transition-colors cursor-pointer shadow-sm whitespace-nowrap"
              >
                OPEN WORKSPACES
              </button>
            </div>

            <div className="mt-4 flex items-center gap-2 font-mono text-[10.5px] text-sub">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
              <span>Zero setup required · Works directly in your browser</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
