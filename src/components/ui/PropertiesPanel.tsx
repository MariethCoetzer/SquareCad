import { useSquareStore } from '../../store/useSquareStore'
import { clampDimension } from '../../utils/gridSnap'

export function PropertiesPanel() {
  const selectedIds = useSquareStore((s) => s.selectedIds)
  const squares = useSquareStore((s) => s.squares)
  const updateSelectedSquares = useSquareStore((s) => s.updateSelectedSquares)
  const updateSquare = useSquareStore((s) => s.updateSquare)
  const deleteSelected = useSquareStore((s) => s.deleteSelected)
  const clearSelection = useSquareStore((s) => s.clearSelection)

  const selected = squares.filter((sq) => selectedIds.includes(sq.id))

  if (selected.length === 0) {
    return (
      <aside className="properties-panel properties-panel--empty">
        <h2>SquareCad</h2>
        <p>Click a shape to select it, then drag to move or use the handles to resize.</p>
        <ul className="hint-list">
          <li>Move mode — click and drag shapes; stretch with handles</li>
          <li>Rotate mode — orbit the camera around your selection</li>
          <li>Shift+click to multi-select</li>
          <li>Drag on empty space to box-select</li>
        </ul>
      </aside>
    )
  }

  const first = selected[0]
  const sharedColor = selected.every((sq) => sq.color === first.color) ? first.color : ''
  const sharedLabel = selected.length === 1 ? first.label : ''
  const sharedWidth =
    selected.length === 1 ? first.size[0] : selected.every((sq) => sq.size[0] === first.size[0]) ? first.size[0] : 1
  const sharedHeight =
    selected.length === 1 ? first.size[1] : selected.every((sq) => sq.size[1] === first.size[1]) ? first.size[1] : 1
  const sharedDepth =
    selected.length === 1 ? first.size[2] : selected.every((sq) => sq.size[2] === first.size[2]) ? first.size[2] : 1

  const setSize = (index: 0 | 1 | 2, value: number) => {
    if (selected.length === 1) {
      const newSize = [...first.size] as [number, number, number]
      newSize[index] = clampDimension(value)
      updateSquare(first.id, { size: newSize })
    } else {
      selected.forEach((sq) => {
        const newSize = [...sq.size] as [number, number, number]
        newSize[index] = clampDimension(value)
        updateSquare(sq.id, { size: newSize })
      })
    }
  }

  return (
    <aside className="properties-panel">
      <div className="properties-panel__header">
        <h2>
          {selected.length === 1 ? 'Shape Properties' : `${selected.length} Shapes Selected`}
        </h2>
        <button
          type="button"
          className="panel-close-btn"
          onClick={clearSelection}
          title="Close"
          aria-label="Close properties"
        >
          ×
        </button>
      </div>

      <label className="field">
        <span>Color</span>
        <input
          type="color"
          value={sharedColor || '#4a90d9'}
          onChange={(e) => updateSelectedSquares({ color: e.target.value })}
        />
      </label>

      {selected.length === 1 && (
        <label className="field">
          <span>Label</span>
          <input
            type="text"
            value={sharedLabel}
            onChange={(e) => updateSelectedSquares({ label: e.target.value })}
            placeholder="Shape label"
          />
        </label>
      )}

      <label className="field">
        <span>Width</span>
        <input
          type="range"
          min={0.25}
          max={6}
          step={0.25}
          value={sharedWidth}
          onChange={(e) => setSize(0, parseFloat(e.target.value))}
        />
        <span className="field-value">{sharedWidth.toFixed(2)}</span>
      </label>

      <label className="field">
        <span>Height</span>
        <input
          type="range"
          min={0.25}
          max={6}
          step={0.25}
          value={sharedHeight}
          onChange={(e) => setSize(1, parseFloat(e.target.value))}
        />
        <span className="field-value">{sharedHeight.toFixed(2)}</span>
      </label>

      <label className="field">
        <span>Depth</span>
        <input
          type="range"
          min={0.25}
          max={6}
          step={0.25}
          value={sharedDepth}
          onChange={(e) => setSize(2, parseFloat(e.target.value))}
        />
        <span className="field-value">{sharedDepth.toFixed(2)}</span>
      </label>

      <button type="button" className="delete-btn" onClick={deleteSelected}>
        Delete Selected
      </button>
    </aside>
  )
}
