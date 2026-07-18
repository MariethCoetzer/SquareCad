import { useEffect, useState, type KeyboardEvent } from 'react'
import { useSquareStore, PRESET_COLORS } from '../../store/useSquareStore'
import { clampDimension, MAX_DIMENSION, MIN_DIMENSION } from '../../utils/gridSnap'
import {
  clampLabelFontSize,
  DEFAULT_LABEL_FONT_SIZE,
  LABEL_FONT_SIZE_STEP,
} from '../../utils/labelFont'

function isPresetColor(color: string): boolean {
  return PRESET_COLORS.some((preset) => preset.value.toLowerCase() === color.toLowerCase())
}

const SIZE_STEP = 1

function filterNumericInput(raw: string): string {
  let seenDot = false
  let result = ''
  for (const ch of raw) {
    if (ch >= '0' && ch <= '9') {
      result += ch
    } else if (ch === '.' && !seenDot) {
      seenDot = true
      result += ch
    }
  }
  return result
}

interface SizeStepperProps {
  label: string
  value: number
  onChange: (value: number) => void
}

function SizeStepper({ label, value, onChange }: SizeStepperProps) {
  const [draft, setDraft] = useState(String(value))

  useEffect(() => {
    setDraft(String(value))
  }, [value])

  const commitDraft = () => {
    const parsed = parseFloat(draft)
    if (Number.isFinite(parsed)) {
      onChange(parsed)
    } else {
      setDraft(String(value))
    }
  }

  const stepBy = (delta: number) => {
    onChange(clampDimension(value + delta))
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      commitDraft()
      event.currentTarget.blur()
    }
  }

  return (
    <div className="field">
      <span>{label}</span>
      <div className="size-stepper">
        <button
          type="button"
          className="size-stepper-btn"
          onClick={() => stepBy(-SIZE_STEP)}
          aria-label={`Decrease ${label.toLowerCase()}`}
        >
          −
        </button>
        <input
          type="text"
          inputMode="decimal"
          className="size-stepper-input"
          value={draft}
          onChange={(e) => setDraft(filterNumericInput(e.target.value))}
          onBlur={commitDraft}
          onKeyDown={onKeyDown}
          aria-label={label}
        />
        <button
          type="button"
          className="size-stepper-btn"
          onClick={() => stepBy(SIZE_STEP)}
          aria-label={`Increase ${label.toLowerCase()}`}
        >
          +
        </button>
      </div>
    </div>
  )
}

interface FontSizeStepperProps {
  value: number
  onChange: (value: number) => void
}

function FontSizeStepper({ value, onChange }: FontSizeStepperProps) {
  const stepBy = (delta: number) => {
    onChange(clampLabelFontSize(value + delta))
  }

  return (
    <div className="field">
      <span>Font Size</span>
      <div className="size-stepper">
        <button
          type="button"
          className="size-stepper-btn"
          onClick={() => stepBy(-LABEL_FONT_SIZE_STEP)}
          aria-label="Decrease font size"
        >
          −
        </button>
        <span className="size-stepper-value">{value.toFixed(2)}</span>
        <button
          type="button"
          className="size-stepper-btn"
          onClick={() => stepBy(LABEL_FONT_SIZE_STEP)}
          aria-label="Increase font size"
        >
          +
        </button>
      </div>
    </div>
  )
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
          Your session is saved in this browser. Use Export in the top-right to download
          your layout, or Import to restore it later.
        </p>
        <ul className="hint-list">
          <li>Click and drag shapes to move; use handles to resize</li>
          <li>Click and drag empty space to orbit the camera</li>
          <li>Shift+click to multi-select</li>
          <li>Ctrl+C / Ctrl+V to copy and paste shapes</li>
          <li>Export / Import (top-right) to save or load a layout file</li>
          <li>Hold Z while dragging to stack a shape on top of another</li>
          <li>Hold X while dragging to lower a shape by one layer</li>
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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m14.622 17.897-10.68-2.913" />
                <path d="M18.376 2.622a1 1 0 1 1 3.002 3.002L17.36 9.643a2 2 0 0 0-.854 1.659l.39 2.443a.5.5 0 0 1-.622.622l-2.443-.39a2 2 0 0 0-1.659.854z" />
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

          <FontSizeStepper
            value={first.labelFontSize ?? DEFAULT_LABEL_FONT_SIZE}
            onChange={(labelFontSize) => updateSelectedSquares({ labelFontSize })}
          />
        </>
      )}

      <SizeStepper label="Width" value={sharedWidth} onChange={(v) => setSize(0, v)} />
      <SizeStepper label="Depth" value={sharedDepth} onChange={(v) => setSize(2, v)} />
      <SizeStepper label="Height" value={sharedHeight} onChange={(v) => setSize(1, v)} />
      <p className="size-hint">
        Type a size ({MIN_DIMENSION}–{MAX_DIMENSION}) or use +/− to change by {SIZE_STEP}.
      </p>

      <button type="button" className="delete-btn" onClick={deleteSelected}>
        Delete Selected
      </button>
    </aside>
  )
}
