'use client'
import { GitBranch, Layers, Sparkles, Terminal, Shield, ArrowUpRight } from 'lucide-react'

interface Props {
  onStartDemo: () => void
  onOpenDashboard: () => void
}

export function ArchitecturalFooter({ onStartDemo, onOpenDashboard }: Props) {
  return (
    <footer
      style={{
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        background: '#08090C',
        padding: '64px 24px 44px',
        color: '#94A3B8',
        fontSize: 13,
      }}
    >
      <div
        style={{
          maxWidth: 1320,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 44,
          marginBottom: 48,
        }}
      >
        {/* Brand & Manifesto Column */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <img src="/logo.png" alt="RA-Graph" style={{ width: 28, height: 28, objectFit: 'contain' }} />
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 19,
                fontWeight: 700,
                color: '#F8FAFC',
                letterSpacing: '-0.025em',
              }}
            >
              RA-Graph
            </span>
          </div>
          <p style={{ lineHeight: 1.6, color: '#64748B', margin: '0 0 16px', fontFamily: 'var(--font-body)' }}>
            Hierarchical RAG and Knowledge Graph Engine for complex technical corpora. Tree-aware traversal with zero context fragmentation.
          </p>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              color: '#34D399',
              background: 'rgba(52, 211, 153, 0.08)',
              border: '1px solid rgba(52, 211, 153, 0.2)',
              padding: '4px 9px',
              borderRadius: 4,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34D399', boxShadow: '0 0 8px #34D399' }} />
            <span>ENGINE STATUS: OPERATIONAL</span>
          </div>
        </div>

        {/* Engine Links */}
        <div>
          <div
            style={{
              fontSize: 11.5,
              fontFamily: 'var(--font-mono)',
              color: '#F1F5F9',
              fontWeight: 600,
              textTransform: 'uppercase',
              marginBottom: 16,
              letterSpacing: '0.05em',
            }}
          >
            Architecture
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <li>
              <a
                href="#architecture"
                style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.15s ease' }}
                onMouseOver={(e) => (e.currentTarget.style.color = '#F8FAFC')}
                onMouseOut={(e) => (e.currentTarget.style.color = '#94A3B8')}
              >
                Multi-Scale Tree Descent
              </a>
            </li>
            <li>
              <a
                href="#benchmarks"
                style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.15s ease' }}
                onMouseOver={(e) => (e.currentTarget.style.color = '#F8FAFC')}
                onMouseOut={(e) => (e.currentTarget.style.color = '#94A3B8')}
              >
                Benchmark Ledger
              </a>
            </li>
            <li>
              <a
                href="#knowledge-graph"
                style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.15s ease' }}
                onMouseOver={(e) => (e.currentTarget.style.color = '#F8FAFC')}
                onMouseOut={(e) => (e.currentTarget.style.color = '#94A3B8')}
              >
                Cross-Entity Graph Propagation
              </a>
            </li>
            <li>
              <a
                href="#faq"
                style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.15s ease' }}
                onMouseOver={(e) => (e.currentTarget.style.color = '#F8FAFC')}
                onMouseOut={(e) => (e.currentTarget.style.color = '#94A3B8')}
              >
                Memory Constraints & OOM Safeguards
              </a>
            </li>
          </ul>
        </div>

        {/* Researcher Access */}
        <div>
          <div
            style={{
              fontSize: 11.5,
              fontFamily: 'var(--font-mono)',
              color: '#F1F5F9',
              fontWeight: 600,
              textTransform: 'uppercase',
              marginBottom: 16,
              letterSpacing: '0.05em',
            }}
          >
            Access & Sandboxes
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <li>
              <button
                onClick={onStartDemo}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  color: 'inherit',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'color 0.15s ease',
                }}
                onMouseOver={(e) => (e.currentTarget.style.color = '#38BDF8')}
                onMouseOut={(e) => (e.currentTarget.style.color = '#94A3B8')}
              >
                <span>Interactive Guest Sandbox</span>
                <Sparkles size={12} />
              </button>
            </li>
            <li>
              <button
                onClick={onOpenDashboard}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  color: 'inherit',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'color 0.15s ease',
                }}
                onMouseOver={(e) => (e.currentTarget.style.color = '#38BDF8')}
                onMouseOut={(e) => (e.currentTarget.style.color = '#94A3B8')}
              >
                <span>Researcher Notebooks</span>
                <Layers size={12} />
              </button>
            </li>
            <li>
              <a
                href="https://github.com/abhijeeth12/RAGraph"
                target="_blank"
                rel="noreferrer"
                style={{
                  color: 'inherit',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'color 0.15s ease',
                }}
                onMouseOver={(e) => (e.currentTarget.style.color = '#F8FAFC')}
                onMouseOut={(e) => (e.currentTarget.style.color = '#94A3B8')}
              >
                <span>GitHub Source</span>
                <ArrowUpRight size={12} />
              </a>
            </li>
          </ul>
        </div>

        {/* Telemetry Column */}
        <div>
          <div
            style={{
              fontSize: 11.5,
              fontFamily: 'var(--font-mono)',
              color: '#F1F5F9',
              fontWeight: 600,
              textTransform: 'uppercase',
              marginBottom: 16,
              letterSpacing: '0.05em',
            }}
          >
            Telemetry & Security
          </div>
          <div
            style={{
              background: '#0E1117',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 8,
              padding: '12px 14px',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: '#64748B',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <div>QDRANT ENGINE: v1.12.0</div>
            <div>BM25 SPARSE: RANK-BM25</div>
            <div>AST PARSER: LITEPARSE (RUST)</div>
            <div style={{ color: '#38BDF8' }}>ISOLATION: FK NOTEBOOK SCOPED</div>
          </div>
        </div>
      </div>

      {/* Bottom Legal / Copyright Strip */}
      <div
        style={{
          maxWidth: 1320,
          margin: '0 auto',
          paddingTop: 24,
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          fontSize: 12,
          fontFamily: 'var(--font-mono)',
          color: '#64748B',
        }}
      >
        <div>© 2026 RA-Graph Systems. Ground-up architectural knowledge engineering.</div>
        <div style={{ display: 'flex', gap: 16 }}>
          <span>LATENCY: &lt; 40ms</span>
          <span>·</span>
          <span>CITATIONS: VERIFIED</span>
          <span>·</span>
          <span>ZERO DATA LEAK</span>
        </div>
      </div>
    </footer>
  )
}
