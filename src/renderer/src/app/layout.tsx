import Header from '@renderer/components/header'
import { BackCover } from '@renderer/components/hoverCard/close'
import NavBar from '@renderer/components/nav'
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react'
import { Outlet } from 'react-router-dom'

function RootLayout() {
  return (
    <>
      <Header />
      <div className="flex flex-row *:h-[calc(100dvh-48px)]">
        <div className="h-full py-1">
          <NavBar />
        </div>
        <OverlayScrollbarsComponent
          className="h-full w-full rounded-tl-lg border-l border-t pb-8 pt-2"
          element="main"
          options={{ overflow: { x: 'hidden' }, scrollbars: { autoHide: 'scroll'} }}
        >
          <Outlet />
          <BackCover />
        </OverlayScrollbarsComponent>
      </div>
    </>
  )
}

export { RootLayout as Component }
