import MainErrorElement from '@renderer/error/main-error-element'
import { UI_CONFIG } from '@renderer/config'
import { cn } from '@renderer/lib/utils'
import { BackCover } from '@renderer/components/hover-pop-card/close'
import { WindowsButton } from '@renderer/modules/header/windows-button'
import { NavBar } from '@renderer/modules/nav'

export default function AppShellErrorElement() {
  return (
    <>
      <NavBar />
      <div className="ml-16 flex h-dvh flex-row">
        <div className="flex h-full w-full flex-col">
          <header
            className={cn(
              'bg-background drag-region relative z-10 flex shrink-0 flex-row items-center justify-end border-b pl-2',
            )}
            style={{
              height: UI_CONFIG.HEADER_HEIGHT,
              viewTransitionName: 'app-header',
            }}
          >
            <WindowsButton />
          </header>
          <main className="min-h-0 flex-1 overflow-hidden">
            <MainErrorElement />
          </main>
        </div>
      </div>
      <BackCover />
    </>
  )
}
