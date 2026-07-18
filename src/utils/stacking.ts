import type { Square } from '../store/useSquareStore'

export const MIN_STACK_OVERLAP = 0.25

export interface XZBounds {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}

export function getXZBounds(square: Square): XZBounds {
  const [w, , d] = square.size
  const halfW = w / 2
  const halfD = d / 2
  return {
    minX: square.position[0] - halfW,
    maxX: square.position[0] + halfW,
    minZ: square.position[2] - halfD,
    maxZ: square.position[2] + halfD,
  }
}

export function overlapAreaXZ(a: Square, b: Square): number {
  const aBounds = getXZBounds(a)
  const bBounds = getXZBounds(b)
  const overlapX = Math.max(
    0,
    Math.min(aBounds.maxX, bBounds.maxX) - Math.max(aBounds.minX, bBounds.minX),
  )
  const overlapZ = Math.max(
    0,
    Math.min(aBounds.maxZ, bBounds.maxZ) - Math.max(aBounds.minZ, bBounds.minZ),
  )
  return overlapX * overlapZ
}

export function overlapRatio(dragged: Square, other: Square): number {
  const [w, , d] = dragged.size
  const footprint = w * d
  if (footprint <= 0) return 0
  return overlapAreaXZ(dragged, other) / footprint
}

export function overlapsXZ(a: Square, b: Square): boolean {
  return overlapAreaXZ(a, b) > 0
}

export function computeStackY(dragged: Square, others: Square[]): number | null {
  let maxTop = -Infinity

  for (const other of others) {
    if (other.id === dragged.id) continue
    if (overlapRatio(dragged, other) < MIN_STACK_OVERLAP) continue

    const otherTop = other.position[1] + other.size[1] / 2
    maxTop = Math.max(maxTop, otherTop)
  }

  if (maxTop === -Infinity) return null

  return maxTop + dragged.size[1] / 2
}

export function groundY(size: Square['size']): number {
  return size[1] / 2
}

export function isElevated(square: Square): boolean {
  return square.position[1] > groundY(square.size) + 0.01
}

/** Distinct center-Y positions where the block can rest at its current X/Z. */
export function getValidStackCenters(candidate: Square, others: Square[]): number[] {
  const halfH = candidate.size[1] / 2
  const centers = new Set<number>()
  centers.add(groundY(candidate.size))

  const tops = others
    .filter((o) => o.id !== candidate.id && overlapRatio(candidate, o) >= MIN_STACK_OVERLAP)
    .map((o) => o.position[1] + o.size[1] / 2)
    .sort((a, b) => a - b)

  let maxTop = 0
  for (const top of tops) {
    maxTop = Math.max(maxTop, top)
    centers.add(maxTop + halfH)
  }

  return [...centers].sort((a, b) => a - b)
}

/** Move referenceY down to the next lower valid stack layer (ground if already lowest). */
export function computeLayerDownY(
  candidate: Square,
  others: Square[],
  referenceY: number,
): number {
  const valid = getValidStackCenters(candidate, others)
  const epsilon = 0.01

  let currentIdx = 0
  for (let i = 0; i < valid.length; i++) {
    if (valid[i] <= referenceY + epsilon) {
      currentIdx = i
    }
  }

  return valid[Math.max(0, currentIdx - 1)]
}

function resolveNaturalDragY(
  candidate: Square,
  others: Square[],
  startY: number,
  zKeyHeld: boolean,
): { y: number; stacked: boolean } {
  const stackY = computeStackY(candidate, others)
  const elevated = startY > groundY(candidate.size) + 0.01

  if (stackY !== null && (zKeyHeld || elevated)) {
    return { y: stackY, stacked: true }
  }

  return { y: groundY(candidate.size), stacked: false }
}

export function resolveDragY(
  candidate: Square,
  others: Square[],
  startY: number,
  zKeyHeld: boolean,
  xKeyHeld: boolean,
): { y: number; stacked: boolean } {
  const natural = resolveNaturalDragY(candidate, others, startY, zKeyHeld)

  // X takes precedence over Z — lower by one stack layer from the natural height.
  if (xKeyHeld) {
    const y = computeLayerDownY(candidate, others, natural.y)
    const gY = groundY(candidate.size)
    return { y, stacked: y > gY + 0.01 }
  }

  return natural
}
