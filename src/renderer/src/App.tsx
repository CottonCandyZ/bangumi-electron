import { ThemeProvider } from '@renderer/components/theme-wrapper'
import { Outlet } from 'react-router-dom'

function App(): JSX.Element {
  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <Outlet />
    </ThemeProvider>
  )
}

export default App
