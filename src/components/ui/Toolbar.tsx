import { useSquareStore } from '../../store/useSquareStore'

export function Toolbar() {
  const theme = useSquareStore((s) => s.theme)
  const gridEnabled = useSquareStore((s) => s.gridEnabled)
  const transformMode = useSquareStore((s) => s.transformMode)
  const toggleTheme = useSquareStore((s) => s.toggleTheme)
  const toggleGrid = useSquareStore((s) => s.toggleGrid)
  const addSquare = useSquareStore((s) => s.addSquare)
  const setTransformMode = useSquareStore((s) => s.setTransformMode)

  return (
    <div className="toolbar">
      <button type="button" className="toolbar-btn" onClick={addSquare} title="Add shape">
        + Square
      </button>
      <div className="toolbar-divider" />
      <button
        type="button"
        className={`toolbar-btn ${transformMode === 'translate' ? 'active' : ''}`}
        onClick={() => setTransformMode('translate')}
        title="Move and resize shapes"
      >
        Move
      </button>
      <button
        type="button"
        className={`toolbar-btn ${transformMode === 'rotate' ? 'active' : ''}`}
        onClick={() => setTransformMode('rotate')}
        title="Orbit camera around selection"
      >
        Rotate
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
    </div>
  )
}
