import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  GitBranch,
  Network,
  Cpu,
  Layers,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  FileText,
  Lock,
  Zap,
  Globe,
  Sliders,
  Compass,
  BookOpen,
} from 'lucide-react'
import { HeroSimulator } from './HeroSimulator'
import { useSearchStore } from '@/store/useSearchStore'
import AuthModal from '@/components/AuthModal'

interface Props {
  onStartDemo: () => void
  onOpenDashboard: () => void
}

export function LandingPage({ onStartDemo, onOpenDashboard }: Props) {
  const { user, openGuestDemo, setAppView } = useSearchStore()
  const [authOpen, setAuthOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  const handleCta = () => {
    if (user) {
      onOpenDashboard()
    } else {
      openGuestDemo()
    }
  }

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0b0e13',
        color: 'var(--text-primary)',
        overflowX: 'hidden',
        position: 'relative',
        fontFamily: 'var(--font-body)',
      }}
    >
      {/* Background Grid Pattern inspired by Render.com */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)',
          backgroundSize: '36px 36px',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Atmospheric Radial Gradients */}
      <div
        style={{
          position: 'fixed',
          top: '-10%',
          left: '15%',
          width: '700px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(168, 199, 250, 0.08) 0%, transparent 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: 'fixed',
          bottom: '10%',
          right: '10%',
          width: '600px',
          height: '450px',
          background: 'radial-gradient(circle, rgba(196, 238, 208, 0.06) 0%, transparent 70%)',
          filter: 'blur(70px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* ─── Top Navigation Bar ─────────────────────────────────────────── */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          backdropFilter: 'blur(20px)',
          background: 'rgba(11, 14, 19, 0.75)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: 'linear-gradient(135deg, rgba(168, 199, 250, 0.2) 0%, rgba(255, 223, 153, 0.1) 100%)',
              border: '1px solid rgba(168, 199, 250, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img src="/logo.png" alt="RA-Graph" style={{ width: 26, height: 26, objectFit: 'contain' }} />
          </div>
          <span style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.3px', color: 'var(--text-primary)' }}>
            RA-Graph
          </span>
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 600,
              color: 'var(--accent-blue)',
              background: 'rgba(168, 199, 250, 0.1)',
              padding: '2px 8px',
              borderRadius: 6,
              border: '1px solid rgba(168, 199, 250, 0.2)',
            }}
          >
            v5 Engine
          </span>
        </div>

        {/* Navigation Anchors */}
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 28,
            fontSize: 13.5,
            color: 'var(--text-secondary)',
          }}
          className="hidden md:flex"
        >
          <a
            href="#features"
            style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.15s' }}
            onMouseOver={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            Features
          </a>
          <a
            href="#architecture"
            style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.15s' }}
            onMouseOver={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            Architecture
          </a>
          <a
            href="#benchmarks"
            style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.15s' }}
            onMouseOver={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            Benchmarks
          </a>
          <a
            href="#faq"
            style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.15s' }}
            onMouseOver={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            FAQ
          </a>
          <button
            onClick={onOpenDashboard}
            style={{
              background: 'none',
              border: 'none',
              color: 'inherit',
              font: 'inherit',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              transition: 'color 0.15s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = 'var(--accent-blue)')}
            onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            <BookOpen size={14} /> Notebooks
          </button>
        </nav>

        {/* CTA Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {user ? (
            <button
              onClick={onOpenDashboard}
              className="btn-primary"
              style={{
                borderRadius: 20,
                padding: '7px 18px',
                fontSize: 13,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              Open Dashboard <ArrowRight size={14} />
            </button>
          ) : (
            <>
              <button
                onClick={() => setAuthOpen(true)}
                className="btn-ghost"
                style={{ fontSize: 13, padding: '6px 14px' }}
              >
                Sign In
              </button>
              <button
                onClick={handleCta}
                className="btn-primary"
                style={{
                  borderRadius: 20,
                  padding: '7px 18px',
                  fontSize: 13,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                Get Started Free <ArrowRight size={14} />
              </button>
            </>
          )}
        </div>
      </header>

      {/* ─── Hero Section ──────────────────────────────────────────────── */}
      <section
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 1200,
          margin: '0 auto',
          padding: '80px 24px 60px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        {/* Render-style Headline Kicker */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 14px',
            borderRadius: 24,
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            marginBottom: 24,
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-blue)' }} />
          <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-secondary)' }}>
            Hierarchical RAG v5 with Section-Aware Beam Search
          </span>
        </motion.div>

        {/* Main Display Typography */}
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{
            fontSize: 'clamp(2.5rem, 5.5vw, 4.4rem)',
            fontWeight: 700,
            lineHeight: 1.12,
            letterSpacing: '-1.5px',
            maxWidth: 900,
            marginBottom: 20,
            background: 'linear-gradient(180deg, #ffffff 40%, rgba(255, 255, 255, 0.65) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Research beyond flat chunking. Think in structures.
        </motion.h1>

        {/* Value Proposition Description */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          style={{
            fontSize: 'clamp(1rem, 1.8vw, 1.2rem)',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            maxWidth: 680,
            marginBottom: 36,
          }}
        >
          RA-Graph reconstructs the structural hierarchy of your documents (Document $\rightarrow$ Sections $\rightarrow$ Subsections $\rightarrow$ Leaf Paragraphs). Experience verifiable citations, zero-hallucination synthesis, and dynamic concept mind maps.
        </motion.p>

        {/* Hero CTA Button Island */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 54 }}
        >
          <button
            onClick={handleCta}
            style={{
              background: '#ffffff',
              color: '#0b0e13',
              border: 'none',
              borderRadius: 24,
              padding: '13px 28px',
              fontSize: 14.5,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 0 24px rgba(255, 255, 255, 0.25)',
              transition: 'transform 0.15s, opacity 0.15s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            {user ? 'Open Workspace' : 'Start with Free Demo'} <ArrowRight size={16} />
          </button>

          <button
            onClick={onOpenDashboard}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              color: 'var(--text-primary)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 24,
              padding: '13px 24px',
              fontSize: 14.5,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              backdropFilter: 'blur(10px)',
              transition: 'background 0.15s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.09)')}
            onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)')}
          >
            <BookOpen size={15} /> Browse Notebooks
          </button>

          {!user && (
            <button
              onClick={() => setAuthOpen(true)}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                color: 'var(--text-secondary)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 24,
                padding: '13px 22px',
                fontSize: 14.5,
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                backdropFilter: 'blur(10px)',
                transition: 'background 0.15s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.07)'
                e.currentTarget.style.color = 'var(--text-primary)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                e.currentTarget.style.color = 'var(--text-secondary)'
              }}
            >
              <Lock size={15} /> Sign In
            </button>
          )}
        </motion.div>

        {/* Live Interactive Hero Component */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          style={{ width: '100%', maxWidth: 940 }}
        >
          <HeroSimulator onLaunchDemo={handleCta} />
        </motion.div>
      </section>

      {/* ─── Capabilities Bento Grid ───────────────────────────────────── */}
      <section
        id="features"
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 1200,
          margin: '0 auto',
          padding: '80px 24px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 54 }}>
          <span style={{ fontSize: 12, color: 'var(--accent-blue)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
            Engine Features
          </span>
          <h2
            style={{
              fontSize: 'clamp(2rem, 3.8vw, 2.8rem)',
              fontWeight: 700,
              letterSpacing: '-1px',
              marginTop: 10,
              color: 'var(--text-primary)',
            }}
          >
            Engineered for precision. Built for research.
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, maxWidth: 560, margin: '12px auto 0' }}>
            Traditional RAG fractures meaning into blind chunks. RA-Graph models documents as living hierarchical semantic trees.
          </p>
        </div>

        {/* Bento Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 18,
          }}
        >
          {/* Bento Card 1: Tree Traversal */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 16,
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: 'rgba(168, 199, 250, 0.1)',
                color: 'var(--accent-blue)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <GitBranch size={20} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              Hierarchical Beam Search
            </h3>
            <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              Evaluates top-level abstracts first, cascading down to subheadings before expanding into leaf paragraphs. Preserves chapter theses and avoids noisy out-of-context text chunks.
            </p>
            <div style={{ marginTop: 'auto', paddingTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, color: 'var(--accent-blue)' }}>L1 Abstract</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>→</span>
              <span style={{ fontSize: 11, color: 'var(--accent-green)' }}>L2 Section</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>→</span>
              <span style={{ fontSize: 11, color: 'var(--accent-amber)' }}>L3 Paragraphs</span>
            </div>
          </div>

          {/* Bento Card 2: Dual-Path Fallback */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 16,
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: 'rgba(196, 238, 208, 0.1)',
                color: 'var(--accent-green)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Cpu size={20} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              Dual-Path Reciprocal Rank Fusion
            </h3>
            <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              When queries are ambiguous or technical jargon drops below the coherence threshold, the pipeline fires a parallel BM25 sparse keyword pass fused via Reciprocal Rank Fusion (RRF).
            </p>
            <div style={{ marginTop: 'auto', paddingTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>BM25 Keyword Recall</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>+</span>
              <span style={{ fontSize: 11, color: 'var(--accent-green)' }}>Dense Vector Embeddings</span>
            </div>
          </div>

          {/* Bento Card 3: Dynamic Mind Map */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 16,
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: 'rgba(255, 223, 153, 0.1)',
                color: 'var(--accent-amber)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Network size={20} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              Interactive Mind Map & Knowledge Graph
            </h3>
            <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              Generates zoomable, pannable conceptual ontologies across all uploaded notebooks. Switch between a clean hierarchical tree and an entity force-directed network.
            </p>
            <div style={{ marginTop: 'auto', paddingTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, color: 'var(--accent-amber)' }}>Infinite SVG Canvas</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>·</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Collapsible Branches</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Benchmarks & Architecture Comparison ──────────────────────── */}
      <section
        id="benchmarks"
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 1080,
          margin: '0 auto',
          padding: '60px 24px 80px',
        }}
      >
        <div
          style={{
            background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 20,
            padding: '36px',
            overflowX: 'auto',
          }}
        >
          <div style={{ marginBottom: 24 }}>
            <span style={{ fontSize: 11, color: 'var(--accent-green)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8 }}>
              Performance Metrics
            </span>
            <h3 style={{ fontSize: 24, fontWeight: 600, marginTop: 6, color: 'var(--text-primary)' }}>
              In-Memory Tree vs. Naive Flat Chunking
            </h3>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: 'var(--text-muted)', textAlign: 'left' }}>
                <th style={{ padding: '12px 16px', fontWeight: 500 }}>Metric</th>
                <th style={{ padding: '12px 16px', fontWeight: 500, color: 'var(--accent-blue)' }}>RA-Graph v5 (Tree-RAG)</th>
                <th style={{ padding: '12px 16px', fontWeight: 500 }}>Traditional Vector DB RAG</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <td style={{ padding: '14px 16px', color: 'var(--text-primary)' }}>Retrieval Latency</td>
                <td style={{ padding: '14px 16px', color: 'var(--accent-green)', fontWeight: 600, fontFamily: 'monospace' }}>~0.05ms (In-Memory Matmul)</td>
                <td style={{ padding: '14px 16px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>12–25ms (Network round-trip)</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <td style={{ padding: '14px 16px', color: 'var(--text-primary)' }}>Context Coherence</td>
                <td style={{ padding: '14px 16px', color: 'var(--accent-green)', fontWeight: 600 }}>Section-Aware Beam Budget</td>
                <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>Arbitrary 500-token chunks</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <td style={{ padding: '14px 16px', color: 'var(--text-primary)' }}>Citation Traceability</td>
                <td style={{ padding: '14px 16px', color: 'var(--accent-green)', fontWeight: 600 }}>Exact Heading & Paragraph Tags</td>
                <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>Vague chunk IDs</td>
              </tr>
              <tr>
                <td style={{ padding: '14px 16px', color: 'var(--text-primary)' }}>Multimodal Diagrams</td>
                <td style={{ padding: '14px 16px', color: 'var(--accent-green)', fontWeight: 600 }}>Attached to Parent Headings</td>
                <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>Discarded or unlinked</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ─── Frequently Asked Questions ────────────────────────────────── */}
      <section
        id="faq"
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 820,
          margin: '0 auto',
          padding: '40px 24px 80px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--text-primary)' }}>
            Frequently Asked Questions
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            {
              q: 'What file formats are supported?',
              a: 'RA-Graph supports PDF, TXT, Markdown, DOCX, and PPTX. Documents are parsed into structured sections, preserving titles, subtitles, paragraph chunks, and figures.',
            },
            {
              q: 'How does RA-Graph eliminate hallucinations?',
              a: 'Every answer is constructed strictly from retrieved hierarchical nodes. The LLM is supplied with full heading context and required to generate [Doc X, §Y] citation badges for every claim.',
            },
            {
              q: 'Can I test without creating an account?',
              a: 'Yes. You can explore the guest demo workspace with pre-indexed research papers immediately. To persist your own notebooks, notebooks link to an account with Google or email auth.',
            },
            {
              q: 'What models power the synthesis?',
              a: 'RA-Graph integrates with OpenRouter, providing access to free tiers (Llama 3.3, Mistral Small, Gemma) and flagship models (GPT-4o, Claude 3.5 Sonnet, Gemini 1.5 Pro).',
            },
          ].map((item, idx) => {
            const isOpen = openFaq === idx
            return (
              <div
                key={idx}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 12,
                  overflow: 'hidden',
                }}
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  style={{
                    width: '100%',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-primary)',
                    fontSize: 14.5,
                    fontWeight: 500,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  {item.q}
                  <ChevronDown
                    size={16}
                    style={{
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                      color: 'var(--text-muted)',
                    }}
                  />
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <p
                        style={{
                          padding: '0 20px 16px',
                          margin: 0,
                          fontSize: 13.5,
                          color: 'var(--text-secondary)',
                          lineHeight: 1.6,
                        }}
                      >
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </section>

      {/* ─── Bottom Call to Action ─────────────────────────────────────── */}
      <section
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 1000,
          margin: '0 auto 80px',
          padding: '0 24px',
        }}
      >
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(168, 199, 250, 0.08) 0%, rgba(196, 238, 208, 0.04) 100%)',
            border: '1px solid rgba(168, 199, 250, 0.2)',
            borderRadius: 24,
            padding: '50px 36px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 18,
          }}
        >
          <h2 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--text-primary)', margin: 0 }}>
            Start your hierarchical research notebook today
          </h2>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', maxWidth: 540, margin: 0, lineHeight: 1.6 }}>
            Upload PDFs, explore interactive mind maps, and ground your synthesis with verified section citations.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginTop: 10 }}>
            <button
              onClick={handleCta}
              className="btn-primary"
              style={{
                borderRadius: 24,
                padding: '12px 28px',
                fontSize: 14.5,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {user ? 'Open Workspace' : 'Launch Free Demo Workspace'} <ArrowRight size={16} />
            </button>
            <button
              onClick={onOpenDashboard}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'var(--text-primary)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 24,
                padding: '12px 24px',
                fontSize: 14.5,
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.09)')}
              onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)')}
            >
              <BookOpen size={15} /> Explore Notebooks
            </button>
          </div>
        </div>
      </section>

      {/* ─── Footer ────────────────────────────────────────────────────── */}
      <footer
        style={{
          position: 'relative',
          zIndex: 1,
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          padding: '36px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          fontSize: 12.5,
          color: 'var(--text-muted)',
          maxWidth: 1200,
          margin: '0 auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/logo.png" alt="RA-Graph" style={{ width: 20, height: 20, objectFit: 'contain' }} />
          <span>RA-Graph © 2026. Hierarchical Document Intelligence.</span>
        </div>

        <div style={{ display: 'flex', gap: 20 }}>
          <span>Powered by Render + Vercel + Neon</span>
          <span>OpenRouter AI SDK</span>
          <span>Zero Flat Chunks</span>
        </div>
      </footer>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  )
}
