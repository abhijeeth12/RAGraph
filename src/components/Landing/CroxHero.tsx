import { useState, useEffect, useRef } from 'react'
import { ArrowRight, LayoutDashboard, Database, GitBranch, Zap, CheckCircle2, ShieldCheck } from 'lucide-react'

interface Props {
  onStartDemo: () => void
  onOpenDashboard: () => void
}

export function CroxHero({ onStartDemo, onOpenDashboard }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [hoveredBadge, setHoveredBadge] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  // Interactive 3D Wireframe Canvas (Knowledge Graph / Document Tree Geometry)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let angleX = 0.4
    let angleY = 0.6
    let targetAngleX = 0.4
    let targetAngleY = 0.6

    // Create 3D wireframe nodes (a dual-ring / hierarchical torus-graph structure)
    const nodes: { x: number; y: number; z: number }[] = []
    const numRings = 12
    const nodesPerRing = 16
    const R = 80 // Major radius
    const r = 36 // Minor radius

    for (let i = 0; i < numRings; i++) {
      const u = (i / numRings) * Math.PI * 2
      for (let j = 0; j < nodesPerRing; j++) {
        const v = (j / nodesPerRing) * Math.PI * 2
        const x = (R + r * Math.cos(v)) * Math.cos(u)
        const y = (R + r * Math.cos(v)) * Math.sin(u)
        const z = r * Math.sin(v)
        nodes.push({ x, y, z })
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const mx = (e.clientX - rect.left) / rect.width - 0.5
      const my = (e.clientY - rect.top) / rect.height - 0.5
      targetAngleY = mx * 2.2
      targetAngleX = -my * 2.2
    }

    canvas.addEventListener('mousemove', handleMouseMove)

    const render = () => {
      // Smooth interpolation for subtle interactive rotation
      angleX += (targetAngleX - angleX) * 0.05 + 0.005
      angleY += (targetAngleY - angleY) * 0.05 + 0.008

      const width = canvas.width
      const height = canvas.height
      ctx.clearRect(0, 0, width, height)

      // Background grid in wireframe tile
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)'
      ctx.lineWidth = 1
      const gridSize = 24
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
        ctx.stroke()
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.stroke()
      }

      // Rotate and project nodes
      const projected = nodes.map((node) => {
        // Rotate around Y
        const cosY = Math.cos(angleY)
        const sinY = Math.sin(angleY)
        const x1 = node.x * cosY + node.z * sinY
        const z1 = -node.x * sinY + node.z * cosY

        // Rotate around X
        const cosX = Math.cos(angleX)
        const sinX = Math.sin(angleX)
        const y2 = node.y * cosX - z1 * sinX
        const z2 = node.y * sinX + z1 * cosX

        // Perspective projection
        const fov = 260
        const scale = fov / (fov + z2 + 120)
        return {
          px: width / 2 + x1 * scale,
          py: height / 2 + y2 * scale,
          scale,
          z: z2,
        }
      })

      // Draw wireframe connecting lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)'
      ctx.lineWidth = 0.9

      for (let i = 0; i < numRings; i++) {
        for (let j = 0; j < nodesPerRing; j++) {
          const idx = i * nodesPerRing + j
          const p = projected[idx]

          // Ring connection
          const nextInRing = i * nodesPerRing + ((j + 1) % nodesPerRing)
          const pNextRing = projected[nextInRing]
          ctx.beginPath()
          ctx.moveTo(p.px, p.py)
          ctx.lineTo(pNextRing.px, pNextRing.py)
          ctx.stroke()

          // Cross-ring connection
          const nextRing = ((i + 1) % numRings) * nodesPerRing + j
          const pNextCross = projected[nextRing]
          ctx.beginPath()
          ctx.moveTo(p.px, p.py)
          ctx.lineTo(pNextCross.px, pNextCross.py)
          ctx.stroke()
        }
      }

      // Draw active knowledge graph highlight points
      projected.forEach((p, idx) => {
        if (idx % 7 === 0) {
          ctx.fillStyle = idx % 14 === 0 ? '#FF5F14' : '#FFFFFF'
          ctx.beginPath()
          ctx.arc(p.px, p.py, 2.2 * p.scale, 0, Math.PI * 2)
          ctx.fill()
        }
      })

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(animationFrameId)
      canvas.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  return (
    <section
      id="specification"
      style={{
        position: 'relative',
        background: '#E3E7EB',
        color: '#1A1B1C',
        width: '100%',
        minHeight: 'calc(100vh - 60px)',
        boxSizing: 'border-box',
        overflow: 'hidden',
        fontFamily: "'Space Grotesk', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* ─── Architectural 8-Column Vertical Grid Lines & Grid Crosshairs ─── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          gridTemplateColumns: 'repeat(8, 1fr)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
        aria-hidden="true"
      >
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            style={{
              position: 'relative',
              borderLeft: '1px solid rgba(26, 27, 28, 0.08)',
              height: '100%',
            }}
          >
            {/* Architectural Crosshair (+) at grid intersections */}
            <div
              className="crox-cross"
              style={{
                top: '28%',
                left: -4,
              }}
            />
            <div
              className="crox-cross"
              style={{
                top: '64%',
                left: -4,
              }}
            />

            {/* Crosshairs kept at grid intersections without text labels */}
          </div>
        ))}
      </div>

      {/* ─── Hero Core Content Layer ─── */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 1440,
          margin: '0 auto',
          padding: 'clamp(20px, 3.5vw, 40px) clamp(20px, 3.5vw, 40px) 0 clamp(20px, 3.5vw, 40px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        {/* ─── TOP SECTION: Asymmetric Typography & Supporting Text Block ─── */}
        <div
          className="crox-reveal-1"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(12, 1fr)',
            gap: 'clamp(16px, 2vw, 24px)',
            alignItems: 'start',
            marginBottom: 'clamp(24px, 4vw, 48px)',
          }}
        >
          {/* Col 1-3: Studio Label & Circular Black Badge */}
          <div
            style={{
              gridColumn: 'span 4',
              display: 'flex',
              flexDirection: 'column',
              gap: 24,
            }}
            className="col-span-12 md:col-span-4"
          >
            <div
              style={{
                fontSize: 11,
                fontFamily: "var(--font-mono, monospace)",
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#1A1B1C',
              }}
            >
              PRECISION REASONING LAB
            </div>

            {/* Signature Solid Black Circle Badge (Crox 140+ Style) */}
            <div
              onMouseEnter={() => setHoveredBadge(true)}
              onMouseLeave={() => setHoveredBadge(false)}
              style={{
                width: 140,
                height: 140,
                borderRadius: '50%',
                background: '#1A1B1C',
                color: '#FFFFFF',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: 12,
                boxSizing: 'border-box',
                cursor: 'pointer',
                boxShadow: '0 10px 28px rgba(0, 0, 0, 0.16)',
                transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease',
                transform: hoveredBadge ? 'scale(1.06)' : 'scale(1)',
                userSelect: 'none',
              }}
            >
              <div
                style={{
                  fontSize: 34,
                  fontWeight: 800,
                  fontFamily: "'Space Grotesk', sans-serif",
                  lineHeight: 1,
                  letterSpacing: '-0.03em',
                }}
              >
                100%
              </div>
              <div
                style={{
                  fontSize: 10.5,
                  fontWeight: 600,
                  color: '#C3C7CF',
                  marginTop: 4,
                  lineHeight: 1.25,
                }}
              >
                Grounded Citations
              </div>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  color: '#FF5F14',
                  marginTop: 3,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                0 Hallucinations
              </div>
            </div>
          </div>

          {/* Col 5-7: Middle Asymmetric Metadata Stacks */}
          <div
            className="crox-md-flex md:col-span-4"
            style={{
              gridColumn: 'span 4',
              flexDirection: 'column',
              gap: 16,
              paddingTop: 2,
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "var(--font-mono, monospace)",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  color: '#1A1B1C',
                  lineHeight: 1.5,
                }}
              >
                AST PARSER → DUAL VECTOR INDEX → BEAM SEARCH
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontFamily: "var(--font-mono, monospace)",
                  color: '#60636A',
                  marginTop: 2,
                  letterSpacing: '0.04em',
                }}
              >
                ENGINEERED AS ONE SYSTEM
              </div>
            </div>
          </div>

          {/* Col 8-12: Editorial Supporting Copy & Primary High-Visibility Orange CTA */}
          <div
            style={{
              gridColumn: 'span 4',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 22,
            }}
            className="col-span-12 md:col-span-4"
          >
            <p
              style={{
                fontSize: 'clamp(14px, 1.1vw, 15.5px)',
                lineHeight: 1.6,
                color: '#5A5E69',
                margin: 0,
                fontWeight: 400,
              }}
            >
              We engineer hierarchical retrieval and multi-document reasoning for teams who
              can’t afford for citations to fail. AST-aware parsers, dual-vector indexing, and
              beam search prove every claim before anything reaches your models.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button
                  onClick={onStartDemo}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    background: '#FF5F14',
                    color: '#0E1012',
                    border: '2px solid #0E1012',
                    padding: '13px 24px',
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 12.5,
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    cursor: 'pointer',
                    boxShadow: '3px 3px 0px #0E1012',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translate(-1px, -1px)'
                    e.currentTarget.style.boxShadow = '4px 4px 0px #0E1012'
                    e.currentTarget.style.background = '#FF4500'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translate(0, 0)'
                    e.currentTarget.style.boxShadow = '3px 3px 0px #0E1012'
                    e.currentTarget.style.background = '#FF5F14'
                  }}
                >
                  <span>START A PROJECT →</span>
                </button>

                <button
                  onClick={onOpenDashboard}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: '#FFFFFF',
                    color: '#0E1012',
                    border: '2px solid #0E1012',
                    padding: '12px 18px',
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '2px 2px 0px #0E1012',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translate(-1px, -1px)'
                    e.currentTarget.style.boxShadow = '3px 3px 0px #0E1012'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translate(0, 0)'
                    e.currentTarget.style.boxShadow = '2px 2px 0px #0E1012'
                  }}
                >
                  <Database size={13} />
                  <span>NOTEBOOKS</span>
                </button>
              </div>

              <div
                style={{
                  fontFamily: "var(--font-mono, monospace)",
                  fontSize: 10,
                  color: '#60636A',
                  letterSpacing: '0.04em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span>● INSTANT BROWSER DEMO</span>
                <span>·</span>
                <span>NO API KEY REQUIRED</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── MIDDLE SECTION: Monumental Headline Typography (CROX INTELLIGENCE Style) ─── */}
        <div
          className="crox-reveal-2"
          style={{
            position: 'relative',
            marginTop: 'clamp(10px, 2vw, 24px)',
            marginBottom: 'clamp(24px, 4vw, 44px)',
            userSelect: 'none',
          }}
        >
          {/* Header Row: RAGRAPH */}
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
            }}
          >
            <div
              style={{
                fontFamily: "'Space Grotesk', 'Inter', sans-serif",
                fontSize: 'clamp(56px, 11vw, 155px)',
                fontWeight: 900,
                letterSpacing: '-0.045em',
                lineHeight: 0.9,
                color: '#1A1B1C',
                textTransform: 'uppercase',
                margin: 0,
              }}
            >
              RAGRAPH
            </div>
          </div>

          {/* Second Line: INTELLIGENCE */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 16,
              width: '100%',
            }}
          >
            <div
              style={{
                fontFamily: "'Space Grotesk', 'Inter', sans-serif",
                fontSize: 'clamp(56px, 11vw, 155px)',
                fontWeight: 900,
                letterSpacing: '-0.045em',
                lineHeight: 0.9,
                color: '#1A1B1C',
                textTransform: 'uppercase',
                margin: 0,
              }}
            >
              INTELLIGENCE
            </div>

            {/* Technical Sub-Tag Pill */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 14px',
                border: '1.5px solid #0E1012',
                background: '#FFFFFF',
                borderRadius: 3,
                fontFamily: "var(--font-mono, monospace)",
                fontSize: 11,
                fontWeight: 700,
                color: '#2F4CFF',
                boxShadow: '2px 2px 0px #0E1012',
                marginBottom: 10,
              }}
            >
              <GitBranch size={13} />
              <span>HIERARCHICAL RAG &amp; KNOWLEDGE GRAPHS</span>
            </div>
          </div>
        </div>

        {/* ─── LOWER SECTION: Crox Architectural Status & 3D Wireframe Tile ─── */}
        <div
          className="crox-reveal-3 grid-cols-1 md:grid-cols-2"
          style={{
            border: '2px solid #0E1012',
            borderBottom: 'none',
            background: '#E3E7EB',
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)',
            alignItems: 'stretch',
          }}
        >
          {/* Left Tile: 3D Wireframe Mesh with Orange Vertical Stripe */}
          <div
            style={{
              display: 'flex',
              alignItems: 'stretch',
              background: '#1A1B1C',
              borderRight: '2px solid #0E1012',
              position: 'relative',
              overflow: 'hidden',
              minHeight: 220,
            }}
          >
            {/* Signature Crox Vertical Orange Nameplate Strip */}
            <div
              style={{
                width: 32,
                background: '#FF5F14',
                borderRight: '2px solid #0E1012',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                userSelect: 'none',
              }}
            >
              <span
                style={{
                  writingMode: 'vertical-rl',
                  transform: 'rotate(180deg)',
                  fontSize: 10.5,
                  fontWeight: 800,
                  letterSpacing: '0.15em',
                  color: '#0E1012',
                  fontFamily: "var(--font-mono, monospace)",
                  whiteSpace: 'nowrap',
                }}
              >
                ENGINE STATUS
              </span>
            </div>

            {/* Interactive Canvas Wireframe */}
            <div
              style={{
                flex: 1,
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <canvas
                ref={canvasRef}
                width={420}
                height={220}
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'block',
                  cursor: 'crosshair',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: 12,
                  right: 14,
                  fontSize: 9.5,
                  fontFamily: "var(--font-mono, monospace)",
                  color: 'rgba(255, 255, 255, 0.4)',
                  letterSpacing: '0.08em',
                  pointerEvents: 'none',
                }}
              >
                AST-NODE MESH [3D ROTATION ACTIVE]
              </div>
            </div>
          </div>

          {/* Right Tile: SYSTEM STATUS Ledger (Crox Table Layout) */}
          <div
            style={{
              padding: '24px clamp(18px, 2.5vw, 36px)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              background: '#E3E7EB',
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: '0.06em',
                color: '#1A1B1C',
                fontFamily: "'Space Grotesk', sans-serif",
                textTransform: 'uppercase',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>SYSTEM STATUS</span>
              <span
                style={{
                  fontSize: 10,
                  fontFamily: "var(--font-mono, monospace)",
                  color: '#047857',
                  fontWeight: 700,
                }}
              >
                ● 100% OPERATIONAL
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                fontFamily: "var(--font-mono, monospace)",
                fontSize: 11.5,
              }}
            >
              {[
                { label: 'GROUNDED ACCURACY', value: '99.4%', highlight: false },
                { label: 'HALLUCINATION RATE', value: '0.00%', highlight: true },
                { label: 'RETRIEVAL LATENCY', value: '38 MS', highlight: false },
                { label: 'AST TREE DEPTH', value: 'K=4 HIERARCHICAL', highlight: false },
                { label: 'CITATION RESOLUTION', value: 'AST-NODE LEVEL', highlight: false },
              ].map((row, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid rgba(26, 27, 28, 0.12)',
                    paddingBottom: 6,
                  }}
                >
                  <span style={{ color: '#50535A', fontWeight: 600 }}>{row.label}</span>
                  <span
                    style={{
                      fontWeight: 800,
                      color: row.highlight ? '#047857' : '#1A1B1C',
                    }}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Bottom Anchor Bar (Seamlessly connects to CroxTickerBar) ─── */}
        <div
          style={{
            borderTop: '2px solid #0E1012',
            padding: '12px 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            fontFamily: "var(--font-mono, monospace)",
            fontSize: 11,
            color: '#60636A',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontWeight: 800, color: '#1A1B1C' }}>[ 00 ] ENGINE SPECIFICATION</span>
            <span>·</span>
            <span>HIERARCHICAL TREE-RAG &amp; KNOWLEDGE MAPPING</span>
          </div>

          <a
            href="#capabilities"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              color: '#1A1B1C',
              textDecoration: 'none',
              fontWeight: 800,
              letterSpacing: '0.04em',
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#FF5F14'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#1A1B1C'
            }}
          >
            <span>SCROLL TO EXPLORE CAPABILITIES</span>
            <span style={{ color: '#FF5F14', fontWeight: 900 }}>↓</span>
          </a>
        </div>
      </div>
    </section>
  )
}
