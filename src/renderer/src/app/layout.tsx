import PageScrollWrapper from '@renderer/components/base/page-scroll-wrapper'
import Header from '@renderer/components/header'
import NavBar from '@renderer/components/nav'
import { Outlet } from 'react-router-dom'

function RootLayout() {
  return (
    <>
      <Header />
      <div className="fixed top-16 z-10 h-full bg-card py-1" style={{ viewTransitionName: 'nav' }}>
        <NavBar />
      </div>
      <div className="flex *:h-[calc(100dvh-64px)]">
        <PageScrollWrapper className="ml-[72px] mt-16 min-h-full w-full rounded-tl-lg border-l border-t">
          <div>
            <Outlet />
          </div>
        </PageScrollWrapper>
      </div>
    </>
  )
}

export { RootLayout as Component }
