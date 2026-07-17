import { useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useSquareStore } from '../store/useSquareStore'
import { getSquaresInRect, normalizeRect } from '../utils/selection'

const DRAG_THRESHOLD = 5

export interface MarqueeRect {
  x1: number
  y1: number
  x2: number
  y2: number
}

interface MarqueeHandlerProps {
  onRectChange: (rect: MarqueeRect | null) => void
}

function isInteractiveObject(object: THREE.Object3D): boolean {
  let obj: THREE.Object3D | null = object
  while (obj) {
    if (obj.userData?.isSquare || obj.userData?.isHandle) return true
    obj = obj.parent
  }
  return false
}

export function MarqueeHandler({ onRectChange }: MarqueeHandlerProps) {
  const { camera, gl, size, raycaster, scene } = useThree()
  const squares = useSquareStore((s) => s.squares)
  const transformMode = useSquareStore((s) => s.transformMode)
  const setSelection = useSquareStore((s) => s.setSelection)
  const clearSelection = useSquareStore((s) => s.clearSelection)
  const setOrbitEnabled = useSquareStore((s) => s.setOrbitEnabled)

  const startRef = useRef<{ x: number; y: number } | null>(null)
  const isDraggingRef = useRef(false)

  useEffect(() => {
    const canvas = gl.domElement

    const getLocalCoords = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect()
      return {
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      }
    }

    const hitsInteractive = (event: PointerEvent) => {
      const coords = getLocalCoords(event)
      const ndc = new THREE.Vector2(
        (coords.x / size.width) * 2 - 1,
        -(coords.y / size.height) * 2 + 1,
      )
      raycaster.setFromCamera(ndc, camera)
      const hits = raycaster.intersectObjects(scene.children, true)
      return hits.some((hit) => isInteractiveObject(hit.object))
    }

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return
      if (event.target !== canvas) return
      if (transformMode !== 'translate') return
      if (hitsInteractive(event)) return

      const coords = getLocalCoords(event)
      startRef.current = coords
      isDraggingRef.current = false
      onRectChange(null)
    }

    const onPointerMove = (event: PointerEvent) => {
      if (!startRef.current) return

      const coords = getLocalCoords(event)
      const dx = coords.x - startRef.current.x
      const dy = coords.y - startRef.current.y

      if (!isDraggingRef.current && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
        isDraggingRef.current = true
        setOrbitEnabled(false)
      }

      if (isDraggingRef.current) {
        onRectChange({
          x1: startRef.current.x,
          y1: startRef.current.y,
          x2: coords.x,
          y2: coords.y,
        })
      }
    }

    const onPointerUp = (event: PointerEvent) => {
      if (!startRef.current) return

      const coords = getLocalCoords(event)

      if (isDraggingRef.current) {
        const normalized = normalizeRect(
          startRef.current.x,
          startRef.current.y,
          coords.x,
          coords.y,
        )
        const ids = getSquaresInRect(squares, normalized, camera, size.width, size.height)
        if (event.shiftKey) {
          const current = useSquareStore.getState().selectedIds
          setSelection([...new Set([...current, ...ids])])
        } else {
          setSelection(ids)
        }
      } else if (!event.shiftKey) {
        clearSelection()
      }

      startRef.current = null
      isDraggingRef.current = false
      onRectChange(null)
      setOrbitEnabled(true)
    }

    canvas.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)

    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
    }
  }, [
    camera,
    gl,
    size,
    squares,
    transformMode,
    setSelection,
    clearSelection,
    setOrbitEnabled,
    onRectChange,
    raycaster,
    scene,
  ])

  return null
}

export function MarqueeOverlay({ rect }: { rect: MarqueeRect | null }) {
  if (!rect) return null

  const normalized = normalizeRect(rect.x1, rect.y1, rect.x2, rect.y2)
  const width = normalized.right - normalized.left
  const height = normalized.bottom - normalized.top

  return (
    <div
      className="marquee-select"
      style={{
        left: normalized.left,
        top: normalized.top,
        width,
        height,
      }}
    />
  )
}
