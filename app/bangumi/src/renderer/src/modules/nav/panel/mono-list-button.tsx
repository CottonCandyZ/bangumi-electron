import { Button } from '@renderer/components/ui/button'
import { cn } from '@renderer/lib/utils'
import { navOpenAtom, restoreMonoListPanelAtomAction } from '@renderer/state/panel'
import { useAtom } from 'jotai'
import { startTransition } from 'react'

export function MonoListPanelButton() {
  const [panelState, restoreMonoListPanel] = useAtom(restoreMonoListPanelAtomAction)
  const [navOpen, setNavOpen] = useAtom(navOpenAtom)

  if (!panelState.hasTabs) return null

  return (
    <Button
      variant="ghost"
      className={cn(
        'text-primary/65 hover:text-primary relative aspect-square h-full w-fit p-2 active:scale-95',
        panelState.isOpen && 'bg-accent text-primary',
        navOpen && 'aspect-auto w-full justify-start gap-2',
      )}
      onClick={() => {
        startTransition(() => {
          if (navOpen) setNavOpen(false)
          restoreMonoListPanel()
        })
      }}
    >
      <span
        className={cn(
          'text-[1.4rem]',
          panelState.isOpen ? 'i-mingcute-box-3-fill' : 'i-mingcute-box-3-line',
        )}
      />
      {navOpen && <span>列表</span>}
    </Button>
  )
}
