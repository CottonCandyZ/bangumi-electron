import { afterEach, beforeEach, expect, test, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  queryFn: undefined as undefined | (() => Promise<unknown>),
  account: vi.fn(),
  save: vi.fn(),
  profile: vi.fn(),
  token: vi.fn(),
  setQueryData: vi.fn(),
  legacy: vi.fn(),
}))
vi.mock('idb-keyval', () => ({ createStore: vi.fn(), get: mocks.legacy }))
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
  mocks.legacy.mockResolvedValue(undefined)
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

test('offline upgrade migrates the active cached profile without making a network request', async () => {
  vi.stubGlobal('navigator', { onLine: false })
  const profile = { id: 1, username: 'existing-user' }
  mocks.legacy.mockResolvedValue({ state: { data: profile } })
  await expect(mocks.queryFn!()).resolves.toEqual(profile)
  expect(mocks.save).toHaveBeenCalledWith(profile)
  expect(mocks.profile).not.toHaveBeenCalled()
  expect(mocks.legacy.mock.calls[0][0]).toBe('tanstack-query-["userSession","1"]')
})

test('offline upgrade never adopts a different cached account', async () => {
  vi.stubGlobal('navigator', { onLine: false })
  mocks.legacy.mockResolvedValue({ state: { data: { id: 2, username: 'other-user' } } })
  await expect(mocks.queryFn!()).resolves.toBeNull()
  expect(mocks.save).not.toHaveBeenCalled()
})
