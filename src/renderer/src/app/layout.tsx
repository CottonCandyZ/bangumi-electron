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
        <main className="overflow-auto border-t border-l rounded-tl-lg h-full w-full pt-2 pb-20">
          <Outlet />
        </main>
      </div>
    </>
  )
}

export { RootLayout as Component }
