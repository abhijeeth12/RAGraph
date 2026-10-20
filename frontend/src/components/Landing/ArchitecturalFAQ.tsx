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
    a: 'Traditional RAG indexes documents as independent chunks (usually 256–512 tokens). When a user asks a question spanning multiple clauses, flat vector search retrieves fragments without context of parent sections. RA-Graph builds an AST tree: it first scores top-level section summaries to identify high-probability branches, then descends into child leaves while injecting parental summary envelopes.',
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
    a: 'PDFs with complex multi-column layouts, tables, Markdown specs with deep headers, DOCX documents, and source code files. Each parser outputs unified hierarchical tree schemas with page and paragraph coordinates.',
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
      <div style={{ marginBottom: 44, borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: 20 }}>
        <div
          style={{
            fontSize: 12,
            fontFamily: "'JetBrains Mono', monospace",
            color: '#38bdf8',
            marginBottom: 8,
          }}
        >
          [05] TECHNICAL SPECIFICATIONS & FAQ
        </div>
        <h2
          style={{
            fontSize: 'clamp(26px, 3.8vw, 42px)',
            fontWeight: 700,
            letterSpacing: '-0.03em',
            color: '#f8fafc',
            margin: '0 0 12px',
          }}
        >
          Frequently Addressed Inquiries
        </h2>
        <p style={{ fontSize: 16, color: '#94a3b8', margin: 0, maxWidth: 720, lineHeight: 1.6 }}>
          Engineering details on tree induction, memory budgeting, and retrieval guarantees.
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
                background: '#13161c',
                border: isOpen
                  ? '1px solid rgba(56, 189, 248, 0.35)'
                  : '1px solid rgba(255, 255, 255, 0.07)',
                borderRadius: 8,
                overflow: 'hidden',
                transition: 'border-color 0.15s ease',
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
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  gap: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontFamily: "'JetBrains Mono', monospace",
                      color: isOpen ? '#38bdf8' : '#64748b',
                      background: 'rgba(255, 255, 255, 0.03)',
                      padding: '3px 8px',
                      borderRadius: 4,
                    }}
                  >
                    {faq.tag}
                  </span>
                  <span
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: isOpen ? '#f8fafc' : '#cbd5e1',
                    }}
                  >
                    {faq.q}
                  </span>
                </div>

                <div
                  style={{
                    color: isOpen ? '#38bdf8' : '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
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
                        color: '#94a3b8',
                        lineHeight: 1.65,
                        borderTop: '1px solid rgba(255, 255, 255, 0.04)',
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
