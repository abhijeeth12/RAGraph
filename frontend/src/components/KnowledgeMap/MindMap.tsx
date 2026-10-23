'use client'
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence, type Transition } from 'framer-motion'
import {
  Minus,
  Plus,
  Maximize2,
  FileText,
  Hash,
  Layers,
  AlignLeft,
  Table as TableIcon,
  Image as ImageIcon,
  Copy,
  Check,
  X,
  BookOpen,
} from 'lucide-react'

export interface StructuralNode {
  id?: string
  name: string
  level?: string
  element_kind?: string
  page_number?: number
  heading_path?: string[]
  text?: string
  image_url?: string
  caption?: string
  children?: StructuralNode[]
  [key: string]: any
}

interface NodeBox {
  w: number
  h: number
  lines: string[]
  fs: number
}

interface NodePos {
  id: string
  x: number
  y: number
  w: number
  h: number
  parentId?: string
  parentX?: number
  parentY?: number
  data: StructuralNode
}

interface TreeLayoutNode {
  id: string
  name: string
  box: NodeBox
  data: StructuralNode
  children: TreeLayoutNode[]
  subtreeHeight: number
}

interface EdgeData {
  id: string
  source: string
  target: string
  sx: number
  sy: number
  tx: number
  ty: number
  elementKind?: string
}

const boxCache = new Map<string, NodeBox>()

const LABEL_LINE_H = 15
const MAX_LINES = 3
const NODE_GAP_Y = 18

const MOTION_TRANSITION: Transition = {
  duration: 0.28,
  ease: [0.16, 1, 0.3, 1],
}

function wrapLabel(text: string, maxCharsPerLine: number): string[] {
  if (!text) return ['']
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let cur = ''

  for (const w of words) {
    if (!cur) {
      cur = w
    } else if (cur.length + 1 + w.length <= maxCharsPerLine) {
      cur += ' ' + w
    } else {
      lines.push(cur)
      cur = w
      if (lines.length === MAX_LINES - 1) break
    }
  }
  if (cur && lines.length < MAX_LINES) {
    lines.push(cur)
  }
  if (lines.length === MAX_LINES && words.length > lines.join(' ').split(' ').length) {
    lines[MAX_LINES - 1] = lines[MAX_LINES - 1].replace(/…$/, '') + '…'
  }
  return lines.length ? lines : [text.slice(0, maxCharsPerLine)]
}

function computeNodeBox(node: StructuralNode, depth: number): NodeBox {
  const cacheKey = `${node.id || node.name}:${depth}:${node.element_kind || ''}`
  const cached = boxCache.get(cacheKey)
  if (cached) return cached

  const kind = node.element_kind || (depth === 0 ? 'document' : 'heading')
  const fs = depth === 0 ? 12 : depth === 1 ? 11.5 : 11

  let maxW = 220
  let maxChars = 24

  if (kind === 'document') {
    maxW = 230
    maxChars = 25
  } else if (kind === 'table') {
    maxW = 180
    maxChars = 20
  } else if (kind === 'image') {
    maxW = 190
    maxChars = 22
  } else if (kind === 'paragraph') {
    maxW = 250
    maxChars = 30
  } else {
    maxW = depth === 1 ? 210 : 190
    maxChars = depth === 1 ? 23 : 21
  }

  const lines = wrapLabel(node.name || 'Untitled', maxChars)
  const longest = Math.max(...lines.map((l) => l.length), 1)
  const charW = depth === 0 ? 7.2 : 6.6
  const w = Math.min(maxW, Math.max(120, longest * charW + 48))
  const h = Math.max(36, lines.length * LABEL_LINE_H + 20)

  const res: NodeBox = { w, h, lines, fs }
  boxCache.set(cacheKey, res)
  return res
}

function normalizeTree(raw: StructuralNode, path: string = 'root', depth: number = 0): TreeLayoutNode {
  const id = raw.id || path
  const box = computeNodeBox(raw, depth)
  const children = (raw.children || []).map((c, i) =>
    normalizeTree(c, `${id}/${i}-${(c.name || '').replace(/\W+/g, '').slice(0, 12)}_${i}`, depth + 1)
  )

  return {
    id,
    name: raw.name || 'Untitled',
    box,
    data: { ...raw, id },
    children,
    subtreeHeight: 0,
  }
}

function computeSubtreeHeights(node: TreeLayoutNode, expanded: Set<string>): number {
  const isExpanded = expanded.has(node.id)
  if (!isExpanded || !node.children.length) {
    node.subtreeHeight = node.box.h + NODE_GAP_Y
    return node.subtreeHeight
  }

  let sum = 0
  for (const child of node.children) {
    sum += computeSubtreeHeights(child, expanded)
  }
  node.subtreeHeight = Math.max(node.box.h + NODE_GAP_Y, sum)
  return node.subtreeHeight
}

function assignChildPositions(
  node: TreeLayoutNode,
  expanded: Set<string>,
  x: number,
  topY: number,
  posMap: Map<string, NodePos>,
  visibleNodes: StructuralNode[],
  parentPos: NodePos
) {
  const y = topY + node.box.h / 2
  const currentPos: NodePos = {
    id: node.id,
    x,
    y,
    w: node.box.w,
    h: node.box.h,
    parentId: parentPos.id,
    parentX: parentPos.x,
    parentY: parentPos.y,
    data: node.data,
  }

  posMap.set(node.id, currentPos)
  visibleNodes.push(node.data)

  if (expanded.has(node.id) && node.children.length > 0) {
    let subTop = topY
    const childX = x + Math.max(node.box.w / 2 + 105, 235)
    for (const child of node.children) {
      assignChildPositions(child, expanded, childX, subTop, posMap, visibleNodes, currentPos)
      subTop += child.subtreeHeight
    }
  }
}

export interface KnowledgeMindMapProps {
  outline?: StructuralNode
  data?: StructuralNode
  mode?: 'mindmap' | 'structure'
  notebookTitle?: string
  onSelect?: (node: StructuralNode) => void
}

export function KnowledgeMindMap({
  outline,
  data,
  mode = 'mindmap',
  notebookTitle,
  onSelect,
}: KnowledgeMindMapProps) {
  const rootData = data || outline

  const [expanded, setExpanded] = useState<Set<string>>(new Set(['root']))
  const [selectedNode, setSelectedNode] = useState<StructuralNode | null>(null)
  const [copied, setCopied] = useState(false)
  const [zoomDisplay, setZoomDisplay] = useState(100)

  const wrapRef = useRef<HTMLDivElement | null>(null)
  const viewportContentRef = useRef<SVGGElement | null>(null)
  const bgGridRef = useRef<HTMLDivElement | null>(null)

  const viewRef = useRef({ x: 80, y: 80, k: 1 })
  const rafId = useRef<number | null>(null)

  const isDraggingRef = useRef(false)
  const dragStartRef = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null)
  const hasMovedRef = useRef(false)

  const normalizedRoot = useMemo(() => {
    if (!rootData) return null
    return normalizeTree(rootData, 'root', 0)
  }, [rootData])

  useEffect(() => {
    if (!normalizedRoot) return
    const initial = new Set<string>(['root'])
    // Automatically expand the root and immediate first-level sections for instant readability
    if (normalizedRoot.children.length > 0) {
      initial.add(normalizedRoot.id)
      for (const ch of normalizedRoot.children) {
        if (ch.children.length > 0 && normalizedRoot.children.length <= 4) {
          initial.add(ch.id)
        }
      }
    }
    setExpanded(initial)
  }, [normalizedRoot])

  // Deterministic, Anchor-Stable Layout:
  // Root node stays locked at (120, 100). Expanding any branch only moves
  // descendants and siblings BELOW it without shifting ancestor nodes or root.
  const { posMap, visibleNodes, edges, bounds } = useMemo(() => {
    const pos = new Map<string, NodePos>()
    const nodes: StructuralNode[] = []
    const edgeList: EdgeData[] = []

    if (!normalizedRoot) {
      return { posMap: pos, visibleNodes: nodes, edges: edgeList, bounds: { w: 800, h: 600 } }
    }

    computeSubtreeHeights(normalizedRoot, expanded)

    // Anchor Root stably at (120, 100)
    const rootPos: NodePos = {
      id: normalizedRoot.id,
      x: 120,
      y: 100,
      w: normalizedRoot.box.w,
      h: normalizedRoot.box.h,
      data: normalizedRoot.data,
    }
    pos.set(normalizedRoot.id, rootPos)
    nodes.push(normalizedRoot.data)

    if (expanded.has(normalizedRoot.id) && normalizedRoot.children.length > 0) {
      let childTop = 80
      const childX = 120 + Math.max(normalizedRoot.box.w / 2 + 105, 235)
      for (const child of normalizedRoot.children) {
        assignChildPositions(child, expanded, childX, childTop, pos, nodes, rootPos)
        childTop += child.subtreeHeight
      }
    }

    for (const n of nodes) {
      const p = pos.get(n.id!)
      if (p && p.parentId && pos.has(p.parentId)) {
        const s = pos.get(p.parentId)!
        edgeList.push({
          id: `${s.id}->${p.id}`,
          source: s.id,
          target: p.id,
          sx: s.x + s.w / 2 + 8,
          sy: s.y,
          tx: p.x - p.w / 2 - 8,
          ty: p.y,
          elementKind: p.data.element_kind,
        })
      }
    }

    let maxX = 800
    let maxY = 600
    for (const p of pos.values()) {
      if (p.x + p.w / 2 + 100 > maxX) maxX = p.x + p.w / 2 + 100
      if (p.y + p.h / 2 + 100 > maxY) maxY = p.y + p.h / 2 + 100
    }

    return {
      posMap: pos,
      visibleNodes: nodes,
      edges: edgeList,
      bounds: { w: maxX, h: maxY },
    }
  }, [normalizedRoot, expanded])

  // Direct GPU Compositor Transformation (Zero React state update overhead during drag)
  const updateDomTransform = useCallback(() => {
    const { x, y, k } = viewRef.current
    if (viewportContentRef.current) {
      viewportContentRef.current.style.transform = `translate3d(${x}px, ${y}px, 0px) scale(${k})`
    }
    if (bgGridRef.current) {
      const gx = ((x % 28) + 28) % 28
      const gy = ((y % 28) + 28) % 28
      bgGridRef.current.style.backgroundPosition = `${gx}px ${gy}px`
    }
    rafId.current = null
  }, [])

  const scheduleDomTransform = useCallback(() => {
    if (rafId.current === null) {
      rafId.current = requestAnimationFrame(updateDomTransform)
    }
  }, [updateDomTransform])

  const clampK = (k: number) => Math.min(2.5, Math.max(0.08, k))

  const setViewInternal = useCallback(
    (nx: number, ny: number, nk: number, updateZoomBadge: boolean = false) => {
      viewRef.current = { x: nx, y: ny, k: nk }
      scheduleDomTransform()
      if (updateZoomBadge) {
        setZoomDisplay(Math.round(nk * 100))
      }
    },
    [scheduleDomTransform]
  )

  const fitToView = useCallback(() => {
    const el = wrapRef.current
    if (!el || !bounds.w || !bounds.h) return
    const rect = el.getBoundingClientRect()
    if (rect.width < 20 || rect.height < 20) return

    const padX = 80
    const padY = 80
    const scale = Math.min(
      (rect.width - padX) / Math.max(bounds.w, 1),
      (rect.height - padY) / Math.max(bounds.h, 1),
      1.1
    )
    const k = clampK(Math.max(scale, 0.15))
    const x = Math.max(40, (rect.width - bounds.w * k) / 2)
    const y = Math.max(40, (rect.height - bounds.h * k) / 2)

    setViewInternal(x, y, k, true)
  }, [bounds, setViewInternal])

  const prevRootIdRef = useRef<string | null>(null)
  useEffect(() => {
    if (normalizedRoot && normalizedRoot.id !== prevRootIdRef.current) {
      prevRootIdRef.current = normalizedRoot.id
      const t = setTimeout(() => fitToView(), 60)
      return () => clearTimeout(t)
    }
  }, [normalizedRoot, fitToView])

  const zoomBy = (factor: number) => {
    const el = wrapRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const cx = rect.width / 2
    const cy = rect.height / 2
    const v = viewRef.current
    const newK = clampK(v.k * factor)
    const ratio = newK / v.k
    const newX = cx - (cx - v.x) * ratio
    const newY = cy - (cy - v.y) * ratio
    setViewInternal(newX, newY, newK, true)
  }

  // Smooth wheel zoom around cursor focal point
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = el.getBoundingClientRect()
      const cx = e.clientX - rect.left
      const cy = e.clientY - rect.top

      const v = viewRef.current
      const zoomFactor = Math.exp(-e.deltaY * 0.0018)
      const newK = clampK(v.k * zoomFactor)
      const ratio = newK / v.k
      const newX = cx - (cx - v.x) * ratio
      const newY = cy - (cy - v.y) * ratio

      setViewInternal(newX, newY, newK, true)
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [setViewInternal])

  // Native 120 FPS Pointer Drag Panning
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    // Only bypass dragging when clicking explicit interactive buttons
    if ((e.target as HTMLElement).closest('button, [data-action="expand"], [data-action="close"]')) return

    try {
      wrapRef.current?.setPointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }

    isDraggingRef.current = true
    hasMovedRef.current = false
    dragStartRef.current = {
      sx: e.clientX,
      sy: e.clientY,
      ox: viewRef.current.x,
      oy: viewRef.current.y,
    }
    if (wrapRef.current) {
      wrapRef.current.style.cursor = 'grabbing'
    }
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragStartRef.current
    if (!isDraggingRef.current || !d) return

    const dx = e.clientX - d.sx
    const dy = e.clientY - d.sy
    if (Math.abs(dx) + Math.abs(dy) > 4) {
      hasMovedRef.current = true
    }

    const nx = d.ox + dx
    const ny = d.oy + dy
    setViewInternal(nx, ny, viewRef.current.k, false)
  }

  const endDrag = () => {
    if (!isDraggingRef.current) return
    isDraggingRef.current = false
    dragStartRef.current = null
    if (wrapRef.current) {
      wrapRef.current.style.cursor = 'grab'
    }
  }

  const toggleExpand = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleNodeClick = (node: StructuralNode) => {
    if (hasMovedRef.current) return
    setSelectedNode(node)
    onSelect?.(node)
  }

  const handleCopyText = (text: string) => {
    if (!text) return
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const getNodeVisualConfig = (node: StructuralNode, depth: number) => {
    const kind = node.element_kind || (depth === 0 ? 'document' : 'heading')

    if (kind === 'document') {
      return {
        bg: '#181e29',
        border: 'rgba(255, 223, 153, 0.75)',
        accent: '#ffdf99',
        badgeBg: 'rgba(255, 223, 153, 0.15)',
        text: '#ffdf99',
        icon: FileText,
        label: 'Document',
      }
    }
    if (kind === 'table') {
      return {
        bg: '#201633',
        border: 'rgba(192, 132, 252, 0.65)',
        accent: '#c084fc',
        badgeBg: 'rgba(192, 132, 252, 0.15)',
        text: '#e9d5ff',
        icon: TableIcon,
        label: 'Table',
      }
    }
    if (kind === 'image') {
      return {
        bg: '#2b1b17',
        border: 'rgba(251, 146, 60, 0.65)',
        accent: '#fb923c',
        badgeBg: 'rgba(251, 146, 60, 0.15)',
        text: '#ffedd5',
        icon: ImageIcon,
        label: 'Figure',
      }
    }
    if (kind === 'paragraph') {
      return {
        bg: '#111822',
        border: 'rgba(148, 163, 184, 0.45)',
        accent: '#94a3b8',
        badgeBg: 'rgba(148, 163, 184, 0.12)',
        text: '#e2e8f0',
        icon: AlignLeft,
        label: 'Paragraph',
      }
    }
    if (node.level === 'h1' || depth === 1) {
      return {
        bg: '#14213d',
        border: 'rgba(96, 165, 250, 0.7)',
        accent: '#60a5fa',
        badgeBg: 'rgba(96, 165, 250, 0.15)',
        text: '#dbeafe',
        icon: Hash,
        label: 'H1 Section',
      }
    }
    if (node.level === 'h2' || depth === 2) {
      return {
        bg: '#112936',
        border: 'rgba(56, 189, 248, 0.65)',
        accent: '#38bdf8',
        badgeBg: 'rgba(56, 189, 248, 0.15)',
        text: '#e0f2fe',
        icon: Layers,
        label: 'H2 Subsection',
      }
    }
    return {
      bg: '#132e27',
      border: 'rgba(52, 211, 153, 0.6)',
      accent: '#34d399',
      badgeBg: 'rgba(52, 211, 153, 0.15)',
      text: '#d1fae5',
      icon: BookOpen,
      label: 'H3 Subsection',
    }
  }

  return (
    <div
      ref={wrapRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background:
          'radial-gradient(800px 420px at 15% 12%, rgba(168,199,250,0.07), transparent), radial-gradient(700px 380px at 85% 82%, rgba(196,238,208,0.06), transparent), #0a0d12',
        position: 'relative',
        cursor: 'grab',
        touchAction: 'none',
        userSelect: 'none',
      }}
    >
      {/* Dynamic Infinite Grid */}
      <div
        ref={bgGridRef}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          backgroundPosition: '0px 0px',
          pointerEvents: 'none',
        }}
      />

      {/* Floating Canvas Controls */}
      <div
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          display: 'flex',
          gap: 6,
          zIndex: 10,
          alignItems: 'center',
        }}
      >
        <button
          onClick={() => zoomBy(1 / 1.25)}
          title="Zoom out"
          aria-label="Zoom out"
          style={ctrlBtnStyle}
        >
          <Minus size={14} strokeWidth={2.4} />
        </button>
        <span style={zoomBadgeStyle}>{zoomDisplay}%</span>
        <button
          onClick={() => zoomBy(1.25)}
          title="Zoom in"
          aria-label="Zoom in"
          style={ctrlBtnStyle}
        >
          <Plus size={14} strokeWidth={2.4} />
        </button>
        <button
          onClick={() => fitToView()}
          title="Fit entire hierarchy to view"
          aria-label="Fit to view"
          style={ctrlBtnStyle}
        >
          <Maximize2 size={13} strokeWidth={2.2} />
        </button>
      </div>

      {/* SVG Canvas for High-Performance GPU Rendering */}
      <svg
        style={{
          display: 'block',
          position: 'relative',
          width: '100%',
          height: '100%',
          overflow: 'visible',
        }}
        onClick={(e) => {
          if (!hasMovedRef.current && e.target === e.currentTarget) {
            setSelectedNode(null)
          }
        }}
      >
        <g
          ref={viewportContentRef}
          style={{
            transformOrigin: '0 0',
            willChange: 'transform',
            transform: `translate3d(${viewRef.current.x}px, ${viewRef.current.y}px, 0px) scale(${viewRef.current.k})`,
          }}
        >
          {/* Synchronized Smooth Edges Layer */}
          <g>
            <AnimatePresence>
              {edges.map((e) => {
                const isTargetSelected = selectedNode?.id === e.target
                const isSourceSelected = selectedNode?.id === e.source
                const isSelected = isTargetSelected || isSourceSelected

                const mx = (e.sx + e.tx) / 2
                const pathD = `M ${e.sx} ${e.sy} C ${mx} ${e.sy}, ${mx} ${e.ty}, ${e.tx} ${e.ty}`
                const collapsedD = `M ${e.sx} ${e.sy} C ${e.sx} ${e.sy}, ${e.sx} ${e.sy}, ${e.sx} ${e.sy}`

                return (
                  <motion.path
                    key={e.id}
                    d={pathD}
                    fill="none"
                    stroke={
                      isSelected
                        ? 'rgba(168,199,250,0.95)'
                        : e.elementKind === 'table'
                        ? 'rgba(192,132,252,0.45)'
                        : e.elementKind === 'image'
                        ? 'rgba(251,146,60,0.45)'
                        : 'rgba(148,163,184,0.32)'
                    }
                    strokeWidth={isSelected ? 2.2 : 1.4}
                    initial={{ opacity: 0, d: collapsedD }}
                    animate={{ opacity: 1, d: pathD }}
                    exit={{ opacity: 0, d: collapsedD }}
                    transition={MOTION_TRANSITION}
                  />
                )
              })}
            </AnimatePresence>
          </g>

          {/* Interactive Nodes Layer */}
          <AnimatePresence initial={false}>
            {visibleNodes.map((n) => {
              const p = posMap.get(n.id!)
              if (!p) return null

              const depth = n.id!.split('/').length - 1
              const hasChildren = (n.children?.length || 0) > 0
              const isExpanded = expanded.has(n.id!)
              const isSelected = selectedNode?.id === n.id
              const box = computeNodeBox(n, depth)
              const cfg = getNodeVisualConfig(n, depth)

              const parentX = p.parentX ?? p.x
              const parentY = p.parentY ?? p.y

              return (
                <motion.g
                  key={n.id}
                  initial={{
                    x: parentX,
                    y: parentY,
                    opacity: 0,
                    scale: 0.6,
                  }}
                  animate={{
                    x: p.x,
                    y: p.y,
                    opacity: 1,
                    scale: 1,
                  }}
                  exit={{
                    x: parentX,
                    y: parentY,
                    opacity: 0,
                    scale: 0.6,
                  }}
                  transition={MOTION_TRANSITION}
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleNodeClick(n)}
                >
                  {/* Zero-Cost Background Drop Shadow (Replaces heavy Gaussian blur SVG filter) */}
                  <rect
                    x={-box.w / 2}
                    y={-box.h / 2 + 3}
                    rx={10}
                    width={box.w}
                    height={box.h}
                    fill="rgba(0, 0, 0, 0.45)"
                    pointerEvents="none"
                  />

                  {/* Selected Outer Focus Accent */}
                  {isSelected && (
                    <rect
                      x={-box.w / 2 - 3}
                      y={-box.h / 2 - 3}
                      rx={13}
                      width={box.w + 6}
                      height={box.h + 6}
                      fill="none"
                      stroke="rgba(96, 165, 250, 0.6)"
                      strokeWidth={2}
                      pointerEvents="none"
                    />
                  )}

                  {/* Node Card Base */}
                  <rect
                    x={-box.w / 2}
                    y={-box.h / 2}
                    rx={10}
                    width={box.w}
                    height={box.h}
                    fill={cfg.bg}
                    stroke={isSelected ? 'var(--accent-blue, #60a5fa)' : cfg.border}
                    strokeWidth={isSelected ? 2 : 1.2}
                  />

                  {/* Subtle Top Gloss Accent */}
                  <rect
                    x={-box.w / 2}
                    y={-box.h / 2}
                    rx={10}
                    width={box.w}
                    height={box.h / 2}
                    fill="rgba(255,255,255,0.03)"
                    pointerEvents="none"
                  />

                  {/* Indicator Icon / Pill */}
                  <circle
                    cx={-box.w / 2 + 14}
                    cy={0}
                    r={4.5}
                    fill={cfg.accent}
                    pointerEvents="none"
                  />

                  {/* Node Text Content - Clean, Non-Overlapping */}
                  <text
                    x={-box.w / 2 + 26}
                    y={-((box.lines.length - 1) * LABEL_LINE_H) / 2}
                    textAnchor="start"
                    fill={cfg.text}
                    fontSize={box.fs}
                    fontWeight={depth === 0 ? 700 : depth === 1 ? 600 : 500}
                    fontFamily="Inter, system-ui, sans-serif"
                    pointerEvents="none"
                  >
                    {box.lines.map((ln, li) => (
                      <tspan key={li} x={-box.w / 2 + 26} dy={li === 0 ? 4 : LABEL_LINE_H}>
                        {ln}
                      </tspan>
                    ))}
                  </text>

                  {/* Expand / Collapse Button Pill */}
                  {hasChildren && (
                    <g
                      data-action="expand"
                      onClick={(e) => toggleExpand(n.id!, e)}
                      style={{ cursor: 'pointer' }}
                      transform={`translate(${box.w / 2 + 12}, 0)`}
                    >
                      <circle
                        r={10}
                        fill="#0f1419"
                        stroke={isExpanded ? cfg.accent : 'rgba(148,163,184,0.5)'}
                        strokeWidth={1.2}
                      />
                      <text
                        textAnchor="middle"
                        dy={3.5}
                        fill={isExpanded ? cfg.accent : '#94a3b8'}
                        fontSize={11}
                        fontWeight={800}
                        fontFamily="Inter, system-ui, sans-serif"
                        pointerEvents="none"
                      >
                        {isExpanded ? '‹' : '›'}
                      </text>
                    </g>
                  )}
                </motion.g>
              )
            })}
          </AnimatePresence>
        </g>
      </svg>

      {/* Floating Node Inspector / Detail Drawer */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            style={{
              position: 'absolute',
              top: 16,
              bottom: 16,
              right: 16,
              width: 360,
              maxWidth: 'calc(100% - 32px)',
              background: 'rgba(18, 22, 29, 0.95)',
              backdropFilter: 'blur(16px)',
              border: '1px solid var(--border, rgba(148,163,184,0.25))',
              borderRadius: 16,
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
              display: 'flex',
              flexDirection: 'column',
              zIndex: 30,
              overflow: 'hidden',
            }}
          >
            {/* Drawer Header */}
            <div
              style={{
                padding: '14px 18px',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(25, 30, 40, 0.6)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    padding: '3px 8px',
                    borderRadius: 12,
                    fontSize: 11,
                    fontWeight: 600,
                    background: getNodeVisualConfig(selectedNode, 1).badgeBg,
                    color: getNodeVisualConfig(selectedNode, 1).accent,
                    border: `1px solid ${getNodeVisualConfig(selectedNode, 1).accent}40`,
                    textTransform: 'capitalize',
                  }}
                >
                  {selectedNode.element_kind || selectedNode.level || 'Node'}
                </span>
                {selectedNode.page_number && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: 10,
                      background: 'rgba(96, 165, 250, 0.12)',
                      color: 'var(--accent-blue, #60a5fa)',
                      border: '1px solid rgba(96, 165, 250, 0.3)',
                    }}
                  >
                    Page {selectedNode.page_number}
                  </span>
                )}
              </div>
              <button
                data-action="close"
                onClick={() => setSelectedNode(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted, #94a3b8)',
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 6,
                }}
                title="Close Inspector"
              >
                <X size={16} />
              </button>
            </div>

            {/* Drawer Body Content */}
            <div
              style={{
                padding: '16px 18px',
                flex: 1,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}
            >
              <div>
                <h3
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: 'var(--text-primary, #f8fafc)',
                    margin: 0,
                    lineHeight: 1.4,
                  }}
                >
                  {selectedNode.name}
                </h3>
                {selectedNode.heading_path && selectedNode.heading_path.length > 0 && (
                  <p
                    style={{
                      fontSize: 12,
                      color: 'var(--text-muted, #94a3b8)',
                      margin: '6px 0 0 0',
                    }}
                  >
                    {selectedNode.heading_path.join(' › ')}
                  </p>
                )}
              </div>

              {/* Image Preview if image element */}
              {selectedNode.image_url && (
                <div
                  style={{
                    borderRadius: 8,
                    overflow: 'hidden',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: '#0f1419',
                  }}
                >
                  <img
                    src={selectedNode.image_url}
                    alt={selectedNode.caption || selectedNode.name}
                    style={{ width: '100%', display: 'block' }}
                  />
                  {selectedNode.caption && (
                    <p
                      style={{
                        padding: '8px 12px',
                        fontSize: 12,
                        color: 'var(--text-muted, #94a3b8)',
                        margin: 0,
                        fontStyle: 'italic',
                      }}
                    >
                      {selectedNode.caption}
                    </p>
                  )}
                </div>
              )}

              {/* Text Body */}
              {selectedNode.text && (
                <div
                  style={{
                    background: 'rgba(0,0,0,0.25)',
                    padding: 14,
                    borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.06)',
                    fontSize: 13,
                    lineHeight: 1.6,
                    color: '#e2e8f0',
                    whiteSpace: selectedNode.element_kind === 'table' ? 'pre' : 'pre-wrap',
                    fontFamily:
                      selectedNode.element_kind === 'table'
                        ? 'var(--font-mono, monospace)'
                        : 'inherit',
                    overflowX: 'auto',
                  }}
                >
                  {selectedNode.text}
                </div>
              )}

              {/* Action Buttons */}
              {selectedNode.text && (
                <div style={{ marginTop: 'auto', paddingTop: 8 }}>
                  <button
                    onClick={() => handleCopyText(selectedNode.text!)}
                    style={{
                      width: '100%',
                      padding: '8px 14px',
                      borderRadius: 8,
                      border: '1px solid var(--border, rgba(148,163,184,0.3))',
                      background: 'rgba(255,255,255,0.05)',
                      color: copied ? '#34d399' : 'var(--text-primary, #f8fafc)',
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Copied to Clipboard' : 'Copy Content'}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const ctrlBtnStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 8,
  cursor: 'pointer',
  background: 'rgba(18,22,29,0.9)',
  color: '#e2e8f0',
  border: '1px solid rgba(148,163,184,0.35)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  margin: 0,
  boxSizing: 'border-box',
  userSelect: 'none',
  transition: 'background 0.15s, border-color 0.15s',
}

const zoomBadgeStyle: React.CSSProperties = {
  height: 32,
  color: '#94a3b8',
  fontSize: 11,
  minWidth: 46,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  background: 'rgba(18,22,29,0.9)',
  border: '1px solid rgba(148,163,184,0.35)',
  borderRadius: 8,
  padding: '0 6px',
  boxSizing: 'border-box',
  userSelect: 'none',
  fontWeight: 600,
}
