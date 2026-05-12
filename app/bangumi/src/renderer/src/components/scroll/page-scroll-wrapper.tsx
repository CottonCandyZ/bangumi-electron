import { scrollCache, subjectInitScroll } from '@renderer/state/global-var'
import { mainPanelScrollPositionAtom, scrollViewportAtom } from '@renderer/state/scroll'
import { cn } from '@renderer/lib/utils'
import { ScrollArea } from '@base-ui/react/scroll-area'
import { useSetAtom } from 'jotai'
import { PropsWithChildren, useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useLocation } from 'react-router-dom'

const SCROLL_RESTORE_TOLERANCE = 2

export function PageScrollWrapper({
  initScrollTo = 0,
  className,
  children,
}: PropsWithChildren<{
  initScrollTo?: number
  className?: string
}>) {
  const { pathname } = useLocation()
  const viewportRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const setViewport = useSetAtom(scrollViewportAtom)
  const setScrollPosition = useSetAtom(mainPanelScrollPositionAtom)

  useEffect(() => {
    setViewport(viewportRef.current)
    return () => setViewport(null)
  }, [setViewport])

  const initialScrollTop = useMemo(() => {
    return (
      scrollCache.get(pathname) ??
      (pathname.includes('subject') ? subjectInitScroll.x : initScrollTo)
    )
  }, [pathname, initScrollTo])

  const updateViewportState = useCallback(
    (pathname: string, scrollTop: number, shouldCache: boolean) => {
      if (shouldCache) scrollCache.set(pathname, scrollTop)
      setScrollPosition(scrollTop)
    },
    [setScrollPosition],
  )

  useLayoutEffect(() => {
    const viewport = viewportRef.current
    const content = contentRef.current
    if (!viewport) return

    let isRestoring = initialScrollTop > 0
    const getMaxScrollTop = () => Math.max(0, viewport.scrollHeight - viewport.clientHeight)
    const canRestoreTarget = () => initialScrollTop <= getMaxScrollTop() + SCROLL_RESTORE_TOLERANCE

    const syncViewportState = () => {
      updateViewportState(pathname, viewport.scrollTop, !isRestoring)
    }
    const restoreScrollPosition = (force = false) => {
      if (!force && !isRestoring) return

      const nextScrollTop = Math.min(initialScrollTop, getMaxScrollTop())

      viewport.scrollTo({ top: nextScrollTop, left: 0 })

      if (initialScrollTop === 0 || canRestoreTarget()) {
        isRestoring = false
        updateViewportState(pathname, viewport.scrollTop, true)
        return
      }

      updateViewportState(pathname, viewport.scrollTop, false)
    }
    const cancelRestore = () => {
      if (!isRestoring) return
      isRestoring = false
      updateViewportState(pathname, viewport.scrollTop, true)
    }
    const wheelListener = (event: WheelEvent) => {
      // Prevent horizontal trackpad scrolling from affecting the page viewport.
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY) && Math.abs(event.deltaX) > 0.5) {
        event.preventDefault()
        return
      }

      if (Math.abs(event.deltaY) > 0.5) {
        cancelRestore()
      }
    }
    const pointerDownListener = () => {
      cancelRestore()
    }
    const resizeObserver = new ResizeObserver(() => restoreScrollPosition())
    const mutationObserver = new MutationObserver(() => restoreScrollPosition())

    restoreScrollPosition(true)
    if (content) {
      resizeObserver.observe(content)
      mutationObserver.observe(content, { childList: true, subtree: true })
    }
    viewport.addEventListener('scroll', syncViewportState, { passive: true })
    viewport.addEventListener('wheel', wheelListener, { passive: false })
    viewport.addEventListener('pointerdown', pointerDownListener)
    return () => {
      scrollCache.set(pathname, viewport.scrollTop)
      resizeObserver.disconnect()
      mutationObserver.disconnect()
      viewport.removeEventListener('scroll', syncViewportState)
      viewport.removeEventListener('wheel', wheelListener)
      viewport.removeEventListener('pointerdown', pointerDownListener)
    }
  }, [pathname, initialScrollTop, updateViewportState])

  return (
    <ScrollArea.Root
      className={cn('group/scroll relative h-full w-full overflow-hidden', className)}
    >
      <ScrollArea.Viewport
        ref={viewportRef}
        className="h-full w-full overflow-x-hidden focus-visible:outline-hidden"
      >
        <ScrollArea.Content ref={contentRef} className="h-full min-h-full w-full">
          {children}
        </ScrollArea.Content>
      </ScrollArea.Viewport>

      <ScrollArea.Scrollbar
        orientation="vertical"
        className="absolute top-0 right-0 z-20 flex h-full w-2.5 touch-none p-0.5 opacity-0 transition-opacity duration-150 select-none group-hover/scroll:opacity-100"
      >
        <ScrollArea.Thumb
          className={cn(
            'bg-foreground/10 hover:bg-foreground/30 active:bg-foreground/40 relative flex-1 rounded-full',
            '[height:var(--scroll-area-thumb-height)] w-full',
          )}
        />
      </ScrollArea.Scrollbar>
    </ScrollArea.Root>
  )
}
