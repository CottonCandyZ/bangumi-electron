import { ScrollArea } from '@base-ui/react/scroll-area'
import { BackToTopButton } from '@renderer/components/button/back-to-top'
import { cn } from '@renderer/lib/utils'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Key, ReactNode } from 'react'

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
  onNearBottom?: () => Promise<unknown> | void
  overscan?: number
  renderPlaceholder?: (index: number) => ReactNode
  rootClassName?: string
  scrollAreaKey?: string
  showBackToTop?: boolean
}

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
  onNearBottom,
  overscan = 6,
  renderPlaceholder,
  rootClassName,
  scrollAreaKey,
  showBackToTop = false,
}: SingleColumnVirtualListProps<T>) {
  const viewportRef = useRef<HTMLElement | null>(null)
  const loadingMoreRef = useRef(false)
  const [viewport, setViewport] = useState<HTMLElement | null>(null)
  const itemCount = items.length + (isFetchingMore ? appendPlaceholderCount : 0)
  const virtualizer = useVirtualizer({
    count: itemCount,
    getScrollElement: () => viewportRef.current,
    estimateSize: () => estimateSize,
    overscan,
    gap,
  })
  const virtualItems = virtualizer.getVirtualItems()
  const lastVirtualIndex = virtualItems.at(-1)?.index
  const requestMore = useCallback(() => {
    if (!hasMore || isFetchingMore || loadingMoreRef.current || !onNearBottom) return

    loadingMoreRef.current = true
    Promise.resolve(onNearBottom()).finally(() => {
      loadingMoreRef.current = false
    })
  }, [hasMore, isFetchingMore, onNearBottom])

  useEffect(() => {
    if (lastVirtualIndex === undefined || items.length === 0) return
    if (lastVirtualIndex >= items.length - 1) requestMore()
  }, [items.length, lastVirtualIndex, requestMore])

  useEffect(() => {
    if (!viewport) return
    if (activeIndex === undefined || activeIndex < 0 || activeIndex >= items.length) return
    virtualizer.scrollToIndex(activeIndex, { align: 'center' })
  }, [activeIndex, items.length, viewport, virtualizer])

  if (items.length === 0 && empty) return empty

  return (
    <ScrollArea.Root
      className={cn('group/scroll relative min-h-0 w-full overflow-hidden', rootClassName)}
      key={scrollAreaKey}
    >
      <ScrollArea.Viewport
        className={cn('h-full w-full overflow-x-hidden focus-visible:outline-hidden', className)}
        ref={(node) => {
          viewportRef.current = node
          setViewport((prev) => (prev === node ? prev : node))
        }}
      >
        <ScrollArea.Content
          className="relative w-full"
          style={{ height: `${virtualizer.getTotalSize()}px` }}
        >
          {virtualItems.map((virtualItem) => {
            const item = items[virtualItem.index]

            return (
              <div
                className="absolute top-0 right-0 left-0"
                data-index={virtualItem.index}
                key={item ? getKey(item, virtualItem.index) : `placeholder-${virtualItem.index}`}
                ref={virtualizer.measureElement}
                style={{ transform: `translateY(${virtualItem.start}px)` }}
              >
                {item
                  ? renderItem(item, virtualItem.index)
                  : renderPlaceholder?.(virtualItem.index)}
              </div>
            )
          })}
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
