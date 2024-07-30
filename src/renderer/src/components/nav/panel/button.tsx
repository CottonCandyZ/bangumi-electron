import { route } from '@renderer/components/nav/panel/nav'
import { Button } from '@renderer/components/ui/button'
import { cn } from '@renderer/lib/utils'
import { PanelName, useNavCollapsed, usePanelName } from '@renderer/state/panel'

type Props = (typeof route)[number]

export default function PanelButton({ name, panelName, icon, active }: Props) {
  const { panelName: currentPanelName, setPanelName } = usePanelName((state) => state)
  const isActive = currentPanelName === panelName
  const typedPanelName = panelName as PanelName
  const { collapsed: navCollapsed, setCollapsed: setNavCollapsed } = useNavCollapsed(
    (state) => state,
  )

  return (
    <Button
      variant="ghost"
      className={cn(
        'relative aspect-square h-full w-fit p-2 text-primary/65 hover:text-primary active:scale-95',
        isActive && 'bg-accent text-primary',
        !navCollapsed && 'aspect-auto w-full justify-start gap-2',
      )}
      onClick={() => {
        if (!navCollapsed) setNavCollapsed(true)
        setPanelName(!isActive ? typedPanelName : null)
      }}
    >
      <>
        <div className="flex">{isActive ? active : icon}</div>
        {!navCollapsed && <span>{name}</span>}
      </>
    </Button>
  )
}
