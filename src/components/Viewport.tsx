import { useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { SceneContent } from './SceneContent'
import { MarqueeHandler } from './MarqueeSelect'
import { ContextMenu } from './ui/ContextMenu'

interface ViewportProps {
  onSceneReady?: () => void
}

export function Viewport({ onSceneReady }: ViewportProps) {
  const viewportRef = useRef<HTMLDivElement>(null)

  return (
    <div className="viewport" ref={viewportRef}>
      <Canvas
        shadows
        camera={{ position: [8, 6, 8], fov: 50 }}
        onCreated={({ gl }) => {
          gl.domElement.style.touchAction = 'none'
        }}
      >
        <Suspense fallback={null}>
          <SceneContent onReady={onSceneReady} />
          <MarqueeHandler />
        </Suspense>
      </Canvas>
      <ContextMenu containerRef={viewportRef} />
    </div>
  )
}
