import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light' | 'system'
type Color = 'dark' | 'light'

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  currentColor: Color
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: 'system',
  currentColor: 'light',
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'vite-ui-theme',
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme,
  )
  const [currentColor, setCurrentColor] = useState<Color>(
    theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : theme,
  )
  useEffect(() => {
    const root = window.document.documentElement
    const darkModePreference = window.matchMedia('(prefers-color-scheme: dark)')
    const changeTheme = (e: MediaQueryListEvent) => {
      if (theme === 'system') {
        root.classList.remove('light', 'dark')
        const systemTheme = e.matches ? 'dark' : 'light'
        setCurrentColor(systemTheme)
        root.classList.add(systemTheme)
      }
    }
    darkModePreference.addEventListener('change', changeTheme)
    return () => darkModePreference.removeEventListener('change', changeTheme)
  }, [theme])

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove('light', 'dark')

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      setCurrentColor(systemTheme)
      root.classList.add(systemTheme)
      return
    }

    setCurrentColor(theme)

    root.classList.add(theme)
  }, [theme])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme)
      setTheme(theme)
    },
    currentColor,
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined) throw new Error('useTheme must be used within a ThemeProvider')

  return context
}
