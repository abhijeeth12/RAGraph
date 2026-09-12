'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useMemo, useRef, useEffect } from 'react'

export type OutlineNode = { name: string; children?: OutlineNode[] }

type PositionedNode = {
  id: string
  name: string
  depth: number
  x: number
  y: number
  hasChildren: boolean
  isExpanded: boolean
  orig: OutlineNode
}

type Edge = { source: string; target: string }

function buildVisible(outline: OutlineNode, expanded: Set<string>) {
  const nodes: PositionedNode[] = []
  const edges: Edge[] = []
  const positions = new Map<string, { x: number; y: number }>()
  let idCounter = 0
  const genId = (prefix: string, name: string) => `${prefix}-${name.toLowerCase().replace(/\W+/g,'-')}-${idCounter++}`

  // Assign ids recursively
  function assignIds(node: OutlineNode, depth: number, path: string): any {
    const id = path || 'root'
    const children = node.children || []
    return { id, name: node.name, orig: node, children: children.map((c,i) => assignIds(c, depth+1, `${id}/${i}-${c.name}`)) }
  }
  const rooted = assignIds(outline, 0, 'root')

  // BFS to collect visible
  const queue: any[] = [rooted]
  const visible = new Set<string>(['root'])
  while (queue.length) {
    const cur = queue.shift()!
    if (expanded.has(cur.id)) {
      for (const ch of cur.children) {
        visible.add(ch.id)
        queue.push(ch)
      }
    }
  }
  // Include root always
  // Build edges visible
  function collectEdges(node: any) {
    if (!visible.has(node.id)) return
    for (const ch of node.children) {
      if (visible.has(ch.id)) {
        edges.push({ source: node.id, target: ch.id })
        collectEdges(ch)
      }
    }
  }
  collectEdges(rooted)
  // Flatten visible nodes
  function flatten(node: any) {
    if (!visible.has(node.id)) return
    nodes.push(node)
    for (const ch of node.children) flatten(ch)
  }
  flatten(rooted)

  return { nodes: nodes as any, edges }
}

function layoutNodes(nodes: any[], edges: Edge[]): Map<string, {x:number,y:number}> {
  // Column layout like image: depth 0 x=80, depth1 x=380, depth2 x=780
  const depthGroups = new Map<number, any[]>()
  for (const n of nodes) {
    const depth = n.id.split('/').length - 1
    if (!depthGroups.has(depth)) depthGroups.set(depth, [])
    depthGroups.get(depth)!.push(n)
  }
  const pos = new Map<string, {x:number,y:number}>()
  const colX: Record<number, number> = { 0: 80, 1: 380, 2: 780, 3: 780 }
  const containerH = Math.max(400, (depthGroups.get(1)?.length || 1) * 70 + 100)
  for (const [depth, group] of depthGroups) {
    const x = colX[depth] ?? 780
    // Distribute vertically centered
    const count = group.length
    const startY = 60
    const gap = count > 1 ? (containerH - 120) / (count - 1) : 0
    // Sort by original order – group already in BFS order, keep
    group.forEach((n, i) => {
      const y = count === 1 ? containerH / 2 : startY + i * gap
      // For depth 2 leaves that share same parent, cluster around parent Y
      pos.set(n.id, { x, y })
    })
  }
  // Adjust leaves to cluster near parent
  for (const n of nodes) {
    if (n.id === 'root') continue
    const parentId = n.id.substring(0, n.id.lastIndexOf('/'))
    if (pos.has(parentId) && n.id.split('/').length === 3) {
      const parentPos = pos.get(parentId)!
      const siblings = nodes.filter(m => m.id.startsWith(parentId + '/'))
      if (siblings.length > 1) {
        const idx = siblings.findIndex(s => s.id === n.id)
        const spread = 36
        const baseY = parentPos.y
        const offset = (idx - (siblings.length-1)/2) * spread
        pos.set(n.id, { x: colX[2], y: baseY + offset })
      }
    }
  }
  return pos
}

export function KnowledgeMindMap({ outline, onSelect }: { outline: OutlineNode; onSelect?: (name:string)=>void }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['root']))
  const [hovered, setHovered] = useState<string|null>(null)

  // Auto-expand first level on mount
  useEffect(() => {
    const children = outline.children ?? []
    if (children.length) {
      const ids = new Set<string>(['root'])
      children.forEach((c, i) => ids.add(`root/${i}-${c.name}`))
      // Expand each L1 that has leaves by default (like image shows Motivation expanded)
      const currentChildren = children
      ids.forEach(id => {
        if (id !== 'root') {
          const idx = parseInt(id.split('/')[1].split('-')[0],10)
          if (!Number.isNaN(idx) && currentChildren[idx]?.children?.length) ids.add(id)
        }
      })
      setExpanded(ids)
    } else {
      setExpanded(new Set(['root']))
    }
  }, [outline])

  const { nodes, edges } = useMemo(() => buildVisible(outline, expanded), [outline, expanded])
  const posMap = useMemo(() => layoutNodes(nodes, edges), [nodes, edges])

  const width = 1000
  const height = Math.max(420, nodes.length * 18 + 200)

  const toggle = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div style={{ width:'100%', height:'100%', overflow:'auto', background:'#0f1419', position:'relative' }}>
      <svg width={width} height={height} style={{ display:'block', minHeight: height }} viewBox={`0 0 ${width} ${height}`}>
        {/* Edges with bezier */}
        <g>
          {edges.map((e, i) => {
            const s = posMap.get(e.source)
            const t = posMap.get(e.target)
            if (!s || !t) return null
            const cx = (s.x + t.x) / 2
            const path = `M ${s.x+60} ${s.y} C ${cx} ${s.y}, ${cx} ${t.y}, ${t.x-60} ${t.y}`
            const isHovered = hovered===e.source || hovered===e.target
            return (
              <motion.path
                key={`${e.source}->${e.target}-${i}`}
                d={path}
                fill="none"
                stroke={isHovered ? 'rgba(168,199,250,0.9)' : 'rgba(160,174,192,0.45)'}
                strokeWidth={isHovered ? 2.2 : 1.4}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.6, delay: i*0.04, ease:'easeOut' }}
                style={{ filter: isHovered ? 'drop-shadow(0 0 4px rgba(168,199,250,0.5))' : undefined }}
              />
            )
          })}
        </g>

        {/* Nodes */}
        {nodes.map((n: any, idx: number) => {
          const p = posMap.get(n.id)
          if (!p) return null
          const depth = n.id.split('/').length - 1
          const hasChildren = (n.children?.length || 0) > 0
          const isExpanded = expanded.has(n.id)
          const isRoot = n.id==='root'
          const bg = depth===0 ? '#2d3748' : depth===1 ? '#2d3748' : '#1a3a2e'
          const border = depth===0 ? 'rgba(168,199,250,0.6)' : depth===1 ? 'rgba(160,174,192,0.5)' : 'rgba(104,211,145,0.45)'
          const textColor = depth===2 ? '#c6f6d5' : '#e2e8f0'
          return (
            <motion.g
              key={n.id}
              initial={{ opacity: 0, x: p.x - 20, scale: 0.92 }}
              animate={{ opacity: 1, x: p.x, scale: 1 }}
              transition={{ type:'spring', stiffness: 320, damping: 22, delay: idx*0.04 }}
              onHoverStart={() => setHovered(n.id)}
              onHoverEnd={() => setHovered(null)}
              style={{ cursor: hasChildren ? 'pointer' : onSelect ? 'pointer' : 'default' }}
              onClick={() => {
                if (hasChildren) toggle(n.id)
                else onSelect?.(n.name)
              }}
            >
              {/* Pill background */}
              <motion.rect
                x={p.x - 70}
                y={p.y - 16}
                rx={8}
                width={140}
                height={32}
                fill={bg}
                stroke={border}
                strokeWidth={hovered===n.id ? 1.6 : 1}
                whileHover={{ scale: 1.03 }}
                style={{ filter: hovered===n.id ? 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))' : 'drop-shadow(0 2px 6px rgba(0,0,0,0.3))' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              />
              {/* Label */}
              <text
                x={p.x}
                y={p.y + 4}
                textAnchor="middle"
                fill={textColor}
                fontSize={12}
                fontFamily="Inter, system-ui, sans-serif"
                fontWeight={depth===0 ? 600 : 500}
                style={{ pointerEvents:'none', userSelect:'none' }}
              >
                {n.name.length>22 ? n.name.slice(0,22)+'…' : n.name}
              </text>
              {/* Expand/collapse badge – like image's < > */}
              {hasChildren && (
                <g
                  onClick={(e:any)=>{ e.stopPropagation(); toggle(n.id)}}
                  style={{ cursor:'pointer' }}
                >
                  <circle
                    cx={depth===0 ? p.x+78 : depth===1 ? p.x+78 : p.x+78}
                    cy={p.y}
                    r={9}
                    fill="#1a202c"
                    stroke="rgba(160,174,192,0.5)"
                    strokeWidth={1}
                  />
                  <text
                    x={depth===0 ? p.x+78 : p.x+78}
                    y={p.y+3.5}
                    textAnchor="middle"
                    fill="#a0aec0"
                    fontSize={9}
                    fontWeight={700}
                  >
                    {isExpanded ? '<' : '>'}
                  </text>
                </g>
              )}
            </motion.g>
          )
        })}
      </svg>
    </div>
  )
}
