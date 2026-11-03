'use client'
import { useState, useEffect, useRef } from 'react'
import {
  GitBranch,
  Zap,
  Network,
  ShieldCheck,
  Cpu,
  Lock,
  ArrowRight,
} from 'lucide-react'

interface ServiceDoor {
  index: string
  title: string
  subtitle: string
  details: string[]
  badge: string
  badgeBg: string
  badgeColor: string
  icon: React.ReactNode
  linkText: string
  href: string
}

const DOORS: ServiceDoor[] = [
  {
    index: '01',
    title: 'Keep Document Structure Intact',
    subtitle: 'Preserves complete outline structure, section levels, and multi-column tables intact.',
    details: [
      'Never loses complex multi-column tables or balance sheets',
      'Keeps footnotes linked directly to their source numbers',
      'Maintains chapter hierarchies, section levels, and figures',
    ],
    badge: 'TABLES & CHAPTERS',
    badgeBg: '#e6f7f1',
    badgeColor: '#047857',
    icon: <GitBranch size={16} />,
    linkText: 'SEE HOW IT WORKS →',
    href: '#specification',
  },
  {
    index: '02',
    title: 'Search by Meaning & Exact Words',
    subtitle: 'Finds what you need whether you describe it in plain English or use specific technical terms.',
    details: [
      'Understands conversational questions and natural phrasing',
      'Matches precise numbers, codes, and specific terms',
      'Delivers verified search results in under 40 milliseconds',
    ],
    badge: 'INSTANT SEARCH',
    badgeBg: '#eef1ff',
    badgeColor: '#2f4cff',
    icon: <Zap size={16} />,
    linkText: 'TEST SEARCH SPEED →',
    href: '#metrics',
  },
  {
    index: '03',
    title: 'Interactive Concept Maps',
    subtitle: 'Automatically discovers and maps conceptual connections across all your files.',
    details: [
      'Visualizes themes and connections across separate chapters',
      'Interactive visual mind map you can drag and explore',
      'Click any concept node to jump directly to supporting text',
    ],
    badge: 'VISUAL MIND MAPS',
    badgeBg: '#fff2e5',
    badgeColor: '#b45309',
    icon: <Network size={16} />,
    linkText: 'EXPLORE CONCEPT MAPS →',
    href: '#work',
  },
  {
    index: '04',
    title: 'Direct Sentence Citation Proofs',
    subtitle: 'Every answer links directly to the original document so you can verify facts in seconds.',
    details: [
      'Side-by-side drawer highlighting the exact sentence and page',
      'Eliminates AI guessing and hallucinated claims completely',
      'Inspect surrounding context with a single click',
    ],
    badge: '100% GROUNDED',
    badgeBg: '#fbeefc',
    badgeColor: '#a21caf',
    icon: <ShieldCheck size={16} />,
    linkText: 'VIEW CITATION PROOFS →',
    href: '#reviews',
  },
  {
    index: '05',
    title: 'Real-Time Streaming Answers',
    subtitle: 'See the model’s step-by-step thinking in real-time as it finds and synthesizes evidence.',
    details: [
      'Watch reasoning steps unfold before the final answer',
      'Citation links update live as answers stream to your screen',
      'Sub-second response delivery with zero waiting',
    ],
    badge: 'TRANSPARENT THINKING',
    badgeBg: '#fcfdec',
    badgeColor: '#a16207',
    icon: <Cpu size={16} />,
    linkText: 'TRY INTERACTIVE DEMO →',
    href: '#closer',
  },
  {
    index: '06',
    title: 'Private & Secure Workspaces',
    subtitle: 'Your research files and notes are private and never used to train external AI models.',
    details: [
      'Strict zero-data-retention policy for all your documents',
      'Encrypted local storage for confidential study notes and PDFs',
      'Option to run on your own private cloud or local machine',
    ],
    badge: 'PRIVATE & SECURE',
    badgeBg: '#fdecec',
    badgeColor: '#ee4234',
    icon: <Lock size={16} />,
    linkText: 'EXPLORE PRIVACY & SECURITY →',
    href: '#stack',
  },
]

export function ItsuaServicesMatrix() {
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
      id="services"
      className="border-t border-line bg-paper px-6 py-8 md:px-14 md:py-18"
      style={{
        backgroundColor: '#F5F5F3',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        {/* Section Header */}
        <div className="flex items-end justify-between max-[359px]:flex-col max-[359px]:items-start max-[359px]:gap-4 border-b border-line pb-6 mb-8">
          <div>
            <div className="font-mono text-[11px] text-sub tracking-wider uppercase mb-2">
              § 04 — SYSTEM ARCHITECTURE / CAPABILITIES & RETRIEVAL MODULES
            </div>
            <div className="flex items-baseline gap-4 flex-wrap">
              <h2 className="m-0 text-[44px] leading-none font-medium tracking-[-0.03em] md:text-[68px] text-[#0E1012] font-display">
                /services
              </h2>
              <span className="font-mono text-[12px] text-sub">
                Engineered for strict accuracy, zero hallucinations, and high-throughput research
              </span>
            </div>
          </div>

          <a
            href="#stack"
            className="font-mono text-[12px] font-bold text-sub hover:text-[#0E1012] transition-colors inline-flex items-center gap-2 underline"
          >
            <span>VIEW RUNTIME STACK</span>
            <ArrowRight size={13} />
          </a>
        </div>

        {/* Editorial Callout */}
        <div className="max-w-[780px] mb-8">
          <p className="font-display text-[18px] md:text-[22px] font-medium text-[#0E1012] leading-relaxed m-0">
            “Unlike typical RAG setups that fragment text into arbitrary 500-token chunks and lose all document hierarchy, Study Space treats documents as trees. Outline structure, headers, tables, and citations remain bound together forever.”
          </p>
        </div>

        {/* ─── Door Table 2x3 Grid with Itsua Washing Wipe Stagger ─── */}
        <div className="border border-line rounded-[2px] bg-white grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-y divide-line lg:divide-y-0">
          {DOORS.map((door, idx) => (
            <div
              key={door.index}
              style={{
                transition: 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                transitionDelay: `${idx * 90}ms`,
                opacity: isInView ? 1 : 0,
                transform: isInView ? 'translateY(0)' : 'translateY(20px)',
              }}
              className={`group p-7 md:p-9 flex flex-col justify-between hover:bg-[#FAF9F6] transition-colors border-line ${
                idx % 3 !== 2 ? 'lg:border-r' : ''
              } ${idx < 3 ? 'lg:border-b' : ''}`}
            >
              <div>
                {/* Header: Icon & Badge */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-[#F5F5F3] border border-line rounded-[2px] text-[#0E1012] group-hover:scale-110 group-hover:bg-[#EEF1FF] group-hover:text-[#2F4CFF] transition-all duration-200">
                      {door.icon}
                    </div>
                    <span className="font-mono text-[11px] font-bold text-sub">
                      [{door.index}]
                    </span>
                  </div>

                  <span
                    className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-[2px]"
                    style={{ backgroundColor: door.badgeBg, color: door.badgeColor }}
                  >
                    {door.badge}
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-display text-[19px] font-bold text-[#0E1012] group-hover:text-[#2F4CFF] transition-colors mb-2 leading-tight">
                  {door.title}
                </h3>

                {/* Subtitle */}
                <p className="text-[14px] text-sub leading-normal mb-5">
                  {door.subtitle}
                </p>

                {/* Details List */}
                <ul className="list-none p-0 m-0 space-y-2 mb-6">
                  {door.details.map((detail, dIdx) => (
                    <li
                      key={dIdx}
                      className="font-mono text-[11.5px] text-sub flex items-start gap-2"
                    >
                      <span className="text-[#2F4CFF] font-bold">•</span>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Link with Slide Arrow */}
              <a
                href={door.href}
                className="font-mono text-[11px] font-bold text-[#0E1012] group-hover:text-[#2F4CFF] transition-colors pt-4 border-t border-line inline-flex items-center gap-2 text-decoration-none"
              >
                <span>{door.linkText}</span>
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
