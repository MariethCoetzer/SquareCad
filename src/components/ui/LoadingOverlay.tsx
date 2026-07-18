interface LoadingOverlayProps {
  visible: boolean
  title?: string
  message?: string
}

export function LoadingOverlay({
  visible,
  title = 'Loading',
  message = 'Please wait while the grid is loading.',
}: LoadingOverlayProps) {
  if (!visible) return null

  return (
    <div className="loading-overlay" role="status" aria-live="polite" aria-busy="true">
      <div className="loading-overlay__content">
        <div className="loading-spinner" aria-hidden="true" />
        <p className="loading-overlay__title">{title}</p>
        <p className="loading-overlay__message">{message}</p>
      </div>
    </div>
  )
}
