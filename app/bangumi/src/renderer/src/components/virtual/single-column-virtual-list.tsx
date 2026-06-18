import { BackToTopButton } from '@renderer/components/button/back-to-top'
import { NativeScrollViewport } from '@renderer/components/scroll/native-scroll-viewport'
import { useNativeSmoothVirtualizerScrollToTop } from '@renderer/components/virtual/use-native-smooth-virtualizer-scroll-to-top'
import { useVirtualScrollMemory } from '@renderer/components/virtual/use-virtual-scroll-memory'
import { cn } from '@renderer/lib/utils'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, Key, ReactNode } from 'react'
import { Virtualizer } from 'virtua'
import type { VirtualizerHandle } from 'virtua'

type SingleColumnVirtualListProps<T> = {
  items: T[]
  getKey: (item: T, index: number) => Key
  renderItem: (item: T, index: number) => ReactNode
  activeIndex?: number
  appendPlaceholderCount?: number
  className?: string
  empty?: ReactNode
  estimateSize?: number
  footer?: ReactNode
  gap?: number
  hasMore?: boolean
  isFetchingMore?: boolean
  loadMoreRowThreshold?: number
  onNearBottom?: () => Promise<unknown> | void
  overscan?: number
  renderPlaceholder?: (index: number) => ReactNode
  rootClassName?: string
  scrollMemoryKey?: string
  scrollToTopSignal?: number
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
      key: Key
      type: 'footer'
    }
  | {
      index: number
      key: Key
      type: 'placeholder'
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
  footer,
  gap = 4,
  hasMore = false,
  isFetchingMore = false,
  loadMoreRowThreshold = 1,
  onNearBottom,
  overscan = 6,
  renderPlaceholder,
  rootClassName,
  scrollMemoryKey,
  scrollToTopSignal,
  showBackToTop = false,
}: SingleColumnVirtualListProps<T>) {
  const viewportRef = useRef<HTMLElement | null>(null)
  const virtualizerRef = useRef<VirtualizerHandle>(null)
  const loadingMoreRef = useRef(false)
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
      ...(footer ? [{ key: 'footer', type: 'footer' as const }] : []),
    ],
    [appendPlaceholderCount, footer, getKey, isFetchingMore, items],
  )
  const activeItemKey =
    activeIndex !== undefined && activeIndex >= 0 && activeIndex < items.length
      ? rows[activeIndex]?.key
      : undefined
  const {
    cache: restoredVirtualCache,
    mountKey,
    saveScrollState,
  } = useVirtualScrollMemory({
    canSave: !isFetchingMore,
    itemCount: items.length,
    memoryKey: scrollMemoryKey,
    viewport,
    viewportRef,
    virtualizerRef,
  })

  const scrollToTop = useNativeSmoothVirtualizerScrollToTop({
    saveScrollState,
    viewport,
    virtualizerRef,
  })
  const handledScrollToTopSignalRef = useRef(scrollToTopSignal)

  const requestMore = useCallback(() => {
    if (!hasMore || isFetchingMore || loadingMoreRef.current || !onNearBottom) return

    loadingMoreRef.current = true
    Promise.resolve(onNearBottom()).finally(() => {
      loadingMoreRef.current = false
    })
  }, [hasMore, isFetchingMore, onNearBottom])

  const isNearBottom = useCallback(() => {
    const viewport = viewportRef.current
    if (viewport) {
      return (
        viewport.scrollTop + viewport.clientHeight >=
        viewport.scrollHeight - estimateSize * loadMoreRowThreshold
      )
    }

    const virtualizer = virtualizerRef.current
    if (!virtualizer) return false

    return (
      virtualizer.scrollOffset + virtualizer.viewportSize >=
      virtualizer.scrollSize - estimateSize * loadMoreRowThreshold
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
  }, [activeIndex, activeItemKey, items.length])

  useLayoutEffect(() => {
    const currentViewport = viewportRef.current
    const currentVirtualizer = virtualizerRef.current
    if (!currentViewport || !currentVirtualizer || currentViewport.scrollTop <= 0) return

    currentVirtualizer.scrollTo(currentViewport.scrollTop)
  }, [rows.length, viewport])

  useEffect(() => {
    if (rows.length === 0 || !isNearBottom()) return
    requestMore()
  }, [isNearBottom, requestMore, rows.length])

  useEffect(() => {
    if (scrollToTopSignal === undefined) return
    if (handledScrollToTopSignalRef.current === scrollToTopSignal) return

    handledScrollToTopSignalRef.current = scrollToTopSignal
    scrollToTop()
  }, [scrollToTop, scrollToTopSignal])

  if (items.length === 0 && empty) return empty

  const virtualContent = (
    <div className="relative w-full">
      {viewport && (
        <Virtualizer
          cache={restoredVirtualCache}
          data={rows}
          item={VirtualListItem}
          itemSize={estimateSize}
          key={mountKey}
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
                : row.type === 'footer'
                  ? footer
                  : renderPlaceholder?.(row.index)}
            </div>
          )}
        </Virtualizer>
      )}
    </div>
  )

  const viewportProps = {
    onScroll: (event: React.UIEvent<HTMLDivElement>) => {
      saveScrollState(event.currentTarget.scrollTop)
      handleScroll()
    },
    ref: (node: HTMLDivElement | null) => {
      viewportRef.current = node
      setViewport((prev) => (prev === node ? prev : node))
    },
  }

  return (
    <div
      className={cn('relative min-h-0 w-full overflow-hidden', rootClassName)}
      key={scrollMemoryKey}
    >
      <NativeScrollViewport {...viewportProps} className={className}>
        {virtualContent}
      </NativeScrollViewport>
      {showBackToTop && (
        <BackToTopButton onBackToTop={scrollToTop} position="absolute" viewport={viewport} />
      )}
    </div>
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
