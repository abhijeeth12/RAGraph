'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useMemo, useEffect } from 'react'

export type OutlineNode = { name: string; children?: OutlineNode[] }
type Edge = { source: string; target: string }

// Assign stable ids depth-aware
function assignIds(node: OutlineNode, path: string): any {
  const id = path || 'root'
  const children = (node.children || []).map((c,i) => assignIds(c, `${id}/${i}-${c.name.replace(/\W+/g,'').slice(0,14)}_${i}`))
  return { id, name: node.name, children }
}

function buildVisible(outline: OutlineNode, expanded: Set<string>) {
  const rooted = assignIds(outline, 'root')
  const edges: Edge[] = []
  const visible = new Set<string>(['root'])
  const q: any[] = [rooted]
  while (q.length) {
    const cur = q.shift()!
    if (expanded.has(cur.id)) {
      for (const ch of cur.children) { visible.add(ch.id); q.push(ch) }
    }
  }
  function collect(n:any){ if(!visible.has(n.id))return; for(const ch of n.children) if(visible.has(ch.id)){ edges.push({source:n.id,target:ch.id}); collect(ch)} }
  collect(rooted)
  const nodes:any[]=[]
  function flat(n:any){ if(!visible.has(n.id))return; nodes.push(n); for(const ch of n.children) flat(ch) }
  flat(rooted)
  return { nodes, edges, rooted }
}

// Stable layout for arbitrary depth – branches evenly spaced, leaves clustered around parent
function useStableLayout(nodes:any[], edges:Edge[]) {
  return useMemo(() => {
    const pos = new Map<string,{x:number,y:number,w:number}>()
    // Group by depth
    const byDepth = new Map<number, any[]>()
    for (const n of nodes) {
      const d = n.id.split('/').length-1
      if (!byDepth.has(d)) byDepth.set(d,[])
      byDepth.get(d)!.push(n)
    }
    const maxDepth = Math.max(...Array.from(byDepth.keys()),0)
    const colX = (d:number)=> 140 + d*220 // 140,360,580,800...
    const gap = 64
    // For each depth, distribute evenly, but for depth>=2 cluster around parent
    const canvasH = Math.max(440, (byDepth.get(1)?.length||1)*gap + 160)
    // Depth 1 (branches) evenly spaced
    const l1 = byDepth.get(1) || []
    l1.forEach((n,i)=>{
      const y = 80 + i*gap + gap/2 + ( (byDepth.get(2)?.length||0) > l1.length*2 ? 20 : 0)
      // Center around canvas if many leaves, keep within bounds
      const offset = ((l1.length*gap - canvasH + 160)/2)
      const adjY = y - offset
      pos.set(n.id,{x:colX(1),y:Math.max(40,Math.min(canvasH-40,adjY)),w:0})
    })
    // Root centered between first and last L1
    if (l1.length) {
      const first = pos.get(l1[0].id)!.y, last = pos.get(l1[l1.length-1].id)!.y
      pos.set('root',{x:colX(0),y:(first+last)/2,w:0})
    } else {
      pos.set('root',{x:colX(0),y:canvasH/2,w:0})
    }
    // Deeper levels: cluster around parent
    for (let d=2; d<=maxDepth; d++) {
      const group = byDepth.get(d) || []
      // Group by parent
      const byParent = new Map<string, any[]>()
      for (const n of group) {
        const p = n.id.slice(0,n.id.lastIndexOf('/'))
        if(!byParent.has(p)) byParent.set(p,[])
        byParent.get(p)!.push(n)
      }
      for (const [p, children] of byParent) {
        const parentPos = pos.get(p)
        if (!parentPos) continue
        children.forEach((leaf, idx)=>{
          const spread = 54
          const y = parentPos.y - ((children.length-1)*spread)/2 + idx*spread
          pos.set(leaf.id,{x:colX(d),y,w:0})
        })
      }
    }
    // Ensure leaves not overlapping canvas bounds
    for (const [id, p] of pos) {
      if (p.y < 30) pos.set(id,{...p,y:30})
      if (p.y > canvasH-30) pos.set(id,{...p,y:canvasH-30})
    }
    return { pos, canvasH, maxDepth }
  }, [nodes, edges])
}

function pillWidth(name:string, depth:number){
  const base = name.length*7 + 36
  if(depth===0) return Math.max(150, Math.min(200, base))
  if(depth===1) return Math.max(138, Math.min(170, base))
  return Math.max(148, Math.min(190, base))
}

export function KnowledgeMindMap({ outline, onSelect }: { outline: OutlineNode; onSelect?: (name:string)=>void }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['root']))
  const [hovered, setHovered] = useState<string|null>(null)

  useEffect(()=>{
    const ids = new Set<string>(['root'])
    const q: {node:OutlineNode, path:string}[] = (outline.children||[]).map((c,i)=>({node:c, path:`root/${i}-${c.name.replace(/\W+/g,'').slice(0,12)}_${i}`}))
    // Expand 2 levels by default (like NotebookLM)
    for (const {node, path} of q) {
      ids.add(path)
      if (node.children?.length) {
        // leave collapsed initially for deeper than 2? Expand all L1, keep L2 collapsed
      }
    }
    setExpanded(ids)
  },[outline])

  const { nodes, edges } = useMemo(()=> buildVisible(outline, expanded), [outline, expanded])
  const { pos, canvasH } = useStableLayout(nodes, edges)
  const W = 980

  const toggle = (id:string)=> setExpanded(prev=>{ const n=new Set(prev); if(n.has(id)) n.delete(id); else n.add(id); return n })

  return (
    <div style={{ width:'100%', height:'100%', overflow:'auto', background:'radial-gradient(700px 380px at 18% 14%, rgba(99,102,241,0.07), transparent), radial-gradient(560px 320px at 88% 80%, rgba(16,185,129,0.06), transparent), #0b0e13', position:'relative' }}>
      <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)', backgroundSize:'28px 28px', pointerEvents:'none' }} />
      <svg width={W} height={canvasH} viewBox={`0 0 ${W} ${canvasH}`} style={{ display:'block', position:'relative' }}>
        <g>
          <AnimatePresence>
            {edges.map((e,i)=>{
              const s=pos.get(e.source), t=pos.get(e.target)
              if(!s||!t) return null
              const sDepth = e.source.split('/').length-1
              const tDepth = e.target.split('/').length-1
              const isLeaf = tDepth>=2
              const sW = pillWidth(nodes.find(n=>n.id===e.source)?.name||'', sDepth)
              const sx = s.x + sW/2 + 12
              const tW = pillWidth(nodes.find(n=>n.id===e.target)?.name||'', tDepth)
              const tx = t.x - tW/2 - 6
              const mx = (sx+tx)/2
              const path = `M ${sx} ${s.y} C ${mx} ${s.y}, ${mx} ${t.y}, ${tx} ${t.y}`
              const hov = hovered===e.source || hovered===e.target
              return (
                <motion.path
                  key={e.source+'>'+e.target}
                  d={path}
                  fill="none"
                  stroke={hov ? (isLeaf?'rgba(110,231,183,0.92)':'rgba(168,199,250,0.92)') : (isLeaf?'rgba(110,231,183,0.34)':'rgba(148,163,184,0.38)')}
                  strokeWidth={hov?2.2: isLeaf?1.4:1.35}
                  initial={{ pathLength:0, opacity:0 }}
                  animate={{ pathLength:1, opacity:1 }}
                  exit={{ pathLength:0, opacity:0, transition:{duration:0.22}}}
                  transition={{ duration:0.55, delay:0.12+i*0.045, ease:[0.16,1,0.3,1] }}
                />
              )
            })}
          </AnimatePresence>
        </g>

        <AnimatePresence initial={false}>
          {nodes.map((n:any, idx:number)=>{
            const p=pos.get(n.id)
            if(!p) return null
            const depth=n.id.split('/').length-1
            const hasChildren=(n.children?.length||0)>0
            const isExpanded=expanded.has(n.id)
            const w=pillWidth(n.name, depth)
            const h=32
            const bg = depth===0? '#1a2233' : depth===1? '#1f2a3a' : '#143026'
            const border = depth===0? 'rgba(255,223,153,0.85)' : depth===1? 'rgba(148,163,184,0.55)' : 'rgba(110,231,183,0.5)'
            const textColor = depth===0?'#ffdf99': depth>=2?'#a7f3d0':'#e2e8f0'
            const delay = depth===0?0: depth===1? 0.16+idx*0.05: 0.38+idx*0.04
            return (
              <motion.g
                key={n.id}
                initial={{ opacity:0, scale:0.92 }}
                animate={{ opacity:1, scale:1 }}
                exit={{ opacity:0, scale:0.92, transition:{duration:0.18} }}
                transition={{ type:'spring', stiffness:340, damping:22, delay }}
                onHoverStart={()=>setHovered(n.id)}
                onHoverEnd={()=>setHovered(null)}
                style={{ cursor: hasChildren? 'pointer' : onSelect?'pointer':'default' }}
                onClick={()=> hasChildren? toggle(n.id): onSelect?.(n.name)}
              >
                <g transform={`translate(${p.x},${p.y})`}>
                  <rect x={-w/2} y={-h/2} rx={10} width={w} height={h} fill="rgba(0,0,0,0.35)" />
                  <rect x={-w/2} y={-h/2} rx={10} width={w} height={h} fill={bg} stroke={border} strokeWidth={hovered===n.id?1.6:1} />
                  <rect x={-w/2} y={-h/2} rx={10} width={w} height={h/2} fill="rgba(255,255,255,0.04)" />
                  <circle cx={-w/2+14} cy={0} r={4.2} fill={depth===0?'#ffdf99':depth===1?'#93c5fd':'#34d399'} />
                  <text x={-w/2+26} y={0} dy={4} textAnchor="start" fill={textColor} fontSize={depth===0?12:11} fontWeight={depth===0?700:500} fontFamily="Inter, system-ui" style={{ pointerEvents:'none' }}>
                    {n.name.length>28? n.name.slice(0,28)+'…': n.name}
                  </text>
                  {hasChildren && (
                    <g onClick={(e:any)=>{e.stopPropagation(); toggle(n.id)}} style={{cursor:'pointer'}} transform={`translate(${w/2+12},0)`}>
                      <circle r={9} fill="#0f1419" stroke={isExpanded?'#ffdf99':'rgba(148,163,184,0.5)'} strokeWidth={1} />
                      <text textAnchor="middle" dy={3} fill={isExpanded?'#ffdf99':'#94a3b8'} fontSize={10} fontWeight={800}>{isExpanded?'‹':'›'}</text>
                    </g>
                  )}
                </g>
              </motion.g>
            )
          })}
        </AnimatePresence>
      </svg>
    </div>
  )
}
