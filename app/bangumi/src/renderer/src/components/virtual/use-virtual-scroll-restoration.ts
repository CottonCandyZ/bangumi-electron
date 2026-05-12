import { useCallback, useLayoutEffect, useRef } from 'react'
import type { Key, UIEvent } from 'react'

const VIRTUAL_RESTORE_FRAME_COUNT = 4

type VirtualScrollEntry = {
  anchorIndex: number
  anchorKey: Key
  anchorOffset: number
  scrollTop: number
}

type VirtualItemSnapshot = {
  end: number
  index: number
  start: number
}

const virtualScrollCache = new Map<string, VirtualScrollEntry>()

export function useVirtualScrollRestoration<T>({
  getKey,
  getViewport,
  getVirtualItems,
  itemCount,
  items,
  scrollKey,
  scrollToIndex,
  scrollToOffset,
}: {
  getKey: (item: T, index: number) => Key
  getViewport: () => HTMLElement | null
  getVirtualItems: () => VirtualItemSnapshot[]
  itemCount: number
  items: T[]
  scrollKey?: string
  scrollToIndex: (index: number) => void
  scrollToOffset: (offset: number) => void
}) {
  const restoredKeyRef = useRef<string | undefined>(undefined)
  const restoringRef = useRef(false)
  const restoreFrameRef = useRef<number | null>(null)

  const cancelRestoreFrame = useCallback(() => {
    if (restoreFrameRef.current === null) return
    cancelAnimationFrame(restoreFrameRef.current)
    restoreFrameRef.current = null
  }, [])

  const saveScrollState = useCallback(
    (viewport = getViewport()) => {
      if (!scrollKey || !viewport) return

      const scrollTop = viewport.scrollTop
      const virtualItems = getVirtualItems()
      const anchor = virtualItems.find((item) => item.end > scrollTop) ?? virtualItems[0]
      const item = anchor ? items[anchor.index] : undefined

      if (!anchor || item === undefined) return

      virtualScrollCache.set(scrollKey, {
        anchorIndex: anchor.index,
        anchorKey: getKey(item, anchor.index),
        anchorOffset: Math.max(0, scrollTop - anchor.start),
        scrollTop,
      })
    },
    [getKey, getViewport, getVirtualItems, items, scrollKey],
  )

  const stopRestore = useCallback(
    (shouldSave = true) => {
      if (!restoringRef.current) return

      restoringRef.current = false
      cancelRestoreFrame()
      if (shouldSave) saveScrollState()
    },
    [cancelRestoreFrame, saveScrollState],
  )

  const getAnchorIndex = useCallback(
    (entry: VirtualScrollEntry) => {
      const indexByKey = items.findIndex((item, index) =>
        Object.is(getKey(item, index), entry.anchorKey),
      )
      if (indexByKey >= 0) return indexByKey
      if (items.length === 0) return -1
      return Math.min(entry.anchorIndex, items.length - 1)
    },
    [getKey, items],
  )

  useLayoutEffect(() => {
    restoredKeyRef.current = undefined
    restoringRef.current = false
    cancelRestoreFrame()
  }, [cancelRestoreFrame, scrollKey])

  useLayoutEffect(() => {
    if (!scrollKey || itemCount === 0) return
    if (restoredKeyRef.current === scrollKey) return

    const entry = virtualScrollCache.get(scrollKey)
    if (!entry) return

    const viewport = getViewport()
    if (!viewport) return

    let frameCount = 0
    let cancelled = false
    restoredKeyRef.current = scrollKey
    restoringRef.current = true

    const finishRestore = () => {
      restoringRef.current = false
      restoreFrameRef.current = null
      saveScrollState(viewport)
    }

    const restore = () => {
      if (cancelled) return

      const anchorIndex = getAnchorIndex(entry)
      if (anchorIndex < 0) {
        finishRestore()
        return
      }

      scrollToIndex(anchorIndex)

      restoreFrameRef.current = requestAnimationFrame(() => {
        const anchor = getVirtualItems().find((item) => item.index === anchorIndex)
        const targetScrollTop = anchor ? anchor.start + entry.anchorOffset : entry.scrollTop
        const maxScrollTop = Math.max(0, viewport.scrollHeight - viewport.clientHeight)

        scrollToOffset(Math.min(targetScrollTop, maxScrollTop))

        frameCount += 1
        if (frameCount >= VIRTUAL_RESTORE_FRAME_COUNT) {
          finishRestore()
          return
        }

        restoreFrameRef.current = requestAnimationFrame(restore)
      })
    }

    restore()

    return () => {
      cancelled = true
      cancelRestoreFrame()
      restoringRef.current = false
    }
  }, [
    cancelRestoreFrame,
    getAnchorIndex,
    getViewport,
    getVirtualItems,
    itemCount,
    saveScrollState,
    scrollKey,
    scrollToIndex,
    scrollToOffset,
  ])

  return {
    onScroll: (event: UIEvent<HTMLElement>) => {
      if (restoringRef.current) return
      saveScrollState(event.currentTarget)
    },
    onUserScrollIntent: () => stopRestore(),
  }
}
