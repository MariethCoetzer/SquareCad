export const GRID_SIZE = 1
export const MIN_DIMENSION = 0.25
export const MAX_DIMENSION = 6

export function snapValue(value: number, enabled: boolean): number {
  if (!enabled) return value
  return Math.round(value / GRID_SIZE) * GRID_SIZE
}

export function snapPosition(
  position: [number, number, number],
  enabled: boolean,
  height?: number,
): [number, number, number] {
  if (!enabled) return position
  const y = height !== undefined ? height / 2 : position[1]
  return [snapValue(position[0], true), y, snapValue(position[2], true)]
}

export function clampDimension(value: number): number {
  return Math.min(MAX_DIMENSION, Math.max(MIN_DIMENSION, value))
}
