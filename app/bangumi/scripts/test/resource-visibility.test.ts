import { expect, test, vi } from 'vitest'
const persisted = vi.hoisted(() => new Map<string, unknown>())
vi.mock('idb-keyval', () => ({
  createStore: vi.fn(),
  get: async (key: string) => persisted.get(key),
  set: async (key: string, value: unknown) => {
    persisted.set(key, value)
  },
  del: async (key: string) => {
    persisted.delete(key)
  },
}))

test('guest 404 visibility persists across reloads without hiding authenticated resources', async () => {
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
