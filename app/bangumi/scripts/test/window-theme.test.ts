import { beforeEach, expect, test, vi } from 'vitest'
import type { BrowserWindow } from 'electron'

const state = vi.hoisted(() => ({
  theme: {
    themeSource: 'system',
    shouldUseDarkColors: false,
    on: vi.fn(),
    removeListener: vi.fn(),
  },
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
import {
  getWindowTitleBarOverlay,
  restoreWindowTheme,
  setWindowTheme,
  syncWindowTitleBarTheme,
} from '../../src/main/window-theme'

beforeEach(() => {
  state.theme.themeSource = 'system'
  state.theme.shouldUseDarkColors = false
  vi.clearAllMocks()
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

test('updates existing caption controls for system theme changes and cleans up closed windows', () => {
  const window = {
    isDestroyed: vi.fn(() => false),
    setTitleBarOverlay: vi.fn(),
    once: vi.fn(),
  }
  syncWindowTitleBarTheme(window as unknown as BrowserWindow)
  expect(window.setTitleBarOverlay).toHaveBeenLastCalledWith({
    height: 32,
    color: '#00000000',
    symbolColor: '#000000',
  })
  const update = state.theme.on.mock.calls[0][1]
  state.theme.shouldUseDarkColors = true
  update()
  expect(window.setTitleBarOverlay).toHaveBeenLastCalledWith({
    height: 32,
    color: '#00000000',
    symbolColor: '#ffffff',
  })
  window.isDestroyed.mockReturnValue(true)
  update()
  expect(window.setTitleBarOverlay).toHaveBeenCalledTimes(2)
  expect(window.once.mock.calls[0][0]).toBe('closed')
  window.once.mock.calls[0][1]()
  expect(state.theme.removeListener).toHaveBeenCalledWith('updated', update)
})

test('initial dark caption controls are configured before showing the window', () => {
  state.theme.shouldUseDarkColors = true
  expect(getWindowTitleBarOverlay()).toEqual({
    height: 32,
    color: '#00000000',
    symbolColor: '#ffffff',
  })
})
