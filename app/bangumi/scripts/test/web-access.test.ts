import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  assertWebVerificationNotRequired,
  isWebVerificationRequired,
  isWebVerificationRequiredError,
  markWebVerificationComplete,
  markWebVerificationRequired,
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
