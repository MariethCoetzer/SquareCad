import { useSquareStore } from '../../store/useSquareStore'

export function Toolbar() {
  const theme = useSquareStore((s) => s.theme)
  const gridEnabled = useSquareStore((s) => s.gridEnabled)
  const toggleTheme = useSquareStore((s) => s.toggleTheme)
  const toggleGrid = useSquareStore((s) => s.toggleGrid)
  const addSquare = useSquareStore((s) => s.addSquare)

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
    </div>
  )
}
