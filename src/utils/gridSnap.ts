export const GRID_SIZE = 1
export const MIN_DIMENSION = 0.25
export const MAX_DIMENSION = 50

export interface SnapOptions {
  height?: number
  preserveY?: boolean
  size?: [number, number, number]
}

export function snapValue(value: number, enabled: boolean): number {
  if (!enabled) return value
  return Math.round(value / GRID_SIZE) * GRID_SIZE
}

export function snapEdgeAxis(center: number, size: number, gridSize: number): number {
  const half = size / 2
  const minEdge = center - half
  const snappedMin = Math.round(minEdge / gridSize) * gridSize
  return snappedMin + half
}

export function snapPosition(
  position: [number, number, number],
  enabled: boolean,
  options: SnapOptions = {},
): [number, number, number] {
  if (!enabled) return position

  const { height, preserveY = false, size } = options
  let y: number
  if (preserveY) {
    y = position[1]
  } else if (height !== undefined) {
    y = height / 2
  } else {
    y = position[1]
  }

  const width = size?.[0] ?? GRID_SIZE
  const depth = size?.[2] ?? GRID_SIZE

  return [
    snapEdgeAxis(position[0], width, GRID_SIZE),
    y,
    snapEdgeAxis(position[2], depth, GRID_SIZE),
  ]
}

export function clampDimension(value: number): number {
  return Math.min(MAX_DIMENSION, Math.max(MIN_DIMENSION, value))
}
