import { Toaster } from '@renderer/components/ui/sonner'
import { ThemeProvider } from '@renderer/components/wrapper/theme-wrapper'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { PropsWithChildren } from 'react'
import { TooltipProvider } from '@renderer/components/ui/tooltip'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import SessionWrapper from '@renderer/components/wrapper/session-wrapper'
import { ClickScrollPlugin, OverlayScrollbars } from 'overlayscrollbars'
import SheetWrapper from '@renderer/components/wrapper/sheet-wrapper'
import HoverCard from '@renderer/components/base/hover-card/wrapper'
import { persister, queryClient } from '@renderer/components/wrapper/query'

OverlayScrollbars.plugin(ClickScrollPlugin)

export default function Wrapper({ children }: PropsWithChildren) {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister, maxAge: 60 * 1000 * 60 * 24 }}
    >
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
    </PersistQueryClientProvider>
  )
}
