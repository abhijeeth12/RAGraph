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
        background: '#080a0e',
        padding: '60px 24px 40px',
        color: '#94a3b8',
        fontSize: 13,
      }}
    >
      <div
        style={{
          maxWidth: 1320,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 40,
          marginBottom: 48,
        }}
      >
        {/* Brand & Manifesto Column */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <img src="/logo.png" alt="RA-Graph" style={{ width: 26, height: 26, objectFit: 'contain' }} />
            <span style={{ fontSize: 18, fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.02em' }}>
              RA-Graph
            </span>
          </div>
          <p style={{ lineHeight: 1.6, color: '#64748b', margin: '0 0 16px' }}>
            Hierarchical RAG and Knowledge Graph Engine for complex technical corpora. Tree-aware traversal with zero context fragmentation.
          </p>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              fontFamily: "'JetBrains Mono', monospace",
              color: '#34d399',
              background: 'rgba(52, 211, 153, 0.08)',
              padding: '3px 8px',
              borderRadius: 4,
            }}
          >
            <span>ENGINE STATUS: OPERATIONAL</span>
          </div>
        </div>

        {/* Engine Links */}
        <div>
          <div
            style={{
              fontSize: 11.5,
              fontFamily: "'JetBrains Mono', monospace",
              color: '#f1f5f9',
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
              <a href="#architecture" style={{ color: 'inherit', textDecoration: 'none' }}>
                Multi-Scale Tree Descent
              </a>
            </li>
            <li>
              <a href="#benchmarks" style={{ color: 'inherit', textDecoration: 'none' }}>
                Benchmark Ledger
              </a>
            </li>
            <li>
              <a href="#knowledge-graph" style={{ color: 'inherit', textDecoration: 'none' }}>
                Cross-Entity Graph Propagation
              </a>
            </li>
            <li>
              <a href="#faq" style={{ color: 'inherit', textDecoration: 'none' }}>
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
              fontFamily: "'JetBrains Mono', monospace",
              color: '#f1f5f9',
              fontWeight: 600,
              textTransform: 'uppercase',
              marginBottom: 16,
              letterSpacing: '0.05em',
            }}
          >
            Platform Access
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <li>
              <button
                onClick={onStartDemo}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  color: '#38bdf8',
                  fontSize: 13,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                Launch Guest Sandbox
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
                  fontSize: 13,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                Researcher Notebooks
              </button>
            </li>
            <li>
              <a
                href="https://github.com/abhijeeth12/RAGraph"
                target="_blank"
                rel="noreferrer"
                style={{ color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <span>GitHub Repository</span>
                <ArrowUpRight size={12} />
              </a>
            </li>
          </ul>
        </div>

        {/* Telemetry Block */}
        <div>
          <div
            style={{
              fontSize: 11.5,
              fontFamily: "'JetBrains Mono', monospace",
              color: '#f1f5f9',
              fontWeight: 600,
              textTransform: 'uppercase',
              marginBottom: 16,
              letterSpacing: '0.05em',
            }}
          >
            Engine Specifications
          </div>
          <div
            style={{
              background: '#0e1117',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: 6,
              padding: '12px 14px',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11.5,
              lineHeight: 1.6,
              color: '#94a3b8',
            }}
          >
            <div>BUILD: release-v5.2.0</div>
            <div>RUNTIME: Dual-Path RRF</div>
            <div>BRANCH BUDGET: k=3</div>
            <div style={{ color: '#38bdf8' }}>PROVENANCE: Grounded</div>
          </div>
        </div>
      </div>

      {/* Bottom Legal / Copyright Bar */}
      <div
        style={{
          maxWidth: 1320,
          margin: '0 auto',
          paddingTop: 24,
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          fontSize: 12,
          color: '#64748b',
        }}
      >
        <div>© 2026 RA-Graph Engineering. Open research architecture.</div>
        <div style={{ display: 'flex', gap: 18 }}>
          <span>Apache 2.0 License</span>
          <span>·</span>
          <span>Zero Data Retention</span>
          <span>·</span>
          <span>Hierarchical Semantic Engine</span>
        </div>
      </div>
    </footer>
  )
}
