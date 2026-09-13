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

// Stable layout for arbitrary depth – branches dynamically spaced, leaves clustered, auto de-overlap with smooth shift
function useStableLayout(nodes:any[], edges:Edge[]) {
  return useMemo(() => {
    const pos = new Map<string,{x:number,y:number,w:number}>()
    const byDepth = new Map<number, any[]>()
    for (const n of nodes) {
      const d = n.id.split('/').length-1
      if (!byDepth.has(d)) byDepth.set(d,[])
      byDepth.get(d)!.push(n)
    }
    const maxDepth = Math.max(...Array.from(byDepth.keys()),0)
    const colX = (d:number)=> 140 + d*220 // 140,360,580,800...
    const MIN_GAP = 42 // center-to-center minimum (32h + 10 padding)
    const BASE_GAP = 64
    const LEAF_SPREAD = 54
    const TOP_MARGIN = 40
    const BOTTOM_MARGIN = 40

    // child counts per parent (visible children)
    const childCountByParent = new Map<string, number>()
    for (let d=2; d<=maxDepth; d++) {
      const group = byDepth.get(d) || []
      for (const n of group) {
        const p = n.id.slice(0,n.id.lastIndexOf('/'))
        childCountByParent.set(p, (childCountByParent.get(p)||0)+1)
      }
    }

    // ---- Depth 1: dynamic gaps based on child spans ----
    const l1 = byDepth.get(1) || []
    let canvasH = Math.max(440, (l1.length||1)*BASE_GAP + 160)
    if (l1.length) {
      const spans = l1.map(n => {
        const cnt = childCountByParent.get(n.id)||0
        return cnt>1 ? (cnt-1)*LEAF_SPREAD : 0
      })
      const yVals: number[] = []
      let curY = TOP_MARGIN + (spans[0]||0)/2
      // ensure first node's top leaf >= TOP_MARGIN (already)
      yVals.push(curY)
      for (let i=1; i<l1.length; i++) {
        const required = (spans[i-1]+spans[i])/2 + MIN_GAP
        const gap = Math.max(BASE_GAP, required)
        curY += gap
        yVals.push(curY)
      }
      const lastBottom = yVals[yVals.length-1] + (spans[spans.length-1]||0)/2
      const neededH = lastBottom + BOTTOM_MARGIN
      canvasH = Math.max(canvasH, neededH, 440)
      // if still 440 (sparse), center vertically
      if (neededH < 440) {
        const totalSpan = yVals[yVals.length-1] - yVals[0]
        const offset = (canvasH - totalSpan)/2 - yVals[0]
        for (let i=0;i<yVals.length;i++) yVals[i]+=offset
      }
      l1.forEach((n,i)=> pos.set(n.id,{x:colX(1), y: yVals[i], w:0}))
      // root centered between first and last L1 (using sorted order)
      pos.set('root',{x:colX(0), y:(yVals[0]+yVals[yVals.length-1])/2, w:0})
    } else {
      pos.set('root',{x:colX(0), y:canvasH/2, w:0})
    }
    if(!pos.has('root')) pos.set('root',{x:colX(0),y:canvasH/2,w:0})

    // ---- Deeper levels: cluster around parent (initial) ----
    for (let d=2; d<=maxDepth; d++) {
      const group = byDepth.get(d) || []
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
          const y = parentPos.y - ((children.length-1)*LEAF_SPREAD)/2 + idx*LEAF_SPREAD
          pos.set(leaf.id,{x:colX(d), y, w:0})
        })
      }
    }

    // helper: enforce MIN_GAP within a depth by shifting down, propagating delta to descendants to keep clusters centered
    const enforceGap = (depth:number) => {
      const group = byDepth.get(depth) || []
      if(group.length<=1) return false
      const sorted = [...group].sort((a,b)=> (pos.get(a.id)!.y - pos.get(b.id)!.y))
      let changed = false
      let lastY = pos.get(sorted[0].id)!.y
      for(let i=1;i<sorted.length;i++){
        const id = sorted[i].id
        const cur = pos.get(id)!
        if(cur.y - lastY < MIN_GAP){
          const delta = MIN_GAP - (cur.y - lastY)
          for(let j=i;j<sorted.length;j++){
            const jid = sorted[j].id
            const jp = pos.get(jid)!
            pos.set(jid,{...jp, y: jp.y + delta})
            // propagate to all descendants of jid (keep subtree together)
            for(const [descId, descPos] of Array.from(pos.entries())){
              if(descId !== jid && descId.startsWith(jid + '/')){
                pos.set(descId,{...descPos, y: descPos.y + delta})
              }
            }
          }
          lastY = cur.y + delta
          changed = true
        } else {
          lastY = cur.y
        }
      }
      const maxY = Math.max(...Array.from(pos.values()).map(v=>v.y))
      if(maxY + BOTTOM_MARGIN > canvasH) canvasH = maxY + BOTTOM_MARGIN
      return changed
    }

    // Global de-overlap per depth (shift down to remove overlap) – process shallow to deep so propagation keeps subtrees together
    for(let d=1; d<=maxDepth; d++) enforceGap(d)

    // Safety: if any deeper nodes still overlap after propagation, re-enforce deeper levels once more
    for(let d=maxDepth; d>=2; d--){
      // Re-check without propagation this time just to ensure leaf-leaf gaps after parent shifts
      const group = byDepth.get(d) || []
      if(group.length<=1) continue
      const sorted2 = [...group].sort((a,b)=> (pos.get(a.id)!.y - pos.get(b.id)!.y))
      let last = pos.get(sorted2[0].id)!.y
      let need = false
      for(let i=1;i<sorted2.length;i++){
        const cur = pos.get(sorted2[i].id)!.y
        if(cur - last < MIN_GAP){ need = true; break }
        last = cur
      }
      if(need) enforceGap(d)
    }

    // Bottom-up recentering: keep parents centered over their visible children for natural edge flow
    // This also handles deeper-level overlaps that were resolved by pushing leaves – move parent to follow
    for(let d=maxDepth; d>=1; d--){
      const parents = byDepth.get(d) || []
      for(const pNode of parents){
        const pid = pNode.id
        // find visible children of this parent at next depth
        const childGroup: any[] = []
        for(let dd=d+1; dd<=maxDepth; dd++){
          const candidates = byDepth.get(dd) || []
          for(const c of candidates){
            if(c.id.startsWith(pid + '/') && c.id.slice(pid.length+1).split('/').length===1){
              // direct child (one level deeper) – check visibility via pos existence
              if(pos.has(c.id)) childGroup.push(c)
            }
          }
          if(childGroup.length) break // only direct children
        }
        if(childGroup.length<=1) continue
        const avg = childGroup.reduce((s,c)=> s + (pos.get(c.id)?.y ?? 0), 0)/childGroup.length
        const pPos = pos.get(pid)
        if(pPos && Math.abs(pPos.y - avg) > 2){
          pos.set(pid,{...pPos, y: avg})
        }
      }
    }
    // After recentering, re-enforce top levels to avoid parent-parent overlap introduced by recentering
    for(let d=1; d<=Math.min(2,maxDepth); d++) enforceGap(d)

    // Final root centering between first and last L1 after all shifts
    if(l1.length){
      const sortedL1 = [...l1].sort((a,b)=> pos.get(a.id)!.y - pos.get(b.id)!.y)
      const firstY = pos.get(sortedL1[0].id)!.y
      const lastY = pos.get(sortedL1[sortedL1.length-1].id)!.y
      pos.set('root',{x:colX(0), y:(firstY+lastY)/2, w:0})
    }

    // Clamp within bounds (after all expansions)
    for (const [id, p] of pos) {
      if (p.y < TOP_MARGIN) pos.set(id,{...p, y: TOP_MARGIN})
      if (p.y > canvasH - 12) pos.set(id,{...p, y: canvasH - 12})
    }
    // Ensure canvas at least covers all nodes + margins
    const allY = Array.from(pos.values()).map(v=>v.y)
    const maxYAll = Math.max(...allY, 0)
    canvasH = Math.max(canvasH, maxYAll + BOTTOM_MARGIN, 440)

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
    // NotebookLM: start collapsed, only central visible – user expands slowly
    setExpanded(new Set(['root']))
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
                  animate={{ pathLength:1, opacity:1, d: path }}
                  exit={{ pathLength:0, opacity:0, transition:{duration:0.22}}}
                  transition={{
                    pathLength: { duration:0.55, delay:0.12+i*0.045, ease:[0.16,1,0.3,1] as any },
                    opacity: { duration:0.32, delay:0.12+i*0.045 },
                    d: { type:'spring', stiffness:280, damping:28, mass:0.7 }
                  }}
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
                <motion.g
                  animate={{ x: p.x, y: p.y }}
                  initial={false}
                  transition={{ type:'spring', stiffness:300, damping:28, mass:0.8 }}
                >
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
                </motion.g>
              </motion.g>
            )
          })}
        </AnimatePresence>
      </svg>
    </div>
  )
}
