const APP_QUITTING_KEY = Symbol.for('bangumi-electron.appQuitting')

export function setAppQuitting(value: boolean) {
  ;(globalThis as Record<symbol, unknown>)[APP_QUITTING_KEY] = value
}

export function isAppQuitting() {
  return Boolean((globalThis as Record<symbol, unknown>)[APP_QUITTING_KEY])
}
