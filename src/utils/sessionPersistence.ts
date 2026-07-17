import type { Square, Theme, TransformMode } from '../store/useSquareStore'

const STORAGE_KEY = 'squarecad-session'

export interface PersistedSession {
  squares: Square[]
  theme: Theme
  gridEnabled: boolean
  transformMode: TransformMode
}

function migrateSquare(raw: Record<string, unknown>): Square {
  const labelTop =
    typeof raw.labelTop === 'string'
      ? raw.labelTop
      : typeof raw.label === 'string'
        ? raw.label
        : ''
  const labelSide = typeof raw.labelSide === 'string' ? raw.labelSide : ''

  return {
    id: String(raw.id),
    position: raw.position as Square['position'],
    size: raw.size as Square['size'],
    color: String(raw.color),
    labelTop,
    labelSide,
  }
}

export function loadSession(): PersistedSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as Record<string, unknown>
    if (!Array.isArray(parsed.squares)) return null

    return {
      squares: parsed.squares.map((sq) => migrateSquare(sq as Record<string, unknown>)),
      theme: parsed.theme === 'dark' ? 'dark' : 'light',
      gridEnabled: parsed.gridEnabled !== false,
      transformMode: parsed.transformMode === 'rotate' ? 'rotate' : 'translate',
    }
  } catch {
    return null
  }
}

export function saveSession(session: PersistedSession): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  } catch {
    // Storage full or unavailable — ignore silently
  }
}

export function deriveNextId(squares: Square[]): number {
  let max = 0
  for (const sq of squares) {
    const match = sq.id.match(/^sq-(\d+)$/)
    if (match) max = Math.max(max, parseInt(match[1], 10))
  }
  return max + 1
}
