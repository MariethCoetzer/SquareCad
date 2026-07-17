import { create } from 'zustand'
import {
  deriveNextId,
  loadSession,
  saveSession,
} from '../utils/sessionPersistence'
import { computeStackY, groundY } from '../utils/stacking'

export type Size3 = [number, number, number]

export interface Square {
  id: string
  position: [number, number, number]
  size: Size3
  color: string
  labelTop: string
  labelSide: string
}

export type SquareData = Omit<Square, 'id'>

export type Theme = 'light' | 'dark'
export type TransformMode = 'translate' | 'rotate'

export const PRESET_COLORS = [
  { name: 'Red', value: '#e74c3c' },
  { name: 'Yellow', value: '#f1c40f' },
  { name: 'Green', value: '#2ecc71' },
  { name: 'Blue', value: '#3498db' },
] as const

const PASTE_OFFSET_X = 1.2

interface SquareStore {
  squares: Square[]
  selectedIds: string[]
  clipboard: SquareData[] | null
  theme: Theme
  gridEnabled: boolean
  transformMode: TransformMode
  orbitEnabled: boolean
  shapeDragging: boolean
  zKeyHeld: boolean
  addSquare: () => void
  updateSquare: (id: string, patch: Partial<Omit<Square, 'id'>>) => void
  updateSelectedSquares: (patch: Partial<Omit<Square, 'id'>>) => void
  deleteSelected: () => void
  copySelected: () => void
  pasteClipboard: () => void
  selectSquare: (id: string, additive?: boolean) => void
  setSelection: (ids: string[]) => void
  clearSelection: () => void
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  setGridEnabled: (enabled: boolean) => void
  toggleGrid: () => void
  setTransformMode: (mode: TransformMode) => void
  setOrbitEnabled: (enabled: boolean) => void
  setShapeDragging: (dragging: boolean) => void
  setZKeyHeld: (held: boolean) => void
}

const saved = loadSession()
let nextId = saved ? deriveNextId(saved.squares) : 1

const DEFAULT_COLORS = PRESET_COLORS.map((c) => c.value)

function centerY(size: Size3): number {
  return size[1] / 2
}

function createSquare(index: number): Square {
  const size: Size3 = [1, 1, 1]
  const offset = index * 1.2
  return {
    id: `sq-${nextId++}`,
    position: [offset, centerY(size), 0],
    size,
    color: DEFAULT_COLORS[index % DEFAULT_COLORS.length],
    labelTop: `Square ${index + 1}`,
    labelSide: '',
  }
}

function cloneSquareData(data: SquareData): Square {
  return {
    id: `sq-${nextId++}`,
    position: [...data.position] as [number, number, number],
    size: [...data.size] as Size3,
    color: data.color,
    labelTop: data.labelTop,
    labelSide: data.labelSide,
  }
}

function applySizePosition(square: Square, size: Size3, allSquares: Square[]): Square {
  const wasElevated = square.position[1] > groundY(square.size) + 0.01
  const others = allSquares.filter((s) => s.id !== square.id)
  const candidate: Square = { ...square, size }
  const stackY = computeStackY(candidate, others)

  const y = wasElevated && stackY !== null ? stackY : centerY(size)

  return {
    ...square,
    size,
    position: [square.position[0], y, square.position[2]],
  }
}

export const useSquareStore = create<SquareStore>((set, get) => ({
  squares: saved?.squares ?? [],
  selectedIds: [],
  clipboard: null,
  theme: saved?.theme ?? 'light',
  gridEnabled: saved?.gridEnabled ?? true,
  transformMode: saved?.transformMode ?? 'translate',
  orbitEnabled: true,
  shapeDragging: false,
  zKeyHeld: false,

  addSquare: () =>
    set((state) => {
      const square = createSquare(state.squares.length)
      return {
        squares: [...state.squares, square],
        selectedIds: [square.id],
      }
    }),

  updateSquare: (id, patch) =>
    set((state) => ({
      squares: state.squares.map((sq) => {
        if (sq.id !== id) return sq
        const updated = { ...sq, ...patch }
        if (patch.size !== undefined) {
          return applySizePosition(updated, patch.size, state.squares)
        }
        if (patch.position !== undefined) {
          updated.position = [
            patch.position[0],
            patch.position[1],
            patch.position[2],
          ]
        }
        return updated
      }),
    })),

  updateSelectedSquares: (patch) => {
    const { selectedIds } = get()
    selectedIds.forEach((id) => get().updateSquare(id, patch))
  },

  deleteSelected: () =>
    set((state) => {
      const remaining = state.squares.filter((sq) => !state.selectedIds.includes(sq.id))
      return { squares: remaining, selectedIds: [] }
    }),

  copySelected: () => {
    const { squares, selectedIds } = get()
    if (selectedIds.length === 0) return

    const copied = squares
      .filter((sq) => selectedIds.includes(sq.id))
      .map(({ id: _id, ...data }) => ({
        position: [...data.position] as [number, number, number],
        size: [...data.size] as Size3,
        color: data.color,
        labelTop: data.labelTop,
        labelSide: data.labelSide,
      }))

    set({ clipboard: copied })
  },

  pasteClipboard: () => {
    const { clipboard, squares } = get()
    if (!clipboard || clipboard.length === 0) return

    const pasted = clipboard.map((data) => {
      const square = cloneSquareData({
        ...data,
        position: [
          data.position[0] + PASTE_OFFSET_X,
          data.position[1],
          data.position[2],
        ],
      })
      return square
    })

    set({
      squares: [...squares, ...pasted],
      selectedIds: pasted.map((sq) => sq.id),
    })
  },

  selectSquare: (id, additive = false) =>
    set((state) => {
      if (additive) {
        const exists = state.selectedIds.includes(id)
        return {
          selectedIds: exists
            ? state.selectedIds.filter((sid) => sid !== id)
            : [...state.selectedIds, id],
        }
      }
      return { selectedIds: [id] }
    }),

  setSelection: (ids) => set({ selectedIds: ids }),

  clearSelection: () => set({ selectedIds: [] }),

  setTheme: (theme) => set({ theme }),

  toggleTheme: () =>
    set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),

  setGridEnabled: (enabled) => set({ gridEnabled: enabled }),

  toggleGrid: () => set((state) => ({ gridEnabled: !state.gridEnabled })),

  setTransformMode: (mode) => set({ transformMode: mode }),

  setOrbitEnabled: (enabled) => set({ orbitEnabled: enabled }),

  setShapeDragging: (dragging) => set({ shapeDragging: dragging }),

  setZKeyHeld: (held) => set({ zKeyHeld: held }),
}))

useSquareStore.subscribe((state) => {
  saveSession({
    squares: state.squares,
    theme: state.theme,
    gridEnabled: state.gridEnabled,
    transformMode: state.transformMode,
  })
})
