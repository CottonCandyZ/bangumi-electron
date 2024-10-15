import { ThemeProvider } from '@renderer/modules/wrapper/theme-wrapper'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { PropsWithChildren } from 'react'
import { SessionWrapper } from '@renderer/modules/wrapper/session-wrapper'
import { ClickScrollPlugin, OverlayScrollbars } from 'overlayscrollbars'
import { queryClient } from '@renderer/modules/wrapper/query'
import { Provider } from 'jotai'
import { store } from '@renderer/state/utils'
import { QueryClientProvider } from '@tanstack/react-query'
import { KeyboardShortcutProvider } from '@renderer/modules/wrapper/keyboard-shortcut'
import { Pop } from '@renderer/modules/wrapper/pop'

OverlayScrollbars.plugin(ClickScrollPlugin)

export function Wrapper({ children }: PropsWithChildren) {
  return (
    <Provider store={store}>
      <KeyboardShortcutProvider>
        <QueryClientProvider client={queryClient}>
          <SessionWrapper>
            <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
              <Pop>{children}</Pop>
            </ThemeProvider>
          </SessionWrapper>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </KeyboardShortcutProvider>
    </Provider>
  )
}
