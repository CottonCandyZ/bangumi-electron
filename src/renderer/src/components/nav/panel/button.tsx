import { route } from '@renderer/components/nav/panel/nav'
import { Button } from '@renderer/components/ui/button'
import { cn } from '@renderer/lib/utils'
import { navOpenAtom, nvaCollectionButtonAtomAction } from '@renderer/state/panel'
import { useAtom } from 'jotai'
import { startTransition } from 'react'

type Props = (typeof route)[number]

export default function PanelButton({ name, panelName, icon, active }: Props) {
  const [panelState, setPanelState] = useAtom(nvaCollectionButtonAtomAction)
  const isActive = panelState.openState && panelState.subjectType === panelName
  const [navOpen, setNavOpen] = useAtom(navOpenAtom)

  return (
    <Button
      variant="ghost"
      className={cn(
        'relative aspect-square h-full w-fit p-2 text-primary/65 hover:text-primary active:scale-95',
        isActive && 'bg-accent text-primary',
        navOpen && 'aspect-auto w-full justify-start gap-2',
      )}
      onClick={() => {
        startTransition(() => {
          if (navOpen) setNavOpen(false)
          setPanelState(panelName, !isActive)
        })
      }}
    >
      <>
        <div className="flex">{isActive ? active : icon}</div>
        {navOpen && <span>{name}</span>}
      </>
    </Button>
  )
}
