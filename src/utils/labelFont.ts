export const DEFAULT_LABEL_FONT_SIZE = 0.22
export const MIN_LABEL_FONT_SIZE = 0.08
export const MAX_LABEL_FONT_SIZE = 1
export const LABEL_FONT_SIZE_STEP = 0.02

export function clampLabelFontSize(value: number): number {
  return Math.min(MAX_LABEL_FONT_SIZE, Math.max(MIN_LABEL_FONT_SIZE, value))
}

export function normalizeLabelFontSize(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return clampLabelFontSize(value)
  }
  return DEFAULT_LABEL_FONT_SIZE
}
