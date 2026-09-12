'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useMemo, useEffect } from 'react'

export type OutlineNode = { name: string; children?: OutlineNode[] }
type Edge = { source: string; target: string }

// Stable ID assignment
function assignIds(node: OutlineNode, path: string): any {
  const id = path || 'root'
  const children = (node.children || []).map((c,i) => assignIds(c, `${id}/${i}-${c.name.replace(/\W+/g,'').slice(0,12)}_${i}`))
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

function useStableLayout(nodes:any[], edges:Edge[]) {
  return useMemo(() => {
    const pos = new Map<string,{x:number,y:number}>()
    const l1 = nodes.filter(n=> n.id.split('/').length===2)
    const l2Map = new Map<string, any[]>()
    for (const n of nodes.filter(n=> n.id.split('/').length===3)) {
      const p = n.id.slice(0,n.id.lastIndexOf('/'))
      if(!l2Map.has(p)) l2Map.set(p,[])
      l2Map.get(p)!.push(n)
    }
    const colX = {0:140, 1:380, 2:800}
    const gapL1 = 72
    const startY = 80
    // Stable: branches evenly spaced regardless of leaf count
    l1.forEach((b,i)=>{
      const y = startY + i*gapL1 + gapL1/2
      pos.set(b.id,{x:colX[1],y})
      const leaves = l2Map.get(b.id) || []
      leaves.forEach((leaf, j)=>{
        const ly = y - ((leaves.length-1)*38)/2 + j*38
        pos.set(leaf.id,{x:colX[2],y:ly})
      })
    })
    // Root centered vertically between first and last branch, or canvas center if no branches
    const canvasH = Math.max(380, l1.length*gapL1 + 140)
    const rootY = l1.length ? (pos.get(l1[0].id)!.y + pos.get(l1[l1.length-1].id)!.y)/2 : canvasH/2
    pos.set('root',{x:colX[0],y:rootY})
    // If only leaves directly under root (outline with 1 level), treat l1 as leaves
    if (l1.length===0) {
      // already handled
    }
    return { pos, canvasH }
  }, [nodes, edges])
}

export function KnowledgeMindMap({ outline, onSelect }: { outline: OutlineNode; onSelect?: (name:string)=>void }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['root']))
  const [hovered, setHovered] = useState<string|null>(null)

  useEffect(()=>{
    const ch = outline.children ?? []
    const ids = new Set<string>(['root'])
    ch.forEach((c,i)=>{
      const id = `root/${i}-${c.name.replace(/\W+/g,'').slice(0,12)}_${i}`
      ids.add(id)
    })
    setExpanded(ids) // expand all L1 by default, collapsed leaves hidden (they are L2, need parent expanded)
    // Keep L1 expanded (show leaves)
  },[outline])

  const { nodes, edges } = useMemo(()=> buildVisible(outline, expanded), [outline, expanded])
  const { pos, canvasH } = useStableLayout(nodes, edges)
  const W = 1020

  const toggle = (id:string)=> setExpanded(prev=>{
    const n=new Set(prev)
    if(n.has(id)) n.delete(id); else n.add(id)
    return n
  })

  return (
    <div style={{ width:'100%', height:'100%', overflow:'auto', background:'radial-gradient(700px 400px at 18% 12%, rgba(99,102,241,0.08), transparent), radial-gradient(600px 320px at 88% 78%, rgba(16,185,129,0.06), transparent), #0b0e13', position:'relative', scrollBehavior:'smooth' }}>
      <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)', backgroundSize:'28px 28px', pointerEvents:'none' }} />
      <svg width={W} height={canvasH} viewBox={`0 0 ${W} ${canvasH}`} style={{ display:'block', position:'relative' }}>
        <defs>
          <linearGradient id="edgeRoot" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(255,223,153,0.15)"/><stop offset="50%" stopColor="rgba(168,199,250,0.55)"/><stop offset="100%" stopColor="rgba(168,199,250,0.35)"/>
          </linearGradient>
          <linearGradient id="edgeLeaf" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(168,199,250,0.3)"/><stop offset="100%" stopColor="rgba(110,231,183,0.38)"/>
          </linearGradient>
        </defs>

        <g>
          <AnimatePresence>
            {edges.map((e,i)=>{
              const s=pos.get(e.source), t=pos.get(e.target)
              if(!s||!t) return null
              const isLeaf = e.target.split('/').length===3
              const srcDepth = e.source.split('/').length-1
              const srcW = srcDepth===0?190: srcDepth===1?152:168
              const sx = s.x + srcW/2 + 22 // start after pill + badge (badge at +14 radius 10)
              const tx = t.x - 76
              const mx = (sx + tx)/2
              const path = `M ${sx} ${s.y} C ${mx} ${s.y}, ${mx} ${t.y}, ${tx} ${t.y}`
              const hov = hovered===e.source || hovered===e.target
              return (
                <motion.path
                  key={e.source+'>'+e.target}
                  d={path}
                  fill="none"
                  stroke={hov ? (isLeaf ? 'rgba(110,231,183,0.9)' : 'rgba(168,199,250,0.9)') : (isLeaf ? 'rgba(110,231,183,0.38)' : 'rgba(148,163,184,0.42)')}
                  strokeWidth={hov?2.3: isLeaf?1.5:1.4}
                  initial={{ pathLength:0, opacity:0 }}
                  animate={{ pathLength:1, opacity:1 }}
                  exit={{ pathLength:0, opacity:0, transition:{ duration:0.25 } }}
                  transition={{ duration:0.55, delay:0.12 + i*0.04, ease:[0.16,1,0.3,1] }}
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
            const w= depth===0? 190: depth===1? 152: 168
            const h=34
            const isLeaf=depth===2
            const bg = depth===0 ? '#2d3748' : depth===1 ? '#1f2a3a' : '#143026'
            const border = depth===0 ? 'rgba(255,223,153,0.85)' : depth===1 ? 'rgba(148,163,184,0.55)' : 'rgba(110,231,183,0.5)'
            const textColor = depth===0 ? '#ffdf99' : isLeaf ? '#a7f3d0' : '#e2e8f0'
            const delay = depth===0?0: depth===1? 0.18+idx*0.05: 0.42+idx*0.04
            return (
              <motion.g
                key={n.id}
                initial={{ opacity:0, scale:0.9, y:8 }}
                animate={{ opacity:1, scale:1, y:0, x:p.x, transition:{ type:'spring', stiffness:380, damping:22, delay } }}
                exit={{ opacity:0, scale:0.9, transition:{ duration:0.18 } }}
                // framer layout handles stable position without jump
                layout
                transition={{ layout:{ type:'spring', stiffness:380, damping:28 } }}
                onHoverStart={()=>setHovered(n.id)}
                onHoverEnd={()=>setHovered(null)}
                style={{ cursor: hasChildren? 'pointer' : onSelect?'pointer':'default' }}
                onClick={()=> hasChildren ? toggle(n.id) : onSelect?.(n.name)}
              >
                {/* Use transform via motion.g x is handled by layout, but we need to set position via translate */}
                <g transform={`translate(${p.x},${p.y})`}>
                  {/* shadow */}
                  <rect x={-w/2} y={-h/2} rx={10} width={w} height={h} fill="rgba(0,0,0,0.4)" />
                  {/* pill */}
                  <rect x={-w/2} y={-h/2} rx={10} width={w} height={h} fill={bg} stroke={border} strokeWidth={hovered===n.id?1.7:1.1} />
                  <rect x={-w/2} y={-h/2} rx={10} width={w} height={h/2} fill="rgba(255,255,255,0.04)" />
                  <circle cx={-w/2+15} cy={0} r={4.5} fill={depth===0?'#ffdf99':depth===1?'#93c5fd':'#34d399'} opacity={0.95} />
                  <text x={6} y={4} textAnchor="middle" fill={textColor} fontSize={depth===0?12.5:11.5} fontWeight={depth===0?700:500} fontFamily="Inter, system-ui" style={{ pointerEvents:'none' }}>
                    {n.name.length>26? n.name.slice(0,26)+'…': n.name}
                  </text>
                  {hasChildren && (
                    <g onClick={(e:any)=>{e.stopPropagation(); toggle(n.id)}} style={{cursor:'pointer'}} transform={`translate(${w/2+14},0)`}>
                      <circle r={10} fill="#0f1419" stroke={isExpanded?'#ffdf99':'rgba(148,163,184,0.5)'} strokeWidth={1.1} />
                      <text textAnchor="middle" dy={3.5} fill={isExpanded?'#ffdf99':'#94a3b8'} fontSize={11} fontWeight={800}>{isExpanded?'‹':'›'}</text>
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
