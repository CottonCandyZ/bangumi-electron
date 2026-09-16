import { toast } from 'sonner'
import { CollectionPendingError } from '../../src/renderer/src/lib/utils/network'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { FetchError } from 'ofetch'
import { AuthError } from '../../src/renderer/src/lib/utils/error'
import { store } from '../../src/renderer/src/state/utils'
import { loginDialogAtom } from '../../src/renderer/src/state/dialog/normal'
import { userIdAtom } from '../../src/renderer/src/state/session'
import { queryClient } from '../../src/renderer/src/modules/wrapper/query'

vi.mock('@renderer/lib/persister', () => ({ newIdbStorage: vi.fn() }))
vi.mock('idb-keyval', () => ({ createStore: vi.fn() }))
vi.mock('@tanstack/react-query-persist-client', () => ({
  experimental_createQueryPersister: () => ({ persisterFn: undefined }),
}))
vi.mock('sonner', () => ({ toast: { error: vi.fn() } }))

beforeEach(() => {
  store.set(userIdAtom, '1')
  store.set(loginDialogAtom, { open: false })
})
afterEach(() => queryClient.clear())

const unauthorized = new FetchError('401 UNAUTHORIZED')
Object.defineProperty(unauthorized, 'statusCode', { value: 401 })

test.each([AuthError.expire(), AuthError.webCookieExpire(), AuthError.notAuth(), unauthorized])(
  'background query failure (%s) preserves cached content without opening login',
  async (error) => {
    const queryKey = ['background-auth']
    queryClient.setQueryData(queryKey, { title: 'cached content' })
    const fail = () =>
      queryClient.fetchQuery({
        queryKey,
        staleTime: 0,
        queryFn: async () => {
          throw error
        },
      })
    await expect(fail()).rejects.toBe(error)
    expect(store.get(loginDialogAtom).open).toBe(false)
    expect(queryClient.getQueryData(queryKey)).toEqual({ title: 'cached content' })
    // A later retry must not open a dialog either.
    await expect(fail()).rejects.toBe(error)
    expect(store.get(loginDialogAtom).open).toBe(false)
    expect(store.get(userIdAtom)).toBe('1')
  },
)

test('an uncached auth error stays available to the page and manual login keeps its callback', async () => {
  const error = AuthError.expire()
  const fail = () =>
    queryClient.fetchQuery({
      queryKey: ['uncached-auth'],
      queryFn: async () => {
        throw error
      },
    })
  await expect(fail()).rejects.toBe(error)
  expect(queryClient.getQueryState(['uncached-auth'])?.error).toBe(error)
  expect(store.get(loginDialogAtom).open).toBe(false)

  const onSuccess = vi.fn()
  store.set(loginDialogAtom, { open: true, content: { onSuccess } })
  await expect(fail()).rejects.toBe(error)
  expect(store.get(loginDialogAtom)).toEqual({ open: true, content: { onSuccess } })
  store.set(loginDialogAtom, { open: false })
  await expect(fail()).rejects.toBe(error)
  expect(store.get(loginDialogAtom).open).toBe(false)
})

test('waiting for collection sync does not generate background error toasts', async () => {
  vi.mocked(toast.error).mockClear()
  queryClient.setQueryData(['collection-episodes'], { data: [] })
  await expect(
    queryClient.fetchQuery({
      queryKey: ['collection-episodes'],
      staleTime: 0,
      queryFn: async () => {
        throw new CollectionPendingError()
      },
    }),
  ).rejects.toBeInstanceOf(CollectionPendingError)
  expect(toast.error).not.toHaveBeenCalled()
})
