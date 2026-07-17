import type { Camera } from 'three'
import * as THREE from 'three'
import type { Square } from '../store/useSquareStore'

export interface ScreenRect {
  left: number
  top: number
  right: number
  bottom: number
}

export function normalizeRect(x1: number, y1: number, x2: number, y2: number): ScreenRect {
  return {
    left: Math.min(x1, x2),
    top: Math.min(y1, y2),
    right: Math.max(x1, x2),
    bottom: Math.max(y1, y2),
  }
}

export function projectSquareToScreen(
  square: Square,
  camera: Camera,
  width: number,
  height: number,
): { x: number; y: number } | null {
  const vector = new THREE.Vector3(...square.position)
  vector.project(camera)

  if (vector.z > 1) return null

  return {
    x: ((vector.x + 1) / 2) * width,
    y: ((-vector.y + 1) / 2) * height,
  }
}

export function getSquaresInRect(
  squares: Square[],
  rect: ScreenRect,
  camera: Camera,
  width: number,
  height: number,
): string[] {
  const minSize = 4
  if (rect.right - rect.left < minSize && rect.bottom - rect.top < minSize) {
    return []
  }

  return squares
    .filter((square) => {
      const projected = projectSquareToScreen(square, camera, width, height)
      if (!projected) return false
      return (
        projected.x >= rect.left &&
        projected.x <= rect.right &&
        projected.y >= rect.top &&
        projected.y <= rect.bottom
      )
    })
    .map((sq) => sq.id)
}

export function computeCentroid(squares: Square[]): [number, number, number] {
  if (squares.length === 0) return [0, 0, 0]
  const sum = squares.reduce(
    (acc, sq) => {
      acc[0] += sq.position[0]
      acc[1] += sq.position[1]
      acc[2] += sq.position[2]
      return acc
    },
    [0, 0, 0],
  )
  return [sum[0] / squares.length, sum[1] / squares.length, sum[2] / squares.length]
}
