import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import {
  clearHoverCardContentElement,
  enterHoverCardTriggerInSafeArea,
  isInHoverCardSafeArea,
  setHoverCardContentElement,
  startHoverCardSafeArea,
} from '../../src/renderer/src/components/hover-card/safe-area'

const content = {
  getBoundingClientRect: () => ({ left: 0, right: 60, top: 20, bottom: 60 }),
} as HTMLElement

beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal('document', new EventTarget())
  setHoverCardContentElement(content)
})

afterEach(() => {
  vi.runOnlyPendingTimers()
  clearHoverCardContentElement(content)
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

function leaveTrigger() {
  const close = vi.fn()
  const keepOpen = vi.fn()
  const owner = {}
  startHoverCardSafeArea(
    { x: 5, y: 10 },
    {
      close,
      keepOpen,
      owner,
      trigger: { left: 0, right: 10, top: 0, bottom: 10 } as DOMRect,
    },
  )
  return { close, keepOpen, owner }
}

test('leaving a pending trigger still closes the old card when its safe area expires', () => {
  const { close } = leaveTrigger()
  // The pending trigger's open callback can become a no-op after the pointer leaves it.
  enterHoverCardTriggerInSafeArea({}, () => {})
  vi.advanceTimersByTime(80)
  expect(isInHoverCardSafeArea()).toBe(false)
  expect(close).toHaveBeenCalledOnce()
})

test('switching cards closes the previous card before opening the pending trigger', () => {
  const { close } = leaveTrigger()
  const open = vi.fn()
  enterHoverCardTriggerInSafeArea({}, open)
  vi.advanceTimersByTime(80)
  expect(close).toHaveBeenCalledOnce()
  expect(open).toHaveBeenCalledOnce()
  expect(close.mock.invocationCallOrder[0]).toBeLessThan(open.mock.invocationCallOrder[0])
})

test('returning to the owner keeps the card open and cancels a pending switch', () => {
  const { close, keepOpen, owner } = leaveTrigger()
  const pending = vi.fn()
  enterHoverCardTriggerInSafeArea({}, pending)
  enterHoverCardTriggerInSafeArea(owner, vi.fn())
  vi.advanceTimersByTime(300)
  expect(keepOpen).toHaveBeenCalledOnce()
  expect(close).not.toHaveBeenCalled()
  expect(pending).not.toHaveBeenCalled()
  expect(isInHoverCardSafeArea()).toBe(false)
})
