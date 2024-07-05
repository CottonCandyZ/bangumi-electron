import Header from '@renderer/components/header'
import { BackCover } from '@renderer/components/hoverCard/close'
import NavBar from '@renderer/components/nav'
import { useOverlayScrollbars } from 'overlayscrollbars-react'
import { useEffect, useRef } from 'react'
import { Outlet, useLocation, useNavigationType } from 'react-router-dom'

function RootLayout() {
  const ref = useRef(null)
  const location = useLocation()
  const navType = useNavigationType()
  const scrollStack = useRef<number[]>([])
  const currentScroll = useRef<number | undefined>(0)
  const [initialize, instance] = useOverlayScrollbars({
    options: { overflow: { x: 'hidden' }, scrollbars: { autoHide: 'scroll' } },
  })
  const scrollListener = () => {
    currentScroll.current = instance()?.elements().viewport?.scrollTop
  }

  useEffect(() => {
    if (navType === 'POP') {
      instance()?.elements().viewport?.scrollTo({ top: scrollStack.current.pop() })
      return
    }
    scrollStack.current.push(currentScroll.current!)
  }, [location])

  useEffect(() => {
    initialize(ref.current!)
    instance()?.on('scroll', scrollListener)
    return () => instance()?.off('scroll', scrollListener)
  }, [initialize])

  return (
    <>
      <Header />
      <div className="flex flex-row *:h-[calc(100dvh-64px)]">
        <div className="h-full py-1">
          <NavBar />
        </div>
        <main className="h-full w-full rounded-tl-lg border-l border-t pb-8 pt-2" ref={ref}>
          <div>
            <Outlet />
            <BackCover />
          </div>
        </main>
      </div>
    </>
  )
}

export { RootLayout as Component }
