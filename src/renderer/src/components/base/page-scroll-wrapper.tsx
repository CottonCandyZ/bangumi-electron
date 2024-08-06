import { UI_CONFIG } from '@renderer/config'
import { scrollCache } from '@renderer/state/global-var'
import { mainPanelScrollPositionAtom } from '@renderer/state/scroll'
import { useSetAtom } from 'jotai'
import { OverlayScrollbars } from 'overlayscrollbars'

import { OverlayScrollbarsComponent } from 'overlayscrollbars-react'
import { PropsWithChildren, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

export default function PageScrollWrapper({
  initScrollTo = 0,
  className,
  children,
}: PropsWithChildren<{
  initScrollTo?: number
  className?: string
}>) {
  const { pathname } = useLocation()
  const [instance, setInstance] = useState<OverlayScrollbars | null>(null)
  const setScrollPosition = useSetAtom(mainPanelScrollPositionAtom)
  if (pathname.includes('subject'))
    setScrollPosition(
      scrollCache.get(pathname) ??
        (pathname.includes('subject') ? UI_CONFIG.SUBJECT_INIT_SCROLL : initScrollTo),
    )

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
        (pathname.includes('subject') ? UI_CONFIG.SUBJECT_INIT_SCROLL : initScrollTo),
    })
    instance?.on('scroll', scrollListener)
    return () => {
      instance?.off('scroll', scrollListener)
    }
  }, [instance, pathname])

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
