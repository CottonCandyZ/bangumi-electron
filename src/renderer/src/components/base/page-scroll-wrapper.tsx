import { SateContext } from '@renderer/components/wrapper/state-wrapper'
import { useOverlayScrollbars } from 'overlayscrollbars-react'
import { PropsWithChildren, useContext, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

export default function PageScrollWrapper({
  initScrollTo = 0,
  className,
  children,
}: PropsWithChildren<{
  initScrollTo?: number
  className?: string
}>) {
  const ref = useRef(null)
  const stateContext = useContext(SateContext)
  const { key } = useLocation()

  const [initialize, instance] = useOverlayScrollbars({
    options: {
      overflow: { x: 'hidden' },
      scrollbars: { autoHide: 'scroll', theme: 'os-theme-custom' },
    },
  })
  if (!stateContext) {
    throw new Error('PageScrollWrapper need in StateWrapper')
  }
  const { scrollCache } = stateContext
  const scrollListener = () => {
    scrollCache.set(key, instance()?.elements().viewport?.scrollTop ?? initScrollTo)
  }
  useEffect(() => {
    initialize(ref.current!)
  }, [initialize])
  useEffect(() => {
    instance()
      ?.elements()
      .viewport?.scrollTo({ top: scrollCache.get(key) ?? initScrollTo })
    instance()?.on('scroll', scrollListener)
    return () => instance()?.off('scroll', scrollListener)
  }, [initialize, key])

  return (
    <div className={className} ref={ref}>
      {children}
    </div>
  )
}