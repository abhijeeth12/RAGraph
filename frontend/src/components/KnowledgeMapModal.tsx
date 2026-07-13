'use client'
import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Maximize, Minimize } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useSearchStore } from '@/store/useSearchStore'
import { getDocumentGraph } from '@/lib/api'

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
  
  const [isFullscreen, setIsFullscreen] = useState(false)
  const graphRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })

  const [loading, setLoading] = useState(false)

  const selectedDocIdsString = Object.entries(selectedDocuments)
    .filter(([_, isSelected]) => isSelected)
    .map(([id]) => id)
    .sort()
    .join(',')

  useEffect(() => {
    if (!isOpen) return
    
    let isMounted = true
    const selectedDocIds = selectedDocIdsString ? selectedDocIdsString.split(',') : []

    async function fetchGraph() {
      setLoading(true)
      try {
        const data = await getDocumentGraph(selectedDocIds.length > 0 ? selectedDocIds : undefined)
        if (isMounted) {
          if (data.nodes.length === 1) {
            data.nodes[0].name = "Select documents to explore."
          }
          
          // CRITICAL: react-force-graph crashes if a link points to a non-existent node
          const nodeIds = new Set(data.nodes.map((n: any) => n.id))
          const validLinks = data.links.filter((l: any) => nodeIds.has(l.source) && nodeIds.has(l.target))
          
          setRawData({ nodes: data.nodes, links: validLinks } as any)
          
          // Default expand Root and Documents
          const defaultExpanded = new Set<string>(['root'])
          data.nodes.forEach((n: any) => {
             if (n.group === 'document') defaultExpanded.add(n.id)
          })
          setExpandedNodes(defaultExpanded)
        }
      } catch (e) {
        console.error("Failed to fetch graph", e)
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    
    fetchGraph()
    
    return () => { isMounted = false }
  }, [isOpen, selectedDocIdsString])

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
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                Visualizing architecture and entities from selected documents.
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: 12 }}>
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
          <div ref={containerRef} style={{ flex: 1, position: 'relative', background: '#0a0a0c' }}>
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
                  case 'h1': return '#c4eed0' // Green
                  case 'h2': return '#f2b8b5' // Red
                  case 'h3': return '#c3b5fd' // Purple
                  case 'paragraph': return '#e3e3e3' // Grey
                  default: return '#fff'
                }
              }}
              nodeRelSize={6}
              linkColor={() => 'rgba(255, 255, 255, 0.25)'}
              linkWidth={2}
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
              nodeCanvasObject={(node: any, ctx, globalScale) => {
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
                  case 'h1': glowColor = '196, 238, 208'; break;
                  case 'h2': glowColor = '242, 184, 181'; break;
                  case 'h3': glowColor = '195, 181, 253'; break;
                  case 'paragraph': glowColor = '227, 227, 227'; break;
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
            
            {loading && (
              <div style={{ position: 'absolute', top: 20, right: 20, color: 'var(--text-muted)' }}>
                Building Map...
              </div>
            )}
            
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
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#c4eed0' }}></span> Sections (H1/H2/H3)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#e3e3e3' }}></span> Paragraphs
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
