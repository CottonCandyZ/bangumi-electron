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
    <div className="flex">
      <ResizablePanelGroup direction="horizontal" autoSaveId="main-panel">
        <ResizablePanel
          minSize={10}
          maxSize={20}
          collapsedSize={10}
          collapsible
          order={1}
          id="nav"
          className={cn(
            navCollapsed && 'min-w-16 max-w-16 transition-all duration-300 ease-in-out',
          )}
          onCollapse={() => {
            setNavCollapsed(true)
          }}
          onResize={() => {
            setNavCollapsed(false)
          }}
        >
          <NavBar />
        </ResizablePanel>

        <ResizableHandle />
        {currentPanelName && (
          <>
            <ResizablePanel defaultSize={25} minSize={15} order={2} id="list" className="min-w-64">
              <SidePanel currentPanelName={currentPanelName} />
            </ResizablePanel>
            <ResizableHandle />
          </>
        )}
        <ResizablePanel minSize={65} order={3} id="main">
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
  )
}

export { RootLayout as Component }
