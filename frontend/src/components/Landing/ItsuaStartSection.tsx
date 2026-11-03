'use client'
import { useState, useEffect, useRef } from 'react'
import { ArrowRight, Sparkles } from 'lucide-react'

interface DecisionRow {
  index: string
  problem: string
  solutionPill: string
  pillBg: string
  pillText: string
  solutionSub: string
  outcome: string
  actionHref?: string
}

const DECISION_ROWS: DecisionRow[] = [
  {
    index: '01',
    problem: 'Dense textbooks & PDFs with complex multi-column tables, equations & footnotes',
    solutionPill: 'Hierarchical Document Parser',
    pillBg: '#E6F7F1',
    pillText: '#047857',
    solutionSub: 'Preserves document outline & layout',
    outcome: 'Sections parsed with tree structure intact. Zero broken tables, formulas, or lost citations.',
    actionHref: '#work',
  },
  {
    index: '02',
    problem: 'Academic papers & research notes where exact terms and concepts both matter',
    solutionPill: 'Dual Semantic & Keyword Search',
    pillBg: '#EEF1FF',
    pillText: '#2F4CFF',
    solutionSub: 'High-dimensional vectors + BM25 keywords',
    outcome: 'Reciprocal rank fusion searches both deep concepts and exact vocabulary in under 40ms.',
    actionHref: '#work',
  },
  {
    index: '03',
    problem: 'Connecting complex ideas, dependencies and themes across separate study materials',
    solutionPill: 'Interactive Knowledge Graph',
    pillBg: '#FFF2E5',
    pillText: '#B45309',
    solutionSub: 'Dynamic concept & entity clustering',
    outcome: 'Visual mind map connecting disparate concepts, themes, and evidence nodes with interactive exploration.',
    actionHref: '#work',
  },
  {
    index: '04',
    problem: 'Thesis defense, essays, exams or research requiring bulletproof source verification',
    solutionPill: 'Mathematical Citation Proofs',
    pillBg: '#FBEEFC',
    pillText: '#A21CAF',
    solutionSub: 'Side-by-side verification drawer',
    outcome: 'Click any claim to jump directly to the exact source page, paragraph, and highlighted sentence.',
    actionHref: '#reviews',
  },
]

export function ItsuaStartSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const tableRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const table = tableRef.current
    if (!table) return

    const computeEdge = () => {
      const headerThird = table.querySelector('.door-header-col-3')
      if (headerThird) {
        const left = headerThird.getBoundingClientRect().left
        table.style.setProperty('--edge', `${(left / window.innerWidth) * 100}%`)
      }
    }

    const rows = Array.from(table.querySelectorAll('.door-row'))
    const measureCells = () => {
      rows.forEach((r) => {
        const cells = Array.from(r.querySelectorAll('.door-wash'))
        const rects = cells.map((c) => c.getBoundingClientRect()).filter((b) => b.width && b.height)
        if (!rects.length) return
        const minLeft = Math.min(...rects.map((b) => b.left))
        const minTop = Math.min(...rects.map((b) => b.top))
        const totalW = Math.max(...rects.map((b) => b.right)) - minLeft
        const totalH = Math.max(...rects.map((b) => b.bottom)) - minTop
        cells.forEach((c) => {
          const b = c.getBoundingClientRect()
          const htmlEl = c as HTMLElement
          htmlEl.style.setProperty('--cx', `${b.left - minLeft}px`)
          htmlEl.style.setProperty('--cy', `${b.top - minTop}px`)
          htmlEl.style.setProperty('--rw', `${totalW}px`)
          htmlEl.style.setProperty('--rh', `${totalH}px`)
        })
      })
    }

    computeEdge()
    measureCells()

    const handleResize = () => {
      computeEdge()
      measureCells()
    }

    window.addEventListener('resize', handleResize, { passive: true })

    const observer = new IntersectionObserver(
      (entries) => {
        entries
          .filter((e) => e.isIntersecting)
          .forEach((entry, rowIdx) => {
            const rowEl = entry.target as HTMLElement
            computeEdge()
            rowEl.querySelectorAll('.door-wash').forEach((cell, cellIdx) => {
              const htmlCell = cell as HTMLElement
              htmlCell.style.setProperty('--delay', `${rowIdx * 110 + cellIdx * 50}ms`)
              htmlCell.classList.add('is-washing')
            })
            observer.unobserve(entry.target)
          })
      },
      { threshold: 0.2 }
    )

    rows.forEach((r) => observer.observe(r))

    return () => {
      window.removeEventListener('resize', handleResize)
      observer.disconnect()
    }
  }, [])

  return (
    <section
      ref={sectionRef}
      id="start"
      className="border-b border-line bg-white px-6 py-8 md:px-14 md:py-18"
      style={{
        boxSizing: 'border-box',
      }}
    >
      <div style={{ maxWidth: 1440, margin: '0 auto' }}>
        {/* Section Header Bar */}
        <div className="flex items-end justify-between max-[359px]:flex-col max-[359px]:items-start max-[359px]:gap-4 border-b border-line pb-6 mb-8">
          <div>
            <div className="font-mono text-[11px] text-sub tracking-wider uppercase mb-2">
              § 01 — START HERE / ENGAGEMENT DECISION MATRIX
            </div>
            <div className="flex items-baseline gap-4 flex-wrap">
              <h2 className="m-0 text-[44px] leading-none font-medium tracking-[-0.03em] md:text-[68px] text-[#0E1012] font-display">
                /start
              </h2>
              <span className="font-mono text-[12px] text-sub">
                Match your research or document challenge to the exact retrieval pipeline
              </span>
            </div>
          </div>

          <a
            href="#work"
            className="font-mono text-[12px] font-bold text-sub hover:text-[#0E1012] transition-colors inline-flex items-center gap-2 underline"
          >
            <span>EXPLORE STUDY WORKSPACES</span>
            <ArrowRight size={13} />
          </a>
        </div>

        {/* ─── Decision Matrix Table with Authentic Itsua Door-Wash ─── */}
        <div
          ref={tableRef}
          className="door-table border border-line rounded-[2px] bg-white divide-y divide-line overflow-hidden"
        >
          {/* Header Row */}
          <div className="hidden md:grid md:grid-cols-12 bg-[#F5F5F3] font-mono text-[11px] font-bold text-[#0E1012] tracking-wider uppercase border-b border-line">
            <div className="col-span-4 px-6 py-3 border-r border-line">01 · YOUR RESEARCH CHALLENGE</div>
            <div className="col-span-4 px-6 py-3 border-r border-line">02 · RECOMMENDED PIPELINE</div>
            <div className="col-span-4 px-6 py-3 door-header-col-3">03 · VERIFIABLE OUTCOME</div>
          </div>

          {/* Rows with Staggered Scroll Door-Wash */}
          {DECISION_ROWS.map((row, idx) => (
            <div
              key={row.index}
              className="door-row grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-line group"
              style={{ '--wash': row.pillBg, '--row': idx } as React.CSSProperties}
            >
              {/* Column 1: Challenge */}
              <div className="door-wash col-span-1 md:col-span-4 px-6 py-5 flex flex-col justify-center transition-colors">
                <div className="md:hidden font-mono text-[10px] text-sub uppercase mb-1">
                  [0{row.index}] CHALLENGE
                </div>
                <div className="font-display text-[15.5px] font-semibold text-[#0E1012] group-hover:text-[#2F4CFF] transition-colors leading-snug">
                  {row.problem}
                </div>
              </div>

              {/* Column 2: Recommended Pipeline */}
              <div className="door-wash col-span-1 md:col-span-4 px-6 py-5 flex flex-col justify-center transition-colors">
                <div className="md:hidden font-mono text-[10px] text-sub uppercase mb-1">
                  PIPELINE
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="font-mono text-[11px] font-semibold px-2.5 py-0.5 rounded-[2px] inline-flex items-center gap-1.5 transition-transform group-hover:scale-105"
                    style={{ backgroundColor: row.pillBg, color: row.pillText }}
                  >
                    <Sparkles size={11} />
                    {row.solutionPill}
                  </span>
                </div>
                <div className="font-mono text-[11.5px] text-sub">
                  {row.solutionSub}
                </div>
              </div>

              {/* Column 3: Outcome */}
              <div className="door-wash col-span-1 md:col-span-4 px-6 py-5 flex flex-col justify-center transition-colors">
                <div className="md:hidden font-mono text-[10px] text-sub uppercase mb-1">
                  OUTCOME
                </div>
                <p className="text-[13.5px] text-[#4b5563] leading-relaxed m-0 font-normal">
                  {row.outcome}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
