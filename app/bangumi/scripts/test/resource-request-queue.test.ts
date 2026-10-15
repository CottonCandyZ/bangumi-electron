import { afterEach, expect, test, vi } from 'vitest'
import { ResourceRequestQueue } from '../../src/renderer/src/data/hooks/resource-request-queue'

const deferred = <T>() => {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((r) => {
    resolve = r
  })
  return { promise, resolve }
}
afterEach(() => vi.restoreAllMocks())

test('overlapping calls within one lane share a serial resource queue', async () => {
  const queue = new ResourceRequestQueue()
  const gate = deferred<number>()
  const controller = new AbortController()
  let active = 0,
    maximum = 0
  const fetch = vi.fn(async () => {
    active++
    maximum = Math.max(maximum, active)
    const result = await gate.promise
    active--
    return result
  })
  const first = queue.run('guest:1', controller.signal, fetch)
  const duplicate = queue.run('guest:1', controller.signal, fetch)
  const different = queue.run('guest:2', controller.signal, fetch)
  await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1))
  gate.resolve(1)
  expect(await Promise.all([first, duplicate, different])).toEqual([1, 1, 1])
  expect(fetch).toHaveBeenCalledTimes(2)
  expect(maximum).toBe(1)
})

test('detail reads finish while a background batch is blocked, with one request per lane', async () => {
  const queue = new ResourceRequestQueue()
  const gate = deferred<number>()
  const signal = new AbortController().signal
  const background = queue.run('batch:1', signal, () => gate.promise, 'background')
  const fetchNext = vi.fn(async () => 2)
  const next = queue.run('batch:2', signal, fetchNext, 'background')
  const detail = queue.run('detail:3', signal, async () => 3)
  expect(await detail).toBe(3)
  expect(fetchNext).not.toHaveBeenCalled()
  gate.resolve(1)
  expect(await Promise.all([background, next])).toEqual([1, 2])
})

test('opening a queued batch item promotes it and reuses the same request', async () => {
  const queue = new ResourceRequestQueue()
  const gate = deferred<number>()
  const signal = new AbortController().signal
  const background = queue.run('1', signal, () => gate.promise, 'background')
  const fetch = vi.fn(async () => 42)
  const queued = queue.run('42', signal, fetch, 'background')
  const detail = queue.run('42', signal, fetch)
  expect(await detail).toBe(42)
  expect(await queued).toBe(42)
  expect(fetch).toHaveBeenCalledTimes(1)
  gate.resolve(1)
  await background
})

test('foreground reads share already running background requests', async () => {
  const queue = new ResourceRequestQueue()
  const gate = deferred<number>()
  const signal = new AbortController().signal
  const fetch = vi.fn(() => gate.promise)
  const background = queue.run('42', signal, fetch, 'background')
  await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1))
  const detail = queue.run('42', signal, fetch)
  gate.resolve(42)
  expect(await Promise.all([background, detail])).toEqual([42, 42])
  expect(fetch).toHaveBeenCalledTimes(1)
})

test('one cancelled consumer does not abort another consumer of the same resource', async () => {
  const queue = new ResourceRequestQueue()
  const gate = deferred<number>()
  const first = new AbortController(),
    second = new AbortController()
  const fetch = vi.fn(async (signal: AbortSignal) => {
    await gate.promise
    signal.throwIfAborted()
    return 42
  })
  const a = queue.run('42', first.signal, fetch)
  const b = queue.run('42', second.signal, fetch)
  const cancelled = expect(a).rejects.toMatchObject({ name: 'AbortError' })
  first.abort()
  gate.resolve(42)
  await cancelled
  expect(await b).toBe(42)
  expect(fetch).toHaveBeenCalledTimes(1)
})

test('cancelled queued requests never reach the server', async () => {
  const queue = new ResourceRequestQueue()
  const gate = deferred<number>()
  const controller = new AbortController()
  const first = queue.run('1', new AbortController().signal, () => gate.promise)
  const fetch = vi.fn(async () => 2)
  const next = queue.run('2', controller.signal, fetch)
  const cancelled = expect(next).rejects.toMatchObject({ name: 'AbortError' })
  controller.abort()
  gate.resolve(1)
  await first
  await cancelled
  expect(fetch).not.toHaveBeenCalled()
})
