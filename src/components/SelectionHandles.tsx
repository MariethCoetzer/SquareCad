import { useRef } from 'react'
import { useThree } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { useSquareStore, type Size3, type Square } from '../store/useSquareStore'
import { clampDimension } from '../utils/gridSnap'

type Axis = 'x' | 'y' | 'z'

interface HandleDef {
  axis: Axis
  sign: 1 | -1
  position: [number, number, number]
}

function getHandles(size: Size3): HandleDef[] {
  const [w, h, d] = size
  return [
    { axis: 'x', sign: 1, position: [w / 2, 0, 0] },
    { axis: 'x', sign: -1, position: [-w / 2, 0, 0] },
    { axis: 'y', sign: 1, position: [0, h / 2, 0] },
    { axis: 'y', sign: -1, position: [0, -h / 2, 0] },
    { axis: 'z', sign: 1, position: [0, 0, d / 2] },
    { axis: 'z', sign: -1, position: [0, 0, -d / 2] },
  ]
}

interface SelectionHandlesProps {
  square: Square
}

export function SelectionHandles({ square }: SelectionHandlesProps) {
  const theme = useSquareStore((s) => s.theme)
  const updateSquare = useSquareStore((s) => s.updateSquare)
  const setShapeDragging = useSquareStore((s) => s.setShapeDragging)
  const { camera, gl } = useThree()

  const dragRef = useRef<{
    axis: Axis
    sign: 1 | -1
    startSize: Size3
    startPos: [number, number, number]
    startMouse: THREE.Vector2
  } | null>(null)

  const handleColor = theme === 'dark' ? '#ffffff' : '#4a90d9'

  const onHandlePointerDown = (
    event: ThreeEvent<PointerEvent>,
    axis: Axis,
    sign: 1 | -1,
  ) => {
    event.stopPropagation()
    setShapeDragging(true)
    dragRef.current = {
      axis,
      sign,
      startSize: [...square.size],
      startPos: [...square.position],
      startMouse: new THREE.Vector2(event.nativeEvent.clientX, event.nativeEvent.clientY),
    }

    const onMove = (e: PointerEvent) => {
      if (!dragRef.current) return
      const { axis: ax, sign: sg, startSize, startPos, startMouse } = dragRef.current

      const axisIndex = ax === 'x' ? 0 : ax === 'y' ? 1 : 2
      const axisVec = new THREE.Vector3(
        ax === 'x' ? 1 : 0,
        ax === 'y' ? 1 : 0,
        ax === 'z' ? 1 : 0,
      )

      const startWorld = new THREE.Vector3(...startPos)
      const endWorld = startWorld.clone().add(axisVec)
      startWorld.project(camera)
      endWorld.project(camera)

      const startScreen = new THREE.Vector2(
        (startWorld.x * 0.5 + 0.5) * gl.domElement.clientWidth,
        (-startWorld.y * 0.5 + 0.5) * gl.domElement.clientHeight,
      )
      const endScreen = new THREE.Vector2(
        (endWorld.x * 0.5 + 0.5) * gl.domElement.clientWidth,
        (-endWorld.y * 0.5 + 0.5) * gl.domElement.clientHeight,
      )

      const screenAxis = endScreen.clone().sub(startScreen).normalize()
      const mouseDelta = new THREE.Vector2(e.clientX - startMouse.x, e.clientY - startMouse.y)
      const projected = mouseDelta.dot(screenAxis) * 0.015

      const newSize: Size3 = [...startSize]
      newSize[axisIndex] = clampDimension(startSize[axisIndex] + projected * sg)

      const sizeDelta = newSize[axisIndex] - startSize[axisIndex]
      const newPos: [number, number, number] = [...startPos]
      newPos[axisIndex] = startPos[axisIndex] + (sizeDelta / 2) * sg
      if (ax === 'y') {
        newPos[1] = newSize[1] / 2
      }

      updateSquare(square.id, { size: newSize, position: newPos })
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

  return (
    <group>
      {getHandles(square.size).map((handle) => (
        <mesh
          key={`${handle.axis}-${handle.sign}`}
          position={handle.position}
          userData={{ isHandle: true }}
          onPointerDown={(e) => onHandlePointerDown(e, handle.axis, handle.sign)}
        >
          <sphereGeometry args={[0.08, 12, 12]} />
          <meshStandardMaterial color={handleColor} emissive={handleColor} emissiveIntensity={0.3} />
        </mesh>
      ))}
    </group>
  )
}
