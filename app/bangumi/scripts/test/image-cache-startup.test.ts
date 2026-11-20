import { get } from 'idb-keyval'
import { expect, test, vi } from 'vitest'

vi.mock('react-router-dom', async (importOriginal) => {
  const router = await importOriginal<typeof import('react-router-dom')>()
  return { ...router, createHashRouter: router.createMemoryRouter }
})
vi.mock('idb-keyval', () => ({
  createStore: vi.fn(),
  get: vi.fn(),
}))
vi.mock('@renderer/App', () => ({ default: () => null }))
vi.mock('@renderer/error/main-error-element', () => ({ default: () => null }))
vi.mock('@renderer/error/app-shell-error-element', () => ({ default: () => null }))
vi.mock('@renderer/app/layout', () => ({ Component: () => null }))
vi.mock('@renderer/app/home/page', () => ({ Component: () => null }))

test('initializes the main route while the image cache read is pending', async () => {
  vi.mocked(get).mockReturnValueOnce(new Promise(() => {}))
  const { router } = await import('../../src/renderer/src/router')

  try {
    await vi.waitFor(() => expect(router.state.initialized).toBe(true))
    expect(router.state.errors).toBeNull()
    expect(get).toHaveBeenCalledOnce()
  } finally {
    router.dispose()
  }
})
