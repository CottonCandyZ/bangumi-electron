import PageScrollWrapper from '@renderer/components/base/page-scroll-wrapper'
import Header from '@renderer/components/header'
import NavBar from '@renderer/components/nav'
import { Outlet } from 'react-router-dom'

function RootLayout() {
  return (
    <>
      <Header />
      <div className="flex flex-row *:h-[calc(100dvh-64px)]">
        <div className="h-full py-1">
          <NavBar />
        </div>
        <PageScrollWrapper className="min-h-full w-full rounded-tl-lg border-l border-t">
          <div>
            <Outlet />
          </div>
        </PageScrollWrapper>
      </div>
    </>
  )
}

export { RootLayout as Component }
