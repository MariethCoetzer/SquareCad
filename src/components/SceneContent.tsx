import { useEffect, useRef } from 'react'
import { Grid, OrbitControls } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { useSquareStore } from '../store/useSquareStore'
import { computeCentroid } from '../utils/selection'
import { SquareMesh } from './SquareMesh'

interface SceneContentProps {
  onReady?: () => void
}

export function SceneContent({ onReady }: SceneContentProps) {
  const squares = useSquareStore((s) => s.squares)
  const selectedIds = useSquareStore((s) => s.selectedIds)
  const theme = useSquareStore((s) => s.theme)
  const gridEnabled = useSquareStore((s) => s.gridEnabled)
  const transformMode = useSquareStore((s) => s.transformMode)
  const orbitEnabled = useSquareStore((s) => s.orbitEnabled)
  const shapeDragging = useSquareStore((s) => s.shapeDragging)

  const controlsRef = useRef<OrbitControlsImpl>(null)
  const isRotateMode = transformMode === 'rotate'

  const selected = squares.filter((sq) => selectedIds.includes(sq.id))

  useEffect(() => {
    onReady?.()
  }, [onReady])

  useEffect(() => {
    const controls = controlsRef.current
    if (!controls) return

    if (isRotateMode && selected.length > 0) {
      const [x, y, z] = computeCentroid(selected)
      controls.target.set(x, y, z)
      controls.update()
    }
  }, [isRotateMode, selectedIds, squares, selected.length])

  const cellColor = theme === 'dark' ? '#2a2a3a' : '#d0d0d0'
  const sectionColor = theme === 'dark' ? '#3a3a5a' : '#a0a0a0'
  const bgColor = theme === 'dark' ? '#1a1a2e' : '#f0f0f5'

  return (
    <>
      <color attach="background" args={[bgColor]} />
      <ambientLight intensity={theme === 'dark' ? 0.5 : 0.7} />
      <directionalLight position={[10, 15, 10]} intensity={1.2} castShadow />
      <directionalLight position={[-5, 8, -5]} intensity={0.4} />

      {gridEnabled && (
        <Grid
          infiniteGrid
          cellSize={1}
          sectionSize={5}
          fadeDistance={60}
          fadeStrength={1.5}
          cellColor={cellColor}
          sectionColor={sectionColor}
          position={[0, 0, 0]}
        />
      )}

      {squares.map((square) => (
        <SquareMesh key={square.id} square={square} />
      ))}

      <OrbitControls
        ref={controlsRef}
        makeDefault
        enabled={orbitEnabled && !shapeDragging}
        enableRotate={false}
        enablePan={false}
        enableZoom
        enableDamping={false}
        minDistance={3}
        maxDistance={100}
      />
    </>
  )
}
