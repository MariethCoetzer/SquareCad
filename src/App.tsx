import { useEffect, useRef, useState, useCallback } from 'react'
import { Viewport } from './components/Viewport'
import { Toolbar } from './components/ui/Toolbar'
import { PropertiesPanel } from './components/ui/PropertiesPanel'
import { LoadingOverlay } from './components/ui/LoadingOverlay'
import { useSquareStore } from './store/useSquareStore'

const MIN_LOADING_MS = 600

function isTypingTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLInputElement
}

function App() {
  const loadStartRef = useRef(Date.now())
  const sceneReadyRef = useRef(false)
  const [loading, setLoading] = useState(true)

  const theme = useSquareStore((s) => s.theme)
  const deleteSelected = useSquareStore((s) => s.deleteSelected)
  const copySelected = useSquareStore((s) => s.copySelected)
  const pasteClipboard = useSquareStore((s) => s.pasteClipboard)
  const setZKeyHeld = useSquareStore((s) => s.setZKeyHeld)
  const selectedIds = useSquareStore((s) => s.selectedIds)

  const handleSceneReady = useCallback(() => {
    if (sceneReadyRef.current) return
    sceneReadyRef.current = true

    const elapsed = Date.now() - loadStartRef.current
    const remaining = Math.max(0, MIN_LOADING_MS - elapsed)
    window.setTimeout(() => setLoading(false), remaining)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue =
        'Your session is saved in this browser. However, to be extra safe, take a screenshot to keep a record of your work.'
      return event.returnValue
    }

    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [])

  useEffect(() => {
    const clearZKey = () => setZKeyHeld(false)

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
      }
    }

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'z' || event.key === 'Z') {
        setZKeyHeld(false)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', clearZKey)
    document.addEventListener('visibilitychange', clearZKey)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', clearZKey)
      document.removeEventListener('visibilitychange', clearZKey)
    }
  }, [deleteSelected, copySelected, pasteClipboard, setZKeyHeld, selectedIds.length])

  return (
    <>
      <LoadingOverlay visible={loading} />
      <div className={`app ${loading ? 'app--loading' : ''}`}>
        <PropertiesPanel />
        <main className="main">
          <Viewport onSceneReady={handleSceneReady} />
          <Toolbar />
        </main>
      </div>
    </>
  )
}

export default App
