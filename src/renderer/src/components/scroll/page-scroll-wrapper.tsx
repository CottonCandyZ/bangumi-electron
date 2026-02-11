import { scrollCache, subjectInitScroll } from '@renderer/state/global-var'
import { mainPanelScrollPositionAtom, scrollViewportAtom } from '@renderer/state/scroll'
import { cn } from '@renderer/lib/utils'
import { ScrollArea } from '@base-ui/react/scroll-area'
import { useSetAtom } from 'jotai'
import { PropsWithChildren, useEffect, useMemo, useRef } from 'react'
import { useLocation } from 'react-router-dom'

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

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    const syncViewportState = () => {
      scrollCache.set(pathname, viewport.scrollTop)
      setScrollPosition(viewport.scrollTop)
    }
    const wheelListener = (event: WheelEvent) => {
      // Prevent horizontal trackpad scrolling from affecting the page viewport.
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY) && Math.abs(event.deltaX) > 0.5) {
        event.preventDefault()
      }
    }

    viewport.scrollTo({ top: initialScrollTop, left: 0 })
    syncViewportState()
    viewport.addEventListener('scroll', syncViewportState, { passive: true })
    viewport.addEventListener('wheel', wheelListener, { passive: false })
    return () => {
      viewport.removeEventListener('scroll', syncViewportState)
      viewport.removeEventListener('wheel', wheelListener)
    }
  }, [pathname, initialScrollTop, setScrollPosition])

  return (
    <ScrollArea.Root
      className={cn('group/scroll relative h-full w-full overflow-hidden', className)}
    >
      <ScrollArea.Viewport
        ref={viewportRef}
        className="h-full w-full overflow-x-hidden focus-visible:outline-hidden"
      >
        <ScrollArea.Content className="min-h-full w-full">{children}</ScrollArea.Content>
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
