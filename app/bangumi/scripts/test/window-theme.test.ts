import { beforeEach, expect, test, vi } from 'vitest'

const state = vi.hoisted(() => ({
  theme: { themeSource: 'system' },
  values: new Map<string, unknown>(),
}))
vi.mock('electron', () => ({ nativeTheme: state.theme }))
vi.mock('../../src/main/env', () => ({ isWindows: true }))
vi.mock('../../src/main/lib/store', () => ({
  JSONStore: {
    get: (key: string) => state.values.get(key),
    set: (key: string, value: unknown) => state.values.set(key, value),
  },
}))
import { restoreWindowTheme, setWindowTheme } from '../../src/main/window-theme'

beforeEach(() => {
  state.theme.themeSource = 'system'
  state.values.clear()
})
test('native title bar follows explicit light, dark and system choices', () => {
  for (const source of ['dark', 'light', 'system'] as const) {
    setWindowTheme(source)
    expect(state.theme.themeSource).toBe(source)
    expect(state.values.get('windowThemeSource')).toBe(source)
  }
})
test('restores the chosen native theme before the renderer starts', () => {
  state.values.set('windowThemeSource', 'dark')
  restoreWindowTheme()
  expect(state.theme.themeSource).toBe('dark')
})
test('ignores invalid persisted theme values', () => {
  state.values.set('windowThemeSource', 'invalid')
  restoreWindowTheme()
  expect(state.theme.themeSource).toBe('system')
})
