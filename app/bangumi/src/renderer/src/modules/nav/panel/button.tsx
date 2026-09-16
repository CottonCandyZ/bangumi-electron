import { NavItemContent } from '@renderer/modules/nav/item-content'
import { route } from '@renderer/modules/nav/panel/nav'
import { Button } from '@renderer/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@renderer/components/ui/dropdown-menu'
import type { CollectionPanelResourceType } from '@renderer/state/collection'
import { cn } from '@renderer/lib/utils'
import { navOpenAtom, nvaCollectionButtonAtomAction } from '@renderer/state/panel'
import { useAtom } from 'jotai'
import { MoreHorizontalIcon } from 'lucide-react'
import { startTransition } from 'react'

type Props = (typeof route)[number]

const EXTRA_COLLECTION_RESOURCES: {
  icon: string
  name: string
  value: Exclude<CollectionPanelResourceType, 'subject'>
}[] = [
  { icon: 'i-mingcute-user-3-line', name: '角色收藏', value: 'character' },
  { icon: 'i-mingcute-idcard-line', name: '人物收藏', value: 'person' },
  { icon: 'i-mingcute-list-check-3-line', name: '目录收藏', value: 'index' },
]

export function PanelButton({ name, panelName, icon, active }: Props) {
  const [panelState, setPanelState] = useAtom(nvaCollectionButtonAtomAction)
  const isActive =
    panelState.openState &&
    panelState.openContent === 'collection' &&
    panelState.subjectType === panelName &&
    !panelState.username &&
    panelState.resourceType === 'subject'
  const [navOpen, setNavOpen] = useAtom(navOpenAtom)

  return (
    <Button
      variant="ghost"
      aria-label={name}
      className={cn(
        'text-primary/65 hover:text-primary relative h-8 w-full shrink-0 justify-start gap-0 overflow-hidden px-0 py-1.5 text-xs',
        isActive && 'bg-accent text-primary',
      )}
      onClick={() => {
        startTransition(() => {
          if (navOpen) setNavOpen(false)
          setPanelState(panelName, !isActive, undefined, 'subject')
        })
      }}
    >
      <>
        <NavItemContent icon={isActive ? active : icon} label={name} open={navOpen} />
      </>
    </Button>
  )
}

export function CollectionResourceMenuButton() {
  const [panelState, setPanelState] = useAtom(nvaCollectionButtonAtomAction)
  const [navOpen, setNavOpen] = useAtom(navOpenAtom)
  const activeResource = EXTRA_COLLECTION_RESOURCES.find(
    (item) =>
      panelState.openState &&
      panelState.openContent === 'collection' &&
      !panelState.username &&
      panelState.resourceType === item.value,
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label={activeResource?.name ?? '更多收藏'}
          variant="ghost"
          className={cn(
            'text-primary/65 hover:text-primary relative h-8 w-full shrink-0 justify-start gap-0 overflow-hidden px-0 py-1.5 text-xs',
            activeResource && 'bg-accent text-primary',
          )}
        >
          <NavItemContent
            icon={<MoreHorizontalIcon className="ui-icon-nav" />}
            label={activeResource?.name ?? '更多收藏'}
            open={navOpen}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-36" side="right">
        <DropdownMenuRadioGroup
          value={activeResource?.value}
          onValueChange={(value) => {
            const resourceType = value as Exclude<CollectionPanelResourceType, 'subject'>
            const isActive =
              panelState.openState &&
              panelState.openContent === 'collection' &&
              !panelState.username &&
              panelState.resourceType === resourceType

            startTransition(() => {
              if (navOpen) setNavOpen(false)
              setPanelState(panelState.subjectType, !isActive, undefined, resourceType)
            })
          }}
        >
          {EXTRA_COLLECTION_RESOURCES.map((item) => (
            <DropdownMenuRadioItem key={item.value} value={item.value}>
              <span className={cn(item.icon, 'text-base')} />
              {item.name}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
