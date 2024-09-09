import { PageScrollWrapper } from '@renderer/components/scroll/page-scroll-wrapper'
import { BackCover } from '@renderer/components/hover-pop-card/dynamic-size/close'
import { ResizablePanel, ResizablePanelGroup } from '@renderer/components/ui/resizable'
import { Outlet } from 'react-router-dom'
import { Header } from '@renderer/modules/header'
import { LeftResizablePanel } from '@renderer/modules/panel/left-panel'
import { RightResizablePanel } from '@renderer/modules/panel/right-panel'
import { NavBar } from '@renderer/modules/nav'

// 对于 windows 暂时先用 overlay scroll bar，等后面 fluent 稳定了就可以上 Windows fluent scroll bar https://source.chromium.org/chromium/chromium/src/+/main:ui/native_theme/native_theme_features.cc;l=5?q=native_theme_features&ss=chromium%2Fchromium%2Fsrc
function RootLayout() {
  return (
    <>
      <NavBar />
      <div className="ml-16 flex">
        <ResizablePanelGroup direction="horizontal" autoSaveId="main-panel">
          <LeftResizablePanel />
          <ResizablePanel order={2} id="main" className="flex h-dvh flex-col">
            <Header />
            <ResizablePanelGroup direction="horizontal" autoSaveId="sub-panel">
              <ResizablePanel order={1} id="left">
                <PageScrollWrapper className="h-full w-full overflow-hidden">
                  <div className="h-full">
                    <Outlet />
                  </div>
                </PageScrollWrapper>
              </ResizablePanel>
              <RightResizablePanel />
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
        <BackCover />
      </div>
    </>
  )
}

export { RootLayout as Component }
