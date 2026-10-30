'use client'
import React from 'react'
import { ArrowRight, Sparkles } from 'lucide-react'

interface NotebookHeroProps {
  notebookTitle?: string
  notebookDescription?: string
  documentCount?: number
  onSearch: (query: string) => void
  onOpenDocManager: () => void
}

export function NotebookHero({
  documentCount = 0,
  onSearch,
}: NotebookHeroProps) {
  const suggestions = [
    'Synthesize the core findings and overarching takeaways',
    'Compare key arguments and technical specifications',
    'Outline primary concepts and open research questions',
  ]

  const statusLabel =
    documentCount > 0
      ? `STUDY SPACE LLM • ${documentCount} SOURCE${documentCount !== 1 ? 'S' : ''} CONNECTED`
      : 'STUDY SPACE LLM • RESEARCH ENGINE'

  return (
    <div
      style={{
        maxWidth: 640,
        margin: 'clamp(44px, 7vh, 72px) auto 0',
        padding: '0 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      {/* ─── Architectural Editorial Kicker ─── */}
      <div
        style={{
          fontFamily: "var(--font-mono, monospace)",
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--text-muted, #8E92A2)',
          marginBottom: 18,
        }}
      >
        {statusLabel}
      </div>

      {/* ─── Main Welcoming Heading with Restored Sparkle Symbol ─── */}
      <h1
        style={{
          fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)",
          fontSize: 'clamp(28px, 4vw, 34px)',
          fontWeight: 600,
          letterSpacing: '-1px',
          lineHeight: 1.25,
          margin: '0 0 18px 0',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
        }}
      >
        <Sparkles
          size={28}
          color="#a8c7fa"
          style={{
            filter: 'drop-shadow(0 2px 8px rgba(168, 199, 250, 0.4))',
            flexShrink: 0,
          }}
        />
        <span
          style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #a8c7fa 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Welcome to Study Space
        </span>
      </h1>

      {/* ─── Meaningful Introduction to Study Space LLM ─── */}
      <p
        style={{
          fontFamily: "var(--font-body, 'Inter', sans-serif)",
          fontSize: 14.5,
          lineHeight: 1.7,
          color: 'var(--text-secondary, #9BA1A6)',
          maxWidth: 540,
          margin: '0 auto 36px',
          fontWeight: 400,
        }}
      >
        An intelligent research companion designed for deep document comprehension and synthesis.
        Ask complex questions, navigate multi-layered outlines, and explore verified, source-grounded answers.
      </p>

      {/* ─── Minimal, Architectural Suggestion Prompts ─── */}
      <div
        style={{
          width: '100%',
          maxWidth: 520,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {suggestions.map((query, idx) => (
          <button
            key={idx}
            onClick={() => onSearch(query)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 18px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              borderRadius: 8,
              color: 'var(--text-secondary, #9BA1A6)',
              fontSize: 13,
              fontFamily: "var(--font-body, 'Inter', sans-serif)",
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'background 0.15s ease, border-color 0.15s ease, color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.16)'
              e.currentTarget.style.color = '#FFFFFF'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.07)'
              e.currentTarget.style.color = 'var(--text-secondary, #9BA1A6)'
            }}
          >
            <span>{query}</span>
            <ArrowRight size={14} style={{ opacity: 0.45, flexShrink: 0, marginLeft: 14 }} />
          </button>
        ))}
      </div>
    </div>
  )
}
