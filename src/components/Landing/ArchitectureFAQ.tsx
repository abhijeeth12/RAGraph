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
    question: 'How is Study Space different from standard AI search tools?',
    answer:
      'Most AI tools cut your documents into arbitrary fragments, often splitting tables in half, detaching headings, or losing vital context. Study Space preserves the natural structure and outline of your documents. It reads through your notes and papers with full context so answers are accurate, complete, and reliable.',
    specTag: 'DOCUMENT CONTEXT',
  },
  {
    id: '02',
    question: 'What kinds of documents can I use with Study Space?',
    answer:
      'You can upload PDFs, research papers, lecture notes, textbooks, study guides, and spreadsheets. Study Space organizes them into dedicated notebooks so you can keep work separated by course, project, or topic.',
    specTag: 'SUPPORTED FILES',
  },
  {
    id: '03',
    question: 'How do clickable citations work?',
    answer:
      'Whenever Study Space answers a question, every factual statement includes an interactive citation. Clicking any citation opens your document side-by-side and highlights the exact sentence where that fact was found, making fact-checking effortless.',
    specTag: 'VERIFIED CITATIONS',
  },
  {
    id: '04',
    question: 'Can I explore connections across multiple documents?',
    answer:
      'Yes. Study Space automatically generates interactive knowledge maps showing how key topics and concepts connect across all documents in your notebook. You can click on any concept in the map to explore related notes and jump directly to the source text.',
    specTag: 'KNOWLEDGE MAPS',
  },
  {
    id: '05',
    question: 'Do I need technical skills or AI experience to use Study Space?',
    answer:
      'Not at all. Study Space is built for students, researchers, teachers, and professionals across all fields. If you know how to upload a file and ask a question in plain English, you have everything you need to start.',
    specTag: 'EASY TO USE',
  },
  {
    id: '06',
    question: 'How do I get started, and do I need to pay or configure anything?',
    answer:
      'You can try Study Space immediately right in your browser with our interactive demo notebook—no sign-up or credit card required. When you are ready to create your own notebooks and upload your files, you can sign in with your email.',
    specTag: 'GETTING STARTED',
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
