interface LoadingOverlayProps {
  visible: boolean
}

export function LoadingOverlay({ visible }: LoadingOverlayProps) {
  if (!visible) return null

  return (
    <div className="loading-overlay" role="status" aria-live="polite" aria-busy="true">
      <div className="loading-overlay__content">
        <div className="loading-spinner" aria-hidden="true" />
        <p className="loading-overlay__title">Loading</p>
        <p className="loading-overlay__message">Please wait while the grid is loading.</p>
      </div>
    </div>
  )
}
