'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface ReviewSlide {
  id: string
  title: string
  domain: string
  subtitle: string
  quote: string
  body: string
  author: string
  role: string
  avatar: string
  brand: string
  year: string
  tintClass: string
  accentColor: string
  thumbs: string[]
  stack: string
  result: string
  chips: string[]
  specs: { key: string; value: string }[]
}

const REVIEWS: ReviewSlide[] = [
  {
    id: '01',
    title: 'Financial Reports & Accounting Filings',
    domain: 'FINANCE // 10-K & 10-Q FILINGS',
    subtitle: 'Custom Financial Hierarchy & Footnote Parsing',
    quote: '“Study Space completely changed how our team inspects quarterly filings. Multi-column tables stay intact, and clicking any number highlights the exact footnote in the original disclosure.”',
    body: 'When working through dense annual reports and balance sheets, having tables kept in their true hierarchical structure saves hours of manual reconstruction. Every reported number links directly to its source paragraph with zero hallucinated figures.',
    author: 'Elena Voronova',
    role: 'PRINCIPAL FINANCIAL ANALYST · APEX CAPITAL',
    avatar: '/images/elena-pomazanova.png',
    brand: 'STUDYSPACE.AI',
    year: '2026 (active)',
    tintClass: 'bg-yellow-soft',
    accentColor: '#D97706',
    thumbs: [
      '/images/retail-network-1.Cfu3F-rr_ZFIJrP.webp',
      '/images/retail-network-2.sQbU00BK_xe2Tx.webp',
      '/images/retail-network-3.QcXN7yJ0_Z1bYTEX.webp',
    ],
    stack: 'FINANCIAL HIERARCHY · MULTI-COLUMN TABLES · FOOTNOTE MAPPING',
    result: 'Saved 14 hours per report with zero table distortion',
    chips: ['10-K FILINGS', 'BALANCE SHEETS', 'FOOTNOTE TRACE', 'ZERO HALLUCINATION'],
    specs: [
      { key: 'analyst', value: 'Apex Capital Team' },
      { key: 'domain', value: 'Financial Valuation' },
      { key: 'outcome', value: 'Zero broken tables' },
    ],
  },
  {
    id: '02',
    title: 'Cross-Paper Biomedical Literature Synthesis',
    domain: 'MEDICINE // CLINICAL RESEARCH',
    subtitle: 'Biomedical Literature & Contradiction Discovery',
    quote: '“When synthesizing findings across a dozen medical papers, Study Space reveals conflicting cohort outcomes that traditional search tools completely miss. It connects concepts across papers effortlessly.”',
    body: 'The dynamic knowledge graph highlights cross-study correlations and contradictory claims across medical cohorts. Our research team reduced literature review cycles from two weeks to under two hours.',
    author: 'Dr. Marcus Vance',
    role: 'LEAD RESEARCH SCIENTIST · BIOPHARMA LABS',
    avatar: '/images/andreas-erfurt.png',
    brand: 'STUDYSPACE.AI',
    year: '2026 (active)',
    tintClass: 'bg-green-soft',
    accentColor: '#047857',
    thumbs: [
      '/images/studybooster_1.wAMymBPA_2niezi.webp',
      '/images/studybooster_2.D-CDAdKh_Z1jYrsS.webp',
      '/images/studybooster_3.Noi3S51p_aTiJU.webp',
    ],
    stack: 'CROSS-PAPER SYNTHESIS · CONTRADICTION ENGINE · MEDICAL CITATIONS',
    result: 'Identified 3 contradictory cohort outcomes across 12 trials',
    chips: ['CLINICAL DATA', 'CROSS-PAPER VIEW', 'COHORT METRICS', 'CONTRADICTIONS'],
    specs: [
      { key: 'institution', value: 'BioPharma Research Labs' },
      { key: 'domain', value: 'Clinical Research' },
      { key: 'outcome', value: '12 papers synthesized' },
    ],
  },
  {
    id: '03',
    title: 'Distributed Systems & Whitepaper Verification',
    domain: 'COMPUTER SCIENCE // RAFT PROTOCOL',
    subtitle: 'Systems Architecture & Technical Protocol Audit',
    quote: '“Study Space acts like an interactive tutor for distributed algorithms. We navigated dense Raft protocol whitepapers and verified leader election state transitions with sub-40ms citation lookups.”',
    body: 'Rather than guessing theorem interpretations, our computer science study group verified consensus edge cases directly against formal mathematical proofs. Complex architectural questions are resolved in seconds.',
    author: 'Tommy Matthews',
    role: 'SYSTEMS ARCHITECT · DISTRIBUTED LABS',
    avatar: '/images/tommy-matthews.png',
    brand: 'STUDYSPACE.AI',
    year: '2026 (active)',
    tintClass: 'bg-blue-soft',
    accentColor: '#2563EB',
    thumbs: [
      '/images/epin_1.BaJG3-gX_Z1eEXrT.webp',
      '/images/epin_2.BgPV8oq-_Z1eELBH.webp',
      '/images/epin_3.7CiBCH0A_ZqXCuJ.webp',
    ],
    stack: 'DISTRIBUTED ALGORITHMS · FORMAL THEOREMS · SUB-40MS RETRIEVAL',
    result: 'Verified 42 protocol theorems with formal proofs',
    chips: ['DISTRIBUTED SYSTEMS', 'CONSENSUS', 'ALGORITHMS', 'THEOREM TRACE'],
    specs: [
      { key: 'group', value: 'Distributed Systems Group' },
      { key: 'domain', value: 'Protocol Analysis' },
      { key: 'outcome', value: 'Sub-40ms retrieval' },
    ],
  },
  {
    id: '04',
    title: 'Legal Contracts & Agreement Analysis',
    domain: 'LEGAL // MASTER AGREEMENTS',
    subtitle: 'Legal Contract Review & Clause Grounding',
    quote: '“In legal research, missing an uncapped indemnity clause can be catastrophic. Study Space’s side-by-side document verification drawer gives our corporate team 100% confidence.”',
    body: 'Every liability limitation, indemnification obligation, and cross-referenced clause is mapped with side-by-side original page, paragraph, and line highlighting. Zero hallucinated clauses across hundreds of agreements.',
    author: 'Fran Susino',
    role: 'GENERAL COUNSEL · STRATEX LEGAL',
    avatar: '/images/fran-susino.png',
    brand: 'STUDYSPACE.AI',
    year: '2026 (active)',
    tintClass: 'bg-pink-soft',
    accentColor: '#E11D48',
    thumbs: [
      '/images/auditrium_1.B2U4GpiW_Z2dMfbQ.webp',
      '/images/auditrium_2.BtDIraas_ZmXbwn.webp',
      '/images/auditrium_3.B0j4Dmum_pwrGG.webp',
    ],
    stack: 'CONTRACT SECTION HIERARCHY · LIABILITY AUDIT · SIDE-BY-SIDE PROOF',
    result: '450+ enterprise contracts audited with 100% clause grounding',
    chips: ['LEGAL CONTRACTS', 'INDEMNITY CAPS', 'CROSS-CLAUSE MAP', 'AUDIT TRAILS'],
    specs: [
      { key: 'organization', value: 'Stratex Legal Counsel' },
      { key: 'domain', value: 'Legal Compliance' },
      { key: 'outcome', value: '100% citation fidelity' },
    ],
  },
]

export function ItsuaReviewsSection() {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [direction, setDirection] = useState(1)
  const current = REVIEWS[currentIdx]

  const cardInnerRef = useRef<HTMLDivElement | null>(null)
  const wobbleAnimRef = useRef<number | null>(null)
  const touchStartX = useRef<number | null>(null)

  // Authentic Itsua Harmonic Wobble: theta(t) = 15 * sin(pi*t) * sin(2*pi*t) over 900ms
  const triggerHarmonicWobble = useCallback(() => {
    const el = cardInnerRef.current
    if (!el || flipped) return

    const startTime = performance.now()
    const duration = 900
    const wobbleEquation = (t: number) =>
      t <= 0 || t >= 1 ? 0 : 15 * Math.sin(Math.PI * t) * Math.sin(2 * Math.PI * t)

    if (wobbleAnimRef.current) cancelAnimationFrame(wobbleAnimRef.current)

    const step = (now: number) => {
      const elapsed = (now - startTime) / duration
      if (el && !flipped) {
        const angle = wobbleEquation(elapsed)
        el.style.setProperty('--ry', `${angle.toFixed(2)}deg`)
      }
      if (elapsed < 1) {
        wobbleAnimRef.current = requestAnimationFrame(step)
      } else {
        if (el && !flipped) el.style.setProperty('--ry', '0deg')
      }
    }
    wobbleAnimRef.current = requestAnimationFrame(step)
  }, [flipped])

  const handlePointerLeave = () => {
    if (wobbleAnimRef.current) cancelAnimationFrame(wobbleAnimRef.current)
    if (cardInnerRef.current && !flipped) {
      cardInnerRef.current.style.setProperty('--ry', '0deg')
    }
  }

  const nextSlide = useCallback(() => {
    setDirection(1)
    setFlipped(false)
    setCurrentIdx((prev) => (prev + 1) % REVIEWS.length)
  }, [])

  const prevSlide = useCallback(() => {
    setDirection(-1)
    setFlipped(false)
    setCurrentIdx((prev) => (prev - 1 + REVIEWS.length) % REVIEWS.length)
  }, [])

  // Keyboard navigation: Left/Right arrows change slide
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if active element is inside reviews section or reviews is in viewport
      const reviewsEl = document.getElementById('reviews')
      if (!reviewsEl) return
      const rect = reviewsEl.getBoundingClientRect()
      const inView = rect.top < window.innerHeight && rect.bottom > 0

      if (inView && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        if (e.key === 'ArrowRight') {
          nextSlide()
        } else if (e.key === 'ArrowLeft') {
          prevSlide()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [nextSlide, prevSlide])

  // Touch swipe support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const deltaX = e.changedTouches[0].clientX - touchStartX.current
    if (deltaX > 45) {
      prevSlide()
    } else if (deltaX < -45) {
      nextSlide()
    }
    touchStartX.current = null
  }

  return (
    <section
      id="reviews"
      className="border-t border-line py-8 md:py-18 bg-white"
      style={{
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px' }}>
        {/* ─── Header: Exact ITSUA Typography & Counter Controls ─── */}
        <div className="flex items-end justify-between max-[359px]:flex-col max-[359px]:items-start max-[359px]:gap-4 border-b border-line pb-6 mb-8">
          <div>
            <div className="font-mono text-[11px] text-sub tracking-wider uppercase mb-2 flex items-center gap-2">
              <span className="font-bold text-[#0E1012]">§ 03 — CLIENT REVIEWS</span>
              <span>/</span>
              <span>VERIFIED PRODUCTION OUTCOMES</span>
            </div>
            <div className="flex items-baseline gap-4 flex-wrap">
              <h2 className="m-0 text-[44px] leading-none font-medium tracking-[-0.03em] md:text-[68px] text-[#0E1012] font-display">
                /reviews
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://clutch.co"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[11px] text-sub underline hover:text-[#0E1012] transition-colors hidden sm:inline-block"
            >
              ALL ON CLUTCH ↗
            </a>

            {/* Counter and Buttons */}
            <div className="flex items-center gap-2">
              <span className="font-mono text-[12px] font-bold text-[#0E1012] bg-[#F5F5F3] border border-line rounded-[2px] px-3 py-1.5">
                {String(currentIdx + 1).padStart(2, '0')} / {String(REVIEWS.length).padStart(2, '0')}
              </span>
              <button
                onClick={prevSlide}
                className="w-9 h-9 flex items-center justify-center border border-line rounded-[2px] bg-white text-[#0E1012] hover:bg-[#0E1012] hover:text-white cursor-pointer transition-colors"
                title="Previous Review (or Left Arrow)"
                aria-label="Previous Review"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={nextSlide}
                className="w-9 h-9 flex items-center justify-center border border-line rounded-[2px] bg-white text-[#0E1012] hover:bg-[#0E1012] hover:text-white cursor-pointer transition-colors"
                title="Next Review (or Right Arrow)"
                aria-label="Next Review"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* ─── Animated Review Slide Track (Noticeably Slower 850ms, Smooth & Comfortable) ─── */}
        <div
          className="review-slide w-full pb-8 md:pb-12 overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="flex w-full transition-transform duration-[850ms] ease-[cubic-bezier(0.25,1,0.35,1)]"
            style={{
              transform: `translateX(-${currentIdx * 100}%)`,
            }}
          >
            {REVIEWS.map((rev, rIdx) => {
              const isCurrent = rIdx === currentIdx
              const isFlipped = isCurrent ? flipped : false

              return (
                <div
                  key={rev.id}
                  className="w-full shrink-0 flex-none opacity-100"
                  aria-hidden={!isCurrent}
                >
                  <div className="grid gap-8 lg:grid-cols-[400px_1fr] xl:grid-cols-[460px_1fr] lg:gap-14 items-center w-full min-w-0">
                    {/* Left Column: Authentic 3D .deck-card.review-deck */}
                    <div
                      className="review-deck min-w-0 w-full"
                      tabIndex={0}
                      role="button"
                      aria-label={`Customer review card for ${rev.title}. Press Enter or Space to view details.`}
                      onPointerEnter={isCurrent ? triggerHarmonicWobble : undefined}
                      onPointerLeave={isCurrent ? handlePointerLeave : undefined}
                      onClick={() => {
                        if (isCurrent) {
                          setFlipped((prev) => !prev)
                        }
                      }}
                      onKeyDown={(e) => {
                        if ((e.key === 'Enter' || e.key === ' ') && isCurrent) {
                          e.preventDefault()
                          setFlipped((prev) => !prev)
                        }
                      }}
                    >
                      <div
                        ref={isCurrent ? cardInnerRef : undefined}
                        className="deck-inner"
                        style={
                          {
                            '--rx': isFlipped ? '180deg' : '0deg',
                          } as React.CSSProperties
                        }
                      >
                        {/* Front Face */}
                        <div className={`deck-face deck-front rounded-[4px] border border-line shadow-sm ${rev.tintClass}`}>
                          <div className="flex items-center justify-between font-mono text-[12px] tracking-wider mb-2">
                            <span className="font-bold text-[12.5px]" style={{ color: rev.accentColor }}>
                              {rev.brand}
                            </span>
                            <span className="text-sub text-[11px]">{rev.year}</span>
                          </div>

                          {/* 3 Real Screenshots */}
                          <div className="flex gap-2.5 my-3 h-[84px]">
                            {rev.thumbs.map((thumbSrc, tIdx) => (
                              <div key={tIdx} className="flex-1 overflow-hidden border border-line rounded-[2px] bg-white">
                                <img
                                  src={thumbSrc}
                                  alt={`${rev.title} Thumb ${tIdx + 1}`}
                                  loading="eager"
                                  decoding="async"
                                  className="w-full h-full object-cover object-top"
                                />
                              </div>
                            ))}
                          </div>

                          <div className="my-2">
                            <h3 className="text-[20px] md:text-[22px] font-bold text-[#0E1012] font-display leading-tight m-0">
                              {rev.title}
                            </h3>
                            <div className="font-mono text-[11.5px] font-semibold mt-1 tracking-wider" style={{ color: rev.accentColor }}>
                              {rev.domain}
                            </div>
                          </div>

                          <div className="border-t border-line pt-2.5 mt-2 flex flex-col gap-1">
                            <div className="font-mono text-[11px] text-sub truncate">{rev.stack}</div>
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-[12px] font-bold" style={{ color: rev.accentColor }}>
                                {rev.result}
                              </span>
                              <span className="font-mono text-[10px] text-sub uppercase">VIEW DETAILS ↻</span>
                            </div>
                          </div>
                        </div>

                        {/* Back Face */}
                        <div className="deck-face deck-back rounded-[4px] border border-line shadow-sm bg-white">
                          <div className="flex items-center justify-between font-mono text-[12px] mb-2">
                            <span className="font-bold" style={{ color: rev.accentColor }}>
                              § 00{rIdx + 1} SPECIFICATION
                            </span>
                            <span className="text-sub text-[11px]">{rev.year}</span>
                          </div>

                          <div className="my-2">
                            <h3 className="text-[19px] font-bold font-display leading-tight m-0" style={{ color: rev.accentColor }}>
                              {rev.title}
                            </h3>
                            <p className="text-[13px] text-sub leading-normal mt-1.5 mb-2">{rev.body}</p>
                          </div>

                          <div className="flex flex-wrap gap-1.5 my-2">
                            {rev.chips.map((chip, cIdx) => (
                              <span key={cIdx} className="border border-line rounded-[2px] px-2 py-0.5 font-mono text-[10px] text-sub bg-white">
                                {chip}
                              </span>
                            ))}
                          </div>

                          <div className="space-y-1 my-2">
                            {rev.specs.map((spec, sIdx) => (
                              <div key={sIdx} className="font-mono text-[11px] text-sub flex gap-2">
                                <span className="font-bold text-[#0E1012]">{spec.key}:</span>
                                <span>{spec.value}</span>
                              </div>
                            ))}
                          </div>

                          <div className="border-t border-line pt-2 mt-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setFlipped(false)
                              }}
                              className="w-full font-mono text-[11px] font-bold text-center py-1.5 border border-current rounded-[2px] cursor-pointer hover:bg-[#0E1012] hover:text-white transition-colors"
                              style={{ color: rev.accentColor }}
                            >
                              BACK TO SUMMARY ↶
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Exact ITSUA Quotation, Copy & Endorsement */}
                    <div className="flex flex-col justify-center">
                      <div className="font-mono text-[12px] md:text-[13px] font-bold text-sub tracking-wider uppercase mb-3">
                        {rev.subtitle}
                      </div>

                      <blockquote className="m-0 text-[22px] leading-[1.3] font-medium tracking-[-0.01em] md:text-[28px] lg:text-[32px] text-[#0E1012] font-display">
                        {rev.quote}
                      </blockquote>

                      <div className="mt-5 text-[15px] leading-[1.6] md:text-[16px] text-[#4b5563]">
                        {rev.body}
                      </div>

                      {/* Client Endorsement Strip */}
                      <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-line pt-6">
                        <img
                          src={rev.avatar}
                          alt={rev.author}
                          loading="eager"
                          className="h-12 w-12 rounded-full object-cover border border-line"
                        />
                        <div>
                          <div className="text-[16px] font-medium text-[#0E1012] font-display">
                            {rev.author}
                          </div>
                          <div className="font-mono text-[11px] text-[#047857] font-semibold tracking-wider">
                            {rev.role}
                          </div>
                        </div>

                        {/* Clutch 5-star Signature High-Contrast Badge */}
                        <a
                          href="https://clutch.co"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-decoration-none shadow-sm group hover:border-[#2F4CFF] transition-all duration-200 rounded-[2px] overflow-hidden ml-auto max-sm:w-full max-sm:mt-3"
                          style={{
                            border: '1px solid rgba(14, 16, 18, 0.2)',
                            fontFamily: 'var(--font-mono)',
                            fontSize: 12,
                          }}
                        >
                          <span className="bg-[#2F4CFF] text-white font-bold px-3 py-2 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
                            ★ 5.0
                          </span>
                          <span className="bg-[#0E1012] text-white font-medium px-4 py-2 border-l border-white/20 flex items-center gap-2 whitespace-nowrap group-hover:bg-[#1a1e22] transition-colors">
                            <span>VERIFIED CITATION AUDIT</span>
                            <span className="text-[#34D399] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">↗</span>
                          </span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
