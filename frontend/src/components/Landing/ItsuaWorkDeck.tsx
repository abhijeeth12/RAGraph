'use client'
import { useState, useRef, useEffect } from 'react'
import { ArrowRight } from 'lucide-react'

interface ShowcaseCard {
  id: string
  title: string
  category: string
  badge: string
  domain: string
  brand: string
  year: string
  tintClass: string
  accentColor: string
  tilt: number
  shift: string
  zIndex: number
  thumbs: string[]
  stack: string
  result: string
  backHeadline: string
  backDesc: string
  chips: string[]
  specs: { key: string; value: string }[]
}

const SHOWCASES: ShowcaseCard[] = [
  {
    id: 'nb-textbooks',
    title: 'Textbooks & Course Notes',
    category: 'STEM & QUANTITATIVE STUDY',
    badge: 'INTERACTIVE NOTEBOOK',
    domain: 'TEXTBOOKS // EQUATIONS & TABLES',
    brand: 'STUDYSPACE.AI',
    year: '2026',
    tintClass: 'bg-green-soft',
    accentColor: '#047857',
    tilt: -3.4,
    shift: '-5%',
    zIndex: 1,
    thumbs: [
      '/images/crawler_1.CThLoWq3_JhUyX.webp',
      '/images/crawler_2.CeHyD6jx_Z1RgSO2.webp',
      '/images/crawler_3.Cx56Frte_Z3EIRH.webp',
    ],
    stack: 'TABLE PRESERVATION · EQUATION FORMATTING · INSTANT SEARCH',
    result: 'Equations & tables stay formatted · Direct chapter jump',
    backHeadline: 'Never Lose Formulas or Table Rows While Studying',
    backDesc: 'Standard AI tools scramble multi-column layouts and drop crucial formulas. Study Space preserves complete textbook chapters, mathematical notation, and footnote derivations with 100% fidelity.',
    chips: ['TEXTBOOK CHAPTERS', 'FORMULAS & PROOFS', 'TABLE RETENTION', 'SOURCE CITATIONS'],
    specs: [
      { key: 'Formatting', value: 'Preserves tables, graphs & equations' },
      { key: 'Navigation', value: 'Instant chapter and section jump' },
      { key: 'Confidence', value: '100% verified source citations' },
    ],
  },
  {
    id: 'nb-research-papers',
    title: 'Research Papers & Literature Reviews',
    category: 'ACADEMIC SYNTHESIS',
    badge: 'MULTI-PAPER WORKSPACE',
    domain: 'PAPERS // CROSS-DOCUMENT SYNTHESIS',
    brand: 'STUDYSPACE.AI',
    year: '2026',
    tintClass: 'bg-yellow-soft',
    accentColor: '#D97706',
    tilt: 2.6,
    shift: '4%',
    zIndex: 2,
    thumbs: [
      '/images/retail-network-1.Cfu3F-rr_ZFIJrP.webp',
      '/images/retail-network-2.sQbU00BK_xe2Tx.webp',
      '/images/retail-network-3.QcXN7yJ0_Z1bYTEX.webp',
    ],
    stack: 'CROSS-PAPER SYNTHESIS · CONFLICT DISCOVERY · AUTHOR CITATIONS',
    result: 'Synthesize dozens of papers · Highlights conflicting findings',
    backHeadline: 'Connect Findings Across Multiple Studies in Seconds',
    backDesc: 'Reading dozens of dense academic papers is overwhelming. Study Space synthesizes overlapping methodologies, points out contradictory conclusions between studies, and writes grounded literature reviews.',
    chips: ['LITERATURE REVIEW', 'CROSS-STUDY VIEW', 'CONTRADICTION FINDER', 'DIRECT QUOTES'],
    specs: [
      { key: 'Synthesis', value: 'Connects findings across 10+ papers' },
      { key: 'Contradictions', value: 'Flags conflicting experimental results' },
      { key: 'Referencing', value: 'Direct paragraph and author quotes' },
    ],
  },
  {
    id: 'nb-exam-thesis',
    title: 'Exam Preparation & Thesis Defense',
    category: 'VERIFIED LEARNING',
    badge: 'VERIFIED STUDY',
    domain: 'ACCURACY // ZERO HALLUCINATIONS',
    brand: 'STUDYSPACE.AI',
    year: '2026',
    tintClass: 'bg-blue-soft',
    accentColor: '#2563EB',
    tilt: -1.8,
    shift: '-2.5%',
    zIndex: 3,
    thumbs: [
      '/images/epin_1.BaJG3-gX_Z1eEXrT.webp',
      '/images/epin_2.BgPV8oq-_Z1eELBH.webp',
      '/images/epin_3.7CiBCH0A_ZqXCuJ.webp',
    ],
    stack: 'PROOF OF SOURCE · SIDE-BY-SIDE VERIFICATION · ZERO GUESSWORK',
    result: '100% grounded in your notes · Side-by-side evidence drawer',
    backHeadline: 'Bulletproof Study Answers with Zero Made-Up Facts',
    backDesc: 'Studying for high-stakes exams requires complete trust. Every summary, answer, and explanation links directly to the exact page, sentence, and paragraph in your uploaded course materials.',
    chips: ['EXAM REVISION', 'THESIS WRITING', 'VERIFIED CITATIONS', 'ZERO GUESSING'],
    specs: [
      { key: 'Verification', value: 'Click any claim to see the source sentence' },
      { key: 'Proof Drawer', value: 'Side-by-side document comparison' },
      { key: 'Reliability', value: 'Zero hallucinated answers or fake facts' },
    ],
  },
  {
    id: 'nb-concept-maps',
    title: 'Visual Concept Maps & Knowledge Graphs',
    category: 'DEEP UNDERSTANDING',
    badge: 'INTERACTIVE GRAPH',
    domain: 'KNOWLEDGE // CONCEPT TOPOLOGY',
    brand: 'STUDYSPACE.AI',
    year: '2026',
    tintClass: 'bg-purple-soft',
    accentColor: '#7C3AED',
    tilt: 3.2,
    shift: '6%',
    zIndex: 4,
    thumbs: [
      '/images/blaze_0_1._gBXDL7S_Z1dTjAG.webp',
      '/images/blaze_0_2.BEWASqVd_ZJyzeo.webp',
      '/images/blaze_0_3.BD9gLgZ5_Z2juEDu.webp',
    ],
    stack: 'MIND MAPPING · TOPIC CLUSTERING · INTERACTIVE EXPLORATION',
    result: 'Visual connection graph · Click any topic to see notes',
    backHeadline: 'See the Big Picture Across All Your Course Materials',
    backDesc: 'Break free of linear scrolling. Study Space automatically creates an interactive mind map that links foundational concepts to advanced theories across every lecture, note, and PDF in your workspace.',
    chips: ['INTERACTIVE MIND MAP', 'TOPIC CLUSTERING', 'CONCEPT TRACING', 'KNOWLEDGE GRAPH'],
    specs: [
      { key: 'Visualization', value: 'Interactive force-directed topic map' },
      { key: 'Discovery', value: 'Reveals hidden thematic connections' },
      { key: 'Exploration', value: 'Click nodes to inspect supporting excerpts' },
    ],
  },
  {
    id: 'nb-case-studies',
    title: 'Case Studies, Reports & Policy Briefs',
    category: 'PROFESSIONAL RESEARCH',
    badge: 'DOCUMENT TRACER',
    domain: 'ANALYSIS // COMPLEX AGREEMENTS & BRIEFS',
    brand: 'STUDYSPACE.AI',
    year: '2026',
    tintClass: 'bg-pink-soft',
    accentColor: '#E11D48',
    tilt: -2.4,
    shift: '-4%',
    zIndex: 5,
    thumbs: [
      '/images/auditrium_1.B2U4GpiW_Z2dMfbQ.webp',
      '/images/auditrium_2.BtDIraas_ZmXbwn.webp',
      '/images/auditrium_3.B0j4Dmum_pwrGG.webp',
    ],
    stack: 'CROSS-REFERENCE LOOKUP · CLAUSE TRACING · SUMMARY DIGESTS',
    result: 'Pinpoint clauses in seconds · Trace references across appendices',
    backHeadline: 'Navigate 100+ Page Reports and Briefs with Confidence',
    backDesc: 'Whether analyzing business case studies, legal agreements, or policy documents, quickly trace cross-references, compare definitions, and extract crucial figures without getting lost in appendices.',
    chips: ['CASE STUDIES', 'POLICY BRIEFS', 'CROSS-REFERENCES', 'RAPID EXTRACT'],
    specs: [
      { key: 'Cross-Reference', value: 'Instant linking across document sections' },
      { key: 'Clause Search', value: 'Pinpoint definitions and conditions' },
      { key: 'Digest Mode', value: 'Executive summaries with supporting quotes' },
    ],
  },
]

interface Props {
  onSelectNotebook: (id: string) => void
  onOpenDashboard: () => void
}

export function ItsuaWorkDeck({ onSelectNotebook, onOpenDashboard }: Props) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const [flippedCards, setFlippedCards] = useState<{ [key: number]: boolean }>({})
  const [isInView, setIsInView] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)
  const cardInnerRefs = useRef<{ [key: number]: HTMLDivElement | null }>({})
  const wobbleAnimRefs = useRef<{ [key: number]: number | null }>({})

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

  // Authentic Itsua Harmonic Wobble: theta(t) = 15 * sin(pi*t) * sin(2*pi*t) over 900ms
  const triggerHarmonicWobble = (idx: number) => {
    const el = cardInnerRefs.current[idx]
    if (!el) return

    const startTime = performance.now()
    const duration = 900 // ms
    const wobbleEquation = (t: number) =>
      t <= 0 || t >= 1 ? 0 : 15 * Math.sin(Math.PI * t) * Math.sin(2 * Math.PI * t)

    const prevAnim = wobbleAnimRefs.current[idx]
    if (prevAnim) cancelAnimationFrame(prevAnim)

    const step = (now: number) => {
      const elapsed = (now - startTime) / duration
      if (el) {
        const angle = wobbleEquation(elapsed)
        el.style.setProperty('--ry', `${angle.toFixed(2)}deg`)
      }

      if (elapsed < 1) {
        wobbleAnimRefs.current[idx] = requestAnimationFrame(step)
      } else {
        if (el) el.style.setProperty('--ry', '0deg')
      }
    }

    wobbleAnimRefs.current[idx] = requestAnimationFrame(step)
  }

  const handlePointerEnter = (idx: number) => {
    setHoveredIdx(idx)
    triggerHarmonicWobble(idx)
  }

  const handlePointerLeave = (idx: number) => {
    setHoveredIdx(null)
    const el = cardInnerRefs.current[idx]
    if (el) el.style.setProperty('--ry', '0deg')
    const prevAnim = wobbleAnimRefs.current[idx]
    if (prevAnim) cancelAnimationFrame(prevAnim)
  }

  const toggleFlip = (idx: number, e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.deck-cta')) return

    setFlippedCards((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }))
  }

  return (
    <section
      ref={sectionRef}
      id="work"
      className="featured-section isolate border-t border-line bg-paper px-6 pt-10 pb-20 md:px-14 md:pt-14 md:pb-28"
      style={{
        backgroundColor: '#F5F5F3',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        {/* ─── Header: Clean Typography & Refined Actions ─── */}
        <div className="mb-8 flex items-end justify-between max-[359px]:flex-col max-[359px]:items-start max-[359px]:gap-4 border-b border-line pb-6">
          <div>
            <div className="font-mono text-[11px] text-sub tracking-wider uppercase mb-2 flex items-center gap-2">
              <span className="font-bold text-[#0E1012]">§ 02 — WORKSPACES IN ACTION</span>
              <span>/</span>
              <span>STUDY WORKFLOWS & USE CASES</span>
            </div>
            <div className="flex items-baseline gap-4 flex-wrap">
              <h2 className="m-0 text-[44px] leading-none font-medium tracking-[-0.03em] md:text-[68px] text-[#0E1012] font-display">
                /work
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenDashboard}
            className="font-mono text-[12px] font-bold text-[#0E1012] bg-white border border-line rounded-[2px] px-4 py-2 hover:bg-[#EAEAE7] transition-colors inline-flex items-center gap-2 cursor-pointer"
          >
            <span>OPEN ALL NOTEBOOKS</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {/* ─── Authentic Fanned 3D Deck Stage ─── */}
        <div className="featured-deck" id="featured-deck">
          {SHOWCASES.map((item, idx) => {
            const isHovered = hoveredIdx === idx
            const isFlipped = !!flippedCards[idx]
            const isRaised = isHovered || isFlipped

            return (
              <div
                key={item.id}
                tabIndex={0}
                role="button"
                aria-label={`Showcase card for ${item.title}. Press Enter or Space to view detailed specifications.`}
                className={`deck-card ${isRaised ? 'is-raised' : ''}`}
                style={
                  {
                    '--i': idx,
                    '--tilt': isInView ? `${item.tilt}deg` : '0deg',
                    '--shift': isInView ? item.shift : '0%',
                    '--z': isHovered ? 60 : item.zIndex,
                    opacity: isInView ? 1 : 0,
                    transition: 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.6s ease',
                    transitionDelay: `${idx * 80}ms`,
                  } as React.CSSProperties
                }
                onPointerEnter={() => handlePointerEnter(idx)}
                onPointerLeave={() => handlePointerLeave(idx)}
                onClick={(e) => toggleFlip(idx, e)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    toggleFlip(idx, e as any)
                  }
                }}
              >
                <div
                  ref={(el) => {
                    cardInnerRefs.current[idx] = el
                  }}
                  className="deck-inner"
                  style={
                    {
                      '--rx': isFlipped ? '180deg' : '0deg',
                    } as React.CSSProperties
                  }
                >
                  {/* ─── FRONT FACE ─── */}
                  <div className={`deck-face deck-front ${item.tintClass}`}>
                    {/* Top Row: Brand & Status */}
                    <div className="deck-row">
                      <div className="deck-mark">
                        <span className="deck-brand" style={{ color: item.accentColor }}>
                          {item.brand}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-sub">{item.year}</span>
                    </div>

                    {/* Thumbs: Authentic 3 Image Mockups */}
                    <div className="deck-thumbs">
                      {item.thumbs.map((thumbSrc, tIdx) => (
                        <div key={tIdx} className="deck-thumb">
                          <img
                            src={thumbSrc}
                            alt={`${item.title} Preview ${tIdx + 1}`}
                            loading="lazy"
                            decoding="async"
                            width="440"
                            height="254"
                          />
                        </div>
                      ))}
                    </div>

                    {/* Mid: Title & Domain */}
                    <div className="deck-mid">
                      <h3 className="deck-name">{item.title}</h3>
                      <div className="deck-domain" style={{ color: item.accentColor }}>
                        {item.domain}
                      </div>
                    </div>

                    {/* Foot: Capability & Result */}
                    <div className="deck-foot">
                      <div className="deck-stack">{item.stack}</div>
                      <div className="deck-row">
                        <span className="deck-result" style={{ color: item.accentColor }}>
                          {item.result}
                        </span>
                        <span className="font-mono text-[9px] text-sub uppercase">VIEW DETAILS ↻</span>
                      </div>
                    </div>
                  </div>

                  {/* ─── BACK FACE: Detailed Workflow Information ─── */}
                  <div className="deck-face deck-back">
                    {/* Top Row: Brand & Back Index */}
                    <div className="deck-row">
                      <span className="deck-brand" style={{ color: item.accentColor }}>
                        § 00{idx + 1} STUDY WORKFLOW
                      </span>
                      <span className="font-mono text-[10px] text-sub">{item.year}</span>
                    </div>

                    {/* Mid: Back Headline & Description */}
                    <div className="deck-mid">
                      <h3 className="deck-name" style={{ color: item.accentColor }}>
                        {item.backHeadline}
                      </h3>
                      <p className="deck-desc">{item.backDesc}</p>
                    </div>

                    {/* Chips */}
                    <div className="deck-chips">
                      {item.chips.map((chip, cIdx) => (
                        <span key={cIdx} className="deck-chip">
                          {chip}
                        </span>
                      ))}
                    </div>

                    {/* Specs Table */}
                    <div className="deck-specs">
                      {item.specs.map((spec, sIdx) => (
                        <div key={sIdx} className="deck-spec">
                          <span className="deck-key">{spec.key}</span>
                          <span>{spec.value}</span>
                        </div>
                      ))}
                    </div>

                    {/* Foot & CTA Button */}
                    <div className="deck-foot" style={{ marginTop: '0.8cqw', paddingTop: '0.8cqw' }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onSelectNotebook(item.id)
                        }}
                        className="deck-cta"
                        style={{ color: item.accentColor }}
                      >
                        EXPLORE THIS WORKSPACE →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
