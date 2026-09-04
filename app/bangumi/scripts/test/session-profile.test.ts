import { afterEach, beforeEach, expect, test, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  queryFn: undefined as undefined | (() => Promise<unknown>),
  account: vi.fn(),
  save: vi.fn(),
  profile: vi.fn(),
  token: vi.fn(),
  setQueryData: vi.fn(),
}))
vi.mock('@renderer/lib/client', () => ({
  client: { collectionAccount: mocks.account, collectionSaveAccount: mocks.save },
}))
vi.mock('@renderer/modules/wrapper/query', () => ({
  queryClient: { setQueryData: mocks.setQueryData },
}))
vi.mock('@renderer/data/fetch/api/user', () => ({ getUserInfoWithAuth: mocks.profile }))
vi.mock('@renderer/data/fetch/session', () => ({ getAccessToken: mocks.token, logout: vi.fn() }))
vi.mock('@renderer/state/dialog/normal', () => ({ loginDialogAtom: {} }))
vi.mock('@renderer/state/session', () => ({ userIdAtom: {} }))
vi.mock('@renderer/state/utils', () => ({ store: { get: () => '1', set: vi.fn() } }))
vi.mock('jotai', () => ({ useAtomValue: () => '1' }))
vi.mock('@tanstack/react-query', () => ({
  useMutation: vi.fn(),
  useQuery: (options: { queryFn: () => Promise<unknown> }) => {
    mocks.queryFn = options.queryFn
    return { data: null }
  },
}))
beforeEach(async () => {
  vi.resetModules()
  vi.clearAllMocks()
  mocks.account.mockResolvedValue(null)
  mocks.token.mockResolvedValue({ access_token: 'test' })
  mocks.profile.mockResolvedValue({ id: 1, username: 'test-user' })
  const { useSession } = await import('../../src/renderer/src/data/hooks/session')
  useSession()
})
afterEach(() => vi.unstubAllGlobals())

test('offline first launch without a local profile recovers immediately on reconnect', async () => {
  vi.stubGlobal('navigator', { onLine: false })
  await expect(mocks.queryFn!()).resolves.toBe(null)
  expect(mocks.profile).not.toHaveBeenCalled()
  vi.stubGlobal('navigator', { onLine: true })
  await expect(mocks.queryFn!()).resolves.toEqual({ id: 1, username: 'test-user' })
  expect(mocks.save).toHaveBeenCalledTimes(1)
})

test('a missing token is not retained in the profile refresh cache', async () => {
  vi.stubGlobal('navigator', { onLine: true })
  mocks.token.mockResolvedValueOnce(null)
  await expect(mocks.queryFn!()).resolves.toBe(null)
  await expect(mocks.queryFn!()).resolves.toEqual({ id: 1, username: 'test-user' })
})
