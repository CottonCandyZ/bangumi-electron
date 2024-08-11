import PageScrollWrapper from '@renderer/components/base/page-scroll-wrapper'
import Header from '@renderer/components/header'
import { BackCover } from '@renderer/components/hover-card/close'
import NavBar from '@renderer/components/nav'
import LeftResizablePanel from '@renderer/components/panel/left-panel'
import RightResizablePanel from '@renderer/components/panel/right-panel'
import { ResizablePanel, ResizablePanelGroup } from '@renderer/components/ui/resizable'
import { Outlet } from 'react-router-dom'

// 对于 windows 暂时先用 overlay scroll bar，等后面 fluent 稳定了就可以上 Windows fluent scroll bar https://source.chromium.org/chromium/chromium/src/+/main:ui/native_theme/native_theme_features.cc;l=5?q=native_theme_features&ss=chromium%2Fchromium%2Fsrc
function RootLayout() {
  return (
    <>
      <NavBar />
      <div className="ml-16 flex">
        <ResizablePanelGroup direction="horizontal" autoSaveId="main-panel">
          <LeftResizablePanel />
          <ResizablePanel order={2} id="main">
            <Header />
            <ResizablePanelGroup direction="horizontal" autoSaveId="sub-panel">
              <ResizablePanel order={1} id="left">
                <PageScrollWrapper className="h-[calc(100dvh-64px)] w-full">
                  <div>
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
