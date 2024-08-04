import PageScrollWrapper from '@renderer/components/base/page-scroll-wrapper'
import ScrollWrapper from '@renderer/components/base/scroll-warpper'
import Header from '@renderer/components/header'
import { BackCover } from '@renderer/components/hover-card/close'
import NavBar from '@renderer/components/nav'
import SidePanel from '@renderer/components/panel'
import MainRightPanel from '@renderer/components/panel/main-right-panel'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@renderer/components/ui/resizable'
import { panelSize } from '@renderer/components/wrapper/state-wrapper'
import { cn } from '@renderer/lib/utils'
import { useNavCollapsed, usePanelName, useRightPanelState } from '@renderer/state/panel'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { Outlet } from 'react-router-dom'

// 对于 windows 暂时先用 overlay scroll bar，等后面 fluent 稳定了就可以上 Windows fluent scroll bar https://source.chromium.org/chromium/chromium/src/+/main:ui/native_theme/native_theme_features.cc;l=5?q=native_theme_features&ss=chromium%2Fchromium%2Fsrc
function RootLayout() {
  const currentPanelName = usePanelName((state) => state.panelName)
  const { collapsed: navCollapsed, setCollapsed: setNavCollapsed } = useNavCollapsed(
    (state) => state,
  )
  const rightPanelOpen = useRightPanelState((state) => state.open)
  const leftRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      panelSize.left_width = entries[0].target.getBoundingClientRect().width
    })
    if (leftRef.current) resizeObserver.observe(leftRef.current)
    return () => {
      if (leftRef.current) resizeObserver.unobserve(leftRef.current)
    }
  }, [currentPanelName])
  const rightRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      panelSize.right_width = entries[0].target.getBoundingClientRect().width
    })
    if (rightRef.current) resizeObserver.observe(rightRef.current)
    return () => {
      if (rightRef.current) resizeObserver.unobserve(rightRef.current)
    }
  }, [rightPanelOpen])

  return (
    <>
      <div
        className={cn(
          'fixed z-20 w-16 max-w-16 border-r bg-background transition-[width]',
          !navCollapsed && 'w-60 max-w-none',
        )}
      >
        <NavBar />
      </div>
      <div className="ml-16 flex">
        <ResizablePanelGroup direction="horizontal" autoSaveId="main-panel">
          {currentPanelName && (
            <>
              <ResizablePanel
                defaultSize={25}
                minSize={20}
                maxSize={70}
                order={1}
                id="list"
                className="min-w-64"
              >
                <div ref={leftRef}>
                  <SidePanel currentPanelName={currentPanelName} />
                </div>
              </ResizablePanel>
              <ResizableHandle className="w-0 border-r" />
            </>
          )}
          <ResizablePanel order={2} id="main">
            <Header />
            <ResizablePanelGroup direction="horizontal" autoSaveId="sub-panel">
              <ResizablePanel order={1} id="left">
                <PageScrollWrapper className="h-[calc(100dvh-64px)] w-full overflow-x-hidden">
                  <div>
                    <Outlet />
                  </div>
                </PageScrollWrapper>
              </ResizablePanel>
              {rightPanelOpen && (
                <>
                  <ResizableHandle className="w-0 border-r" />
                  <ResizablePanel order={2} id="right">
                    <div ref={rightRef}>
                      <ScrollWrapper
                        className="h-[calc(100dvh-64px)] w-full overflow-x-hidden"
                        options={{ scrollbars: { autoHide: 'scroll' } }}
                      >
                        <MainRightPanel />
                      </ScrollWrapper>
                    </div>
                  </ResizablePanel>
                </>
              )}
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
        <BackCover />
      </div>
      <AnimatePresence>
        {!navCollapsed && (
          <motion.div
            className="fixed inset-0 z-10 bg-black"
            onClick={() => setNavCollapsed(true)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>
    </>
  )
}

export { RootLayout as Component }
