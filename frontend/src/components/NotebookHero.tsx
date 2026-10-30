'use client'
import React from 'react'
import { motion } from 'framer-motion'
import {
  Sparkles,
  Zap,
  Share2,
  Compass,
  FolderPlus,
  ArrowUpRight,
  Database,
  Lightbulb,
} from 'lucide-react'

interface NotebookHeroProps {
  notebookTitle?: string
  notebookDescription?: string
  documentCount?: number
  onSearch: (query: string) => void
  onOpenDocManager: () => void
}

export function NotebookHero({
  notebookTitle,
  notebookDescription,
  documentCount = 0,
  onSearch,
  onOpenDocManager,
}: NotebookHeroProps) {
  const displayTitle = notebookTitle || 'Knowledge Workspace'
  const displayDesc =
    notebookDescription ||
    'Synthesize deep multi-document findings, trace semantic connections, and traverse knowledge graphs with hybrid retrieval.'

  const hasDocs = documentCount > 0

  const actionCards = [
    {
      id: 'synthesis',
      badge: 'Executive Synthesis',
      title: 'Synthesize Findings',
      desc: 'Extract key takeaways, core conclusions, and actionable intelligence.',
      icon: <Zap size={18} />,
      color: '#3B82F6',
      bgGlow: 'rgba(59, 130, 246, 0.12)',
      borderColor: 'rgba(59, 130, 246, 0.25)',
      action: () =>
        onSearch('Synthesize the core findings, major takeaways, and overarching arguments across the knowledge base.'),
    },
    {
      id: 'concepts',
      badge: 'Deep Exploration',
      title: 'Explore Key Concepts',
      desc: 'Analyze critical terminology, foundational theories, and methodologies.',
      icon: <Compass size={18} />,
      color: '#06B6D4',
      bgGlow: 'rgba(6, 182, 212, 0.12)',
      borderColor: 'rgba(6, 182, 212, 0.25)',
      action: () =>
        onSearch('What are the primary concepts, methodologies, and technical specifications detailed in this workspace?'),
    },
    {
      id: 'connections',
      badge: 'Graph Intelligence',
      title: 'Map Hidden Links',
      desc: 'Discover non-obvious entity bridges and cross-source relationships.',
      icon: <Share2 size={18} />,
      color: '#10B981',
      bgGlow: 'rgba(16, 185, 129, 0.12)',
      borderColor: 'rgba(16, 185, 129, 0.25)',
      action: () =>
        onSearch('Identify non-obvious connections, cross-document patterns, and contrasting perspectives.'),
    },
    {
      id: 'sources',
      badge: hasDocs ? `${documentCount} Connected` : 'Needs Sources',
      title: hasDocs ? 'Manage Documents' : 'Add Knowledge Base',
      desc: hasDocs
        ? 'Inspect indexed chunks, review document hierarchy, or import new files.'
        : 'Upload PDFs, research papers, or notes to construct your knowledge graph.',
      icon: <FolderPlus size={18} />,
      color: '#8B5CF6',
      bgGlow: 'rgba(139, 92, 246, 0.12)',
      borderColor: 'rgba(139, 92, 246, 0.25)',
      action: onOpenDocManager,
    },
  ]

  const quickPrompts = [
    'What are the most surprising insights here?',
    'Create an executive briefing bulleted summary',
    'Compare methodologies and contrasting viewpoints',
    'Generate key questions for further research',
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      style={{
        maxWidth: 680,
        margin: '24px auto 0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        position: 'relative',
        zIndex: 1,
      }}
    >
      {/* Ambient background glow */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: -30,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 480,
          height: 240,
          background:
            'radial-gradient(ellipse at center, rgba(47, 76, 255, 0.12) 0%, rgba(99, 102, 241, 0.04) 50%, transparent 75%)',
          filter: 'blur(36px)',
          pointerEvents: 'none',
          zIndex: -1,
        }}
      />

      {/* Top Floating Badge */}
      <motion.div
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 7,
          padding: '4px 12px',
          borderRadius: 99,
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
          backdropFilter: 'blur(10px)',
          marginBottom: 16,
        }}
      >
        <span
          style={{
            position: 'relative',
            display: 'flex',
            height: 7,
            width: 7,
          }}
        >
          <span
            style={{
              position: 'absolute',
              display: 'inline-flex',
              height: '100%',
              width: '100%',
              borderRadius: '50%',
              background: hasDocs ? '#10B981' : '#3B82F6',
              opacity: 0.75,
              animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
            }}
          />
          <span
            style={{
              position: 'relative',
              display: 'inline-flex',
              borderRadius: '50%',
              height: 7,
              width: 7,
              background: hasDocs ? '#10B981' : '#3B82F6',
            }}
          />
        </span>
        <span
          style={{
            fontSize: 11.5,
            fontWeight: 500,
            letterSpacing: '0.02em',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          {hasDocs ? (
            <>
              <Database size={11} style={{ color: '#10B981' }} />
              {documentCount} Source{documentCount !== 1 ? 's' : ''} Indexed & Ready
            </>
          ) : (
            <>
              <Sparkles size={11} style={{ color: '#3B82F6' }} />
              Knowledge Space Active
            </>
          )}
        </span>
      </motion.div>

      {/* Main Title */}
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 27,
          fontWeight: 600,
          letterSpacing: '-0.025em',
          lineHeight: 1.25,
          margin: 0,
          marginBottom: 8,
          background: 'linear-gradient(180deg, #FFFFFF 20%, rgba(255, 255, 255, 0.72) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: '0 2px 20px rgba(168, 199, 250, 0.12)',
        }}
      >
        {displayTitle}
      </h1>

      {/* Subtitle / Description */}
      <p
        style={{
          fontSize: 13,
          lineHeight: 1.55,
          color: 'var(--text-secondary)',
          maxWidth: 520,
          margin: '0 auto 24px',
        }}
      >
        {displayDesc}
      </p>

      {/* 2x2 Interactive Action Tiles */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 12,
          width: '100%',
          marginBottom: 20,
        }}
      >
        {actionCards.map((card, idx) => (
          <motion.button
            key={card.id}
            onClick={card.action}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.08 + idx * 0.04 }}
            whileHover={{
              y: -3,
              borderColor: card.borderColor,
              boxShadow: `0 8px 24px -4px ${card.bgGlow}`,
            }}
            whileTap={{ scale: 0.98 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              textAlign: 'left',
              padding: '14px 16px',
              borderRadius: 14,
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              backdropFilter: 'blur(10px)',
              cursor: 'pointer',
              transition: 'background 0.2s, border-color 0.2s',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)'
            }}
          >
            {/* Top row: Icon & Badge & Arrow */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: card.bgGlow,
                  color: card.color,
                  border: `1px solid ${card.borderColor}`,
                }}
              >
                {card.icon}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: card.color,
                    background: card.bgGlow,
                    padding: '2px 7px',
                    borderRadius: 99,
                    letterSpacing: '0.03em',
                    textTransform: 'uppercase',
                  }}
                >
                  {card.badge}
                </span>
                <ArrowUpRight
                  size={14}
                  style={{
                    color: 'var(--text-muted)',
                    opacity: 0.7,
                    transition: 'transform 0.2s',
                  }}
                />
              </div>
            </div>

            {/* Title & Desc */}
            <div
              style={{
                fontSize: 13.5,
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: 4,
                fontFamily: 'var(--font-display)',
                letterSpacing: '-0.01em',
              }}
            >
              {card.title}
            </div>
            <div
              style={{
                fontSize: 11.5,
                lineHeight: 1.4,
                color: 'var(--text-muted)',
              }}
            >
              {card.desc}
            </div>
          </motion.button>
        ))}
      </div>

      {/* Suggested Inspiration Row */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 9,
          width: '100%',
        }}
      >
        <div
          style={{
            fontSize: 10.5,
            fontWeight: 600,
            color: 'var(--text-muted)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <Lightbulb size={12} style={{ color: '#F59E0B' }} />
          Quick Question Starters
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 7,
            width: '100%',
          }}
        >
          {quickPrompts.map((prompt, i) => (
            <motion.button
              key={i}
              onClick={() => onSearch(prompt)}
              whileHover={{ y: -1.5, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                borderRadius: 20,
                padding: '6px 13px',
                fontSize: 11.5,
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
                backdropFilter: 'blur(8px)',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(47, 76, 255, 0.08)'
                e.currentTarget.style.borderColor = 'rgba(47, 76, 255, 0.28)'
                e.currentTarget.style.color = '#FFFFFF'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.07)'
                e.currentTarget.style.color = 'var(--text-secondary)'
              }}
            >
              {prompt}
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
