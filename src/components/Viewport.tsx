import { useState, useCallback, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { SceneContent } from './SceneContent'
import { MarqueeHandler, MarqueeOverlay, type MarqueeRect } from './MarqueeSelect'
import { ContextMenu } from './ui/ContextMenu'

interface ViewportProps {
  onSceneReady?: () => void
}

export function Viewport({ onSceneReady }: ViewportProps) {
  const [marqueeRect, setMarqueeRect] = useState<MarqueeRect | null>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const handleRectChange = useCallback((rect: MarqueeRect | null) => {
    setMarqueeRect(rect)
  }, [])

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
          <MarqueeHandler onRectChange={handleRectChange} />
        </Suspense>
      </Canvas>
      <MarqueeOverlay rect={marqueeRect} />
      <ContextMenu containerRef={viewportRef} />
    </div>
  )
}
