'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus } from 'lucide-react'

interface FAQItem {
  id: string
  question: string
  answer: string
  specTag: string
}

const FAQS: FAQItem[] = [
  {
    id: '01',
    question: 'How is RA-Graph different from typical AI document search tools?',
    answer:
      'Standard AI search tools chop your documents into random 500-word fragments, which splits tables in half, detaches section headings, and destroys context. RA-Graph keeps your document’s original outline and structure intact. It searches down headings just like a human researcher, ensuring the AI always understands the complete, unbroken context.',
    specTag: 'DOCUMENT STRUCTURE',
  },
  {
    id: '02',
    question: 'Can I upload sensitive financial filings, medical records, or confidential contracts?',
    answer:
      'Yes. Every document you upload stays strictly isolated to your private workspace. RA-Graph also supports local, air-gapped models (such as Ollama or local LLMs) with zero data ever leaving your machine or network. Furthermore, every citation is audit-verifiable down to the exact sentence.',
    specTag: 'PRIVACY & SECURITY',
  },
  {
    id: '03',
    question: 'How does it handle complex multi-column spreadsheets and financial tables?',
    answer:
      'Standard vector search frequently scrambles table rows and detaches columns, turning crucial numbers into meaningless text. RA-Graph treats multi-column tables as unified, indivisible units, keeping every number, percentage, and footnote bound to its correct header.',
    specTag: 'TABLE FIDELITY',
  },
  {
    id: '04',
    question: 'What are clickable citations and how do they eliminate AI hallucinations?',
    answer:
      'Whenever RA-Graph answers a question, every factual claim is tagged with an interactive citation. Clicking any citation immediately opens the source document drawer and highlights the exact sentence where that fact was discovered, giving you 100% confidence.',
    specTag: 'CLICKABLE CITATIONS',
  },
  {
    id: '05',
    question: 'Does RA-Graph support standard PDFs, Word documents, and research papers?',
    answer:
      'Yes. Simply drag and drop your PDFs, Word documents, SEC filings, or technical whitepapers into any notebook. The engine automatically maps the outline in seconds, so you can begin searching immediately without any complex configuration.',
    specTag: 'INSTANT INGESTION',
  },
  {
    id: '06',
    question: 'How does RA-Graph reduce AI processing costs by 84%?',
    answer:
      'Instead of dumping entire 300-page documents into expensive AI context windows, RA-Graph pinpoints only the exact high-value paragraphs needed to answer your question. This produces answers in under 50 milliseconds while cutting API costs drastically.',
    specTag: 'COST EFFICIENCY',
  },
]

export function ArchitectureFAQ() {
  const [openId, setOpenId] = useState<string | null>('01')

  return (
    <section
      id="faq"
      style={{
        padding: 'clamp(50px, 8vh, 90px) 24px',
        maxWidth: 1380,
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          borderBottom: '2px solid #0E1012',
          paddingBottom: 20,
          marginBottom: 36,
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
            <span style={{ fontWeight: 700, color: '#0E1012' }}>§ 06 — FREQUENT QUESTIONS</span>
            <span>/</span>
            <span>SIMPLE & TRANSPARENT ANSWERS</span>
          </div>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(38px, 5vw, 68px)',
              lineHeight: 1,
              fontWeight: 700,
              letterSpacing: '-0.04em',
              color: '#0E1012',
              margin: 0,
            }}
          >
            /faq
          </h2>
        </div>

        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: '#0E1012',
            fontWeight: 600,
          }}
        >
          [ 06 COMMON QUESTIONS ]
        </span>
      </div>

      {/* ─── Accordion List (Crox Broad Black Line Style) ─────────────── */}
      <div
        style={{
          border: '2px solid #0E1012',
          background: '#FFFFFF',
          boxShadow: '4px 4px 0px #0E1012',
          overflow: 'hidden',
        }}
      >
        {FAQS.map((item, idx) => {
          const isOpen = openId === item.id
          const isLast = idx === FAQS.length - 1
          return (
            <div
              key={item.id}
              style={{
                background: isOpen ? '#F9F9F8' : '#FFFFFF',
                borderBottom: isLast ? 'none' : '1.5px solid #0E1012',
                transition: 'background 0.2s ease',
              }}
            >
              <button
                onClick={() => setOpenId(isOpen ? null : item.id)}
                style={{
                  width: '100%',
                  padding: 'clamp(20px, 3vh, 26px) clamp(20px, 3vw, 32px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                  cursor: 'pointer',
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      fontWeight: 700,
                      color: isOpen ? '#2F4CFF' : 'var(--text-muted)',
                    }}
                  >
                    [ {item.id} ]
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 'clamp(16px, 1.8vw, 19px)',
                      fontWeight: 700,
                      color: '#0E1012',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {item.question}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      color: isOpen ? '#2F4CFF' : '#0E1012',
                      background: '#FFFFFF',
                      padding: '3px 8px',
                      border: '1.5px solid #0E1012',
                      fontWeight: 700,
                    }}
                    className="hidden sm:inline"
                  >
                    {item.specTag}
                  </span>

                  <div
                    style={{
                      width: 28,
                      height: 28,
                      border: '1.5px solid #0E1012',
                      background: isOpen ? '#0E1012' : '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isOpen ? '#FFFFFF' : '#0E1012',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {isOpen ? <Minus size={14} /> : <Plus size={14} />}
                  </div>
                </div>
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div
                      style={{
                        padding: '0 clamp(20px, 3vw, 32px) clamp(20px, 3vh, 28px) clamp(44px, 5vw, 68px)',
                        fontSize: 15,
                        lineHeight: 1.65,
                        color: 'var(--text-secondary)',
                        fontFamily: 'var(--font-body)',
                        maxWidth: 920,
                      }}
                    >
                      {item.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </section>
  )
}

