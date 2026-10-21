import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Minus, Plus, Maximize2 } from 'lucide-react'

export type OutlineNode = { name: string; children?: OutlineNode[] }
type Edge = { source: string; target: string }

function assignIds(node: OutlineNode, path: string): any {
  const id = path || 'root'
  const children = (node.children || []).map((c, i) =>
    assignIds(c, `${id}/${i}-${c.name.replace(/\W+/g, '').slice(0, 14)}_${i}`)
  )
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
      for (const ch of cur.children) {
        visible.add(ch.id)
        q.push(ch)
      }
    }
  }
  function collect(n: any) {
    if (!visible.has(n.id)) return
    for (const ch of n.children) {
      if (visible.has(ch.id)) {
        edges.push({ source: n.id, target: ch.id })
        collect(ch)
      }
    }
  }
  collect(rooted)
  const nodes: any[] = []
  function flat(n: any) {
    if (!visible.has(n.id)) return
    nodes.push(n)
    for (const ch of n.children) flat(ch)
  }
  flat(rooted)
  return { nodes, edges, rooted }
}

function useStableLayout(nodes: any[], edges: Edge[]) {
  return (() => {
    const pos = new Map<string, { x: number; y: number; w: number; h: number }>()
    const byDepth = new Map<number, any[]>()
    for (const n of nodes) {
      const d = n.id.split('/').length - 1
      if (!byDepth.has(d)) byDepth.set(d, [])
      byDepth.get(d)!.push(n)
    }
    const maxDepth = Math.max(...Array.from(byDepth.keys()), 0)
    const colX = (d: number) => 140 + d * 235
    const MIN_GAP = 42
    const BASE_GAP = 64
    const LEAF_SPREAD = 54

    const boxFor = (id: string, depth: number) => {
      const n = nodes.find((x) => x.id === id)
      return nodeBox(n?.name || '', depth)
    }
    const TOP_MARGIN = 40
    const BOTTOM_MARGIN = 40

    const childCountByParent = new Map<string, number>()
    for (let d = 2; d <= maxDepth; d++) {
      const group = byDepth.get(d) || []
      for (const n of group) {
        const p = n.id.slice(0, n.id.lastIndexOf('/'))
        childCountByParent.set(p, (childCountByParent.get(p) || 0) + 1)
      }
    }

    const l1 = byDepth.get(1) || []
    let canvasH = Math.max(440, (l1.length || 1) * BASE_GAP + 160)
    if (l1.length) {
      const spans = l1.map((n) => {
        const cnt = childCountByParent.get(n.id) || 0
        return cnt > 1 ? (cnt - 1) * LEAF_SPREAD : 0
      })
      const hVals = l1.map((n) => boxFor(n.id, 1).h)
      const needPair = (a: number, b: number) =>
        Math.max(MIN_GAP, (hVals[a] + hVals[b]) / 2 + 12)
      const yVals: number[] = []
      let curY = TOP_MARGIN + (spans[0] || 0) / 2 + hVals[0] / 2
      yVals.push(curY)
      for (let i = 1; i < l1.length; i++) {
        const required = (spans[i - 1] + spans[i]) / 2 + needPair(i - 1, i)
        const gap = Math.max(BASE_GAP, required)
        curY += gap
        yVals.push(curY)
      }
      const lastBottom =
        yVals[yVals.length - 1] +
        (spans[spans.length - 1] || 0) / 2 +
        hVals[hVals.length - 1] / 2
      const neededH = lastBottom + BOTTOM_MARGIN
      canvasH = Math.max(canvasH, neededH, 440)
      if (neededH < 440) {
        const totalSpan = yVals[yVals.length - 1] - yVals[0]
        const offset = (canvasH - totalSpan) / 2 - yVals[0]
        for (let i = 0; i < yVals.length; i++) yVals[i] += offset
      }
      l1.forEach((n, i) => {
        const b = boxFor(n.id, 1)
        pos.set(n.id, { x: colX(1), y: yVals[i], w: b.w, h: b.h })
      })
      const rb = boxFor('root', 0)
      pos.set('root', {
        x: colX(0),
        y: (yVals[0] + yVals[yVals.length - 1]) / 2,
        w: rb.w,
        h: rb.h,
      })
    } else {
      const rb = boxFor('root', 0)
      pos.set('root', { x: colX(0), y: canvasH / 2, w: rb.w, h: rb.h })
    }
    if (!pos.has('root')) {
      const rb = boxFor('root', 0)
      pos.set('root', { x: colX(0), y: canvasH / 2, w: rb.w, h: rb.h })
    }

    for (let d = 2; d <= maxDepth; d++) {
      const group = byDepth.get(d) || []
      const byParent = new Map<string, any[]>()
      for (const n of group) {
        const p = n.id.slice(0, n.id.lastIndexOf('/'))
        if (!byParent.has(p)) byParent.set(p, [])
        byParent.get(p)!.push(n)
      }
      for (const [p, children] of byParent) {
        const parentPos = pos.get(p)
        if (!parentPos) continue
        children.forEach((leaf, idx) => {
          const y = parentPos.y - ((children.length - 1) * LEAF_SPREAD) / 2 + idx * LEAF_SPREAD
          const b = boxFor(leaf.id, d)
          pos.set(leaf.id, { x: colX(d), y, w: b.w, h: b.h })
        })
      }
    }

    const nodeNeed = (aId: string, bId: string) => {
      const ha = pos.get(aId)?.h ?? 32
      const hb = pos.get(bId)?.h ?? 32
      return Math.max(MIN_GAP, (ha + hb) / 2 + 12)
    }

    const enforceGap = (depth: number) => {
      const group = byDepth.get(depth) || []
      if (group.length <= 1) return false
      const sorted = [...group].sort((a, b) => pos.get(a.id)!.y - pos.get(b.id)!.y)
      let changed = false
      let lastY = pos.get(sorted[0].id)!.y
      let lastId = sorted[0].id
      for (let i = 1; i < sorted.length; i++) {
        const id = sorted[i].id
        const cur = pos.get(id)!
        const need = nodeNeed(lastId, id)
        if (cur.y - lastY < need) {
          const delta = need - (cur.y - lastY)
          for (let j = i; j < sorted.length; j++) {
            const jid = sorted[j].id
            const jp = pos.get(jid)!
            pos.set(jid, { ...jp, y: jp.y + delta })
            for (const [descId, descPos] of Array.from(pos.entries())) {
              if (descId !== jid && descId.startsWith(jid + '/')) {
                pos.set(descId, { ...descPos, y: descPos.y + delta })
              }
            }
          }
          lastY = cur.y + delta
          changed = true
          lastId = id
        } else {
          lastY = cur.y
          lastId = id
        }
      }
      const maxBottom = Math.max(
        ...Array.from(pos.values()).map((v) => v.y + (v.h ?? 32) / 2)
      )
      if (maxBottom + BOTTOM_MARGIN > canvasH) canvasH = maxBottom + BOTTOM_MARGIN
      return changed
    }

    for (let d = 1; d <= maxDepth; d++) enforceGap(d)

    for (let d = maxDepth; d >= 2; d--) {
      const group = byDepth.get(d) || []
      if (group.length <= 1) continue
      const sorted2 = [...group].sort((a, b) => pos.get(a.id)!.y - pos.get(b.id)!.y)
      let last = pos.get(sorted2[0].id)!.y
      let lastId2 = sorted2[0].id
      let need = false
      for (let i = 1; i < sorted2.length; i++) {
        const cur = pos.get(sorted2[i].id)!.y
        if (cur - last < nodeNeed(lastId2, sorted2[i].id)) {
          need = true
          break
        }
        last = cur
        lastId2 = sorted2[i].id
      }
      if (need) enforceGap(d)
    }

    for (let d = maxDepth; d >= 1; d--) {
      const parents = byDepth.get(d) || []
      for (const pNode of parents) {
        const pid = pNode.id
        const childGroup: any[] = []
        for (let dd = d + 1; dd <= maxDepth; dd++) {
          const candidates = byDepth.get(dd) || []
          for (const c of candidates) {
            if (
              c.id.startsWith(pid + '/') &&
              c.id.slice(pid.length + 1).split('/').length === 1
            ) {
              if (pos.has(c.id)) childGroup.push(c)
            }
          }
          if (childGroup.length) break
        }
        if (childGroup.length <= 1) continue
        const avg =
          childGroup.reduce((s, c) => s + (pos.get(c.id)?.y ?? 0), 0) /
          childGroup.length
        const pPos = pos.get(pid)
        if (pPos && Math.abs(pPos.y - avg) > 2) {
          pos.set(pid, { ...pPos, y: avg })
        }
      }
    }
    for (let d = 1; d <= Math.min(2, maxDepth); d++) enforceGap(d)

    if (l1.length) {
      const sortedL1 = [...l1].sort((a, b) => pos.get(a.id)!.y - pos.get(b.id)!.y)
      const firstY = pos.get(sortedL1[0].id)!.y
      const lastY = pos.get(sortedL1[sortedL1.length - 1].id)!.y
      const prev = pos.get('root')!
      pos.set('root', { ...prev, x: colX(0), y: (firstY + lastY) / 2 })
    }

    const allX = Array.from(pos.entries()).map(([_, p]) => p.x + (p.w ?? 0) / 2 + 36)
    const maxXAll = Math.max(...allX, 0)
    const allBottom = Array.from(pos.values()).map((v) => v.y + (v.h ?? 32) / 2)
    const maxYAll = Math.max(...allBottom, 0)

    const canvasW0 = Math.max(980, maxXAll + 60)
    canvasH = Math.max(canvasH, maxYAll + BOTTOM_MARGIN, 440)

    const PAD = 24
    let minLeft = Infinity
    let minTop = Infinity
    for (const p of pos.values()) {
      const l = p.x - (p.w ?? 0) / 2
      const t = p.y - (p.h ?? 32) / 2
      if (l < minLeft) minLeft = l
      if (t < minTop) minTop = t
    }
    const shiftX = minLeft < PAD ? PAD - minLeft : 0
    const shiftY = minTop < PAD ? PAD - minTop : 0
    if (shiftX || shiftY) {
      for (const p of pos.values()) {
        p.x += shiftX
        p.y += shiftY
      }
    }

    return { pos, canvasH: canvasH + shiftY, canvasW: canvasW0 + shiftX, maxDepth }
  })()
}

const LABEL_LINE_H = 14
const LABEL_MAX_LINES = 4

function wrapLabel(name: string, maxChars: number): string[] {
  const out: string[] = []
  let cur = ''
  const flush = () => {
    if (cur) {
      out.push(cur)
      cur = ''
    }
  }
  for (const raw of name.split(/\s+/).filter(Boolean)) {
    let w = raw
    while (w.length > maxChars) {
      flush()
      out.push(w.slice(0, maxChars))
      w = w.slice(maxChars)
    }
    const next = cur ? cur + ' ' + w : w
    if (next.length <= maxChars) cur = next
    else {
      flush()
      cur = w
    }
  }
  flush()
  if (!out.length) return [name]
  if (out.length > LABEL_MAX_LINES) {
    const t = out.slice(0, LABEL_MAX_LINES)
    t[LABEL_MAX_LINES - 1] = t[LABEL_MAX_LINES - 1].replace(/…$/, '') + '…'
    return t
  }
  return out
}

function nodeBox(name: string, depth: number) {
  const fs = depth === 0 ? 12 : 11
  const charW = depth === 0 ? 7.3 : 6.7
  const maxW = depth === 0 ? 200 : depth === 1 ? 190 : 180
  const maxChars = Math.max(10, Math.floor((maxW - 44) / charW))
  const lines = wrapLabel(name, maxChars)
  const longest = Math.max(...lines.map((l) => l.length), 1)
  const w = Math.min(maxW, Math.max(96, longest * charW + 44))
  const h = Math.max(32, lines.length * LABEL_LINE_H + 18)
  return { w, h, lines, fs }
}

export function KnowledgeMindMap({
  outline,
  onSelect,
}: {
  outline: OutlineNode
  onSelect?: (name: string) => void
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['root']))
  const [hovered, setHovered] = useState<string | null>(null)

  useEffect(() => {
    setExpanded(new Set(['root']))
  }, [outline])

  const { nodes, edges } = buildVisible(outline, expanded)
  const { pos, canvasH, canvasW } = useStableLayout(nodes, edges)

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })

  const wrapRef = useRef<HTMLDivElement | null>(null)
  const [view, setView] = useState({ x: 24, y: 24, k: 1 })
  const [size, setSize] = useState({ w: 0, h: 0 })
  const dragRef = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null)
  const movedRef = useRef(false)
  const [dragging, setDragging] = useState(false)
  const fittedFor = useRef<any>(null)

  const clampK = (k: number) => Math.min(2.5, Math.max(0.05, k))

  const fitToView = useCallback(() => {
    const el = wrapRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    if (r.width < 10 || r.height < 10) return
    const k = Math.min(
      (r.width - 96) / Math.max(canvasW, 1),
      (r.height - 96) / Math.max(canvasH, 1),
      1
    )
    const kk = clampK(Math.max(k, 0.05))
    setView({ k: kk, x: (r.width - canvasW * kk) / 2, y: (r.height - canvasH * kk) / 2 })
  }, [canvasW, canvasH])

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect()
      setSize({ w: r.width, h: r.height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (size.w > 10 && fittedFor.current !== outline) {
      fittedFor.current = outline
      fitToView()
    }
  }, [outline, size, fitToView])

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const r = el.getBoundingClientRect()
      const cx = e.clientX - r.left
      const cy = e.clientY - r.top
      setView((v) => {
        const k2 = clampK(v.k * Math.exp(-e.deltaY * 0.0015))
        const s = k2 / v.k
        return { k: k2, x: cx - (cx - v.x) * s, y: cy - (cy - v.y) * s }
      })
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  const zoomBy = (f: number) => {
    const el = wrapRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const cx = r.width / 2
    const cy = r.height / 2
    setView((v) => {
      const k2 = clampK(v.k * f)
      const s = k2 / v.k
      return { k: k2, x: cx - (cx - v.x) * s, y: cy - (cy - v.y) * s }
    })
  }

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    // Never start a pan (or capture the pointer) from the zoom/fit controls,
    // otherwise pointer capture swallows the button's click event.
    if ((e.target as HTMLElement).closest('button')) return
    try {
      wrapRef.current?.setPointerCapture(e.pointerId)
    } catch {
      /* noop */
    }
    movedRef.current = false
    dragRef.current = { sx: e.clientX, sy: e.clientY, ox: view.x, oy: view.y }
    setDragging(true)
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current
    if (!d) return
    if (Math.abs(e.clientX - d.sx) + Math.abs(e.clientY - d.sy) > 4) movedRef.current = true
    setView((v) => ({ ...v, x: d.ox + (e.clientX - d.sx), y: d.oy + (e.clientY - d.sy) }))
  }

  const endDrag = () => {
    dragRef.current = null
    setDragging(false)
    if (movedRef.current) setTimeout(() => { movedRef.current = false }, 0)
  }

  const guarded = (fn: (...a: any[]) => void) => (...a: any[]) => {
    if (!movedRef.current) fn(...a)
  }

  return (
    <div
      ref={wrapRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onDoubleClick={() => fitToView()}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background:
          'radial-gradient(700px 380px at 18% 14%, rgba(168,199,250,0.08), transparent), radial-gradient(560px 320px at 88% 80%, rgba(196,238,208,0.06), transparent), #0b0e13',
        position: 'relative',
        cursor: dragging ? 'grabbing' : 'grab',
        touchAction: 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          backgroundPosition: `${((view.x % 28) + 28) % 28}px ${((view.y % 28) + 28) % 28}px`,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 14,
          right: 14,
          display: 'flex',
          gap: 6,
          zIndex: 5,
          alignItems: 'center',
        }}
      >
        <button
          onClick={() => zoomBy(1 / 1.25)}
          title="Zoom out"
          aria-label="Zoom out"
          style={zoomBtn}
        >
          <Minus size={14} strokeWidth={2.4} />
        </button>
        <span style={zoomBadge}>
          {Math.round(view.k * 100)}%
        </span>
        <button
          onClick={() => zoomBy(1.25)}
          title="Zoom in"
          aria-label="Zoom in"
          style={zoomBtn}
        >
          <Plus size={14} strokeWidth={2.4} />
        </button>
        <button
          onClick={() => fitToView()}
          title="Fit to view"
          aria-label="Fit to view"
          style={zoomBtn}
        >
          <Maximize2 size={13} strokeWidth={2.2} />
        </button>
      </div>

      <svg
        style={{
          display: 'block',
          position: 'relative',
          width: '100%',
          height: '100%',
          overflow: 'visible',
        }}
      >
        <g transform={`translate(${view.x} ${view.y}) scale(${view.k})`}>
          <g>
            <AnimatePresence>
              {edges.map((e, i) => {
                const s = pos.get(e.source)
                const t = pos.get(e.target)
                if (!s || !t) return null
                const sDepth = e.source.split('/').length - 1
                const tDepth = e.target.split('/').length - 1
                const isLeaf = tDepth >= 2
                const sW = nodeBox(nodes.find((n) => n.id === e.source)?.name || '', sDepth).w
                const sx = s.x + sW / 2 + 12
                const tW = nodeBox(nodes.find((n) => n.id === e.target)?.name || '', tDepth).w
                const tx = t.x - tW / 2 - 6
                const mx = (sx + tx) / 2
                const path = `M ${sx} ${s.y} C ${mx} ${s.y}, ${mx} ${t.y}, ${tx} ${t.y}`
                const hov = hovered === e.source || hovered === e.target
                return (
                  <motion.path
                    key={e.source + '>' + e.target}
                    d={path}
                    fill="none"
                    stroke={
                      hov
                        ? isLeaf
                          ? 'rgba(110,231,183,0.92)'
                          : 'rgba(168,199,250,0.92)'
                        : isLeaf
                        ? 'rgba(110,231,183,0.34)'
                        : 'rgba(148,163,184,0.38)'
                    }
                    strokeWidth={hov ? 2.2 : isLeaf ? 1.4 : 1.35}
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1, d: path }}
                    exit={{ pathLength: 0, opacity: 0, transition: { duration: 0.22 } }}
                    transition={{
                      pathLength: {
                        duration: 0.55,
                        delay: Math.min(0.12 + i * 0.045, 1.0),
                        ease: [0.16, 1, 0.3, 1] as any,
                      },
                      opacity: { duration: 0.32, delay: Math.min(0.12 + i * 0.045, 1.0) },
                      d: { type: 'spring', stiffness: 280, damping: 28, mass: 0.7 },
                    }}
                  />
                )
              })}
            </AnimatePresence>
          </g>

          <AnimatePresence initial={false}>
            {nodes.map((n: any, idx: number) => {
              const p = pos.get(n.id)
              if (!p) return null
              const depth = n.id.split('/').length - 1
              const hasChildren = (n.children?.length || 0) > 0
              const isExpanded = expanded.has(n.id)
              const box = nodeBox(n.name, depth)
              const w = box.w
              const h = box.h
              const lines = box.lines
              const fs = box.fs
              const bg = depth === 0 ? '#1a2233' : depth === 1 ? '#1f2a3a' : '#143026'
              const border =
                depth === 0
                  ? 'rgba(255,223,153,0.85)'
                  : depth === 1
                  ? 'rgba(148,163,184,0.55)'
                  : 'rgba(110,231,183,0.5)'
              const textColor = depth === 0 ? '#ffdf99' : depth >= 2 ? '#a7f3d0' : '#e2e8f0'
              const delay =
                depth === 0 ? 0 : Math.min(depth === 1 ? 0.16 + idx * 0.05 : 0.38 + idx * 0.04, 1.0)
              return (
                <motion.g
                  key={n.id}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.18 } }}
                  transition={{ type: 'spring', stiffness: 340, damping: 22, delay }}
                  onHoverStart={() => setHovered(n.id)}
                  onHoverEnd={() => setHovered(null)}
                  style={{ cursor: hasChildren ? 'pointer' : onSelect ? 'pointer' : 'default' }}
                  onPointerDown={(e) => {
                    e.stopPropagation()
                  }}
                  onClick={guarded(() => (hasChildren ? toggle(n.id) : onSelect?.(n.name)))}
                >
                  <motion.g
                    animate={{ x: p.x, y: p.y }}
                    initial={false}
                    transition={{ type: 'spring', stiffness: 300, damping: 28, mass: 0.8 }}
                  >
                    <rect x={-w / 2} y={-h / 2} rx={10} width={w} height={h} fill="rgba(0,0,0,0.35)" />
                    <rect
                      x={-w / 2}
                      y={-h / 2}
                      rx={10}
                      width={w}
                      height={h}
                      fill={bg}
                      stroke={border}
                      strokeWidth={hovered === n.id ? 1.6 : 1}
                    />
                    <rect x={-w / 2} y={-h / 2} rx={10} width={w} height={h / 2} fill="rgba(255,255,255,0.04)" />
                    <circle cx={-w / 2 + 14} cy={0} r={4.2} fill={depth === 0 ? '#ffdf99' : depth === 1 ? '#93c5fd' : '#34d399'} />
                    <text
                      x={-w / 2 + 26}
                      y={-((lines.length - 1) * LABEL_LINE_H) / 2}
                      textAnchor="start"
                      fill={textColor}
                      fontSize={fs}
                      fontWeight={depth === 0 ? 700 : 500}
                      fontFamily="Inter, system-ui"
                      style={{ pointerEvents: 'none' }}
                    >
                      {lines.map((ln, li) => (
                        <tspan key={li} x={-w / 2 + 26} dy={li === 0 ? 4 : LABEL_LINE_H}>
                          {ln}
                        </tspan>
                      ))}
                    </text>
                    {hasChildren && (
                      <g
                        onClick={guarded((e: any) => {
                          e.stopPropagation()
                          toggle(n.id)
                        })}
                        style={{ cursor: 'pointer' }}
                        transform={`translate(${w / 2 + 12},0)`}
                      >
                        <circle
                          r={9}
                          fill="#0f1419"
                          stroke={isExpanded ? '#ffdf99' : 'rgba(148,163,184,0.5)'}
                          strokeWidth={1}
                        />
                        <text
                          textAnchor="middle"
                          dy={3}
                          fill={isExpanded ? '#ffdf99' : '#94a3b8'}
                          fontSize={10}
                          fontWeight={800}
                        >
                          {isExpanded ? '‹' : '›'}
                        </text>
                      </g>
                    )}
                  </motion.g>
                </motion.g>
              )
            })}
          </AnimatePresence>
        </g>
      </svg>
    </div>
  )
}

const zoomBtn: React.CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: 8,
  cursor: 'pointer',
  background: 'rgba(15,20,25,0.85)',
  color: '#e2e8f0',
  border: '1px solid rgba(148,163,184,0.35)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  margin: 0,
  boxSizing: 'border-box',
  lineHeight: 1,
  userSelect: 'none',
  transition: 'background 0.15s, border-color 0.15s',
}

const zoomBadge: React.CSSProperties = {
  height: 30,
  color: '#94a3b8',
  fontSize: 11,
  minWidth: 44,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  background: 'rgba(15,20,25,0.85)',
  border: '1px solid rgba(148,163,184,0.35)',
  borderRadius: 8,
  padding: '0 6px',
  boxSizing: 'border-box',
  userSelect: 'none',
}
