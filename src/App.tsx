import { useEffect } from 'react'
import { Viewport } from './components/Viewport'
import { Toolbar } from './components/ui/Toolbar'
import { PropertiesPanel } from './components/ui/PropertiesPanel'
import { useSquareStore } from './store/useSquareStore'

function App() {
  const theme = useSquareStore((s) => s.theme)
  const deleteSelected = useSquareStore((s) => s.deleteSelected)
  const selectedIds = useSquareStore((s) => s.selectedIds)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        (event.key === 'Delete' || event.key === 'Backspace') &&
        selectedIds.length > 0 &&
        !(event.target instanceof HTMLInputElement)
      ) {
        event.preventDefault()
        deleteSelected()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [deleteSelected, selectedIds.length])

  return (
    <div className="app">
      <PropertiesPanel />
      <main className="main">
        <Viewport />
        <Toolbar />
      </main>
    </div>
  )
}

export default App
