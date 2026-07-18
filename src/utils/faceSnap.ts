import type { Square } from '../store/useSquareStore'

const DEFAULT_SNAP_DISTANCE = 0.2

function trySnapAxis(
  candidateCenter: number,
  candidateHalf: number,
  otherCenter: number,
  otherHalf: number,
  snapDistance: number,
): { center: number; gap: number } | null {
  const pairs = [
    { candidateFace: candidateCenter + candidateHalf, otherFace: otherCenter - otherHalf },
    { candidateFace: candidateCenter - candidateHalf, otherFace: otherCenter + otherHalf },
  ]

  let best: { center: number; gap: number } | null = null

  for (const { candidateFace, otherFace } of pairs) {
    const gap = Math.abs(candidateFace - otherFace)
    if (gap > snapDistance) continue

    const offset = otherFace - candidateFace
    const center = candidateCenter + offset
    if (!best || gap < best.gap) {
      best = { center, gap }
    }
  }

  return best
}

export function applyFaceSnap(
  candidate: Square,
  others: Square[],
  snapDistance = DEFAULT_SNAP_DISTANCE,
): [number, number, number] {
  const [w, , d] = candidate.size
  const halfW = w / 2
  const halfD = d / 2

  let bestX: number | null = null
  let bestXGap = snapDistance
  let bestZ: number | null = null
  let bestZGap = snapDistance

  for (const other of others) {
    if (other.id === candidate.id) continue

    const [ow, , od] = other.size
    const xSnap = trySnapAxis(
      candidate.position[0],
      halfW,
      other.position[0],
      ow / 2,
      snapDistance,
    )
    if (xSnap && xSnap.gap <= bestXGap) {
      bestXGap = xSnap.gap
      bestX = xSnap.center
    }

    const zSnap = trySnapAxis(
      candidate.position[2],
      halfD,
      other.position[2],
      od / 2,
      snapDistance,
    )
    if (zSnap && zSnap.gap <= bestZGap) {
      bestZGap = zSnap.gap
      bestZ = zSnap.center
    }
  }

  return [
    bestX ?? candidate.position[0],
    candidate.position[1],
    bestZ ?? candidate.position[2],
  ]
}
