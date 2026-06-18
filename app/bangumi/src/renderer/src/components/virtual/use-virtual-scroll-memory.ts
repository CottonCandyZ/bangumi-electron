import { useCallback, useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import type { CacheSnapshot, VirtualizerHandle } from 'virtua'

type VirtualScrollMemoryEntry = {
  cache?: CacheSnapshot
  itemCount: number
  scrollOffset: number
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
  const restoredKeyRef = useRef<string | undefined>(undefined)
  const cachedEntry = memoryKey ? virtualScrollMemoryCache.get(memoryKey) : undefined
  const canUseCachedEntry = ready && cachedEntry?.itemCount === itemCount
  const cache = canUseCachedEntry ? cachedEntry.cache : undefined
  const restoreOffset = canUseCachedEntry ? cachedEntry.scrollOffset : undefined
  const mountKey = memoryKey
    ? [memoryKey, ready ? 'ready' : 'pending', ...mountKeyParts]
        .filter((part) => part !== undefined)
        .join(':')
    : undefined

  const saveScrollState = useCallback(
    (scrollOffset?: number) => {
      const virtualizer = virtualizerRef.current
      if (!memoryKey || !ready || !canSave || itemCount === 0) return

      const previousEntry = virtualScrollMemoryCache.get(memoryKey)
      const currentViewport = viewport ?? viewportRef?.current
      const nextScrollOffset =
        scrollOffset ?? currentViewport?.scrollTop ?? virtualizer?.scrollOffset ?? 0

      virtualScrollMemoryCache.set(memoryKey, {
        cache: virtualizer?.cache ?? previousEntry?.cache,
        itemCount,
        scrollOffset: nextScrollOffset,
      })
    },
    [canSave, itemCount, memoryKey, ready, viewport, viewportRef, virtualizerRef],
  )

  useEffect(() => {
    restoredKeyRef.current = undefined
  }, [memoryKey])

  useEffect(() => {
    if (!memoryKey || !ready || itemCount === 0) return

    const restoreKey = `${memoryKey}:${itemCount}`
    if (restoredKeyRef.current === restoreKey) return

    if (!restoreOffset || restoreOffset <= 0) {
      restoredKeyRef.current = restoreKey
      saveScrollState()
      return
    }

    const frame = requestAnimationFrame(() => {
      restoredKeyRef.current = restoreKey
      virtualizerRef.current?.scrollTo(restoreOffset)
      const currentViewport = viewport ?? viewportRef?.current
      if (currentViewport) currentViewport.scrollTop = restoreOffset
      saveScrollState(restoreOffset)
    })

    return () => cancelAnimationFrame(frame)
  }, [
    itemCount,
    memoryKey,
    ready,
    restoreOffset,
    saveScrollState,
    viewport,
    viewportRef,
    virtualizerRef,
  ])

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
    mountKey,
    restoreOffset,
    saveScrollState,
  }
}
