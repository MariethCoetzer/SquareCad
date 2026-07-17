import { useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useSquareStore } from '../store/useSquareStore'

const DRAG_THRESHOLD = 5

function isInteractiveObject(object: THREE.Object3D): boolean {
  let obj: THREE.Object3D | null = object
  while (obj) {
    if (obj.userData?.isSquare || obj.userData?.isHandle) return true
    obj = obj.parent
  }
  return false
}

export function MarqueeHandler() {
  const { camera, gl, size, raycaster, scene } = useThree()
  const setTransformMode = useSquareStore((s) => s.setTransformMode)
  const clearSelection = useSquareStore((s) => s.clearSelection)

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
      if (hitsInteractive(event)) return

      setTransformMode('rotate')

      const coords = getLocalCoords(event)
      startRef.current = coords
      isDraggingRef.current = false
    }

    const onPointerMove = (event: PointerEvent) => {
      if (!startRef.current) return

      const coords = getLocalCoords(event)
      const dx = coords.x - startRef.current.x
      const dy = coords.y - startRef.current.y

      if (!isDraggingRef.current && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
        isDraggingRef.current = true
      }
    }

    const onPointerUp = (event: PointerEvent) => {
      if (!startRef.current) return

      if (!isDraggingRef.current && !event.shiftKey) {
        clearSelection()
      }

      startRef.current = null
      isDraggingRef.current = false
    }

    canvas.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)

    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
    }
  }, [camera, gl, size, setTransformMode, clearSelection, raycaster, scene])

  return null
}
