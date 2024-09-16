import { cn } from '@renderer/lib/utils'
import { NavButton } from '@renderer/modules/header/nav-button'
import { OriginalLink } from '@renderer/modules/header/o-link'
import { RightPanelButton } from '@renderer/modules/header/right-panel-button'
import { HeaderTitle } from '@renderer/modules/header/subject-title'
import { WindowsButton } from '@renderer/modules/header/windows-button'

export function Header() {
  return (
    <header
      className={cn(
        'drag-region relative z-10 flex h-16 shrink-0 flex-row items-center justify-between gap-10 border-b pl-2',
      )}
    >
      <div className="flex h-full flex-row items-center gap-3">
        <NavButton />
        <HeaderTitle />
      </div>
      <div className="flex h-full flex-row items-center gap-0.5">
        <OriginalLink />
        <RightPanelButton />
        <WindowsButton />
      </div>
    </header>
  )
}
