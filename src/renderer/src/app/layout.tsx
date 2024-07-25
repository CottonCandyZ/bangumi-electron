import PageScrollWrapper from '@renderer/components/base/page-scroll-wrapper'
import ScrollWrapper from '@renderer/components/base/scroll-warpper'
import CollectionsGrid from '@renderer/components/collections/grid'
import Header from '@renderer/components/header'
import NavBar, { useOpenCollection } from '@renderer/components/nav'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@renderer/components/ui/resizable'
import { useIsLoginQuery } from '@renderer/data/hooks/session'
import { cn } from '@renderer/lib/utils'
import { Outlet } from 'react-router-dom'

function RootLayout() {
  const isLogin = useIsLoginQuery()
  const sideIsOpen = useOpenCollection((state) => state.isOpen)

  return (
    <div className="flex *:h-[calc(100dvh-64px)]">
      <div className="z-10 bg-background py-1" style={{ viewTransitionName: 'nav' }}>
        <div className="drag-region h-16" />
        <NavBar />
      </div>
      <ResizablePanelGroup direction="horizontal" className="gap-0.5" autoSaveId="main">
        {sideIsOpen && (
          <>
            <ResizablePanel defaultSize={25} minSize={20} order={1} id="side">
              <div className="drag-region h-16" />
              <ScrollWrapper
                className={cn(
                  'h-[calc(100dvh-72px)] shrink-0 overflow-x-hidden rounded-lg border bg-background p-1',
                )}
                options={{ scrollbars: { autoHide: 'scroll' } }}
              >
                <div>{isLogin && <CollectionsGrid />}</div>
              </ScrollWrapper>
            </ResizablePanel>
            <ResizableHandle className="w-0" />
          </>
        )}
        <ResizablePanel minSize={65} order={2} id="main">
          <Header />
          <PageScrollWrapper className="h-[calc(100dvh-64px)] w-full overflow-x-hidden rounded-tl-lg border">
            <div>
              <Outlet />
            </div>
          </PageScrollWrapper>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}

export { RootLayout as Component }
