import { NavItemContent, NavTooltip } from '@renderer/modules/nav/item-content'
import { Button } from '@renderer/components/ui/button'
import { cn } from '@renderer/lib/utils'
import { restoreMonoListPanelAtomAction } from '@renderer/state/panel'
import { useAtom } from 'jotai'
import { startTransition } from 'react'

export function MonoListPanelButton() {
  const [panelState, restoreMonoListPanel] = useAtom(restoreMonoListPanelAtomAction)

  if (!panelState.hasTabs) return null

  return (
    <NavTooltip label="列表">
      <Button
        variant="ghost"
        aria-label="列表"
        className={cn(
          'text-primary/65 hover:text-primary relative h-8 w-full shrink-0 justify-start gap-0 overflow-hidden px-0 py-1.5 text-xs',
          panelState.isOpen && 'bg-accent text-primary',
        )}
        onClick={() => {
          startTransition(() => {
            restoreMonoListPanel()
          })
        }}
      >
        <NavItemContent
          icon={
            <span
              className={cn(
                'ui-icon-nav',
                panelState.isOpen ? 'i-mingcute-box-3-fill' : 'i-mingcute-box-3-line',
              )}
            />
          }
        />
      </Button>
    </NavTooltip>
  )
}
