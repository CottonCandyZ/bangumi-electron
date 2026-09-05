import assert from 'node:assert/strict'
import { test } from 'node:test'
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
  assert.doesNotThrow(assertWebVerificationNotRequired)

  markWebVerificationRequired()
  assert.equal(isWebVerificationRequired(), true)
  assert.throws(assertWebVerificationNotRequired, WebVerificationRequiredError)

  markWebVerificationComplete()
  assert.equal(isWebVerificationRequired(), false)
  assert.doesNotThrow(assertWebVerificationNotRequired)
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

  assert.equal(changes, 2)
})

test('web verification errors can be recognized across error boundaries', () => {
  assert.equal(isWebVerificationRequiredError(new WebVerificationRequiredError()), true)
  const reconstructed = new Error('Bangumi 网页验证已过期')
  reconstructed.name = 'WebVerificationRequiredError'
  assert.equal(isWebVerificationRequiredError(reconstructed), true)
  assert.equal(isWebVerificationRequiredError(new Error('403')), false)
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
  assert.equal(maximum, 1)
  assert.deepEqual(results, [0, 1, 2, 3, 4, 5])
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
  assert.equal(requests, 1)
  assert.ok(
    results.every(
      (result) => result.status === 'rejected' && isWebVerificationRequiredError(result.reason),
    ),
  )
  markWebVerificationComplete()
  assert.equal(await queueWebTrends(async () => 'recovered'), 'recovered')
})

test('network failures release the trends queue for the next request', async () => {
  markWebVerificationComplete()
  await assert.rejects(
    queueWebTrends(async () => {
      throw new Error('network failure')
    }),
  )
  assert.equal(await queueWebTrends(async () => 'next request'), 'next request')
})
