import { UI_CONFIG } from '@renderer/config'
import { client } from '@renderer/lib/client'
import { cn } from '@renderer/lib/utils'
import { CommandButton } from '@renderer/modules/header/command-button'
import { NavButton } from '@renderer/modules/header/nav-button'
import { OriginalLink } from '@renderer/modules/header/o-link'
import { RightPanelButton } from '@renderer/modules/header/right-panel-button'
import { HeaderTitle } from '@renderer/modules/header/subject-title'
import { HeaderUpdateIndicator } from '@renderer/modules/update/menu'
import { NotificationButton } from '@renderer/modules/header/notification-button'

import { NavMenuButton } from '@renderer/modules/nav/menu-button'

const platform = await client.platform({})

export function Header() {
  return (
    <header
      className={cn(
        'bg-background drag-region @container/header relative z-10 flex shrink-0 flex-row items-center justify-between gap-3 border-b pl-2',
        platform === 'darwin' && 'pl-[88px]',
      )}
      style={{
        height: UI_CONFIG.HEADER_HEIGHT,
        viewTransitionName: 'app-header',
      }}
    >
      <div className="flex h-full min-w-0 flex-1 flex-row items-center gap-3 overflow-hidden">
        <div className="flex shrink-0 items-center gap-2">
          <NavMenuButton />
          <NavButton compact />
        </div>
        <HeaderTitle />
      </div>
      <div
        className={cn(
          'flex h-full shrink-0 flex-row items-center gap-1',
          (platform === 'darwin' || platform === 'win32') && 'pr-2',
        )}
      >
        <HeaderUpdateIndicator />
        <NotificationButton />
        <CommandButton />
        <OriginalLink />
        <RightPanelButton />
      </div>
    </header>
  )
}
