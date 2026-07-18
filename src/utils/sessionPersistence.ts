import type { Square, Theme } from '../store/useSquareStore'
import { normalizeLabelFontSize } from './labelFont'

const STORAGE_KEY = 'squarecad-session'
export const SESSION_FILE_VERSION = 1

export interface PersistedSession {
  squares: Square[]
  theme: Theme
  gridEnabled: boolean
}

export interface SessionFile extends PersistedSession {
  version: number
  squarecad: true
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
    labelFontSize: normalizeLabelFontSize(raw.labelFontSize),
  }
}

export function parsePersistedSession(parsed: Record<string, unknown>): PersistedSession | null {
  if (!Array.isArray(parsed.squares)) return null

  return {
    squares: parsed.squares.map((sq) => migrateSquare(sq as Record<string, unknown>)),
    theme: parsed.theme === 'dark' ? 'dark' : 'light',
    gridEnabled: parsed.gridEnabled !== false,
  }
}

export function loadSession(): PersistedSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as Record<string, unknown>
    return parsePersistedSession(parsed)
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

export function toSessionFile(session: PersistedSession): SessionFile {
  return {
    version: SESSION_FILE_VERSION,
    squarecad: true,
    squares: session.squares,
    theme: session.theme,
    gridEnabled: session.gridEnabled,
  }
}

export function parseSessionFileContents(raw: string): PersistedSession | null {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    return parsePersistedSession(parsed)
  } catch {
    return null
  }
}

export function defaultExportFilename(): string {
  const date = new Date().toISOString().slice(0, 10)
  return `squarecad-${date}.json`
}

export function downloadSessionFile(session: PersistedSession, filename = defaultExportFilename()): void {
  const payload = toSessionFile(session)
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
