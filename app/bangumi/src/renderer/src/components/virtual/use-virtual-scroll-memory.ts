import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { RefObject } from 'react'
import type { CacheSnapshot, VirtualizerHandle } from 'virtua'

type VirtualScrollMemoryEntry = {
  cache?: CacheSnapshot
  itemCount: number
  scrollOffset: number
  visibleIndexes: number[]
}

type UseVirtualScrollMemoryOptions = {
  canSave?: boolean
  itemCount: number
  mountKeyParts?: Array<number | string | boolean | undefined>
  memoryKey?: string
  ready?: boolean
  viewport?: HTMLElement | null
  viewportRef?: RefObject<HTMLElement | null>
  virtualizerRef: RefObject<VirtualizerHandle | null>
}

const virtualScrollMemoryCache = new Map<string, VirtualScrollMemoryEntry>()

export function useVirtualScrollMemory({
  canSave = true,
  itemCount,
  mountKeyParts = [],
  memoryKey,
  ready = true,
  viewport,
  viewportRef,
  virtualizerRef,
}: UseVirtualScrollMemoryOptions) {
  const restoredRef = useRef<{ key: string; virtualizer: VirtualizerHandle } | undefined>(undefined)
  const cachedEntry = memoryKey ? virtualScrollMemoryCache.get(memoryKey) : undefined
  const canUseCachedEntry = ready && cachedEntry?.itemCount === itemCount
  const cache = canUseCachedEntry ? cachedEntry.cache : undefined
  const restoreOffset = canUseCachedEntry ? cachedEntry.scrollOffset : undefined
  const mountKey = memoryKey
    ? [memoryKey, ready ? 'ready' : 'pending', ...mountKeyParts]
        .filter((part) => part !== undefined)
        .join(':')
    : undefined
  // A -> B -> A creates a new virtualizer even if B has not finished measuring.
  const mountSession = useMemo(() => ({ key: mountKey }), [mountKey])
  const [measuredSession, setMeasuredSession] = useState<typeof mountSession>()
  // Virtua waits for its first viewport ResizeObserver notification before
  // rendering a range. Mount the cached visible rows immediately so restoring a
  // deep offset cannot paint an empty viewport while that measurement is pending.
  const keepMounted =
    canUseCachedEntry && measuredSession !== mountSession ? cachedEntry.visibleIndexes : undefined

  const saveScrollState = useCallback(
    (scrollOffset?: number) => {
      const virtualizer = virtualizerRef.current
      if (!memoryKey || !ready || !canSave || itemCount === 0 || !virtualizer) return
      // Ignore scroll events from the previous page or an uninitialized virtualizer.
      if (
        restoredRef.current?.key !== mountKey ||
        restoredRef.current?.virtualizer !== virtualizer
      ) {
        return
      }

      const currentViewport = viewportRef?.current ?? viewport
      const nextScrollOffset =
        scrollOffset ?? currentViewport?.scrollTop ?? virtualizer.scrollOffset
      const firstIndex = virtualizer.findItemIndex(nextScrollOffset)
      const lastIndex = virtualizer.findItemIndex(
        nextScrollOffset + (currentViewport?.clientHeight || virtualizer.viewportSize),
      )

      virtualScrollMemoryCache.set(memoryKey, {
        cache: virtualizer.cache,
        itemCount,
        scrollOffset: nextScrollOffset,
        visibleIndexes: Array.from(
          { length: lastIndex - firstIndex + 1 },
          (_, i) => firstIndex + i,
        ),
      })
      if (virtualizer.viewportSize > 0) setMeasuredSession(mountSession)
    },
    [
      canSave,
      itemCount,
      memoryKey,
      mountKey,
      mountSession,
      ready,
      viewport,
      viewportRef,
      virtualizerRef,
    ],
  )

  useLayoutEffect(() => {
    const virtualizer = virtualizerRef.current
    const currentViewport = viewportRef?.current ?? viewport
    if (!mountKey || !ready || itemCount === 0 || !virtualizer || !currentViewport) return
    if (restoredRef.current?.key === mountKey && restoredRef.current.virtualizer === virtualizer) {
      return
    }

    // Restore before paint, including zero for an unvisited page. Do this once per
    // mounted virtualizer, not whenever pagination changes the number of rows.
    restoredRef.current = { key: mountKey, virtualizer }
    const offset = restoreOffset ?? 0
    currentViewport.scrollTo({ top: offset, behavior: 'instant' })
    virtualizer.scrollTo(offset)
    // With scrollRef, Virtua attaches its scroll listener in a microtask. Feed
    // the restored offset to it after that attachment, before the first paint;
    // waiting for a native scroll event can leave the visible range empty.
    queueMicrotask(() => {
      if (virtualizerRef.current !== virtualizer) return
      currentViewport.dispatchEvent(new Event('scroll'))
    })
  }, [itemCount, mountKey, ready, restoreOffset, viewport, viewportRef, virtualizerRef])

  useEffect(() => {
    if (!viewport) return

    const saveViewportScrollState = () => {
      saveScrollState(viewport.scrollTop)
    }

    viewport.addEventListener('scroll', saveViewportScrollState, { passive: true })
    viewport.addEventListener('scrollend', saveViewportScrollState)

    return () => {
      viewport.removeEventListener('scroll', saveViewportScrollState)
      viewport.removeEventListener('scrollend', saveViewportScrollState)
    }
  }, [saveScrollState, viewport])

  return {
    cache,
    keepMounted,
    mountKey,
    restoreOffset,
    saveScrollState,
  }
}
