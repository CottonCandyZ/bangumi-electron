import { beforeEach, afterEach, expect, test, vi } from 'vitest'
const state = vi.hoisted(() => ({
  persisted: new Map<string, unknown>(),
  failRead: false,
  failWrite: false,
}))
vi.mock('idb-keyval', () => ({
  createStore: vi.fn(),
  get: async (key: string) => {
    if (state.failRead) throw new Error('IndexedDB unavailable')
    return state.persisted.get(key)
  },
  set: async (key: string, value: unknown) => {
    if (state.failWrite) throw new Error('quota')
    state.persisted.set(key, value)
  },
  del: async (key: string) => {
    if (state.failWrite) throw new Error('quota')
    state.persisted.delete(key)
  },
}))
beforeEach(() => {
  vi.resetModules()
  state.persisted.clear()
  state.failRead = false
  state.failWrite = false
  const mirror = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => mirror.get(key) ?? null,
    setItem: (key: string, value: string) => mirror.set(key, value),
  })
})
afterEach(() => vi.unstubAllGlobals())

test('guest 404 persists across reloads without hiding another account or resource', async () => {
  let visibility = await import('../../src/renderer/src/data/hooks/resource-visibility')
  await visibility.setResourceHidden(['subject-info'], null, 42, true)
  vi.resetModules()
  visibility = await import('../../src/renderer/src/data/hooks/resource-visibility')
  expect(await visibility.isResourceHidden(['subject-info'], null, 42)).toBe(true)
  expect(await visibility.isResourceHidden(['subject-info'], '1', 42)).toBe(false)
  expect(await visibility.isResourceHidden(['person-info'], null, 42)).toBe(false)
  await visibility.setResourceHidden(['subject-info'], '1', 42, true)
  expect(await visibility.isResourceHidden(['subject-info'], '2', 42)).toBe(false)
  await visibility.setResourceHidden(['subject-info'], null, 42, false)
  expect(await visibility.isResourceHidden(['subject-info'], null, 42)).toBe(false)
  expect(await visibility.isResourceHidden(['subject-info'], '1', 42)).toBe(true)
})

test('IndexedDB failure uses known visibility across reloads, while unknown entries fail closed', async () => {
  let visibility = await import('../../src/renderer/src/data/hooks/resource-visibility')
  expect(await visibility.isResourceHidden(['subject'], null, 1)).toBe(false)
  await visibility.setResourceHidden(['subject'], null, 2, true)
  vi.resetModules()
  state.failRead = true
  visibility = await import('../../src/renderer/src/data/hooks/resource-visibility')
  expect(await visibility.isResourceHidden(['subject'], null, 1)).toBe(false)
  expect(await visibility.isResourceHidden(['subject'], null, 2)).toBe(true)
  expect(await visibility.isResourceHidden(['subject'], null, 3)).toBe(true)
})

test('failed 404 writes remain hidden after reload even when IndexedDB still reports visible', async () => {
  let visibility = await import('../../src/renderer/src/data/hooks/resource-visibility')
  state.failWrite = true
  await visibility.setResourceHidden(['subject'], null, 1, true)
  vi.resetModules()
  visibility = await import('../../src/renderer/src/data/hooks/resource-visibility')
  expect(await visibility.isResourceHidden(['subject'], null, 1)).toBe(true)
  state.failWrite = false
  await visibility.setResourceHidden(['subject'], null, 1, false)
  vi.resetModules()
  visibility = await import('../../src/renderer/src/data/hooks/resource-visibility')
  expect(await visibility.isResourceHidden(['subject'], null, 1)).toBe(false)
})

test('both stores failing retains session decisions without exposing unknown content', async () => {
  state.failRead = state.failWrite = true
  vi.stubGlobal('localStorage', {
    getItem: () => {
      throw new Error('blocked')
    },
    setItem: () => {
      throw new Error('blocked')
    },
  })
  const visibility = await import('../../src/renderer/src/data/hooks/resource-visibility')
  await visibility.setResourceHidden(['subject'], null, 1, false)
  await visibility.setResourceHidden(['subject'], null, 2, true)
  expect(await visibility.isResourceHidden(['subject'], null, 1)).toBe(false)
  expect(await visibility.isResourceHidden(['subject'], null, 2)).toBe(true)
  expect(await visibility.isResourceHidden(['subject'], null, 3)).toBe(true)
})
