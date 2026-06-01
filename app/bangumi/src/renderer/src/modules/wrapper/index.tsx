import { ThemeProvider } from '@renderer/modules/wrapper/theme-wrapper'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { PropsWithChildren } from 'react'
import { queryClient } from '@renderer/modules/wrapper/query'
import { Provider as JotaiProvider } from 'jotai'
import { store } from '@renderer/state/utils'
import { QueryClientProvider } from '@tanstack/react-query'
import { Pop } from '@renderer/modules/wrapper/pop'
import { KeyboardShortcutWrapper } from '@renderer/modules/wrapper/keyboard-shortcut'
import { useLoadAppConfig } from '@renderer/state/app-config'

export function Wrapper({ children }: PropsWithChildren) {
  return (
    <JotaiProvider store={store}>
      <QueryClientProvider client={queryClient}>
        <AppConfigLoader>
          <KeyboardShortcutWrapper>
            <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
              <Pop>{children}</Pop>
            </ThemeProvider>
          </KeyboardShortcutWrapper>
        </AppConfigLoader>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </JotaiProvider>
  )
}

function AppConfigLoader({ children }: PropsWithChildren) {
  useLoadAppConfig()

  return children
}
