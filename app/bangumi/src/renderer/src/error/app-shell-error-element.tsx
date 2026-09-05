import MainErrorElement from '@renderer/error/main-error-element'
import { UI_CONFIG } from '@renderer/config'
import { cn } from '@renderer/lib/utils'
import { BackCover } from '@renderer/components/hover-pop-card/close'
import { NavBar } from '@renderer/modules/nav'
import { WindowFrame } from '@renderer/modules/header/window-frame'

export default function AppShellErrorElement() {
  return (
    <WindowFrame>
      <NavBar />
      <div className="app-client-area flex flex-row" style={{ marginLeft: UI_CONFIG.NAV_WIDTH }}>
        <div className="flex h-full w-full flex-col">
          <header
            className={cn(
              'bg-background drag-region relative z-10 flex shrink-0 flex-row items-center justify-end border-b pl-2',
            )}
            style={{
              height: UI_CONFIG.HEADER_HEIGHT,
              viewTransitionName: 'app-header',
            }}
          />
          <main className="min-h-0 flex-1 overflow-hidden">
            <MainErrorElement />
          </main>
        </div>
      </div>
      <BackCover />
    </WindowFrame>
  )
}
