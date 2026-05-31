import { HeaderButton } from '@renderer/components/tooltip-button/header-button'
import { Button } from '@renderer/components/ui/button'
import { cn } from '@renderer/lib/utils'
import {
  getRightPanelContentByPathname,
  replyComposerAtom,
  rightPanelOpenAtom,
} from '@renderer/state/panel'
import { useAtom, useAtomValue } from 'jotai'
import { useLocation } from 'react-router-dom'

export function RightPanelButton() {
  const [open, setOpen] = useAtom(rightPanelOpenAtom)
  const replyComposer = useAtomValue(replyComposerAtom)
  const { pathname } = useLocation()
  const hasContent = replyComposer.open || getRightPanelContentByPathname(pathname) !== null
  const active = open && hasContent

  return (
    <HeaderButton
      Button={
        <Button
          variant="ghost"
          disabled={!hasContent}
          className={cn(
            'no-drag-region text-muted-foreground p-2 text-[1.4rem]',
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
      Content={<p>右边栏</p>}
    />
  )
}
