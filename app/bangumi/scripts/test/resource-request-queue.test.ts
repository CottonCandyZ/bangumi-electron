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

test('overlapping batches and detail calls share a serial resource queue', async () => {
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
