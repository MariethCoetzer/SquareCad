import { useEffect, useRef, type ChangeEvent } from 'react'
import { useSquareStore } from '../../store/useSquareStore'
import { parseSessionFileContents } from '../../utils/sessionPersistence'

export const OVERLAY_WAIT_MESSAGE = 'Please wait'

export interface ActionOverlay {
  title: string
  message: string
}

interface ToolbarProps {
  showActionOverlay: (overlay: ActionOverlay) => void
  hideActionOverlay: () => void
}

export function Toolbar({ showActionOverlay, hideActionOverlay }: ToolbarProps) {
  const theme = useSquareStore((s) => s.theme)
  const gridEnabled = useSquareStore((s) => s.gridEnabled)
  const squares = useSquareStore((s) => s.squares)
  const toggleTheme = useSquareStore((s) => s.toggleTheme)
  const toggleGrid = useSquareStore((s) => s.toggleGrid)
  const addSquare = useSquareStore((s) => s.addSquare)
  const exportSession = useSquareStore((s) => s.exportSession)
  const importSession = useSquareStore((s) => s.importSession)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const exportFocusHandlerRef = useRef<(() => void) | null>(null)
  const exportFallbackTimerRef = useRef<number | null>(null)
  const exportFinishingRef = useRef(false)

  const clearExportListeners = () => {
    if (exportFocusHandlerRef.current) {
      window.removeEventListener('focus', exportFocusHandlerRef.current)
      exportFocusHandlerRef.current = null
    }
    if (exportFallbackTimerRef.current !== null) {
      window.clearTimeout(exportFallbackTimerRef.current)
      exportFallbackTimerRef.current = null
    }
  }

  useEffect(() => {
    const input = fileInputRef.current
    if (!input) return

    const onCancel = () => hideActionOverlay()
    input.addEventListener('cancel', onCancel)
    return () => input.removeEventListener('cancel', onCancel)
  }, [hideActionOverlay])

  useEffect(() => () => clearExportListeners(), [])

  const finishExport = () => {
    if (exportFinishingRef.current) return
    exportFinishingRef.current = true
    clearExportListeners()
    showActionOverlay({ title: 'Exporting', message: OVERLAY_WAIT_MESSAGE })
    window.setTimeout(() => {
      hideActionOverlay()
      exportFinishingRef.current = false
    }, 500)
  }

  const handleExport = () => {
    clearExportListeners()
    showActionOverlay({ title: 'Loading', message: OVERLAY_WAIT_MESSAGE })

    window.requestAnimationFrame(() => {
      exportSession()

      const onFocus = () => {
        finishExport()
      }
      exportFocusHandlerRef.current = onFocus
      window.addEventListener('focus', onFocus)

      exportFallbackTimerRef.current = window.setTimeout(() => {
        if (document.hasFocus()) {
          finishExport()
        }
      }, 800)
    })
  }

  const handleImportClick = () => {
    showActionOverlay({ title: 'Loading', message: OVERLAY_WAIT_MESSAGE })
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) {
      hideActionOverlay()
      return
    }

    showActionOverlay({ title: 'Importing', message: OVERLAY_WAIT_MESSAGE })

    const reader = new FileReader()
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : ''
      const session = parseSessionFileContents(text)
      if (!session) {
        hideActionOverlay()
        window.alert('Could not read that file. Please choose a valid SquareCad export (.json).')
        return
      }

      if (squares.length > 0) {
        const replace = window.confirm(
          'Importing will replace your current shapes. Continue?',
        )
        if (!replace) {
          hideActionOverlay()
          return
        }
      }

      importSession(session)
      window.setTimeout(hideActionOverlay, 400)
    }
    reader.onerror = () => {
      hideActionOverlay()
      window.alert('Could not read that file. Please try again.')
    }
    reader.readAsText(file)
  }

  return (
    <div className="toolbar">
      <button type="button" className="toolbar-btn" onClick={addSquare} title="Add shape">
        + Square
      </button>
      <div className="toolbar-divider" />
      <button
        type="button"
        className={`toolbar-btn ${gridEnabled ? 'active' : ''}`}
        onClick={toggleGrid}
        title="Toggle grid and snap"
      >
        Grid
      </button>
      <button
        type="button"
        className="toolbar-btn"
        onClick={toggleTheme}
        title="Toggle theme"
      >
        {theme === 'light' ? 'Dark' : 'Light'}
      </button>
      <div className="toolbar-divider" />
      <button
        type="button"
        className="toolbar-btn"
        onClick={handleExport}
        title="Download your layout as a file"
      >
        Export
      </button>
      <button
        type="button"
        className="toolbar-btn"
        onClick={handleImportClick}
        title="Load a layout from a file"
      >
        Import
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="toolbar-file-input"
        onChange={handleFileChange}
        aria-hidden="true"
        tabIndex={-1}
      />
    </div>
  )
}
