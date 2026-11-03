import { useState, useEffect, useRef } from 'react'

interface MetricItem {
  index: string
  label: string
  value: string
  description: string
  accentBadge?: string
  bg: string
  text: string
  badgeBg: string
}

const METRICS: MetricItem[] = [
  {
    index: '01',
    label: 'CITATION ACCURACY',
    value: '99.2%',
    description: 'Exact page, paragraph & sentence quotes',
    accentBadge: 'VERIFIED',
    bg: '#E6F7F1',
    text: '#047857',
    badgeBg: '#D1ECE2',
  },
  {
    index: '02',
    label: 'SEARCH SPEED',
    value: '38 ms',
    description: 'Instant dual semantic & keyword retrieval',
    accentBadge: 'SUB-50MS',
    bg: '#EEF1FF',
    text: '#2F4CFF',
    badgeBg: '#D9E0FF',
  },
  {
    index: '03',
    label: 'DISCOVERY RECALL',
    value: '98.4%',
    description: 'Connected concepts across documents',
    accentBadge: 'CROSS-DOC',
    bg: '#FCFDEC',
    text: '#854D0E',
    badgeBg: '#F1F3D2',
  },
  {
    index: '04',
    label: 'KNOWLEDGE VOLUME',
    value: '50M +',
    description: 'Words indexed per research notebook',
    accentBadge: 'SCALE',
    bg: '#FFF2E5',
    text: '#B45309',
    badgeBg: '#FFE0C7',
  },
  {
    index: '05',
    label: 'STREAMING SYNTHESIS',
    value: '< 1.2s',
    description: 'Full answers with interactive proofs',
    accentBadge: 'SSE STREAM',
    bg: '#FBEEFC',
    text: '#A21CAF',
    badgeBg: '#F6D3F8',
  },
]

export function ItsuaMetricsStrip() {
  const [isInView, setIsInView] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={sectionRef}
      id="metrics"
      className="w-full bg-white border-t border-b border-line box-border"
    >
      <div className="max-w-[1440px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-line">
        {METRICS.map((m, idx) => (
          <div
            key={m.index}
            style={{
              backgroundColor: m.bg,
              transition:
                'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
              transitionDelay: `${idx * 65}ms`,
              opacity: isInView ? 1 : 0,
              transform: isInView ? 'translateY(0)' : 'translateY(14px)',
            }}
            className="p-6 md:p-8 flex flex-col justify-between hover:brightness-[0.97] transition-all group cursor-default"
          >
            <div className="flex items-center justify-between mb-3">
              <span
                className="font-mono text-[10.5px] font-bold tracking-wider uppercase transition-opacity"
                style={{ color: m.text }}
              >
                [{m.index}] {m.label}
              </span>
              {m.accentBadge && (
                <span
                  className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-[2px]"
                  style={{ backgroundColor: m.badgeBg, color: m.text }}
                >
                  {m.accentBadge}
                </span>
              )}
            </div>

            <div className="my-2">
              <span
                className="font-display text-[44px] lg:text-[52px] font-bold tracking-tight leading-none group-hover:scale-[1.02] inline-block transition-transform duration-200"
                style={{ color: m.text }}
              >
                {m.value}
              </span>
            </div>

            <div
              className="font-mono text-[11px] mt-2 leading-relaxed opacity-85"
              style={{ color: m.text }}
            >
              {m.description}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
