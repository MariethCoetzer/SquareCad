import { useState } from 'react'
import { useSquareStore, PRESET_COLORS } from '../../store/useSquareStore'
import { clampDimension } from '../../utils/gridSnap'

function isPresetColor(color: string): boolean {
  return PRESET_COLORS.some((preset) => preset.value.toLowerCase() === color.toLowerCase())
}

export function PropertiesPanel() {
  const [collapsed, setCollapsed] = useState(false)
  const selectedIds = useSquareStore((s) => s.selectedIds)
  const squares = useSquareStore((s) => s.squares)
  const updateSelectedSquares = useSquareStore((s) => s.updateSelectedSquares)
  const updateSquare = useSquareStore((s) => s.updateSquare)
  const deleteSelected = useSquareStore((s) => s.deleteSelected)
  const clearSelection = useSquareStore((s) => s.clearSelection)

  const selected = squares.filter((sq) => selectedIds.includes(sq.id))

  if (collapsed) {
    return (
      <button
        type="button"
        className="panel-toggle panel-toggle--collapsed"
        onClick={() => setCollapsed(false)}
        title="Show panel"
        aria-label="Show panel"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="4" />
          <polyline points="10,8 14,12 10,16" />
        </svg>
      </button>
    )
  }

  if (selected.length === 0) {
    return (
      <aside className="properties-panel properties-panel--empty">
        <div className="properties-panel__header">
          <h2>SquareCad</h2>
          <button
            type="button"
            className="panel-collapse-btn"
            onClick={() => setCollapsed(true)}
            title="Collapse panel"
            aria-label="Collapse panel"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="4" />
              <polyline points="14,8 10,12 14,16" />
            </svg>
          </button>
        </div>
        <p>Click a shape to select it, then drag to move or use the handles to resize.</p>
        <p className="session-note">
          Your session is saved in this browser. However, to be extra safe, take a
          screenshot to keep a record of your work.
        </p>
        <ul className="hint-list">
          <li>Click and drag shapes to move; use handles to resize</li>
          <li>Click and drag empty space to orbit the camera</li>
          <li>Shift+click to multi-select</li>
          <li>Ctrl+C / Ctrl+V to copy and paste shapes</li>
          <li>Hold Z while dragging to stack a shape on top of another</li>
        </ul>
      </aside>
    )
  }

  const first = selected[0]
  const sharedColor = selected.every((sq) => sq.color === first.color) ? first.color : ''
  const sharedLabelTop = selected.length === 1 ? first.labelTop : ''
  const sharedLabelSide = selected.length === 1 ? first.labelSide : ''
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

  const activeColor = sharedColor || '#3498db'
  const customColorActive = sharedColor !== '' && !isPresetColor(sharedColor)

  return (
    <aside className="properties-panel">
      <div className="properties-panel__header">
        <h2>
          {selected.length === 1 ? 'Shape Properties' : `${selected.length} Shapes Selected`}
        </h2>
        <div className="properties-panel__header-actions">
          <button
            type="button"
            className="panel-collapse-btn"
            onClick={() => setCollapsed(true)}
            title="Collapse panel"
            aria-label="Collapse panel"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="4" />
              <polyline points="14,8 10,12 14,16" />
            </svg>
          </button>
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
      </div>

      <div className="field">
        <span>Color</span>
        <div className="color-swatches">
          {PRESET_COLORS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              className={`color-swatch ${sharedColor === preset.value ? 'active' : ''}`}
              style={{ backgroundColor: preset.value }}
              title={preset.name}
              aria-label={preset.name}
              onClick={() => updateSelectedSquares({ color: preset.value })}
            />
          ))}
          <label
            className={`color-swatch color-swatch--picker ${customColorActive ? 'active' : ''}`}
            title="Custom color"
          >
            <input
              type="color"
              value={activeColor}
              onChange={(e) => updateSelectedSquares({ color: e.target.value })}
              aria-label="Custom color"
            />
            <span className="color-swatch-icon" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 20h16" />
                <path d="M6 16l6-12 6 12" />
                <path d="M8 12h8" />
              </svg>
            </span>
          </label>
        </div>
      </div>

      {selected.length === 1 && (
        <>
          <label className="field">
            <span>Label (Top)</span>
            <input
              type="text"
              value={sharedLabelTop}
              onChange={(e) => updateSelectedSquares({ labelTop: e.target.value })}
              placeholder="Top label"
            />
          </label>

          <label className="field">
            <span>Label (Side)</span>
            <input
              type="text"
              value={sharedLabelSide}
              onChange={(e) => updateSelectedSquares({ labelSide: e.target.value })}
              placeholder="Side label"
            />
          </label>
        </>
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
