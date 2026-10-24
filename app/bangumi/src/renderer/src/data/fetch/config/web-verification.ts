import type { VerifiedPages, WebVerificationInput } from '@shared/web-verification'
import { markWebVerificationComplete } from './web-access'

let pending: Promise<VerifiedPages> | null = null
let attempt = 0

export function getPendingWebVerification() {
  return pending
}

export function getWebVerificationAttempt() {
  return attempt
}

/** Automatic recovery and manual verification share the same browser session. */
export function requestWebVerification(input: WebVerificationInput) {
  if (pending) return pending
  attempt++
  pending = (async () => {
    const { client } = await import('@renderer/lib/client')
    const pages = await client.requestBangumiWebVerification(input)
    markWebVerificationComplete()
    return pages
  })().finally(() => {
    pending = null
  })
  return pending
}

/** Cancelling one request must not cancel verification needed by other callers. */
export function waitForWebVerification<T>(request: Promise<T>, signal?: AbortSignal | null) {
  signal?.throwIfAborted()
  if (!signal) return request
  return new Promise<T>((resolve, reject) => {
    const abort = () => reject(signal.reason)
    signal.addEventListener('abort', abort, { once: true })
    request.then(resolve, reject).finally(() => signal.removeEventListener('abort', abort))
  })
}
