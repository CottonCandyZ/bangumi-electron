import { Outlet, useNavigate } from 'react-router-dom'
import { Header } from '@renderer/modules/header'
import { LeftResizablePanel } from '@renderer/modules/panel/left-panel'
import { NavBar } from '@renderer/modules/nav'
import { MainContainer } from '@renderer/modules/main'
import { BackCover } from '@renderer/components/hover-pop-card/close'
import { useEffect } from 'react'
import { handlers } from '@renderer/lib/client'

function RootLayout() {
  const navigate = useNavigate()

  useEffect(() => {
    const unlisten = handlers.navigateTo.listen(({ path }) => {
      navigate(path)
    })
    return unlisten
  }, [navigate])

  return (
    <>
      <NavBar />
      <div className="ml-16 flex h-dvh flex-row">
        <LeftResizablePanel />
        <div className="flex h-full w-full flex-col">
          <Header />
          <MainContainer>
            <Outlet />
          </MainContainer>
        </div>
      </div>
      <BackCover />
    </>
  )
}

export { RootLayout as Component }
