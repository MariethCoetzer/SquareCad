import type { Square } from '../store/useSquareStore'

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

export function overlapsXZ(a: Square, b: Square): boolean {
  const aBounds = getXZBounds(a)
  const bBounds = getXZBounds(b)
  return (
    aBounds.minX < bBounds.maxX &&
    aBounds.maxX > bBounds.minX &&
    aBounds.minZ < bBounds.maxZ &&
    aBounds.maxZ > bBounds.minZ
  )
}

export function computeStackY(dragged: Square, others: Square[]): number | null {
  let maxTop = -Infinity

  for (const other of others) {
    if (other.id === dragged.id) continue
    if (!overlapsXZ(dragged, other)) continue

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

export function resolveDragY(
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
