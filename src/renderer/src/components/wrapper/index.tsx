import { Toaster } from '@renderer/components/ui/sonner'
import { ThemeProvider } from '@renderer/components/wrapper/theme-wrapper'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { PropsWithChildren } from 'react'
import { TooltipProvider } from '@renderer/components/ui/tooltip'
import Session from '@renderer/components/wrapper/session'
const queryClient = new QueryClient()
export default function Wrapper({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <Session>
        <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster richColors className="pointer-events-auto" />
        </ThemeProvider>
      </Session>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
