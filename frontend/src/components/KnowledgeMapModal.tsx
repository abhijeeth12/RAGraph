'use client'
import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Maximize, Minimize } from 'lucide-react'
import ForceGraph2D from 'react-force-graph-2d'
import { useSearchStore } from '@/store/useSearchStore'

interface KnowledgeMapModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function KnowledgeMapModal({ isOpen, onClose }: KnowledgeMapModalProps) {
  const store = useSearchStore()
  const { documents, selectedDocuments } = store
  
  const [graphData, setGraphData] = useState({ nodes: [], links: [] })
  const [isFullscreen, setIsFullscreen] = useState(false)
  const graphRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })

  useEffect(() => {
    if (!isOpen) return
    
    // Generate graph data based on selected documents
    const selectedDocs = documents.filter(doc => selectedDocuments[doc.doc_id])
    
    const nodes: any[] = []
    const links: any[] = []
    
    // Root Node
    nodes.push({ id: 'root', name: 'Knowledge Base', group: 0, val: 20 })
    
    selectedDocs.forEach(doc => {
      // Document Node
      nodes.push({ id: doc.doc_id, name: doc.filename, group: 1, val: 10 })
      links.push({ source: 'root', target: doc.doc_id })
      
      // Dummy metadata nodes to mimic the "Mindmap" architecture visually
      const subtopics = ['Metadata', 'Chunks', 'Entities']
      subtopics.forEach((topic, i) => {
        const topicId = `${doc.doc_id}-${topic}`
        nodes.push({ id: topicId, name: topic, group: 2, val: 5 })
        links.push({ source: doc.doc_id, target: topicId })
      })
    })

    if (nodes.length === 1) {
       nodes[0].name = "Select documents to explore."
    }
    
    setGraphData({ nodes, links } as any)
  }, [isOpen, documents, selectedDocuments])

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
              width={dimensions.width}
              height={dimensions.height}
              graphData={graphData}
              nodeLabel="name"
              nodeColor={(node: any) => {
                if (node.group === 0) return '#a8c7fa'
                if (node.group === 1) return '#c4eed0'
                return '#ffdf99'
              }}
              nodeRelSize={6}
              linkColor={() => 'rgba(255,255,255,0.1)'}
              linkWidth={1.5}
              d3VelocityDecay={0.3}
              onNodeClick={(node: any) => {
                // Focus camera on node
                if (graphRef.current) {
                  graphRef.current.centerAt(node.x, node.y, 1000)
                  graphRef.current.zoom(8, 2000)
                }
              }}
              nodeCanvasObject={(node: any, ctx, globalScale) => {
                const label = node.name
                const fontSize = 12/globalScale
                ctx.font = `${fontSize}px Sans-Serif`
                const textWidth = ctx.measureText(label).width
                const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2) // some padding

                ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
                ctx.fillRect(
                  node.x - bckgDimensions[0] / 2,
                  node.y - bckgDimensions[1] / 2,
                  bckgDimensions[0],
                  bckgDimensions[1]
                )

                ctx.textAlign = 'center'
                ctx.textBaseline = 'middle'
                ctx.fillStyle = node.color
                ctx.fillText(label, node.x, node.y)
                
                // Add a border
                ctx.strokeStyle = node.color
                ctx.lineWidth = 0.5 / globalScale
                ctx.strokeRect(
                   node.x - bckgDimensions[0] / 2,
                   node.y - bckgDimensions[1] / 2,
                   bckgDimensions[0],
                   bckgDimensions[1]
                )
              }}
            />
            
            {/* Legend / Overlay */}
            <div style={{
              position: 'absolute', bottom: 20, left: 20,
              background: 'rgba(20,20,20,0.8)', padding: '12px 16px',
              borderRadius: 12, border: '1px solid var(--border)',
              display: 'flex', flexDirection: 'column', gap: 8
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#a8c7fa' }}></span> Knowledge Base
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#c4eed0' }}></span> Documents
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#ffdf99' }}></span> Concepts
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
