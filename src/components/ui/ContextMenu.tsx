import { useEffect, useRef, useState } from 'react'
import { useSquareStore } from '../../store/useSquareStore'

const DRAG_THRESHOLD = 5

interface MenuState {
  x: number
  y: number
}

interface ContextMenuProps {
  containerRef: React.RefObject<HTMLDivElement | null>
}

export function ContextMenu({ containerRef }: ContextMenuProps) {
  const selectedIds = useSquareStore((s) => s.selectedIds)
  const clipboard = useSquareStore((s) => s.clipboard)
  const copySelected = useSquareStore((s) => s.copySelected)
  const pasteClipboard = useSquareStore((s) => s.pasteClipboard)

  const [menu, setMenu] = useState<MenuState | null>(null)
  const pointerStartRef = useRef<{ x: number; y: number; button: number } | null>(null)
  const suppressMenuRef = useRef(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const onPointerDown = (event: PointerEvent) => {
      if (event.button === 2) {
        pointerStartRef.current = { x: event.clientX, y: event.clientY, button: event.button }
        suppressMenuRef.current = false
      }
    }

    const onPointerMove = (event: PointerEvent) => {
      if (!pointerStartRef.current || pointerStartRef.current.button !== 2) return
      const dx = event.clientX - pointerStartRef.current.x
      const dy = event.clientY - pointerStartRef.current.y
      if (Math.hypot(dx, dy) > DRAG_THRESHOLD) {
        suppressMenuRef.current = true
      }
    }

    const onPointerUp = () => {
      pointerStartRef.current = null
    }

    const onContextMenu = (event: MouseEvent) => {
      event.preventDefault()
      if (suppressMenuRef.current) {
        suppressMenuRef.current = false
        return
      }

      const bounds = container.getBoundingClientRect()
      setMenu({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      })
    }

    const onClick = () => setMenu(null)

    container.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    container.addEventListener('contextmenu', onContextMenu)
    window.addEventListener('click', onClick)

    return () => {
      container.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      container.removeEventListener('contextmenu', onContextMenu)
      window.removeEventListener('click', onClick)
    }
  }, [containerRef])

  useEffect(() => {
    if (!menu) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenu(null)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [menu])

  if (!menu) return null

  const canCopy = selectedIds.length > 0
  const canPaste = clipboard !== null && clipboard.length > 0

  return (
    <div
      className="context-menu"
      style={{ left: menu.x, top: menu.y }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className="context-menu-item"
        disabled={!canCopy}
        onClick={() => {
          copySelected()
          setMenu(null)
        }}
      >
        Copy
      </button>
      <button
        type="button"
        className="context-menu-item"
        disabled={!canPaste}
        onClick={() => {
          pasteClipboard()
          setMenu(null)
        }}
      >
        Paste
      </button>
    </div>
  )
}
