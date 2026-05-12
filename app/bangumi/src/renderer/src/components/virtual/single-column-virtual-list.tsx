import { ScrollArea } from '@base-ui/react/scroll-area'
import { BackToTopButton } from '@renderer/components/button/back-to-top'
import { cn } from '@renderer/lib/utils'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, Key, ReactNode } from 'react'
import { Virtualizer } from 'virtua'
import type { CacheSnapshot, VirtualizerHandle } from 'virtua'

type SingleColumnVirtualListProps<T> = {
  items: T[]
  getKey: (item: T, index: number) => Key
  renderItem: (item: T, index: number) => ReactNode
  activeIndex?: number
  appendPlaceholderCount?: number
  className?: string
  empty?: ReactNode
  estimateSize?: number
  gap?: number
  hasMore?: boolean
  isFetchingMore?: boolean
  loadMoreRowThreshold?: number
  onNearBottom?: () => Promise<unknown> | void
  overscan?: number
  renderPlaceholder?: (index: number) => ReactNode
  rootClassName?: string
  scrollAreaKey?: string
  showBackToTop?: boolean
}

type VirtualListRow<T> =
  | {
      index: number
      item: T
      key: Key
      type: 'item'
    }
  | {
      index: number
      key: Key
      type: 'placeholder'
    }

type VirtualScrollEntry = {
  cache: CacheSnapshot
  itemCount: number
  scrollOffset: number
}

const virtualScrollCache = new Map<string, VirtualScrollEntry>()

export function SingleColumnVirtualList<T>({
  items,
  getKey,
  renderItem,
  activeIndex,
  appendPlaceholderCount = 4,
  className,
  empty,
  estimateSize = 84,
  gap = 4,
  hasMore = false,
  isFetchingMore = false,
  loadMoreRowThreshold = 1,
  onNearBottom,
  overscan = 6,
  renderPlaceholder,
  rootClassName,
  scrollAreaKey,
  showBackToTop = false,
}: SingleColumnVirtualListProps<T>) {
  const viewportRef = useRef<HTMLElement | null>(null)
  const virtualizerRef = useRef<VirtualizerHandle>(null)
  const loadingMoreRef = useRef(false)
  const restoredKeyRef = useRef<string | undefined>(undefined)
  const [viewport, setViewport] = useState<HTMLElement | null>(null)
  const rows = useMemo<VirtualListRow<T>[]>(
    () => [
      ...items.map((item, index) => ({
        index,
        item,
        key: getKey(item, index),
        type: 'item' as const,
      })),
      ...(isFetchingMore
        ? Array.from({ length: appendPlaceholderCount }, (_, placeholderIndex) => {
            const index = items.length + placeholderIndex
            return {
              index,
              key: `placeholder-${index}`,
              type: 'placeholder' as const,
            }
          })
        : []),
    ],
    [appendPlaceholderCount, getKey, isFetchingMore, items],
  )
  const cachedEntry = scrollAreaKey ? virtualScrollCache.get(scrollAreaKey) : undefined
  const restoredCache =
    cachedEntry && cachedEntry.itemCount === rows.length ? cachedEntry.cache : undefined
  const activeItemKey =
    activeIndex !== undefined && activeIndex >= 0 && activeIndex < items.length
      ? rows[activeIndex]?.key
      : undefined

  const saveScrollState = useCallback(() => {
    if (!scrollAreaKey || !virtualizerRef.current) return

    virtualScrollCache.set(scrollAreaKey, {
      cache: virtualizerRef.current.cache,
      itemCount: rows.length,
      scrollOffset: virtualizerRef.current.scrollOffset,
    })
  }, [rows.length, scrollAreaKey])

  const requestMore = useCallback(() => {
    if (!hasMore || isFetchingMore || loadingMoreRef.current || !onNearBottom) return

    loadingMoreRef.current = true
    Promise.resolve(onNearBottom()).finally(() => {
      loadingMoreRef.current = false
    })
  }, [hasMore, isFetchingMore, onNearBottom])

  const isNearBottom = useCallback(() => {
    const virtualizer = virtualizerRef.current
    if (virtualizer) {
      return (
        virtualizer.scrollOffset + virtualizer.viewportSize >=
        virtualizer.scrollSize - estimateSize * loadMoreRowThreshold
      )
    }

    const viewport = viewportRef.current
    if (!viewport) return false

    return (
      viewport.scrollTop + viewport.clientHeight >=
      viewport.scrollHeight - estimateSize * loadMoreRowThreshold
    )
  }, [estimateSize, loadMoreRowThreshold])

  const handleScroll = useCallback(() => {
    saveScrollState()
    if (rows.length === 0 || !isNearBottom()) return
    requestMore()
  }, [isNearBottom, requestMore, rows.length, saveScrollState])

  useEffect(() => {
    if (activeIndex === undefined || activeIndex < 0 || activeIndex >= items.length) return
    virtualizerRef.current?.scrollToIndex(activeIndex, { align: 'center' })
  }, [activeIndex, activeItemKey])

  useEffect(() => {
    restoredKeyRef.current = undefined
  }, [scrollAreaKey])

  useEffect(() => {
    if (!scrollAreaKey || !cachedEntry || !virtualizerRef.current) return
    if (restoredKeyRef.current === scrollAreaKey) return

    restoredKeyRef.current = scrollAreaKey

    const frame = requestAnimationFrame(() => {
      virtualizerRef.current?.scrollTo(cachedEntry.scrollOffset)
      saveScrollState()
    })

    return () => cancelAnimationFrame(frame)
  }, [cachedEntry, saveScrollState, scrollAreaKey])

  useEffect(() => {
    if (rows.length === 0 || !isNearBottom()) return
    requestMore()
  }, [isNearBottom, requestMore, rows.length])

  useEffect(() => saveScrollState, [saveScrollState])

  if (items.length === 0 && empty) return empty

  return (
    <ScrollArea.Root
      className={cn('group/scroll relative min-h-0 w-full overflow-hidden', rootClassName)}
      key={scrollAreaKey}
    >
      <ScrollArea.Viewport
        className={cn('h-full w-full overflow-x-hidden focus-visible:outline-hidden', className)}
        onScroll={saveScrollState}
        ref={(node) => {
          viewportRef.current = node
          setViewport((prev) => (prev === node ? prev : node))
        }}
      >
        <ScrollArea.Content className="relative w-full">
          <Virtualizer
            cache={restoredCache}
            data={rows}
            item={VirtualListItem}
            itemSize={estimateSize}
            onScroll={handleScroll}
            onScrollEnd={saveScrollState}
            ref={virtualizerRef}
            scrollRef={viewportRef}
            bufferSize={overscan * estimateSize}
          >
            {(row) => (
              <div style={{ paddingBottom: gap > 0 ? `${gap}px` : undefined }}>
                {row.type === 'item'
                  ? renderItem(row.item, row.index)
                  : renderPlaceholder?.(row.index)}
              </div>
            )}
          </Virtualizer>
        </ScrollArea.Content>
      </ScrollArea.Viewport>
      {showBackToTop && (
        <BackToTopButton className="absolute right-4 bottom-4" viewport={viewport} />
      )}
      <ScrollArea.Scrollbar
        orientation="vertical"
        className="absolute top-0 right-0 z-20 flex h-full w-2.5 touch-none p-0.5 opacity-0 transition-opacity duration-150 select-none group-hover/scroll:opacity-100"
      >
        <ScrollArea.Thumb className="bg-foreground/10 hover:bg-foreground/30 active:bg-foreground/40 relative [height:var(--scroll-area-thumb-height)] w-full flex-1 rounded-full" />
      </ScrollArea.Scrollbar>
    </ScrollArea.Root>
  )
}

function VirtualListItem({
  children,
  index,
  ref,
  style,
}: {
  children: ReactNode
  index: number
  ref?: React.Ref<HTMLDivElement>
  style: CSSProperties
}) {
  return (
    <div className="w-full" data-index={index} ref={ref} style={style}>
      {children}
    </div>
  )
}
