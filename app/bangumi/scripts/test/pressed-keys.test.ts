import { afterEach, beforeEach, expect, test, vi } from 'vitest'

const probes = vi.hoisted(() => [] as { read: () => boolean; stop: () => void }[])

vi.mock('react', () => ({
  useSyncExternalStore(subscribe: (listener: () => void) => () => void, read: () => boolean) {
    probes.push({ read, stop: subscribe(() => {}) })
    return read()
  },
}))

let useKeyPressed: typeof import('../../src/renderer/src/lib/pressed-keys').useKeyPressed

beforeEach(async () => {
  vi.resetModules()
  vi.stubGlobal('navigator', { platform: 'MacIntel' })
  vi.stubGlobal('window', new EventTarget())
  vi.stubGlobal('document', Object.assign(new EventTarget(), { hidden: false }))
  ;({ useKeyPressed } = await import('../../src/renderer/src/lib/pressed-keys'))
})

afterEach(() => {
  probes.splice(0).forEach((probe) => probe.stop())
  vi.unstubAllGlobals()
})

function watch(token: string) {
  // eslint-disable-next-line react-hooks/rules-of-hooks -- React is mocked to expose the store's snapshots.
  useKeyPressed(token)
  return probes.at(-1)!.read
}

function key(type: 'keydown' | 'keyup', code: string, value: string, flags = {}) {
  window.dispatchEvent(
    Object.assign(new Event(type), {
      code,
      key: value,
      ctrlKey: false,
      metaKey: false,
      altKey: false,
      shiftKey: false,
      ...flags,
    }),
  )
}

test('releasing Command clears ordinary keys whose keyup was never delivered', () => {
  const command = watch('mod')
  const letter = watch('k')
  key('keydown', 'MetaLeft', 'Meta', { metaKey: true })
  key('keydown', 'KeyK', 'k', { metaKey: true })
  expect([command(), letter()]).toEqual([true, true])
  key('keyup', 'MetaLeft', 'Meta')
  expect([command(), letter()]).toEqual([false, false])
})

test('releasing Command preserves modifiers that are still physically held', () => {
  const shift = watch('shift')
  const letter = watch('k')
  key('keydown', 'KeyK', 'k', { metaKey: true, shiftKey: true })
  key('keyup', 'MetaLeft', 'Meta', { shiftKey: true })
  expect([shift(), letter()]).toEqual([true, false])
})

test('the next key event recovers when the Command release was also missed', () => {
  const previous = watch('k')
  const current = watch('j')
  key('keydown', 'KeyK', 'k', { metaKey: true })
  key('keydown', 'KeyJ', 'j')
  expect([previous(), current()]).toEqual([false, true])
})

test('ordinary keyup only releases its own key', () => {
  const first = watch('k')
  const second = watch('j')
  key('keydown', 'KeyK', 'k')
  key('keydown', 'KeyJ', 'j')
  key('keyup', 'KeyK', 'k')
  expect([first(), second()]).toEqual([false, true])
})

test('releasing Control leaves ordinary keys held until their own keyup', () => {
  const control = watch('ctrl')
  const letter = watch('k')
  key('keydown', 'KeyK', 'k', { ctrlKey: true })
  key('keyup', 'ControlLeft', 'Control')
  expect([control(), letter()]).toEqual([false, true])
  key('keyup', 'KeyK', 'k')
  expect(letter()).toBe(false)
})

test('losing focus or hiding the document clears pressed keys', () => {
  const letter = watch('k')
  key('keydown', 'KeyK', 'k')
  window.dispatchEvent(new Event('blur'))
  expect(letter()).toBe(false)
  key('keydown', 'KeyK', 'k')
  Object.defineProperty(document, 'hidden', { value: true })
  document.dispatchEvent(new Event('visibilitychange'))
  expect(letter()).toBe(false)
})
