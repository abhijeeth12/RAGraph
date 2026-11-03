import { useState, useEffect, useRef } from 'react'

interface StackCategory {
  index: string
  title: string
  description: string
  technologies: {
    name: string
    role: string
    status: 'ACTIVE' | 'EMBEDDED' | 'PRODUCTION'
  }[]
}

const STACK_CATEGORIES: StackCategory[] = [
  {
    index: '01',
    title: 'FRONTEND PLATFORM & INTERACTION',
    description: 'High-performance reactive user interface with sub-16ms layout frame rates.',
    technologies: [
      { name: 'TypeScript 5.8', role: 'Strict typed contract validation', status: 'PRODUCTION' },
      { name: 'React 19', role: 'Concurrent rendering & transitions', status: 'PRODUCTION' },
      { name: 'Next.js 16 (App Router)', role: 'Production edge SSR & streaming', status: 'PRODUCTION' },
      { name: 'Vite 6', role: 'Sub-millisecond HMR local dev SPA', status: 'ACTIVE' },
      { name: 'Tailwind CSS v4', role: 'CSS tokens & fluid responsive grid', status: 'PRODUCTION' },
      { name: 'Framer Motion & GSAP', role: '60fps kinetic spring physics', status: 'PRODUCTION' },
    ],
  },
  {
    index: '02',
    title: 'RETRIEVAL & VECTOR ENGINES',
    description: 'Dual-path retrieval fusing high-dimensional embeddings with exact token indices.',
    technologies: [
      { name: 'Tree-RAG AST Parser', role: 'Hierarchical outline & table engine', status: 'EMBEDDED' },
      { name: 'ChromaDB Vector Store', role: 'Sub-40ms vector similarity lookup', status: 'PRODUCTION' },
      { name: 'BM25 Okapi Algorithm', role: 'Exact lexical keyword verification', status: 'PRODUCTION' },
      { name: 'Reciprocal Rank Fusion', role: 'Dual-path score normalizer', status: 'EMBEDDED' },
      { name: 'Cross-Encoder Reranker', role: 'Multi-hop contextual relevance', status: 'ACTIVE' },
      { name: 'PyMuPDF Document Parser', role: 'PDF bounding box & coordinate map', status: 'PRODUCTION' },
    ],
  },
  {
    index: '03',
    title: 'BACKEND SERVICES & GRAPH LOGIC',
    description: 'Asynchronous Python architecture with memory-efficient streaming endpoints.',
    technologies: [
      { name: 'Python 3.12', role: 'Asynchronous event loop runtime', status: 'PRODUCTION' },
      { name: 'FastAPI Framework', role: 'Low-latency ASGI REST & SSE endpoints', status: 'PRODUCTION' },
      { name: 'Uvicorn Worker Cluster', role: 'High-concurrency ASGI server', status: 'PRODUCTION' },
      { name: 'NetworkX Graph Engine', role: 'Force-directed knowledge graph topology', status: 'EMBEDDED' },
      { name: 'Async SQLAlchemy & SQLite', role: 'Local session persistence & threads', status: 'PRODUCTION' },
      { name: 'Pydantic v2', role: 'Zero-overhead JSON schema validation', status: 'PRODUCTION' },
    ],
  },
  {
    index: '04',
    title: 'LLM MODELS & CLOUD INFRASTRUCTURE',
    description: 'Multi-provider model agnostic integration with zero-data-retention enclaves.',
    technologies: [
      { name: 'Gemini 2.5 Flash / Pro', role: 'High-throughput reasoning & context', status: 'ACTIVE' },
      { name: 'Claude 3.5 Sonnet', role: 'Complex code & analytical synthesis', status: 'ACTIVE' },
      { name: 'OpenAI GPT-4o', role: 'Multi-modal document inspection', status: 'ACTIVE' },
      { name: 'Vercel Edge Network', role: 'Worldwide static & SSR distribution', status: 'PRODUCTION' },
      { name: 'Render Global Compute', role: 'Automated Docker container deployment', status: 'PRODUCTION' },
      { name: 'Study Space Runtime Engine', role: 'Continuous citation verification', status: 'PRODUCTION' },
    ],
  },
]

export function ItsuaStackSection() {
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
      { threshold: 0.1 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={sectionRef}
      id="stack"
      className="border-t border-line bg-white px-6 py-8 md:px-14 md:py-18"
      style={{
        boxSizing: 'border-box',
      }}
    >
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        {/* Section Header */}
        <div className="flex items-end justify-between max-[359px]:flex-col max-[359px]:items-start max-[359px]:gap-4 border-b border-line pb-6 mb-8">
          <div>
            <div className="font-mono text-[11px] text-sub tracking-wider uppercase mb-2">
              § 05 — RUNTIME & ARCHITECTURE / HIGH-PERFORMANCE STUDY PLATFORM
            </div>
            <div className="flex items-baseline gap-4 flex-wrap">
              <h2 className="m-0 text-[44px] leading-none font-medium tracking-[-0.03em] md:text-[68px] text-[#0E1012] font-display">
                /stack
              </h2>
              <span className="font-mono text-[12px] text-sub">
                Reliable, high-performance architecture built for instant research & verification
              </span>
            </div>
          </div>

          <div className="font-mono text-[11px] font-semibold text-[#047857] bg-[#E6F7F1] border border-[#34D399] px-3 py-1.5 rounded-[2px] inline-flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#34D399] inline-block shadow-[0_0_6px_#34D399]" />
            <span>ALL RUNTIME SUBSYSTEMS NOMINAL</span>
          </div>
        </div>

        {/* ─── 4-Category Technical Matrix Grid ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {STACK_CATEGORIES.map((category, cIdx) => (
            <div
              key={category.index}
              className="border border-line rounded-[2px] p-6 md:p-8 bg-[#F5F5F3] hover:bg-[#F0F0EE] transition-colors"
            >
              <div className="border-b border-line pb-4 mb-5">
                <div className="font-mono text-[11px] font-bold text-sub tracking-wider mb-1">
                  [{category.index}] {category.title}
                </div>
                <p className="text-[13px] text-sub m-0">
                  {category.description}
                </p>
              </div>

              {/* Technologies List with Blinking LEDs */}
              <div className="space-y-2.5">
                {category.technologies.map((tech, tIdx) => {
                  const delayMs = cIdx * 120 + tIdx * 70

                  return (
                    <div
                      key={tech.name}
                      className="flex items-center justify-between p-2 rounded-[2px] bg-white border border-line hover:border-[#2F4CFF]/40 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`stack-dot ${isInView ? 'is-blinking' : ''}`}
                          style={
                            {
                              '--blink-delay': `${delayMs}ms`,
                            } as React.CSSProperties
                          }
                        />
                        <span className="font-display text-[14.5px] font-semibold text-[#0E1012]">
                          {tech.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[11px] text-sub hidden sm:inline-block">
                          {tech.role}
                        </span>
                        <span
                          className={`font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-[2px] border ${tech.status === 'PRODUCTION'
                              ? 'border-[#047857]/30 text-[#047857] bg-[#E6F7F1]'
                              : tech.status === 'ACTIVE'
                                ? 'border-[#2F4CFF]/30 text-[#2F4CFF] bg-[#EEF1FF]'
                                : 'border-line text-sub bg-[#F5F5F3]'
                            }`}
                        >
                          {tech.status}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
