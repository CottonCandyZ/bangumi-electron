import { useCallback, useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import type { VirtualizerHandle } from 'virtua'

const SCROLL_SETTLE_DELAY = 120
const SCROLL_SETTLE_TIMEOUT = 1800

export function useNativeSmoothVirtualizerScrollToTop({
  saveScrollState,
  viewport,
  virtualizerRef,
}: {
  saveScrollState: (scrollOffset?: number) => void
  viewport: HTMLElement | null
  virtualizerRef: RefObject<VirtualizerHandle | null>
}) {
  const cleanupRef = useRef<(() => void) | null>(null)

  const cleanup = useCallback(() => {
    cleanupRef.current?.()
    cleanupRef.current = null
  }, [])

  const reconcileScrollTop = useCallback(() => {
    cleanup()
    virtualizerRef.current?.scrollTo(0)
    saveScrollState(0)
  }, [cleanup, saveScrollState, virtualizerRef])

  const scrollToTop = useCallback(() => {
    cleanup()

    if (!viewport) {
      reconcileScrollTop()
      return
    }

    if (viewport.scrollTop <= 0) {
      reconcileScrollTop()
      return
    }

    const scrollViewport = viewport
    let settled = false
    let settleTimer: number | null = null

    function removeListeners() {
      scrollViewport.removeEventListener('scroll', scheduleSettle)
      scrollViewport.removeEventListener('scrollend', settle)
    }

    function settle() {
      if (settled) return

      settled = true
      removeListeners()
      if (settleTimer !== null) window.clearTimeout(settleTimer)
      window.clearTimeout(maxTimer)
      reconcileScrollTop()
    }

    function scheduleSettle() {
      if (settleTimer !== null) window.clearTimeout(settleTimer)
      settleTimer = window.setTimeout(settle, SCROLL_SETTLE_DELAY)
    }

    const maxTimer = window.setTimeout(settle, SCROLL_SETTLE_TIMEOUT)

    cleanupRef.current = () => {
      settled = true
      removeListeners()
      if (settleTimer !== null) window.clearTimeout(settleTimer)
      window.clearTimeout(maxTimer)
    }

    scrollViewport.addEventListener('scroll', scheduleSettle, { passive: true })
    scrollViewport.addEventListener('scrollend', settle)
    scrollViewport.scrollTo({ top: 0, behavior: 'smooth' })
  }, [cleanup, reconcileScrollTop, viewport])

  useEffect(() => cleanup, [cleanup])

  return scrollToTop
}
