import { Button } from '@renderer/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@renderer/components/ui/tooltip'
import { cn } from '@renderer/lib/utils'
import { rightPanelButtonAtomAction } from '@renderer/state/panel'
import { useAtom } from 'jotai'
import { useLocation } from 'react-router-dom'

export default function RightPanelButton() {
  const [openState, panelAction] = useAtom(rightPanelButtonAtomAction)
  const { pathname } = useLocation()
  const showSubjectId = pathname.includes('subject')

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            'no-drag-region mr-3 p-2 text-[1.4rem] text-muted-foreground',
            openState && 'text-primary',
          )}
          onClick={() => {
            panelAction(showSubjectId ? 'subjectInfo' : null, !openState)
          }}
        >
          {openState ? (
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
