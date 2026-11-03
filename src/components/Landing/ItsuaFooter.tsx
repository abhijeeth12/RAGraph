interface Props {
  onStartDemo: () => void
  onOpenDashboard: () => void
}

export function ItsuaFooter({ onStartDemo, onOpenDashboard }: Props) {
  return (
    <footer
      style={{
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderTop: '1px solid #0E1012',
        fontFamily: 'var(--font-mono)',
        fontSize: 11.5,
        color: '#60636a',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          maxWidth: 1400,
          margin: '0 auto',
          minHeight: 56,
          padding: '16px 24px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontWeight: 700, color: '#0E1012' }}>
            © 2026 STUDY SPACE
          </span>
          <span style={{ color: '#0E1012' }}>|</span>
          <span>INTELLIGENT RESEARCH ENGINE</span>
          <span style={{ color: '#0E1012' }}>|</span>
          <span>ALL RIGHTS RESERVED</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#047857', fontWeight: 600 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#34d399', display: 'inline-block' }} />
            <span>ALL SYSTEMS OPERATIONAL</span>
          </div>

          <a
            href="#specification"
            style={{ color: '#60636a', textDecoration: 'none' }}
            className="hover:text-[#0E1012] hover:underline"
          >
            DOCUMENTATION
          </a>

          <a
            href="#closer"
            style={{ color: '#60636a', textDecoration: 'none' }}
            className="hover:text-[#0E1012] hover:underline"
          >
            SECURITY & SLA
          </a>

          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#60636a', textDecoration: 'none' }}
            className="hover:text-[#0E1012] hover:underline"
          >
            GITHUB ↗
          </a>
        </div>
      </div>
    </footer>
  )
}
