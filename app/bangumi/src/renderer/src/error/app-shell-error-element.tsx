import MainErrorElement from '@renderer/error/main-error-element'
import { UI_CONFIG } from '@renderer/config'
import { BackCover } from '@renderer/components/hover-pop-card/close'
import { NavMenuButton } from '@renderer/modules/nav/menu-button'
import { client } from '@renderer/lib/client'
import { NavBar } from '@renderer/modules/nav'
import { WindowFrame } from '@renderer/modules/header/window-frame'

const platform = await client.platform({})

export default function AppShellErrorElement() {
  return (
    <WindowFrame>
      <div className="app-client-area flex min-w-0 flex-col">
        <header
          className="bg-background drag-region relative z-10 flex shrink-0 items-center border-b"
          style={{
            height: UI_CONFIG.HEADER_HEIGHT,
            paddingLeft: platform === 'darwin' ? 88 : 8,
            viewTransitionName: 'app-header',
          }}
        >
          <NavMenuButton />
        </header>
        <NavBar />
        <main
          className="min-h-0 flex-1 overflow-hidden"
          style={{ marginLeft: UI_CONFIG.NAV_WIDTH }}
        >
          <MainErrorElement />
        </main>
        <BackCover />
      </div>
    </WindowFrame>
  )
}
