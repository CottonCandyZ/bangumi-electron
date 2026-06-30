import { useNavigate } from 'react-router-dom'
import { Header } from '@renderer/modules/header'
import { LeftResizablePanel } from '@renderer/modules/panel/left-panel'
import { NavBar } from '@renderer/modules/nav'
import { MainContainer } from '@renderer/modules/main'
import { BackCover } from '@renderer/components/hover-pop-card/close'
import { useEffect } from 'react'
import { handlers } from '@renderer/lib/client'
import { MainOutlet } from './main-outlet'
import { UI_CONFIG } from '@renderer/config'

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
      <div className="flex h-dvh flex-row" style={{ marginLeft: UI_CONFIG.NAV_WIDTH }}>
        <LeftResizablePanel />
        <div className="flex h-full w-full flex-col">
          <Header />
          <MainContainer>
            <MainOutlet />
          </MainContainer>
        </div>
      </div>
      <BackCover />
    </>
  )
}

export { RootLayout as Component }
