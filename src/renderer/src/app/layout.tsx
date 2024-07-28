import PageScrollWrapper from '@renderer/components/base/page-scroll-wrapper'
import ScrollWrapper from '@renderer/components/base/scroll-warpper'
import CollectionsGrid from '@renderer/components/collections/grid'
import Header from '@renderer/components/header'
import { BackCover } from '@renderer/components/hover-card/close'
import NavBar, { useOpenCollection } from '@renderer/components/nav'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@renderer/components/ui/resizable'
import { useIsLoginQuery } from '@renderer/data/hooks/session'
import { cn } from '@renderer/lib/utils'
import { Outlet } from 'react-router-dom'

// 对于 windows 暂时先用 overlay scroll bar，等后面 fluent 稳定了就可以上 Windows fluent scroll bar https://source.chromium.org/chromium/chromium/src/+/main:ui/native_theme/native_theme_features.cc;l=5?q=native_theme_features&ss=chromium%2Fchromium%2Fsrc
function RootLayout() {
  const isLogin = useIsLoginQuery()
  const sideIsOpen = useOpenCollection((state) => state.isOpen)

  return (
    <div className="flex">
      <div className="flex flex-col border-r bg-background" style={{ viewTransitionName: 'nav' }}>
        <NavBar />
      </div>
      <ResizablePanelGroup direction="horizontal" autoSaveId="main">
        {sideIsOpen && (
          <>
            <ResizablePanel defaultSize={25} minSize={20} order={1} id="side">
              <div className="drag-region h-16 border-b" />
              <ScrollWrapper
                className={cn('h-[calc(100dvh-72px)] shrink-0 overflow-x-hidden bg-background p-1')}
                options={{ scrollbars: { autoHide: 'leave' } }}
              >
                <div>{isLogin && <CollectionsGrid />}</div>
              </ScrollWrapper>
            </ResizablePanel>
            <ResizableHandle />
          </>
        )}
        <ResizablePanel minSize={65} order={2} id="main">
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
