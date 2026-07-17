import { create } from 'zustand'

export type Size3 = [number, number, number]

export interface Square {
  id: string
  position: [number, number, number]
  size: Size3
  color: string
  label: string
}

export type Theme = 'light' | 'dark'
export type TransformMode = 'translate' | 'rotate'

interface SquareStore {
  squares: Square[]
  selectedIds: string[]
  theme: Theme
  gridEnabled: boolean
  transformMode: TransformMode
  orbitEnabled: boolean
  shapeDragging: boolean
  addSquare: () => void
  updateSquare: (id: string, patch: Partial<Omit<Square, 'id'>>) => void
  updateSelectedSquares: (patch: Partial<Omit<Square, 'id'>>) => void
  deleteSelected: () => void
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
}

let nextId = 1

const DEFAULT_COLORS = ['#4a90d9', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c']

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
    label: `Square ${index + 1}`,
  }
}

function applySizePosition(square: Square, size: Size3): Square {
  return {
    ...square,
    size,
    position: [square.position[0], centerY(size), square.position[2]],
  }
}

export const useSquareStore = create<SquareStore>((set, get) => ({
  squares: [],
  selectedIds: [],
  theme: 'light',
  gridEnabled: false,
  transformMode: 'translate',
  orbitEnabled: true,
  shapeDragging: false,

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
          return applySizePosition(updated, patch.size)
        }
        if (patch.position !== undefined) {
          updated.position = [
            patch.position[0],
            centerY(updated.size),
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
}))
