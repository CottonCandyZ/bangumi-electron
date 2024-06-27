import Header from '@renderer/components/header'
import NavBar from '@renderer/components/nav'
import { Outlet } from 'react-router-dom'

function RootLayout() {
  return (
    <>
      <Header />
      <div className="flex flex-row *:h-[calc(100dvh-48px)]">
        <div className="h-full py-1">
          <NavBar />
        </div>
        <main className="h-full w-full overflow-auto rounded-tl-lg border-l border-t pb-2 pt-2">
          <Outlet />
        </main>
      </div>
    </>
  )
}

export { RootLayout as Component }
