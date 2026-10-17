'use client'
import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Maximize, Minimize, Sparkles, LayoutGrid } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useSearchStore } from '@/store/useSearchStore'
import { getKnowledgeMap, generateKnowledgeMap } from '@/lib/api'
import { KnowledgeMindMap } from './KnowledgeMap/MindMap'

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false })

interface KnowledgeMapModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function KnowledgeMapModal({ isOpen, onClose }: KnowledgeMapModalProps) {
  const store = useSearchStore()
  const { documents, selectedDocuments } = store
  
  const [rawData, setRawData] = useState({ nodes: [], links: [] })
  const [graphData, setGraphData] = useState({ nodes: [], links: [] })
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['root']))
  const [outline, setOutline] = useState<any>(null)
  const [mode, setMode] = useState<'mindmap' | 'graph'>('mindmap')

  // On-demand map lifecycle: loading -> empty | ready (+regenerate) ; generating polls
  const [phase, setPhase] = useState<'loading' | 'idle'>('loading')
  const [generating, setGenerating] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [staleDocs, setStaleDocs] = useState<string[]>([])
  const [docCount, setDocCount] = useState(0)
  const busyRef = useRef(false)
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  
  const [isFullscreen, setIsFullscreen] = useState(false)
  const graphRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })

  const selectedDocIdsString = Object.entries(selectedDocuments)
    .filter(([_, isSelected]) => isSelected)
    .map(([id]) => id)
    .sort()
    .join(',')

  useEffect(() => {
    if (!isOpen) return

    let isMounted = true
    const selectedDocIds = selectedDocIdsString ? selectedDocIdsString.split(',') : []

    const clearPoll = () => {
      if (pollTimer.current) { clearTimeout(pollTimer.current); pollTimer.current = null }
    }

    async function pollStatus(): Promise<void> {
      try {
        const data = await getKnowledgeMap(selectedDocIds.length > 0 ? selectedDocIds : undefined)
        if (!isMounted) return
        if (data.generating || data.status === 'generating') {
          setGenerating(true)
          pollTimer.current = setTimeout(() => { if (isMounted) void pollStatus() }, 3000)
          return
        }
        setGenerating(false)
        if (data.exists && (data.outline as any)?.children?.length) {
          applyMap(data)
          setErrorMsg(null)
        } else if (data.status === 'failed' || (data as any).error) {
          // Failed with no prior map: stay on empty/error, never show partial data
          setErrorMsg((data as any).error || 'Map generation failed. Please try again.')
        }
      } catch (e: any) {
        if (!isMounted) return
        setGenerating(false)
        setErrorMsg(e?.message || 'Failed to check map status')
      }
    }

    function applyMap(data: any) {
      setOutline(data.outline)
      const g = data.graph || { nodes: [], links: [] }
      setRawData({ nodes: g.nodes, links: g.links } as any)
      const next = new Set<string>(['root'])
      g.nodes.forEach((n: any) => { if (n.group === 'document') next.add(n.id) })
      setExpandedNodes(next)
      setStaleDocs(data.stale ? (data.new_docs || []) : [])
      setDocCount(data.doc_count || 0)
    }

    async function loadStatus() {
      setPhase('loading')
      setErrorMsg(null)
      try {
        const data = await getKnowledgeMap(selectedDocIds.length > 0 ? selectedDocIds : undefined)
        if (!isMounted) return
        setDocCount(data.doc_count || 0)
        if (data.generating || data.status === 'generating') {
          setGenerating(true)
          // Keep any existing outline visible while regeneration runs
          pollTimer.current = setTimeout(() => { if (isMounted) void pollStatus() }, 3000)
        } else if (data.exists && (data.outline as any)?.children?.length) {
          applyMap(data)
        } else if (data.status === 'failed' || (data as any).error) {
          setOutline(null)
          setErrorMsg((data as any).error || 'Map generation failed. Please try again.')
        }
        // else: no map yet -> empty state with Generate button
      } catch (e: any) {
        if (!isMounted) return
        setErrorMsg(e?.message || 'Failed to load knowledge map')
      } finally {
        if (isMounted) setPhase('idle')
      }
    }

    void loadStatus()

    return () => { isMounted = false; clearPoll() }
  }, [isOpen, selectedDocIdsString])

  async function handleGenerate() {
    if (busyRef.current || generating) return // double-click / concurrent guard
    busyRef.current = true
    setErrorMsg(null)
    setGenerating(true)
    try {
      const selectedDocIds = selectedDocIdsString ? selectedDocIdsString.split(',') : []
      await generateKnowledgeMap(selectedDocIds.length > 0 ? selectedDocIds : undefined)
      // Poll until done/failed; the previous map (if any) stays visible meanwhile
      const poll = async (): Promise<void> => {
        try {
          const data = await getKnowledgeMap(selectedDocIds.length > 0 ? selectedDocIds : undefined)
          if (data.generating || data.status === 'generating') {
            pollTimer.current = setTimeout(() => void poll(), 3000)
            return
          }
          setGenerating(false)
          if (data.exists && (data.outline as any)?.children?.length) {
            setOutline(data.outline)
            const g = data.graph || { nodes: [], links: [] }
            setRawData({ nodes: g.nodes, links: g.links } as any)
            const next = new Set<string>(['root'])
            g.nodes.forEach((n: any) => { if (n.group === 'document') next.add(n.id) })
            setExpandedNodes(next)
            setStaleDocs([])
            setDocCount(data.doc_count || 0)
            setErrorMsg(null)
          } else {
            // Failure: previous map (if any) is untouched — surface the error only
            setErrorMsg((data as any)?.error || 'Map generation failed. Your previous map was kept.')
          }
        } catch (e: any) {
          setGenerating(false)
          setErrorMsg(e?.message || 'Map generation failed. Your previous map was kept.')
        }
      }
      pollTimer.current = setTimeout(() => void poll(), 3000)
    } catch (e: any) {
      // 409 (already running) -> just poll; other errors -> message, old map kept
      const msg = e?.message || ''
      if (/already in progress|409/.test(msg)) {
        const selectedDocIds = selectedDocIdsString ? selectedDocIdsString.split(',') : []
        const poll = async (): Promise<void> => {
          try {
            const data = await getKnowledgeMap(selectedDocIds.length > 0 ? selectedDocIds : undefined)
            if (data.generating || data.status === 'generating') {
              pollTimer.current = setTimeout(() => void poll(), 3000)
              return
            }
            setGenerating(false)
          } catch { setGenerating(false) }
        }
        pollTimer.current = setTimeout(() => void poll(), 3000)
      } else {
        setGenerating(false)
        setErrorMsg(msg || 'Failed to start map generation')
      }
    } finally {
      busyRef.current = false
    }
  }

  useEffect(() => {
    if (!rawData.nodes.length) return
    
    const childrenMap = new Map<string, string[]>()
    rawData.links.forEach((l: any) => {
      const src = typeof l.source === 'object' ? l.source.id : l.source
      const tgt = typeof l.target === 'object' ? l.target.id : l.target
      if (!childrenMap.has(src)) childrenMap.set(src, [])
      childrenMap.get(src)!.push(tgt)
    })

    const visibleNodes = new Set<string>()
    visibleNodes.add('root')
    
    const queue = ['root']
    while(queue.length > 0) {
      const curr = queue.shift()!
      if (expandedNodes.has(curr)) {
          const children = childrenMap.get(curr) || []
          children.forEach(c => {
             visibleNodes.add(c)
             queue.push(c)
          })
      }
    }
    
    const nodes = rawData.nodes.filter((n: any) => visibleNodes.has(n.id)).map((n: any) => ({...n}))
    const links = rawData.links.filter((l: any) => {
      const src = typeof l.source === 'object' ? l.source.id : l.source
      const tgt = typeof l.target === 'object' ? l.target.id : l.target
      return visibleNodes.has(src) && visibleNodes.has(tgt)
    }).map((l: any) => ({...l}))
    
    nodes.forEach((n: any) => {
        n._hasChildren = (childrenMap.get(n.id)?.length || 0) > 0
        n._isExpanded = expandedNodes.has(n.id)
    })
    
    setGraphData({ nodes, links } as any)
  }, [rawData, expandedNodes])

  useEffect(() => {
    if (isOpen && containerRef.current) {
      setDimensions({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight
      })
    }
    
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        })
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isOpen, isFullscreen])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(10px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: isFullscreen ? 0 : '4vh 4vw'
        }}
      >
        <motion.div
          initial={{ scale: 0.95, y: 10 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 10 }}
          style={{
            background: 'var(--bg-app)',
            borderRadius: isFullscreen ? 0 : 20,
            border: isFullscreen ? 'none' : '1px solid var(--border)',
            width: '100%',
            height: '100%',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(30,31,32,0.8)'
          }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 500, fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent-blue)', boxShadow: '0 0 10px var(--accent-blue)' }}></div>
                Knowledge Map
                {mode==='mindmap' && outline && <span style={{ fontSize: 11, background:'rgba(168,199,250,0.15)', color:'#a8c7fa', padding:'2px 8px', borderRadius:20, display:'inline-flex', alignItems:'center', gap:4 }}><Sparkles size={11}/> NotebookLM style</span>}
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                {mode==='mindmap' ? 'Hierarchical mind map – LLM outline' : 'Force-graph entity view'} • {outline ? `${outline.name}` : 'Visualizing architecture and entities'}
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: 8, alignItems:'center' }}>
              {outline && (
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="btn-ghost"
                  style={{ padding:'6px 14px', fontSize:12, display:'flex', alignItems:'center', gap:6, border:'1px solid var(--border)', borderRadius:20, opacity: generating ? 0.6 : 1, cursor: generating ? 'default' : 'pointer' }}
                  title={staleDocs.length ? `Includes ${staleDocs.length} new document(s)` : 'Generate a new map from current documents'}
                >
                  <Sparkles size={14}/> {generating ? 'Generating…' : '+ Regenerate'}
                </button>
              )}
              <button
                onClick={() => setMode(m => m==='mindmap' ? 'graph' : 'mindmap')}
                className="btn-ghost"
                style={{ padding:'6px 10px', fontSize:12, display:'flex', alignItems:'center', gap:6, border:'1px solid var(--border)', borderRadius:20 }}
                title="Switch view"
              >
                <LayoutGrid size={14}/> {mode==='mindmap' ? 'Graph' : 'Mind Map'}
              </button>
              <button 
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="btn-ghost"
                style={{ padding: 8 }}
                title="Toggle Fullscreen"
              >
                {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
              </button>
              <button 
                onClick={onClose}
                className="btn-ghost"
                style={{ padding: 8 }}
                title="Close Map"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Graph Container */}
          <div ref={containerRef} style={{ flex: 1, position: 'relative', background: '#0a0a0c', overflow:'hidden' }}>
            {phase === 'loading' ? (
              <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:12 }}>
                <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Loading knowledge map…</p>
              </div>
            ) : generating && !outline ? (
              <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:12 }}>
                <p style={{ fontSize: 15, color: 'var(--text-primary)' }}>Generating knowledge map…</p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 420, textAlign:'center', lineHeight:1.6 }}>
                  Synthesizing concepts across your documents. This can take a minute — you can close this window and come back.
                </p>
              </div>
            ) : !outline ? (
              <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:14, padding: 24 }}>
                {docCount === 0 ? (
                  <>
                    <p style={{ fontSize: 15, color: 'var(--text-primary)' }}>No documents in this notebook yet</p>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 420, textAlign:'center', lineHeight:1.6 }}>
                      Upload documents first — then return here to generate a unified knowledge map.
                    </p>
                  </>
                ) : (
                  <>
                    <p style={{ fontSize: 15, color: 'var(--text-primary)' }}>No knowledge map yet</p>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 420, textAlign:'center', lineHeight:1.6 }}>
                      Generate one cohesive map from all {docCount} document{docCount === 1 ? '' : 's'} in this notebook.
                    </p>
                    <button
                      onClick={handleGenerate}
                      disabled={generating}
                      style={{ padding:'10px 28px', fontSize:14, fontWeight:600, display:'flex', alignItems:'center', gap:8, background:'var(--accent-blue)', color:'#fff', border:'none', borderRadius:24, cursor:'pointer', opacity: generating ? 0.6 : 1 }}
                    >
                      <Sparkles size={15}/> + Generate
                    </button>
                  </>
                )}
                {errorMsg && (
                  <p style={{ fontSize: 13, color:'#f2b8b5', maxWidth: 460, textAlign:'center', lineHeight:1.6 }}>{errorMsg}</p>
                )}
              </div>
            ) : (
              <>
              {staleDocs.length > 0 && (
                <div style={{ position:'absolute', top:12, left:'50%', transform:'translateX(-50%)', zIndex:5, background:'rgba(20,20,20,0.92)', border:'1px solid var(--border)', borderRadius:20, padding:'6px 14px', fontSize:12, color:'var(--text-muted)', display:'flex', alignItems:'center', gap:8 }}>
                  <span>{staleDocs.length} new document{staleDocs.length === 1 ? '' : 's'} not in this map</span>
                  <button onClick={handleGenerate} disabled={generating} style={{ background:'none', border:'none', color:'var(--accent-blue)', cursor:'pointer', fontSize:12, fontWeight:600 }}>Regenerate to include</button>
                </div>
              )}
              {errorMsg && (
                <div style={{ position:'absolute', top: staleDocs.length > 0 ? 52 : 12, left:'50%', transform:'translateX(-50%)', zIndex:5, background:'rgba(60,20,20,0.92)', border:'1px solid #f2b8b5', borderRadius:12, padding:'8px 14px', fontSize:12, color:'#f2b8b5', maxWidth:'80%', textAlign:'center' }}>
                  {errorMsg} Your existing map was kept.
                </div>
              )}
              {generating && (
                <div style={{ position:'absolute', top:12, right:12, zIndex:5, background:'rgba(20,20,20,0.92)', border:'1px solid var(--border)', borderRadius:20, padding:'6px 14px', fontSize:12, color:'var(--text-muted)' }}>
                  Regenerating…
                </div>
              )}
              {mode==='mindmap' ? (
              <KnowledgeMindMap outline={outline} onSelect={(name)=>{ console.log('select',name)}} />
            ) : (
            <>
            <ForceGraph2D
              ref={graphRef}
              dagMode="lr"
              dagLevelDistance={200}
              width={dimensions.width}
              height={dimensions.height}
              graphData={graphData}
              nodeLabel="text"
              nodeColor={(node: any) => {
                switch(node.group) {
                  case 'root': return '#ffdf99' // Yellow
                  case 'document': return '#a8c7fa' // Blue
                  case 'concept': return '#c4eed0' // Green
                  case 'person': return '#f2b8b5' // Red
                  case 'organization': return '#c3b5fd' // Purple
                  case 'location': return '#f6c382' // Orange
                  default: return '#e3e3e3' // Grey
                }
              }}
              nodeRelSize={6}
              linkColor={() => 'rgba(255, 255, 255, 0.25)'}
              linkWidth={2}
              linkCanvasObjectMode={() => 'after'}
              linkCanvasObject={(link: any, ctx: any, globalScale: number) => {
                const MAX_FONT_SIZE = 4
                const LABEL_NODE_MARGIN = 12 / globalScale

                const start = link.source
                const end = link.target

                if (typeof start !== 'object' || typeof end !== 'object') return

                if (!link.label) return

                const textPos = Object.assign({}, ...['x', 'y'].map(c => ({
                  [c]: start[c] + (end[c] - start[c]) / 2 // calc middle point
                })))

                const relLink = { x: end.x - start.x, y: end.y - start.y }
                const maxTextLength = Math.sqrt(Math.pow(relLink.x, 2) + Math.pow(relLink.y, 2)) - LABEL_NODE_MARGIN * 2

                let textAngle = Math.atan2(relLink.y, relLink.x)
                if (textAngle > Math.PI / 2) textAngle = -(Math.PI - textAngle)
                if (textAngle < -Math.PI / 2) textAngle = -(-Math.PI - textAngle)

                const label = link.label
                const fontSize = 10 / globalScale
                ctx.font = `${fontSize}px Inter, sans-serif`
                
                ctx.save()
                ctx.translate(textPos.x, textPos.y)
                ctx.rotate(textAngle)

                ctx.textAlign = 'center'
                ctx.textBaseline = 'middle'
                
                const textWidth = ctx.measureText(label).width
                
                ctx.fillStyle = 'rgba(24, 25, 27, 0.8)'
                ctx.fillRect(-textWidth / 2 - 2/globalScale, -fontSize / 2 - 2/globalScale, textWidth + 4/globalScale, fontSize + 4/globalScale)
                
                ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
                ctx.fillText(label, 0, 0)
                
                ctx.restore()
              }}
              d3VelocityDecay={0.3}
              onNodeClick={(node: any) => {
                const nodeId = node.id
                setExpandedNodes(prev => {
                    const next = new Set(prev)
                    if (next.has(nodeId)) next.delete(nodeId)
                    else next.add(nodeId)
                    return next
                })
                
                // Focus camera on node
                if (graphRef.current) {
                  graphRef.current.centerAt(node.x, node.y, 1000)
                  graphRef.current.zoom(8, 2000)
                }
              }}
              nodeCanvasObject={(node: any, ctx: any, globalScale: number) => {
                const label = node.name
                const fontSize = 14 / globalScale
                ctx.font = `${fontSize}px Inter, sans-serif`
                
                // Calculate dimensions
                const textWidth = ctx.measureText(label).width
                const paddingX = 16 / globalScale
                const paddingY = 10 / globalScale
                const bckgDimensions = [textWidth + paddingX * 2, fontSize + paddingY * 2]
                
                const nodeColor = node.color || '#fff'
                
                ctx.save()
                
                // Draw rounded rectangle background
                const x = node.x - bckgDimensions[0] / 2
                const y = node.y - bckgDimensions[1] / 2
                const width = bckgDimensions[0]
                const height = bckgDimensions[1]
                const radius = 8 / globalScale

                ctx.beginPath()
                ctx.moveTo(x + radius, y)
                ctx.lineTo(x + width - radius, y)
                ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
                ctx.lineTo(x + width, y + height - radius)
                ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
                ctx.lineTo(x + radius, y + height)
                ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
                ctx.lineTo(x, y + radius)
                ctx.quadraticCurveTo(x, y, x + radius, y)
                ctx.closePath()

                // Fill background (sleek dark slate)
                ctx.fillStyle = 'rgba(24, 25, 27, 0.95)'
                ctx.fill()
                
                // Stroke border with subtle glow
                ctx.lineWidth = 1.5 / globalScale
                let glowColor = '255, 255, 255'
                switch(node.group) {
                  case 'root': glowColor = '255, 223, 153'; break;
                  case 'document': glowColor = '168, 199, 250'; break;
                  case 'concept': glowColor = '196, 238, 208'; break;
                  case 'person': glowColor = '242, 184, 181'; break;
                  case 'organization': glowColor = '195, 181, 253'; break;
                  case 'location': glowColor = '246, 195, 130'; break;
                  default: glowColor = '227, 227, 227'; break;
                }
                ctx.strokeStyle = `rgba(${glowColor}, 0.5)`
                ctx.stroke()
                
                // Add a small colored dot next to text
                const dotRadius = 4 / globalScale
                const dotX = x + paddingX
                const dotY = node.y
                ctx.beginPath()
                ctx.arc(dotX, dotY, dotRadius, 0, 2 * Math.PI)
                ctx.fillStyle = nodeColor
                ctx.fill()

                // Draw Text
                ctx.textAlign = 'left'
                ctx.textBaseline = 'middle'
                ctx.fillStyle = '#e3e3e3' // Bright white-grey text
                ctx.fillText(label, dotX + dotRadius * 2 + 4/globalScale, node.y)
                
                // Draw expand/collapse indicator if it has children
                if (node._hasChildren) {
                    const iconX = x + width + (12 / globalScale)
                    const iconY = node.y
                    const r = 7 / globalScale
                    
                    ctx.beginPath()
                    ctx.arc(iconX, iconY, r, 0, 2*Math.PI)
                    ctx.fillStyle = 'rgba(24, 25, 27, 1)'
                    ctx.fill()
                    ctx.strokeStyle = `rgba(${glowColor}, 0.8)`
                    ctx.lineWidth = 1 / globalScale
                    ctx.stroke()
                    
                    ctx.fillStyle = '#fff'
                    ctx.textAlign = 'center'
                    ctx.textBaseline = 'middle'
                    const iconStr = node._isExpanded ? '<' : '>'
                    ctx.fillText(iconStr, iconX, iconY + (1/globalScale))
                }
                
                ctx.restore()
              }}
            />
            
            {/* Legend / Overlay */}
            <div style={{
              position: 'absolute', bottom: 20, left: 20,
              background: 'rgba(20,20,20,0.8)', padding: '12px 16px',
              borderRadius: 12, border: '1px solid var(--border)',
              display: 'flex', flexDirection: 'column', gap: 8, backdropFilter: 'blur(10px)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#ffdf99' }}></span> Knowledge Base
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#a8c7fa' }}></span> Documents
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#c4eed0' }}></span> Concepts
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#f2b8b5' }}></span> Persons
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#c3b5fd' }}></span> Organizations
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#f6c382' }}></span> Locations
              </div>
            </div>
            </>
            )}
            </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
