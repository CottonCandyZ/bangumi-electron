import PageScrollWrapper from '@renderer/components/base/page-scroll-wrapper'
import Header from '@renderer/components/header'
import { BackCover } from '@renderer/components/hover-card/close'
import NavBar from '@renderer/components/nav'
import SidePanel from '@renderer/components/panel'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@renderer/components/ui/resizable'
import { cn } from '@renderer/lib/utils'
import { useNavCollapsed, usePanelName } from '@renderer/state/panel'
import { Outlet } from 'react-router-dom'

// 对于 windows 暂时先用 overlay scroll bar，等后面 fluent 稳定了就可以上 Windows fluent scroll bar https://source.chromium.org/chromium/chromium/src/+/main:ui/native_theme/native_theme_features.cc;l=5?q=native_theme_features&ss=chromium%2Fchromium%2Fsrc
function RootLayout() {
  const currentPanelName = usePanelName((state) => state.panelName)
  const { collapsed: navCollapsed, setCollapsed: setNavCollapsed } = useNavCollapsed(
    (state) => state,
  )

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
                order={2}
                id="list"
                className="min-w-64 backdrop-blur-2xl"
              >
                <SidePanel currentPanelName={currentPanelName} />
              </ResizablePanel>
              <ResizableHandle />
            </>
          )}
          <ResizablePanel order={3} id="main">
            <Header />
            <PageScrollWrapper className="h-[calc(100dvh-64px)] w-full overflow-x-hidden">
              <div>
                <Outlet />
              </div>
            </PageScrollWrapper>
          </ResizablePanel>
        </ResizablePanelGroup>
        <BackCover />
      </div>
      {!navCollapsed && (
        <div className="fixed inset-0 z-10" onClick={() => setNavCollapsed(true)}></div>
      )}
    </>
  )
}

export { RootLayout as Component }
