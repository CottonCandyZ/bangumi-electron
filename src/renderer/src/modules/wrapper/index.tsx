import { Toaster } from '@renderer/components/ui/sonner'
import { ThemeProvider } from '@renderer/modules/wrapper/theme-wrapper'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { PropsWithChildren } from 'react'
import { TooltipProvider } from '@renderer/components/ui/tooltip'
import { SessionWrapper } from '@renderer/modules/wrapper/session-wrapper'
import { ClickScrollPlugin, OverlayScrollbars } from 'overlayscrollbars'
import { SheetWrapper } from '@renderer/modules/sheet/wrapper'
import { HoverCard } from '@renderer/modules/hover-card'
import { queryClient } from '@renderer/modules/wrapper/query'
import { Provider } from 'jotai'
import { store } from '@renderer/state/utils'
import { QueryClientProvider } from '@tanstack/react-query'

OverlayScrollbars.plugin(ClickScrollPlugin)

export function Wrapper({ children }: PropsWithChildren) {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <SessionWrapper>
          <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
            <TooltipProvider>
              <SheetWrapper>{children}</SheetWrapper>
            </TooltipProvider>
            <HoverCard />
            <Toaster richColors className="pointer-events-auto" />
          </ThemeProvider>
        </SessionWrapper>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </Provider>
  )
}
