'use client'
import { useState } from 'react'
import { ArrowUpRight, ChevronLeft, ChevronRight, Star, CheckCircle2 } from 'lucide-react'

interface ReviewItem {
  id: string
  company: string
  domain: string
  sector: string
  quote: string
  body: string
  author: string
  role: string
  avatar: string
  cardTitle: string
  cardMeta: string
  cardTags: string[]
  cardTint: string
  stats: string
}

const REVIEWS: ReviewItem[] = [
  {
    id: '01',
    company: 'Apex Capital Quantitative Research',
    domain: 'APEXCAPITAL.IO',
    sector: 'FINANCIAL AUDITING & COMPLIANCE',
    quote: '“RA-Graph eliminated citation hallucinations across our 300-page regulatory filings. What used to take days of manual checking now takes seconds.”',
    body: 'Our quantitative analysts cross-reference multi-table earnings variances across five years of SEC filings. RA-Graph preserved complex footnote hierarchies and delivered citations with 100% confidence.',
    author: 'Dr. Elena Vance',
    role: 'HEAD OF QUANTITATIVE RESEARCH',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=160&q=80',
    cardTitle: 'SEC 10-K Earnings Ledger',
    cardMeta: '2024 AUDIT PIPELINE',
    cardTags: ['FINANCE', '10-K', 'MULTI-TABLE', 'AST-PRESERVED'],
    cardTint: '#FFF8F0',
    stats: '50+ filings · 100% citation accuracy',
  },
  {
    id: '02',
    company: 'Helix Therapeutics BioPharma',
    domain: 'HELIXBIO.ORG',
    sector: 'BIOMEDICAL & DRUG DISCOVERY',
    quote: '“Traditional vector search missed vital dosage contraindications buried in nested appendices. RA-Graph’s tree search found every single one.”',
    body: 'During FDA phase III submissions, missing a cross-document contradiction can delay approval by months. The hierarchical knowledge mind map gave our regulatory team absolute clarity.',
    author: 'Marcus Chen, PhD',
    role: 'VP CLINICAL DATA SCIENCE',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
    cardTitle: 'FDA Phase III Trial Synthesis',
    cardMeta: 'BIOMEDICAL CORPUS',
    cardTags: ['PHARMA', 'FDA-APPROVAL', 'CLINICAL-TRIALS'],
    cardTint: '#EEF9F5',
    stats: '12 concurrent trials · 0 hallucinations',
  },
  {
    id: '03',
    company: 'Distributed Systems Labs',
    domain: 'DSL-SYSTEMS.AI',
    sector: 'DISTRIBUTED CONSENSUS VERIFICATION',
    quote: '“The beam search retrieval latency is under 40ms, even across complex technical proofs and distributed consensus state machines.”',
    body: 'Our engineers rely on RA-Graph to trace Raft and Paxos theorem derivations across academic literature. The citation map is the most precise retrieval tool we have ever tested.',
    author: 'Siddharth Nair',
    role: 'PRINCIPAL DISTRIBUTED ARCHITECT',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80',
    cardTitle: 'Raft Formal Invariant Ledger',
    cardMeta: 'PEER-REVIEWED CORPUS',
    cardTags: ['CONSENSUS', 'RAFT', 'FORMAL-SPEC', 'C++20'],
    cardTint: '#F0F3FF',
    stats: '38ms beam latency · 98.4% recall',
  },
]

export function ItsuaReviewsSection() {
  const [currentIdx, setCurrentIdx] = useState(0)
  const review = REVIEWS[currentIdx]

  const nextReview = () => {
    setCurrentIdx((prev) => (prev + 1) % REVIEWS.length)
  }

  const prevReview = () => {
    setCurrentIdx((prev) => (prev - 1 + REVIEWS.length) % REVIEWS.length)
  }

  return (
    <section
      id="reviews"
      style={{
        position: 'relative',
        background: '#FFFFFF',
        padding: 'clamp(50px, 8vh, 90px) 24px',
        borderBottom: '2px solid #0E1012',
      }}
    >
      <div style={{ maxWidth: 1380, margin: '0 auto' }}>
        {/* Section Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            marginBottom: 'clamp(36px, 5vh, 56px)',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: 'var(--text-muted)',
                letterSpacing: '0.08em',
                marginBottom: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span style={{ fontWeight: 700, color: '#0E1012' }}>§ 04 — VERIFIED RESEARCH REVIEWS</span>
              <span>/</span>
              <span>ENTERPRISE CASE STUDIES</span>
            </div>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(38px, 5vw, 68px)',
                fontWeight: 700,
                letterSpacing: '-0.04em',
                color: '#0E1012',
                margin: 0,
                lineHeight: 1,
              }}
            >
              /reviews
            </h2>
          </div>

          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11.5,
              fontWeight: 700,
              color: '#0E1012',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>VERIFIED CROX-EVAL MATRIX</span>
            <ArrowUpRight size={14} color="#FF5500" />
          </div>
        </div>

        {/* ─── Review Layout (Exact ITSUA /reviews Reproduction) ─── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.8fr)',
            gap: 'clamp(28px, 4vw, 56px)',
            alignItems: 'center',
            border: '2px solid #0E1012',
            padding: 'clamp(24px, 4vw, 48px)',
            boxShadow: '4px 4px 0px #0E1012',
            background: '#FFFFFF',
          }}
          className="review-split-grid"
        >
          {/* Left Column: Realistic Interactive Document Preview Card */}
          <div
            style={{
              background: review.cardTint,
              border: '2px solid #0E1012',
              borderRadius: 8,
              padding: '24px 20px',
              boxShadow: '3px 3px 0px #0E1012',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: 320,
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#0E1012',
                  marginBottom: 16,
                  borderBottom: '1px solid rgba(14, 16, 18, 0.1)',
                  paddingBottom: 8,
                }}
              >
                <span>{review.domain}</span>
                <span>{review.cardMeta}</span>
              </div>

              {/* Simulated Document Preview Panes */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 6,
                  marginBottom: 16,
                }}
              >
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid rgba(14, 16, 18, 0.12)',
                      borderRadius: 4,
                      padding: 6,
                      height: 54,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-around',
                    }}
                  >
                    <div style={{ height: 3, background: 'rgba(14, 16, 18, 0.1)', width: '80%', borderRadius: 1 }} />
                    <div style={{ height: 3, background: i === 1 ? '#2F4CFF' : 'rgba(14, 16, 18, 0.08)', width: '60%', borderRadius: 1 }} />
                    <div style={{ height: 3, background: 'rgba(14, 16, 18, 0.08)', width: '90%', borderRadius: 1 }} />
                  </div>
                ))}
              </div>

              <h4
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 18,
                  fontWeight: 700,
                  color: '#0E1012',
                  margin: '0 0 6px 0',
                }}
              >
                {review.cardTitle}
              </h4>
              <p
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10.5,
                  color: 'var(--text-muted)',
                  margin: '0 0 12px 0',
                }}
              >
                {review.sector}
              </p>
            </div>

            <div>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 4,
                  marginBottom: 12,
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9.5,
                }}
              >
                {review.cardTags.map((t, idx) => (
                  <span
                    key={idx}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid rgba(14, 16, 18, 0.12)',
                      padding: '2px 6px',
                      borderRadius: 3,
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#0E1012',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <CheckCircle2 size={13} color="#047857" />
                <span>{review.stats}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Monumental Quote & Author */}
          <div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10.5,
                fontWeight: 700,
                color: '#0E1012',
                letterSpacing: '0.08em',
                marginBottom: 12,
              }}
            >
              {review.company}
            </div>

            <h3
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(22px, 2.5vw, 34px)',
                fontWeight: 700,
                letterSpacing: '-0.025em',
                lineHeight: 1.25,
                color: '#0E1012',
                margin: '0 0 16px 0',
              }}
            >
              {review.quote}
            </h3>

            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 14.5,
                lineHeight: 1.6,
                color: '#4B505B',
                margin: '0 0 28px 0',
              }}
            >
              {review.body}
            </p>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 18,
                borderTop: '1px solid rgba(14, 16, 18, 0.1)',
                paddingTop: 20,
              }}
            >
              {/* Author */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <img
                  src={review.avatar}
                  alt={review.author}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '1.5px solid #0E1012',
                  }}
                />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#0E1012' }}>
                    {review.author}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      color: '#047857',
                      letterSpacing: '0.04em',
                      fontWeight: 700,
                    }}
                  >
                    {review.role}
                  </div>
                </div>
              </div>

              {/* ITSUA Split Button */}
              <a
                href="#dual-engine"
                className="btn-itsua-split"
                style={{
                  border: '1.5px solid #0E1012',
                  boxShadow: '2px 2px 0px #0E1012',
                }}
              >
                <span className="icon-block" style={{ padding: '10px 12px' }}>
                  <ArrowUpRight size={14} />
                </span>
                <span className="text-block" style={{ padding: '10px 16px', fontSize: 11.5 }}>
                  VERIFY GROUND TRUTH
                </span>
              </a>
            </div>
          </div>
        </div>

        {/* ─── Footer Controls: Carousel Navigation + Rating ─── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 24,
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          {/* Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={prevReview}
                style={{
                  width: 36,
                  height: 36,
                  border: '1.5px solid #0E1012',
                  borderRadius: 4,
                  background: '#FFFFFF',
                  color: '#0E1012',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '1.5px 1.5px 0px #0E1012',
                  transition: 'all 0.15s ease',
                }}
                title="Previous Case Study"
              >
                <ChevronLeft size={16} />
              </button>

              <button
                onClick={nextReview}
                style={{
                  width: 36,
                  height: 36,
                  border: '1.5px solid #0E1012',
                  borderRadius: 4,
                  background: '#FFFFFF',
                  color: '#0E1012',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '1.5px 1.5px 0px #0E1012',
                  transition: 'all 0.15s ease',
                }}
                title="Next Case Study"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                fontWeight: 700,
                color: '#0E1012',
              }}
            >
              0{currentIdx + 1} / 0{REVIEWS.length}
            </span>
          </div>

          {/* Verification Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              border: '1.5px solid #0E1012',
              padding: '6px 14px',
              borderRadius: 4,
              background: '#FFFFFF',
              boxShadow: '2px 2px 0px #0E1012',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
            }}
          >
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: '#0E1012',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: 10,
              }}
            >
              C
            </div>
            <span style={{ fontWeight: 700, color: '#0E1012' }}>5.0</span>
            <div style={{ display: 'flex', color: '#FF5500' }}>
              <Star size={11} fill="currentColor" />
            </div>
            <span style={{ color: 'var(--text-secondary)' }}>BASED ON 18 BENCHMARK AUDITS</span>
          </div>
        </div>
      </div>
    </section>
  )
}

