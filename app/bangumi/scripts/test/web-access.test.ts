import { expect, test } from 'vitest'
import {
  assertWebVerificationNotRequired,
  isWebVerificationRequired,
  isWebVerificationRequiredError,
  markWebVerificationComplete,
  markWebVerificationRequired,
  queueWebTrends,
  subscribeWebVerificationRequired,
  WebVerificationRequiredError,
} from '../../src/renderer/src/data/fetch/config/web-access'

test('web verification gate blocks repeated requests after the first 403', () => {
  markWebVerificationComplete()
  expect(assertWebVerificationNotRequired).not.toThrow()

  markWebVerificationRequired()
  expect(isWebVerificationRequired()).toBe(true)
  expect(assertWebVerificationNotRequired).toThrow(WebVerificationRequiredError)

  markWebVerificationComplete()
  expect(isWebVerificationRequired()).toBe(false)
  expect(assertWebVerificationNotRequired).not.toThrow()
})

test('web verification state only notifies on transitions', () => {
  markWebVerificationComplete()
  let changes = 0
  const unsubscribe = subscribeWebVerificationRequired(() => changes++)

  markWebVerificationRequired()
  markWebVerificationRequired()
  markWebVerificationComplete()
  markWebVerificationComplete()
  unsubscribe()

  expect(changes).toBe(2)
})

test('web verification errors can be recognized across error boundaries', () => {
  expect(isWebVerificationRequiredError(new WebVerificationRequiredError())).toBe(true)
  const reconstructed = new Error('Bangumi 网页验证已过期')
  reconstructed.name = 'WebVerificationRequiredError'
  expect(isWebVerificationRequiredError(reconstructed)).toBe(true)
  expect(isWebVerificationRequiredError(new Error('403'))).toBe(false)
})

test('home and list refreshes share a single request slot through body completion', async () => {
  markWebVerificationComplete()
  let active = 0
  let maximum = 0
  const results = await Promise.all(
    Array.from({ length: 6 }, (_, index) =>
      queueWebTrends(async () => {
        active++
        maximum = Math.max(maximum, active)
        await new Promise((resolve) => setTimeout(resolve, 5))
        active--
        return index
      }),
    ),
  )
  expect(maximum).toBe(1)
  expect(results).toEqual([0, 1, 2, 3, 4, 5])
})

test('queued requests stop after a challenge and resume after verification', async () => {
  markWebVerificationComplete()
  let requests = 0
  const results = await Promise.allSettled(
    Array.from({ length: 5 }, () =>
      queueWebTrends(async () => {
        requests++
        markWebVerificationRequired()
        throw new WebVerificationRequiredError()
      }),
    ),
  )
  expect(requests).toBe(1)
  expect(
    results.every(
      (result) => result.status === 'rejected' && isWebVerificationRequiredError(result.reason),
    ),
  ).toBeTruthy()
  markWebVerificationComplete()
  expect(await queueWebTrends(async () => 'recovered')).toBe('recovered')
})

test('network failures release the trends queue for the next request', async () => {
  markWebVerificationComplete()
  await expect(
    queueWebTrends(async () => {
      throw new Error('network failure')
    }),
  ).rejects.toThrow()
  expect(await queueWebTrends(async () => 'next request')).toBe('next request')
})
