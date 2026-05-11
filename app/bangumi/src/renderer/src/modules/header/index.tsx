import { UI_CONFIG } from '@renderer/config'
import { client } from '@renderer/lib/client'
import { cn } from '@renderer/lib/utils'
import { CommandButton } from '@renderer/modules/header/command-button'
import { NavButton } from '@renderer/modules/header/nav-button'
import { OriginalLink } from '@renderer/modules/header/o-link'
import { RightPanelButton } from '@renderer/modules/header/right-panel-button'
import { HeaderTitle } from '@renderer/modules/header/subject-title'
import { WindowsButton } from '@renderer/modules/header/windows-button'

const platform = await client.platform({})

export function Header() {
  return (
    <header
      className={cn(
        'bg-background drag-region relative z-10 flex shrink-0 flex-row items-center justify-between gap-10 border-b pl-2',
      )}
      style={{
        height: UI_CONFIG.HEADER_HEIGHT,
        viewTransitionName: 'app-header',
      }}
    >
      <div className="flex h-full flex-row items-center gap-3">
        <NavButton />
        <HeaderTitle />
      </div>
      <div
        className={cn('flex h-full flex-row items-center gap-2', platform === 'darwin' && 'pr-2')}
      >
        <CommandButton />
        <OriginalLink />
        <RightPanelButton />
        <WindowsButton />
      </div>
    </header>
  )
}
