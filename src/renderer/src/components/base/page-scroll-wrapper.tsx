import { SateContext } from '@renderer/components/wrapper/state-wrapper'
import { UI_CONFIG } from '@renderer/config'
import { OverlayScrollbars } from 'overlayscrollbars'

import { OverlayScrollbarsComponent } from 'overlayscrollbars-react'
import { PropsWithChildren, useContext, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { create } from 'zustand'

type ScrollPosition = {
  scrollPosition: number
  setScrollPosition: (ScrollPosition: number) => void
}

export const useScrollPosition = create<ScrollPosition>()((set) => ({
  scrollPosition: 0,
  setScrollPosition: (scrollPosition) => set({ scrollPosition }),
}))

export default function PageScrollWrapper({
  initScrollTo = 0,
  className,
  children,
}: PropsWithChildren<{
  initScrollTo?: number
  className?: string
}>) {
  const stateContext = useContext(SateContext)
  const { pathname } = useLocation()
  const [instance, setInstance] = useState<OverlayScrollbars | null>(null)
  const setScrollPosition = useScrollPosition((state) => state.setScrollPosition)

  if (!stateContext) {
    throw new Error('PageScrollWrapper need in StateWrapper')
  }
  const { scrollCache } = stateContext

  //TODO: 需要优化
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
  })

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
