export class WebVerificationRequiredError extends Error {
  readonly statusCode = 403

  constructor() {
    super('Bangumi 网页验证已过期')
    this.name = 'WebVerificationRequiredError'
  }
}

let verificationRequired = false
const listeners = new Set<() => void>()

export function isWebVerificationRequired() {
  return verificationRequired
}

export function markWebVerificationRequired() {
  if (verificationRequired) return
  verificationRequired = true
  emitChange()
}

export function markWebVerificationComplete() {
  if (!verificationRequired) return
  verificationRequired = false
  emitChange()
}

export function assertWebVerificationNotRequired() {
  if (verificationRequired) throw new WebVerificationRequiredError()
}

export function isWebVerificationRequiredError(error: unknown) {
  return (
    error instanceof WebVerificationRequiredError ||
    (error instanceof Error && error.name === 'WebVerificationRequiredError')
  )
}

export function subscribeWebVerificationRequired(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function emitChange() {
  for (const listener of listeners) listener()
}
