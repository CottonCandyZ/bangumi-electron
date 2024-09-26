import { scrollCache, subjectInitScroll } from '@renderer/state/global-var'
import { mainPanelScrollPositionAtom, scrollInstanceAtom } from '@renderer/state/scroll'
import { useAtom, useSetAtom } from 'jotai'
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react'
import { PropsWithChildren, useEffect } from 'react'
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
  const [instance, setInstance] = useAtom(scrollInstanceAtom)
  const setScrollPosition = useSetAtom(mainPanelScrollPositionAtom)

  useEffect(() => {
    const scrollListener = () => {
      if (instance) {
        scrollCache.set(pathname, instance.elements().viewport.scrollTop)
        setScrollPosition(instance.elements().viewport.scrollTop)
      }
    }
    instance?.elements().viewport.scrollTo({
      top:
        scrollCache.get(pathname) ??
        (pathname.includes('subject') ? subjectInitScroll.x : initScrollTo),
    })
    instance?.on('scroll', scrollListener)
    return () => {
      instance?.off('scroll', scrollListener)
    }
  }, [instance, pathname, initScrollTo, setScrollPosition])

  return (
    <OverlayScrollbarsComponent
      options={{
        overflow: { x: 'hidden' },
        scrollbars: { autoHide: 'scroll', theme: 'os-theme-custom' },
      }}
      className={className}
      events={{
        initialized(instance) {
          setInstance(instance)
        },
      }}
      defer
    >
      {children}
    </OverlayScrollbarsComponent>
  )
}
