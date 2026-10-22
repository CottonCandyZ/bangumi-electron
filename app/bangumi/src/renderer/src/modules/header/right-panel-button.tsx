import { HeaderButton } from '@renderer/components/tooltip-button/header-button'
import { Button } from '@renderer/components/ui/button'
import { getHotkeyForHook, isHotkeyEnabled } from '@renderer/lib/shortcut'
import { cn } from '@renderer/lib/utils'
import { appConfigAtom } from '@renderer/state/app-config'
import { getRightPanelContentByPathname, rightPanelOpenAtom } from '@renderer/state/panel'
import { useAtom, useAtomValue } from 'jotai'
import { useHotkeys } from 'react-hotkeys-hook'
import { useLocation } from 'react-router-dom'

export function RightPanelButton() {
  const [open, setOpen] = useAtom(rightPanelOpenAtom)
  const { pathname } = useLocation()
  const hotkey = useAtomValue(appConfigAtom).shortcuts.toggleRightPanel
  const hasContent = getRightPanelContentByPathname(pathname) !== null
  const active = open && hasContent

  useHotkeys(
    getHotkeyForHook(hotkey),
    () => setOpen(!open),
    { enabled: isHotkeyEnabled(hotkey) && hasContent, preventDefault: true },
    [hotkey, open, setOpen],
  )

  return (
    <HeaderButton
      Button={
        <Button
          variant="ghost"
          aria-label="右边栏"
          aria-expanded={active}
          disabled={!hasContent}
          className={cn(
            'no-drag-region text-muted-foreground size-7 p-1 text-lg',
            active && 'text-primary',
          )}
          onClick={() => {
            setOpen(!open)
          }}
        >
          {active ? (
            <span className="i-tabler-layout-sidebar-right-filled" />
          ) : (
            <span className="i-tabler-layout-sidebar-right" />
          )}
        </Button>
      }
      Content="右边栏"
      hotkey={hotkey}
    />
  )
}
