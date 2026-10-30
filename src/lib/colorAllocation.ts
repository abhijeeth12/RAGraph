/**
 * Intelligent Randomized Notebook Color Allocation
 * 
 * Uses the perceptual Oklab color space and 2D grid spatial distance optimization
 * to ensure that:
 * 1. Identical colors are kept as far apart as possible in both row and column directions.
 * 2. Perceptually similar shades/hues are separated with maximum spatial distance.
 * 3. Assignments are stable across reloads, additions, and deletions (persisted in localStorage).
 * 4. Genuine variation/randomness is introduced via elite-tier stochastic sampling.
 * 5. High contrast is guaranteed against dark text (#111827, WCAG AA/AAA compliant).
 */

export interface DocketColor {
  id: string
  name: string
  bg: string
  text: string
  subtext: string
  badgeBg: string
  badgeText: string
  starColor?: string
}

// 12 Curated, high-aesthetic pastel/candy colors with verified contrast for dark text (#111827)
export const WORKSPACE_PALETTE: DocketColor[] = [
  {
    id: 'peach',
    name: 'Peach Coral',
    bg: '#FF9F76',
    text: '#111827',
    subtext: 'rgba(17, 24, 39, 0.78)',
    badgeBg: '#111827',
    badgeText: '#ffffff',
  },
  {
    id: 'yellow',
    name: 'Amber Yellow',
    bg: '#FEC868',
    text: '#111827',
    subtext: 'rgba(17, 24, 39, 0.78)',
    badgeBg: '#111827',
    badgeText: '#ffffff',
  },
  {
    id: 'coral',
    name: 'Coral Red',
    bg: '#FF8B70',
    text: '#111827',
    subtext: 'rgba(17, 24, 39, 0.78)',
    badgeBg: '#111827',
    badgeText: '#ffffff',
  },
  {
    id: 'purple',
    name: 'Lilac Purple',
    bg: '#A88BEB',
    text: '#111827',
    subtext: 'rgba(17, 24, 39, 0.78)',
    badgeBg: '#111827',
    badgeText: '#ffffff',
    starColor: '#ffd700',
  },
  {
    id: 'lime',
    name: 'Lime Green',
    bg: '#D8F78F',
    text: '#111827',
    subtext: 'rgba(17, 24, 39, 0.78)',
    badgeBg: '#111827',
    badgeText: '#ffffff',
  },
  {
    id: 'cyan',
    name: 'Sky Cyan',
    bg: '#32D6F5',
    text: '#111827',
    subtext: 'rgba(17, 24, 39, 0.78)',
    badgeBg: '#111827',
    badgeText: '#ffffff',
  },
  {
    id: 'mint',
    name: 'Mint Green',
    bg: '#85E3B3',
    text: '#111827',
    subtext: 'rgba(17, 24, 39, 0.78)',
    badgeBg: '#111827',
    badgeText: '#ffffff',
  },
  {
    id: 'pink',
    name: 'Bubblegum Pink',
    bg: '#FFA6D5',
    text: '#111827',
    subtext: 'rgba(17, 24, 39, 0.78)',
    badgeBg: '#111827',
    badgeText: '#ffffff',
  },
  {
    id: 'lavender',
    name: 'Lavender Mist',
    bg: '#D4A5FF',
    text: '#111827',
    subtext: 'rgba(17, 24, 39, 0.78)',
    badgeBg: '#111827',
    badgeText: '#ffffff',
  },
  {
    id: 'orange',
    name: 'Buttercup Orange',
    bg: '#FFD166',
    text: '#111827',
    subtext: 'rgba(17, 24, 39, 0.78)',
    badgeBg: '#111827',
    badgeText: '#ffffff',
  },
  {
    id: 'seafoam',
    name: 'Seafoam Turquoise',
    bg: '#6EE7B7',
    text: '#111827',
    subtext: 'rgba(17, 24, 39, 0.78)',
    badgeBg: '#111827',
    badgeText: '#ffffff',
  },
  {
    id: 'periwinkle',
    name: 'Periwinkle Blue',
    bg: '#93C5FD',
    text: '#111827',
    subtext: 'rgba(17, 24, 39, 0.78)',
    badgeBg: '#111827',
    badgeText: '#ffffff',
  },
]

// Backward compatibility alias for the top 6 signature Docket colors
export const DOCKET_COLORS = WORKSPACE_PALETTE.slice(0, 6)

export interface OklabColor {
  L: number
  a: number
  b: number
}

/**
 * Converts sRGB hex string to Oklab color space (Björn Ottosson, 2020)
 * which provides uniform perceptual color distance.
 */
export function hexToOklab(hex: string): OklabColor {
  let clean = hex.replace('#', '').trim()
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('')
  }
  const r8 = parseInt(clean.substring(0, 2), 16) || 0
  const g8 = parseInt(clean.substring(2, 4), 16) || 0
  const b8 = parseInt(clean.substring(4, 6), 16) || 0

  // Gamma uncompression to linear sRGB
  const toLinear = (c: number): number => {
    const v = c / 255
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  }
  const r = toLinear(r8)
  const g = toLinear(g8)
  const b = toLinear(b8)

  // Linear sRGB to cone response (LMS)
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b

  // Non-linear response (cube root)
  const l_ = Math.cbrt(Math.max(0, l))
  const m_ = Math.cbrt(Math.max(0, m))
  const s_ = Math.cbrt(Math.max(0, s))

  // LMS to Oklab
  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_
  const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_
  const b_val = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_

  return { L, a, b: b_val }
}

// Precompute Oklab values for the palette to ensure zero runtime overhead
const PALETTE_OKLAB: OklabColor[] = WORKSPACE_PALETTE.map((c) => hexToOklab(c.bg))

/**
 * Calculates perceptual color distance between two palette indices using Oklab Delta E.
 */
export function perceptualColorDistance(idxA: number, idxB: number): number {
  if (idxA === idxB) return 0
  const cA = PALETTE_OKLAB[idxA]
  const cB = PALETTE_OKLAB[idxB]
  const dL = cA.L - cB.L
  const da = cA.a - cB.a
  const db = cA.b - cB.b
  return Math.sqrt(dL * dL + da * da + db * db)
}

const STORAGE_KEY = 'ragraph_notebook_colors_v2'

/**
 * Retrieves the persisted mapping of notebook ID -> color ID from localStorage.
 */
export function getStoredColorMap(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (typeof parsed === 'object' && parsed !== null) {
        return parsed
      }
    }
  } catch {}
  return {}
}

/**
 * Persists the notebook ID -> color ID mapping.
 */
export function saveStoredColorMap(map: Record<string, string>): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch {}
}

export interface GridAssignedItem {
  index: number
  colorIdx: number
}

/**
 * Computes the spatial penalty for assigning candidate color `candColorIdx` to grid position `pos`.
 * Neighbors within radius R = 2.5 (covering direct horizontal, vertical, diagonal, and 2-step neighbors)
 * contribute an electrostatic-style repulsive penalty based on inverse square spatial distance
 * and perceptual color similarity.
 */
function computeColorPenalty(
  pos: number,
  candColorIdx: number,
  assigned: GridAssignedItem[],
  cols: number
): number {
  const row = Math.floor(pos / cols)
  const col = pos % cols
  let penalty = 0

  for (const item of assigned) {
    if (item.index === pos) continue
    const nRow = Math.floor(item.index / cols)
    const nCol = item.index % cols
    const dRow = row - nRow
    const dCol = col - nCol
    const spatialDistSq = dRow * dRow + dCol * dCol
    if (spatialDistSq === 0) continue

    // Only consider relevant 2D spatial neighborhood (radius <= 2.5)
    if (spatialDistSq <= 6.25) {
      const spatialWeight = 1.0 / spatialDistSq
      const deltaE = perceptualColorDistance(candColorIdx, item.colorIdx)

      if (candColorIdx === item.colorIdx) {
        // Severe penalty for identical color in local neighborhood
        penalty += spatialWeight * 120.0
      } else {
        // High penalty for perceptually close shades (e.g. two very similar pinks/corals)
        penalty += spatialWeight * (1.0 / (deltaE + 0.02))
      }
    }
  }

  return penalty
}

/**
 * Selects an optimal color index for grid position `pos` using an intelligent
 * Max-Min / Minimum Penalty approach combined with Elite Stochastic Sampling.
 * 
 * Randomness operates within an elite candidate tier (candidates within 15% of the minimum
 * penalty score), guaranteeing maximum perceptual separation while introducing organic variety.
 */
export function selectOptimalColorIndex(
  pos: number,
  assigned: GridAssignedItem[],
  cols: number = 3
): number {
  const numColors = WORKSPACE_PALETTE.length
  const penalties: number[] = []

  for (let c = 0; c < numColors; c++) {
    penalties.push(computeColorPenalty(pos, c, assigned, cols))
  }

  const minPenalty = Math.min(...penalties)
  // Elite pool: candidates whose penalty is within 15% of the absolute best score
  const threshold = minPenalty * 1.15 + 0.005
  const eliteCandidates: number[] = []

  for (let c = 0; c < numColors; c++) {
    if (penalties[c] <= threshold) {
      eliteCandidates.push(c)
    }
  }

  // Draw randomly among the elite candidates
  const chosen = eliteCandidates[Math.floor(Math.random() * eliteCandidates.length)]
  return chosen ?? 0
}

/**
 * Master color allocation engine for the Dashboard.
 * 
 * - Preserves existing notebook assignments so cards do not randomly change colors on reload or edit.
 * - Intelligently allocates colors to new/unmapped notebooks considering horizontal and vertical neighbors.
 * - Cleans up deleted notebook keys to prevent storage bloat.
 * - Handles arbitrary grid columns and notebook counts gracefully.
 */
export function allocateNotebookColors(
  notebooks: Array<{ id: string }>,
  cols: number = 3
): Record<string, DocketColor> {
  const storedMap = getStoredColorMap()
  const currentIds = new Set(notebooks.map((nb) => nb.id))
  const cleanStored: Record<string, string> = {}

  // Keep only existing notebooks in cache
  for (const [id, colorId] of Object.entries(storedMap)) {
    if (currentIds.has(id)) {
      cleanStored[id] = colorId
    }
  }

  const assignedList: GridAssignedItem[] = []
  const result: Record<string, DocketColor> = {}

  // Step 1: Place already assigned notebooks into the spatial model
  notebooks.forEach((nb, index) => {
    const existingColorId = cleanStored[nb.id]
    if (existingColorId) {
      const paletteIdx = WORKSPACE_PALETTE.findIndex((c) => c.id === existingColorId)
      if (paletteIdx !== -1) {
        assignedList.push({ index, colorIdx: paletteIdx })
        result[nb.id] = WORKSPACE_PALETTE[paletteIdx]
      }
    }
  })

  // Step 2: For any notebooks lacking an assignment, allocate using 2D optimization
  notebooks.forEach((nb, index) => {
    if (!result[nb.id]) {
      const optimalIdx = selectOptimalColorIndex(index, assignedList, cols)
      const allocatedColor = WORKSPACE_PALETTE[optimalIdx]
      assignedList.push({ index, colorIdx: optimalIdx })
      result[nb.id] = allocatedColor
      cleanStored[nb.id] = allocatedColor.id
    }
  })

  // Persist updated assignments
  saveStoredColorMap(cleanStored)

  return result
}
