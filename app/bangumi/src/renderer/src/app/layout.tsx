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
import { WindowFrame } from '@renderer/modules/header/window-frame'
import { store } from '@renderer/state/utils'
import { openReplyComposerAtomAction } from '@renderer/state/panel'
import { queryClient } from '@renderer/modules/wrapper/query'
import { getReplyInvalidationKeys } from '@renderer/data/hooks/api/reply'

function RootLayout() {
  const navigate = useNavigate()

  useEffect(() => {
    const undock = handlers.dockReplyComposer.listen((content) =>
      store.set(openReplyComposerAtomAction, content),
    )
    const unsubmit = handlers.replySubmitted.listen((target) => {
      for (const queryKey of getReplyInvalidationKeys(target))
        void queryClient.invalidateQueries({ queryKey })
    })
    return () => {
      undock()
      unsubmit()
    }
  }, [])

  useEffect(() => {
    const unlisten = handlers.navigateTo.listen(({ path }) => {
      navigate(path)
    })
    return unlisten
  }, [navigate])

  return (
    <WindowFrame>
      <NavBar />
      <div
        className="app-client-area flex min-w-0 flex-row"
        style={{ marginLeft: UI_CONFIG.NAV_WIDTH }}
      >
        <LeftResizablePanel />
        <div className="flex h-full min-w-0 flex-1 flex-col">
          <Header />
          <MainContainer>
            <MainOutlet />
          </MainContainer>
        </div>
        <BackCover />
      </div>
    </WindowFrame>
  )
}

export { RootLayout as Component }
