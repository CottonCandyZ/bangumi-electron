import { Toaster } from '@renderer/components/ui/toaster'
import { ThemeProvider } from '@renderer/components/wrapper/theme-wrapper'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Outlet } from 'react-router-dom'
const queryClient = new QueryClient()
function App(): JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <Outlet />
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
