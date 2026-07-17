import { useState, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { SceneContent } from './SceneContent'
import { MarqueeHandler, MarqueeOverlay, type MarqueeRect } from './MarqueeSelect'

export function Viewport() {
  const [marqueeRect, setMarqueeRect] = useState<MarqueeRect | null>(null)
  const handleRectChange = useCallback((rect: MarqueeRect | null) => {
    setMarqueeRect(rect)
  }, [])

  return (
    <div className="viewport">
      <Canvas
        shadows
        camera={{ position: [8, 6, 8], fov: 50 }}
        onCreated={({ gl }) => {
          gl.domElement.style.touchAction = 'none'
        }}
      >
        <Suspense fallback={null}>
          <SceneContent />
          <MarqueeHandler onRectChange={handleRectChange} />
        </Suspense>
      </Canvas>
      <MarqueeOverlay rect={marqueeRect} />
    </div>
  )
}
