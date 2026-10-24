import { toast } from 'sonner'
import {
  CollectionPendingError,
  isRequestCancelledError,
} from '../../src/renderer/src/lib/utils/network'
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
  vi.mocked(toast.error).mockClear()
  store.set(userIdAtom, '1')
  store.set(loginDialogAtom, { open: false })
})

const abort = new DOMException('signal is aborted without reason', 'AbortError')
test.each([
  abort,
  new FetchError('request failed', { cause: abort }),
  new Error("Error invoking remote method 'tipc': AbortError: This operation was aborted"),
  new Error('signal is aborted without reason'),
])(
  'cancelled background query (%s) preserves cache freshness without a notification',
  async (error) => {
    const queryKey = ['cancelled-background', error]
    const updatedAt = Date.now() - 60000
    const data = { title: 'cached content' }
    queryClient.setQueryData(queryKey, data, { updatedAt })
    await expect(
      queryClient.fetchQuery({
        queryKey,
        staleTime: 0,
        queryFn: async () => {
          throw error
        },
      }),
    ).rejects.toBe(error)
    expect(toast.error).not.toHaveBeenCalled()
    expect(queryClient.getQueryData(queryKey)).toBe(data)
    expect(queryClient.getQueryState(queryKey)?.dataUpdatedAt).toBe(updatedAt)
    expect(queryClient.getQueryState(queryKey)?.status).toBe('success')
  },
)

test('an uncached cancelled request does not show a toast or become an empty success', async () => {
  const queryKey = ['uncached-cancelled', abort]
  await expect(
    queryClient.fetchQuery({
      queryKey,
      queryFn: async () => {
        throw abort
      },
    }),
  ).rejects.toBe(abort)
  expect(toast.error).not.toHaveBeenCalled()
  expect(queryClient.getQueryState(queryKey)?.error).toBe(abort)
})

test.each([
  new Error('The server aborted processing the request'),
  new DOMException('Request timed out', 'TimeoutError'),
  new TypeError('Cannot read properties of undefined'),
])('ordinary errors and timeouts are not classified as cancellation: %s', (error) => {
  expect(isRequestCancelledError(error)).toBe(false)
})

test('repeated business 400 errors share one notification and keep the session', async () => {
  const error = new FetchError('[POST] /p1/example: 400 Bad Request')
  Object.defineProperty(error, 'statusCode', { value: 400 })
  for (const id of [1, 2]) {
    const queryKey = ['business-error', id, error]
    queryClient.setQueryData(queryKey, { cached: true })
    await expect(
      queryClient.fetchQuery({
        queryKey,
        staleTime: 0,
        queryFn: async () => {
          throw error
        },
      }),
    ).rejects.toBe(error)
  }
  expect(toast.error).toHaveBeenCalledTimes(2)
  const calls = vi.mocked(toast.error).mock.calls
  expect(calls[0][1]?.id).toBe(calls[1][1]?.id)
  expect(store.get(userIdAtom)).toBe('1')
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
