'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Plus, Minus, HelpCircle } from 'lucide-react'

interface FAQItem {
  q: string
  a: string
  tag: string
}

const FAQS: FAQItem[] = [
  {
    q: 'How does Hierarchical Beam Search differ from traditional semantic search?',
    a: 'Traditional RAG indexes documents as disjoint chunks (usually 256–512 tokens). When a user asks a question spanning multiple clauses, flat vector search retrieves fragments without context of parent sections. RA-Graph builds a structured AST tree: it first scores top-level section summaries to identify high-probability branches, then descends into child leaves while injecting parental summary envelopes.',
    tag: 'ARCHITECTURE',
  },
  {
    q: 'How does RA-Graph run within memory-constrained backends (e.g., 512MB RAM limits)?',
    a: 'RA-Graph employs streaming chunk batching and offloaded dual-path indexing. During embedding, text is streamed in micro-batches with strict garbage collection triggers to prevent memory accumulation, enabling full AST induction even on constrained container deployments.',
    tag: 'INFRASTRUCTURE',
  },
  {
    q: 'What is Dual-Path Reciprocal Rank Fusion (RRF)?',
    a: 'Dual-Path RRF executes two parallel retrieval pipelines for every query: a dense vector similarity pass (capturing conceptual synonyms and thesis statements) and a sparse BM25 pass (capturing exact identifiers, code signatures, parameter names, and section numbers). The results are fused mathematically via reciprocal rank weighting, preventing semantic drift.',
    tag: 'RETRIEVAL',
  },
  {
    q: 'Can I upload proprietary documents without data leak or training usage?',
    a: 'Yes. All notebook sessions are isolated by secure foreign-key scoping. Text extractions and vector representations are private to your workspace and never retained by foundational model providers for training.',
    tag: 'PRIVACY & SECURITY',
  },
  {
    q: 'What document formats are natively supported by the AST parser?',
    a: 'PDFs with complex multi-column layouts, ruled tables, Markdown specs with deep headers, DOCX documents, and source code files. Each parser outputs unified hierarchical tree schemas with page and paragraph coordinates.',
    tag: 'INGESTION',
  },
]

export function ArchitecturalFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx)
  }

  return (
    <section
      id="faq"
      style={{
        padding: '80px 24px',
        maxWidth: 1320,
        margin: '0 auto',
        width: '100%',
      }}
    >
      {/* Section Header */}
      <div
        style={{
          marginBottom: 44,
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          paddingBottom: 20,
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontFamily: 'var(--font-mono)',
            color: '#38BDF8',
            marginBottom: 10,
            letterSpacing: '0.05em',
          }}
        >
          § 04 / TECHNICAL SPECIFICATIONS & FAQ
        </div>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(28px, 4vw, 44px)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: '#F8FAFC',
            margin: '0 0 12px',
          }}
        >
          Frequently Addressed Specifications
        </h2>
        <p
          style={{
            fontSize: 16,
            color: '#94A3B8',
            margin: 0,
            maxWidth: 760,
            lineHeight: 1.6,
            fontFamily: 'var(--font-body)',
          }}
        >
          Engineering details on structural tree induction, memory budgeting, and retrieval guarantees.
        </p>
      </div>

      {/* Accordion List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {FAQS.map((faq, idx) => {
          const isOpen = openIndex === idx
          return (
            <div
              key={faq.q}
              style={{
                background: '#0E1117',
                border: isOpen
                  ? '1px solid rgba(56, 189, 248, 0.4)'
                  : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 12,
                overflow: 'hidden',
                transition: 'border-color 0.2s ease, background 0.2s ease',
              }}
            >
              <button
                onClick={() => toggle(idx)}
                style={{
                  width: '100%',
                  padding: '20px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  textAlign: 'left',
                  cursor: 'pointer',
                  background: isOpen ? 'rgba(255, 255, 255, 0.02)' : 'transparent',
                  border: 'none',
                  gap: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span
                    style={{
                      fontSize: 10.5,
                      fontFamily: 'var(--font-mono)',
                      background: 'rgba(255, 255, 255, 0.04)',
                      color: isOpen ? '#38BDF8' : '#64748B',
                      padding: '3px 8px',
                      borderRadius: 4,
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    {faq.tag}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 16,
                      fontWeight: 600,
                      color: isOpen ? '#F8FAFC' : '#E2E8F0',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {faq.q}
                  </span>
                </div>

                <div
                  style={{
                    color: isOpen ? '#38BDF8' : '#64748B',
                    display: 'flex',
                    alignItems: 'center',
                    flexShrink: 0,
                  }}
                >
                  {isOpen ? <Minus size={18} /> : <Plus size={18} />}
                </div>
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div
                      style={{
                        padding: '0 24px 22px',
                        fontSize: 14.5,
                        lineHeight: 1.68,
                        color: '#94A3B8',
                        fontFamily: 'var(--font-body)',
                        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                        paddingTop: 16,
                      }}
                    >
                      {faq.a}
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

