import { Toaster } from '@renderer/components/ui/sonner'
import { ThemeProvider } from '@renderer/components/wrapper/theme-wrapper'
import { QueryCache, QueryClient } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { PropsWithChildren } from 'react'
import { TooltipProvider } from '@renderer/components/ui/tooltip'
import { toast } from 'sonner'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import SessionWrapper from '@renderer/components/wrapper/session-wrapper'
import { ClickScrollPlugin, OverlayScrollbars } from 'overlayscrollbars'
import SheetWrapper from '@renderer/components/wrapper/sheet-wrapper'
import HoverCard from '@renderer/components/base/hover-card/wrapper'
import { createIDBPersister } from '@renderer/lib/persister'

OverlayScrollbars.plugin(ClickScrollPlugin)

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      // 已经获得了数据，但是在更新时出错
      if (query.state.data === null) {
        toast.error(error.message)
      }
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: import.meta.env.DEV ? 1000 * 60 * 60 * 5 : 20 * 1000,
      gcTime: import.meta.env.DEV ? Infinity : 60 * 1000 * 5,
      retry: 0,
    },
  },
})

const persister = createIDBPersister()
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
