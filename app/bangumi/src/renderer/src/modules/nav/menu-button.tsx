import { Button } from '@renderer/components/ui/button'
import { HeaderButton } from '@renderer/components/tooltip-button/header-button'
import { navOpenAtom } from '@renderer/state/panel'
import { useAtom } from 'jotai'
import { PanelLeft } from 'lucide-react'

export function NavMenuButton() {
  const [open, setOpen] = useAtom(navOpenAtom)

  return (
    <HeaderButton
      Button={
        <Button
          variant="ghost"
          aria-label="导航菜单"
          aria-expanded={open}
          className="no-drag-region text-muted-foreground size-7 shrink-0 rounded-sm p-1 [&_svg]:size-4"
          onClick={() => setOpen(!open)}
        >
          <PanelLeft />
        </Button>
      }
      Content={<p>导航菜单</p>}
    />
  )
}
