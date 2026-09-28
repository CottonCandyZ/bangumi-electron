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
import { LEFT_PANEL_MAX_WIDTH, LEFT_PANEL_MIN_WIDTH } from '@renderer/modules/panel/left-panel'
import { clamp } from '@renderer/lib/utils/tool'
import { leftPanelOpenAtom, leftPanelResizingAtom, leftPanelWidth } from '@renderer/state/panel'
import { useAtomValue } from 'jotai'

const platform = await client.platform({})
const HEADER_PADDING_LEFT = platform === 'darwin' ? 88 : 8
// Keep in sync with the left panel's slide animation.
const LEFT_PANEL_TRANSITION = '300ms .05s'

export function Header() {
  const leftPanelOpen = useAtomValue(leftPanelOpenAtom)
  const leftPanelResizing = useAtomValue(leftPanelResizingAtom)
  const width = useAtomValue(leftPanelWidth)
  // Right edge of the left panel, where its border sits.
  const leftPanelEdge =
    UI_CONFIG.NAV_WIDTH + clamp(width, LEFT_PANEL_MIN_WIDTH, LEFT_PANEL_MAX_WIDTH)

  return (
    <header
      className={cn(
        'bg-background drag-region @container/header relative z-10 flex shrink-0 flex-row items-center justify-between gap-3 border-b',
      )}
      style={{
        height: UI_CONFIG.HEADER_HEIGHT,
        paddingLeft: HEADER_PADDING_LEFT,
        viewTransitionName: 'app-header',
      }}
    >
      <div className="flex h-full min-w-0 flex-1 flex-row items-center gap-3 overflow-hidden">
        <div
          className="flex shrink-0 items-center gap-2"
          style={{
            minWidth: leftPanelOpen ? leftPanelEdge - HEADER_PADDING_LEFT : 0,
            transition: leftPanelResizing ? undefined : `min-width ${LEFT_PANEL_TRANSITION}`,
          }}
        >
          <NavMenuButton />
          <NavButton compact />
        </div>
        <div
          aria-hidden
          className={cn(
            'bg-border pointer-events-none absolute top-1/2 h-5 w-px -translate-y-1/2 opacity-0',
            leftPanelOpen && 'opacity-100',
          )}
          style={{
            left: leftPanelEdge - 1,
            transition: `opacity ${LEFT_PANEL_TRANSITION}`,
          }}
        />
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
