import { useRef } from 'react'
import { Edges, Line, Text } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { useSquareStore, type Square } from '../store/useSquareStore'
import { SelectionHandles } from './SelectionHandles'
import { snapPosition } from '../utils/gridSnap'

interface SquareMeshProps {
  square: Square
}

export function SquareMesh({ square }: SquareMeshProps) {
  const selectedIds = useSquareStore((s) => s.selectedIds)
  const theme = useSquareStore((s) => s.theme)
  const transformMode = useSquareStore((s) => s.transformMode)
  const gridEnabled = useSquareStore((s) => s.gridEnabled)
  const selectSquare = useSquareStore((s) => s.selectSquare)
  const updateSquare = useSquareStore((s) => s.updateSquare)
  const setShapeDragging = useSquareStore((s) => s.setShapeDragging)
  const { camera, gl } = useThree()

  const dragRef = useRef<{
    ids: string[]
    startPositions: Map<string, [number, number, number]>
    plane: THREE.Plane
    offset: THREE.Vector3
  } | null>(null)

  const isSelected = selectedIds.includes(square.id)
  const isMoveMode = transformMode === 'translate'
  const showHandles = isSelected && isMoveMode && selectedIds.length === 1

  const [w, h, d] = square.size

  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    if (!isMoveMode) {
      selectSquare(square.id, event.nativeEvent.shiftKey)
      return
    }

    event.stopPropagation()

    const additive = event.nativeEvent.shiftKey
    const alreadySelected = selectedIds.includes(square.id)

    if (!alreadySelected) {
      selectSquare(square.id, additive)
      if (additive) return
    }

    const idsToMove = alreadySelected
      ? selectedIds
      : additive
        ? [...selectedIds, square.id]
        : [square.id]

    const state = useSquareStore.getState()
    const startPositions = new Map<string, [number, number, number]>()
    idsToMove.forEach((id) => {
      const sq = state.squares.find((s) => s.id === id)
      if (sq) startPositions.set(id, [...sq.position])
    })

    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -square.position[1])
    const intersection = new THREE.Vector3()
    const ndc = new THREE.Vector2(
      (event.nativeEvent.clientX / gl.domElement.clientWidth) * 2 - 1,
      -(event.nativeEvent.clientY / gl.domElement.clientHeight) * 2 + 1,
    )
    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(ndc, camera)
    raycaster.ray.intersectPlane(plane, intersection)

    const offset = intersection.sub(new THREE.Vector3(...square.position))
    setShapeDragging(true)
    dragRef.current = { ids: idsToMove, startPositions, plane, offset }

    const onMove = (e: PointerEvent) => {
      if (!dragRef.current) return
      const raycaster = new THREE.Raycaster()
      const ndcMove = new THREE.Vector2(
        (e.clientX / gl.domElement.clientWidth) * 2 - 1,
        -(e.clientY / gl.domElement.clientHeight) * 2 + 1,
      )
      raycaster.setFromCamera(ndcMove, camera)
      const hit = new THREE.Vector3()
      if (!raycaster.ray.intersectPlane(dragRef.current.plane, hit)) return

      hit.sub(dragRef.current.offset)
      const origin = dragRef.current.startPositions.get(square.id)
      if (!origin) return

      const delta: [number, number, number] = [
        hit.x - origin[0],
        0,
        hit.z - origin[2],
      ]

      dragRef.current.ids.forEach((id) => {
        const start = dragRef.current!.startPositions.get(id)
        if (!start) return
        const sq = useSquareStore.getState().squares.find((s) => s.id === id)
        if (!sq) return
        const raw: [number, number, number] = [
          start[0] + delta[0],
          sq.size[1] / 2,
          start[2] + delta[2],
        ]
        const snapped = snapPosition(raw, gridEnabled, sq.size[1])
        updateSquare(id, { position: snapped })
      })
    }

    const onUp = () => {
      dragRef.current = null
      setShapeDragging(false)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const outlineColor = theme === 'dark' ? '#ffffff' : '#4a90d9'
  const edgeColor = isSelected
    ? outlineColor
    : theme === 'dark'
      ? '#888888'
      : '#333333'

  const hw = w / 2
  const hh = h / 2
  const hd = d / 2
  const outlinePoints: [number, number, number][] = [
    [-hw, -hh, -hd],
    [hw, -hh, -hd],
    [hw, -hh, hd],
    [-hw, -hh, hd],
    [-hw, -hh, -hd],
    [-hw, hh, -hd],
    [hw, hh, -hd],
    [hw, -hh, -hd],
    [hw, hh, -hd],
    [hw, hh, hd],
    [hw, -hh, hd],
    [hw, hh, hd],
    [-hw, hh, hd],
    [-hw, -hh, hd],
    [-hw, hh, hd],
    [-hw, hh, -hd],
  ]

  return (
    <group position={square.position} onPointerDown={handlePointerDown}>
      <mesh castShadow receiveShadow userData={{ isSquare: true }}>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={square.color} roughness={0.35} metalness={0.05} />
        <Edges linewidth={1.5} threshold={15} color={edgeColor} />
      </mesh>

      {showHandles && (
        <>
          <Line points={outlinePoints} color={outlineColor} lineWidth={1} />
          <SelectionHandles square={square} />
        </>
      )}

      {square.label && (
        <Text
          position={[0, h / 2 + 0.02, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={Math.min(0.22, w * 0.35)}
          color={theme === 'dark' ? '#ffffff' : '#111111'}
          anchorX="center"
          anchorY="middle"
          maxWidth={w * 0.85}
        >
          {square.label}
        </Text>
      )}
    </group>
  )
}
