import { Button } from '@renderer/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@renderer/components/ui/tooltip'
import { cn } from '@renderer/lib/utils'
import { rightPanelOpenAtom } from '@renderer/state/panel'
import { useAtom } from 'jotai'

export default function RightPanelButton() {
  const [open, setOpen] = useAtom(rightPanelOpenAtom)

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            'no-drag-region mr-3 p-2 text-[1.4rem] text-muted-foreground',
            open && 'text-primary',
          )}
          onClick={() => {
            setOpen(!open)
          }}
        >
          {open ? (
            <span className="i-tabler-layout-sidebar-right-filled" />
          ) : (
            <span className="i-tabler-layout-sidebar-right" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>右边栏</p>
      </TooltipContent>
    </Tooltip>
  )
}
