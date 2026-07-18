import { useEffect, useRef, useState, useCallback } from 'react'
import { Viewport } from './components/Viewport'
import { Toolbar } from './components/ui/Toolbar'
import { PropertiesPanel } from './components/ui/PropertiesPanel'
import { LoadingOverlay } from './components/ui/LoadingOverlay'
import { useSquareStore } from './store/useSquareStore'
import type { ActionOverlay } from './components/ui/Toolbar'

const MIN_LOADING_MS = 600
const BOOT_OVERLAY: ActionOverlay = {
  title: 'Loading',
  message: 'Please wait while the grid is loading.',
}

function isTypingTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLInputElement
}

function App() {
  const loadStartRef = useRef(Date.now())
  const sceneReadyRef = useRef(false)
  const [bootLoading, setBootLoading] = useState(true)
  const [actionOverlay, setActionOverlay] = useState<ActionOverlay | null>(null)

  const overlayVisible = bootLoading || actionOverlay !== null
  const overlayContent = bootLoading ? BOOT_OVERLAY : actionOverlay

  const showActionOverlay = useCallback((overlay: ActionOverlay) => {
    setActionOverlay(overlay)
  }, [])

  const hideActionOverlay = useCallback(() => {
    setActionOverlay(null)
  }, [])

  const theme = useSquareStore((s) => s.theme)
  const deleteSelected = useSquareStore((s) => s.deleteSelected)
  const copySelected = useSquareStore((s) => s.copySelected)
  const pasteClipboard = useSquareStore((s) => s.pasteClipboard)
  const setZKeyHeld = useSquareStore((s) => s.setZKeyHeld)
  const setXKeyHeld = useSquareStore((s) => s.setXKeyHeld)
  const selectedIds = useSquareStore((s) => s.selectedIds)

  const handleSceneReady = useCallback(() => {
    if (sceneReadyRef.current) return
    sceneReadyRef.current = true

    const elapsed = Date.now() - loadStartRef.current
    const remaining = Math.max(0, MIN_LOADING_MS - elapsed)
    window.setTimeout(() => setBootLoading(false), remaining)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue =
        'Your session is saved in this browser. Use Export (top-right) to download your layout as a backup file.'
      return event.returnValue
    }

    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [])

  useEffect(() => {
    const clearModifierKeys = () => {
      setZKeyHeld(false)
      setXKeyHeld(false)
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return

      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (selectedIds.length > 0) {
          event.preventDefault()
          deleteSelected()
        }
        return
      }

      if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
        if (selectedIds.length > 0) {
          event.preventDefault()
          copySelected()
        }
        return
      }

      if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
        event.preventDefault()
        pasteClipboard()
        return
      }

      if (event.key === 'z' || event.key === 'Z') {
        setZKeyHeld(true)
        return
      }

      if (event.key === 'x' || event.key === 'X') {
        setXKeyHeld(true)
      }
    }

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'z' || event.key === 'Z') {
        setZKeyHeld(false)
      }
      if (event.key === 'x' || event.key === 'X') {
        setXKeyHeld(false)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', clearModifierKeys)
    document.addEventListener('visibilitychange', clearModifierKeys)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', clearModifierKeys)
      document.removeEventListener('visibilitychange', clearModifierKeys)
    }
  }, [deleteSelected, copySelected, pasteClipboard, setZKeyHeld, setXKeyHeld, selectedIds.length])

  return (
    <>
      <LoadingOverlay
        visible={overlayVisible}
        title={overlayContent?.title ?? BOOT_OVERLAY.title}
        message={overlayContent?.message ?? BOOT_OVERLAY.message}
      />
      <div className={`app ${overlayVisible ? 'app--loading' : ''}`}>
        <PropertiesPanel />
        <main className="main">
          <Viewport onSceneReady={handleSceneReady} />
          <Toolbar
            showActionOverlay={showActionOverlay}
            hideActionOverlay={hideActionOverlay}
          />
        </main>
      </div>
    </>
  )
}

export default App
