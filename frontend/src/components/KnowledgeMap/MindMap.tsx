'use client'
import { motion } from 'framer-motion'
import { useState, useMemo, useEffect } from 'react'

export type OutlineNode = { name: string; children?: OutlineNode[] }

type Edge = { source: string; target: string }

function buildVisible(outline: OutlineNode, expanded: Set<string>) {
  let idCounter = 0
  function assignIds(node: OutlineNode, path: string): any {
    const id = path || 'root'
    const children = (node.children || []).map((c,i) => assignIds(c, `${id}/${i}-${c.name.replace(/\W+/g,'')}`))
    return { id, name: node.name, orig: node, children }
  }
  const rooted = assignIds(outline, 'root')
  const edges: Edge[] = []
  const queue: any[] = [rooted]
  const visible = new Set<string>(['root'])
  while (queue.length) {
    const cur = queue.shift()!
    if (expanded.has(cur.id)) {
      for (const ch of cur.children) {
        // dedup guard: skip if child name already visible elsewhere (avoid ABHIJEETH dup)
        if ([...visible].some(v => v.toLowerCase().includes(ch.name.toLowerCase().slice(0,12)))) {
          // still allow but we already filter central dup in backend; frontend secondary
        }
        visible.add(ch.id)
        queue.push(ch)
      }
    }
  }
  function collect(n: any) {
    if (!visible.has(n.id)) return
    for (const ch of n.children) if (visible.has(ch.id)) { edges.push({ source: n.id, target: ch.id }); collect(ch) }
  }
  collect(rooted)
  function flatten(n: any, out: any[]) { if (!visible.has(n.id)) return; out.push(n); for (const ch of n.children) flatten(ch, out) }
  const nodes: any[] = []
  flatten(rooted, nodes)
  return { nodes, edges, rooted }
}

function layoutNodes(nodes: any[], edges: Edge[]) {
  const pos = new Map<string, {x:number,y:number}>()
  // Find root and branches
  const root = nodes.find(n=>n.id==='root')
  const l1 = nodes.filter(n=> n.id.split('/').length===2)
  const l2Groups = new Map<string, any[]>()
  for (const n of nodes.filter(n=> n.id.split('/').length===3)) {
    const parent = n.id.slice(0, n.id.lastIndexOf('/'))
    if (!l2Groups.has(parent)) l2Groups.set(parent, [])
    l2Groups.get(parent)!.push(n)
  }
  const colX = { 0: 140, 1: 380, 2: 760 }
  // Height = sum of branch blocks
  const branchBlocks: {id:string,h:number}[] = []
  for (const b of l1) {
    const leaves = l2Groups.get(b.id)?.length || 0
    const h = leaves ? leaves*44 + 20 : 50
    branchBlocks.push({ id: b.id, h })
  }
  const totalH = branchBlocks.reduce((a,b)=>a+b.h,0) || 400
  const canvasH = Math.max(420, totalH + 100)
  const startY = (canvasH - totalH)/2
  let curY = startY
  // Root centered
  pos.set('root', { x: colX[0], y: canvasH/2 })
  for (const b of l1) {
    const block = branchBlocks.find(x=>x.id===b.id)!
    const midY = curY + block.h/2
    pos.set(b.id, { x: colX[1], y: midY })
    const leaves = l2Groups.get(b.id) || []
    leaves.forEach((leaf, i) => {
      const leafY = midY - ((leaves.length-1)*44)/2 + i*44
      pos.set(leaf.id, { x: colX[2], y: leafY })
    })
    curY += block.h
  }
  // Single branch case (1 L1) center leaves already
  return { pos, canvasH }
}

export function KnowledgeMindMap({ outline, onSelect }: { outline: OutlineNode; onSelect?: (name:string)=>void }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['root']))
  const [hovered, setHovered] = useState<string|null>(null)

  useEffect(() => {
    const ch = outline.children ?? []
    if (ch.length) {
      const ids = new Set<string>(['root'])
      ch.forEach((c,i) => {
        const id = `root/${i}-${c.name.replace(/\W+/g,'')}`
        ids.add(id)
        if (c.children?.length) ids.add(id) // keep expanded
      })
      setExpanded(ids)
    } else setExpanded(new Set(['root']))
  }, [outline])

  const { nodes, edges } = useMemo(() => buildVisible(outline, expanded), [outline, expanded])
  const { pos, canvasH } = useMemo(() => layoutNodes(nodes, edges), [nodes, edges])
  const width = 1020

  const toggle = (id: string) => setExpanded(prev => {
    const n = new Set(prev)
    if (n.has(id)) n.delete(id); else n.add(id)
    return n
  })

  return (
    <div style={{ width:'100%', height:'100%', overflow:'auto', background:'radial-gradient(800px 400px at 20% 10%, rgba(168,199,250,0.06), transparent), radial-gradient(600px 300px at 90% 80%, rgba(104,211,145,0.05), transparent), #0a0f14', position:'relative' }}>
      {/* subtle grid */}
      <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize:'32px 32px', opacity:0.5 }} />
      <svg width={width} height={canvasH} style={{ display:'block', minHeight: canvasH, position:'relative' }} viewBox={`0 0 ${width} ${canvasH}`}>
        <defs>
          <linearGradient id="edgeGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(168,199,250,0.1)" />
            <stop offset="50%" stopColor="rgba(168,199,250,0.6)" />
            <stop offset="100%" stopColor="rgba(104,211,145,0.35)" />
          </linearGradient>
          <filter id="glow">
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="rgba(168,199,250,0.4)" floodOpacity="0.6" />
          </filter>
        </defs>

        {/* Edges */}
        <g>
          {edges.map((e, i) => {
            const s = pos.get(e.source), t = pos.get(e.target)
            if (!s || !t) return null
            const isLeafEdge = e.target.split('/').length===3
            const mx = (s.x + t.x)/2 + (isLeafEdge ? 40 : 0)
            const path = `M ${s.x+72} ${s.y} C ${mx} ${s.y}, ${mx} ${t.y}, ${t.x-72} ${t.y}`
            const isHovered = hovered===e.source || hovered===e.target
            return (
              <motion.path
                key={e.source+'->'+e.target}
                d={path}
                fill="none"
                stroke={isHovered ? 'url(#edgeGrad)' : isLeafEdge ? 'rgba(104,211,145,0.32)' : 'rgba(160,174,192,0.38)'}
                strokeWidth={isHovered ? 2.4 : isLeafEdge ? 1.6 : 1.5}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.15 + i*0.05, ease: [0.22,1,0.36,1] }}
                style={{ filter: isHovered ? 'drop-shadow(0 0 6px rgba(168,199,250,0.6))' : undefined }}
              />
            )
          })}
        </g>

        {/* Nodes */}
        {nodes.map((n:any, idx:number) => {
          const p = pos.get(n.id)
          if (!p) return null
          const depth = n.id.split('/').length-1
          const hasChildren = (n.children?.length||0)>0
          const isExpanded = expanded.has(n.id)
          const w = depth===0 ? 176 : depth===1 ? 148 : 150
          const h = 34
          const isLeaf = depth===2
          const bg = depth===0 ? 'linear-gradient(135deg, #2d3748 0%, #1a202c 100%)' : depth===1 ? 'linear-gradient(135deg, #2d3748 0%, #242e3e 100%)' : 'linear-gradient(135deg, #1e3a2e 0%, #162a20 100%)'
          const border = depth===0 ? 'rgba(255,223,153,0.7)' : depth===1 ? 'rgba(168,199,250,0.55)' : 'rgba(104,211,145,0.45)'
          const textColor = depth===0 ? '#ffdf99' : isLeaf ? '#c6f6d5' : '#e2e8f0'
          const delay = depth===0 ? 0 : depth===1 ? 0.2 + idx*0.06 : 0.45 + idx*0.05
          return (
            <motion.g
              key={n.id}
              initial={{ opacity:0, y:12, scale:0.88 }}
              animate={{ opacity:1, y:0, scale:1 }}
              transition={{ type:'spring', stiffness:340, damping:20, delay }}
              onHoverStart={()=>setHovered(n.id)}
              onHoverEnd={()=>setHovered(null)}
              style={{ cursor: hasChildren ? 'pointer' : onSelect ? 'pointer' : 'default' }}
              onClick={()=> hasChildren ? toggle(n.id) : onSelect?.(n.name)}
            >
              {/* shadow */}
              <rect x={p.x - w/2} y={p.y - h/2} rx={10} width={w} height={h} fill="rgba(0,0,0,0.35)" opacity={0.4} />
              {/* pill */}
              <motion.g whileHover={{ scale: 1.03 }} transition={{ type:'spring', stiffness:400 }}>
                <rect x={p.x - w/2} y={p.y - h/2} rx={10} width={w} height={h} fill={depth===0 ? '#2d3748' : depth===1 ? '#2d3748' : '#1a3a2e'} stroke={border} strokeWidth={hovered===n.id?1.8:1.1} style={{ filter: hovered===n.id ? 'drop-shadow(0 6px 14px rgba(0,0,0,0.45))' : 'drop-shadow(0 3px 8px rgba(0,0,0,0.35))' }} />
                {/* inner highlight */}
                <rect x={p.x - w/2} y={p.y - h/2} rx={10} width={w} height={h/2} fill="rgba(255,255,255,0.03)" />
                {/* dot */}
                <circle cx={p.x - w/2 + 14} cy={p.y} r={4.5} fill={depth===0 ? '#ffdf99' : depth===1 ? '#a8c7fa' : '#68d391'} filter="url(#glow)" />
                <text x={p.x + 6} y={p.y+4} textAnchor="middle" fill={textColor} fontSize={depth===0?12:11.5} fontFamily="Inter, system-ui" fontWeight={depth===0?700:500} style={{ pointerEvents:'none', letterSpacing:'0.01em' }}>
                  {n.name.length>24 ? n.name.slice(0,24)+'…' : n.name}
                </text>
              </motion.g>
              {hasChildren && (
                <g onClick={(e:any)=>{e.stopPropagation(); toggle(n.id)}} style={{ cursor:'pointer' }}>
                  <motion.circle cx={p.x + w/2 + 12} cy={p.y} r={10} fill="#0f1419" stroke={isExpanded ? 'rgba(255,223,153,0.8)' : 'rgba(160,174,192,0.45)'} strokeWidth={1.2} initial={{ scale:0 }} animate={{ scale:1 }} transition={{ delay: delay+0.2, type:'spring' }} whileHover={{ scale:1.15 }} />
                  <text x={p.x + w/2 + 12} y={p.y+3.5} textAnchor="middle" fill={isExpanded ? '#ffdf99' : '#a0aec0'} fontSize={10} fontWeight={800}>{isExpanded ? '‹' : '›'}</text>
                </g>
              )}
            </motion.g>
          )
        })}
      </svg>
    </div>
  )
}
