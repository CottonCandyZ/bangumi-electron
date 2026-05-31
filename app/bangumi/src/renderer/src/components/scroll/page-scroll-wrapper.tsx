import { scrollCache, subjectInitScroll } from '@renderer/state/global-var'
import { mainPanelScrollPositionAtom, scrollViewportAtom } from '@renderer/state/scroll'
import { UI_CONFIG } from '@renderer/config'
import { cn } from '@renderer/lib/utils'
import { ScrollArea } from '@base-ui/react/scroll-area'
import { useSetAtom } from 'jotai'
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useLocation } from 'react-router-dom'

const SCROLL_RESTORE_TOLERANCE = 2
const SCROLL_RESTORE_TIMEOUT = 1600
const PAGE_SCROLL_CACHE_DISABLED_PATHS = [/^\/episode\//]
const SUBJECT_DETAIL_PATH_PATTERN = /^\/subject\/[^/]+\/?$/

type ScrollRestoreReadyContextValue = {
  register: (id: symbol, ready: boolean) => void
  unregister: (id: symbol) => void
}

const ScrollRestoreReadyContext = createContext<ScrollRestoreReadyContextValue | null>(null)

export function usePageScrollRestoreReady(ready: boolean) {
  const context = useContext(ScrollRestoreReadyContext)
  const idRef = useRef<symbol | null>(null)

  if (idRef.current === null) {
    idRef.current = Symbol('page-scroll-restore-ready')
  }

  useLayoutEffect(() => {
    const id = idRef.current
    if (!context || !id) return

    context.register(id, ready)

    return () => {
      context.unregister(id)
    }
  }, [context, ready])
}

export function PageScrollWrapper({
  initScrollTo = 0,
  className,
  children,
}: PropsWithChildren<{
  initScrollTo?: number
  className?: string
}>) {
  const { pathname, search } = useLocation()
  const scrollKey = `${pathname}${search}`
  const viewportRef = useRef<HTMLDivElement>(null)
  const scrollKeyRef = useRef(scrollKey)
  const lastScrollTopRef = useRef(0)
  const restoringRef = useRef(false)
  const restoreFrameRef = useRef<number | null>(null)
  const [readyEntries, setReadyEntries] = useState<Map<symbol, boolean>>(() => new Map())
  const [allowNoReadyEntries, setAllowNoReadyEntries] = useState(false)
  const setViewport = useSetAtom(scrollViewportAtom)
  const setScrollPosition = useSetAtom(mainPanelScrollPositionAtom)
  const restoreReady =
    readyEntries.size > 0 ? Array.from(readyEntries.values()).every(Boolean) : allowNoReadyEntries
  const pageScrollCacheEnabled = !PAGE_SCROLL_CACHE_DISABLED_PATHS.some((pattern) =>
    pattern.test(pathname),
  )

  const restoreReadyContextValue = useMemo<ScrollRestoreReadyContextValue>(
    () => ({
      register: (id, ready) => {
        setReadyEntries((entries) => {
          const current = entries.get(id)
          if (current === ready) return entries

          const next = new Map(entries)
          next.set(id, ready)
          return next
        })
      },
      unregister: (id) => {
        setReadyEntries((entries) => {
          if (!entries.has(id)) return entries

          const next = new Map(entries)
          next.delete(id)
          return next
        })
      },
    }),
    [],
  )

  useEffect(() => {
    setViewport(viewportRef.current)
    return () => setViewport(null)
  }, [setViewport])

  const getInitialRouteScrollTop = useCallback(
    (pathname: string, viewport: HTMLElement) => {
      if (!SUBJECT_DETAIL_PATH_PATTERN.test(pathname)) return initScrollTo

      const viewportInitialScroll = viewport.clientHeight * UI_CONFIG.SUBJECT_INIT_SCROLL_PERCENT
      return viewportInitialScroll > 0 ? viewportInitialScroll : subjectInitScroll.x
    },
    [initScrollTo],
  )

  const getInitialScrollTop = useCallback(
    (pathname: string, scrollKey: string, viewport: HTMLElement) =>
      (pageScrollCacheEnabled ? (scrollCache.get(scrollKey) ?? scrollCache.get(pathname)) : 0) ??
      getInitialRouteScrollTop(pathname, viewport),
    [getInitialRouteScrollTop, pageScrollCacheEnabled],
  )

  useLayoutEffect(() => {
    setAllowNoReadyEntries(false)

    const frame = requestAnimationFrame(() => {
      setAllowNoReadyEntries(true)
    })

    return () => cancelAnimationFrame(frame)
  }, [scrollKey])

  const updateViewportState = useCallback(
    (scrollTop: number, shouldCache = true) => {
      lastScrollTopRef.current = scrollTop
      if (shouldCache && pageScrollCacheEnabled) scrollCache.set(scrollKeyRef.current, scrollTop)
      setScrollPosition(scrollTop)
    },
    [pageScrollCacheEnabled, setScrollPosition],
  )

  useLayoutEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    if (pageScrollCacheEnabled && scrollKeyRef.current !== scrollKey && !restoringRef.current) {
      scrollCache.set(scrollKeyRef.current, lastScrollTopRef.current)
    }
    scrollKeyRef.current = scrollKey

    const initialScrollTop = getInitialScrollTop(pathname, scrollKey, viewport)
    const startedAt = performance.now()
    let cancelled = false

    const restoreScrollPosition = () => {
      if (cancelled) return

      const maxScrollTop = Math.max(0, viewport.scrollHeight - viewport.clientHeight)
      const nextScrollTop = Math.min(initialScrollTop, maxScrollTop)

      viewport.scrollTo({ top: nextScrollTop, left: 0 })
      updateViewportState(viewport.scrollTop, false)

      const targetCanFit = initialScrollTop <= maxScrollTop + SCROLL_RESTORE_TOLERANCE
      const timedOut = performance.now() - startedAt >= SCROLL_RESTORE_TIMEOUT
      if (initialScrollTop === 0 || (restoreReady && targetCanFit) || timedOut) {
        restoringRef.current = false
        restoreFrameRef.current = null
        updateViewportState(viewport.scrollTop)
        return
      }

      restoreFrameRef.current = requestAnimationFrame(restoreScrollPosition)
    }

    restoringRef.current = initialScrollTop > 0
    restoreScrollPosition()

    return () => {
      const wasRestoring = restoringRef.current
      cancelled = true
      if (restoreFrameRef.current !== null) {
        cancelAnimationFrame(restoreFrameRef.current)
        restoreFrameRef.current = null
      }
      restoringRef.current = false
      if (!wasRestoring && pageScrollCacheEnabled) {
        scrollCache.set(scrollKey, lastScrollTopRef.current)
      }
    }
  }, [
    getInitialScrollTop,
    pageScrollCacheEnabled,
    pathname,
    restoreReady,
    scrollKey,
    updateViewportState,
  ])

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    const cancelRestore = () => {
      if (!restoringRef.current) return
      restoringRef.current = false
      if (restoreFrameRef.current !== null) {
        cancelAnimationFrame(restoreFrameRef.current)
        restoreFrameRef.current = null
      }
      updateViewportState(viewport.scrollTop)
    }
    const syncViewportState = () => {
      updateViewportState(viewport.scrollTop, !restoringRef.current)
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
    viewport.addEventListener('scroll', syncViewportState, { passive: true })
    viewport.addEventListener('wheel', wheelListener, { passive: false })
    viewport.addEventListener('pointerdown', cancelRestore)
    viewport.addEventListener('touchstart', cancelRestore, { passive: true })
    viewport.addEventListener('keydown', cancelRestore)
    return () => {
      viewport.removeEventListener('scroll', syncViewportState)
      viewport.removeEventListener('wheel', wheelListener)
      viewport.removeEventListener('pointerdown', cancelRestore)
      viewport.removeEventListener('touchstart', cancelRestore)
      viewport.removeEventListener('keydown', cancelRestore)
    }
  }, [updateViewportState])

  return (
    <ScrollArea.Root
      className={cn('group/scroll relative h-full w-full overflow-hidden', className)}
    >
      <ScrollArea.Viewport
        ref={viewportRef}
        className="h-full w-full overflow-x-hidden focus-visible:outline-hidden"
      >
        <ScrollArea.Content className="h-full min-h-full w-full">
          <ScrollRestoreReadyContext.Provider value={restoreReadyContextValue}>
            {children}
          </ScrollRestoreReadyContext.Provider>
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
