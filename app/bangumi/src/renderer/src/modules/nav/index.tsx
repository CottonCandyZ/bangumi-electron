import { LinkNav } from '@renderer/modules/nav/link/nav'
import { PanelNav } from '@renderer/modules/nav/panel/nav'
import { NavProfile } from '@renderer/modules/nav/profile'
import { Separator } from '@renderer/components/ui/separator'
import { UI_CONFIG } from '@renderer/config'
import type { CSSProperties } from 'react'

export function NavBar() {
  return (
    <nav
      className="app-sidebar bg-background fixed z-50 flex cursor-default flex-col border-r select-none"
      style={
        {
          width: UI_CONFIG.NAV_WIDTH,
          '--nav-icon-column': `calc(${UI_CONFIG.NAV_WIDTH}px - 1px - var(--spacing) * 3)`,
          viewTransitionName: 'app-nav',
        } as CSSProperties
      }
    >
      <div className="flex h-full w-full flex-col justify-between overflow-x-hidden p-1.5">
        <div className="flex w-full flex-col gap-1.5">
          <LinkNav />
          <Separator />
          <PanelNav />
        </div>
        <NavProfile />
      </div>
    </nav>
  )
}
