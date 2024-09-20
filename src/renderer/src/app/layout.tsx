import { PageScrollWrapper } from '@renderer/components/scroll/page-scroll-wrapper'
import { BackCover } from '@renderer/components/hover-pop-card/close'
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
      <div className="ml-16 flex h-dvh flex-row">
        <LeftResizablePanel />
        <div className="flex h-full w-full flex-col">
          <Header />
          <div className="flex h-full w-full flex-row overflow-hidden">
            <PageScrollWrapper className="h-full w-full">
              <div className="h-full">
                <Outlet />
              </div>
            </PageScrollWrapper>
            <RightResizablePanel />
          </div>
        </div>
      </div>
      <BackCover />
    </>
  )
}

export { RootLayout as Component }
