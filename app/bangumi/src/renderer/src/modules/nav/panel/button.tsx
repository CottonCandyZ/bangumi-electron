import { NavItemContent, NavTooltip } from '@renderer/modules/nav/item-content'
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
import { nvaCollectionButtonAtomAction } from '@renderer/state/panel'
import { useAtom } from 'jotai'
import { MoreHorizontalIcon } from 'lucide-react'
import { startTransition } from 'react'

type Props = (typeof route)[number]

const EXTRA_COLLECTION_RESOURCES: {
  activeIcon: string
  icon: string
  name: string
  value: Exclude<CollectionPanelResourceType, 'subject'>
}[] = [
  {
    activeIcon: 'i-mingcute-user-3-fill',
    icon: 'i-mingcute-user-3-line',
    name: '角色收藏',
    value: 'character',
  },
  {
    activeIcon: 'i-mingcute-idcard-fill',
    icon: 'i-mingcute-idcard-line',
    name: '人物收藏',
    value: 'person',
  },
  {
    activeIcon: 'i-mingcute-list-check-3-fill',
    icon: 'i-mingcute-list-check-3-line',
    name: '目录收藏',
    value: 'index',
  },
]

export function PanelButton({ name, panelName, icon, active }: Props) {
  const [panelState, setPanelState] = useAtom(nvaCollectionButtonAtomAction)
  const isActive =
    panelState.openState &&
    panelState.openContent === 'collection' &&
    panelState.subjectType === panelName &&
    !panelState.username &&
    panelState.resourceType === 'subject'
  return (
    <NavTooltip label={name}>
      <Button
        variant="ghost"
        aria-label={name}
        className={cn(
          'text-primary/65 hover:text-primary relative h-8 w-full shrink-0 justify-start gap-0 overflow-hidden px-0 py-1.5 text-xs',
          isActive && 'bg-accent text-primary',
        )}
        onClick={() => {
          startTransition(() => {
            setPanelState(panelName, !isActive, undefined, 'subject')
          })
        }}
      >
        <NavItemContent icon={isActive ? active : icon} />
      </Button>
    </NavTooltip>
  )
}

export function CollectionResourceMenuButton() {
  const [panelState, setPanelState] = useAtom(nvaCollectionButtonAtomAction)
  const activeResource = EXTRA_COLLECTION_RESOURCES.find(
    (item) =>
      panelState.openState &&
      panelState.openContent === 'collection' &&
      !panelState.username &&
      panelState.resourceType === item.value,
  )

  return (
    <>
      {/* 选中「更多」里的收藏时，把它露出成一个独立按钮，取消选中后收回菜单里 */}
      {activeResource && (
        <NavTooltip label={activeResource.name}>
          <Button
            aria-label={activeResource.name}
            aria-pressed
            variant="ghost"
            className="bg-accent text-primary relative h-8 w-full shrink-0 justify-start gap-0 overflow-hidden px-0 py-1.5 text-xs"
            onClick={() => {
              startTransition(() => {
                setPanelState(panelState.subjectType, false, undefined, activeResource.value)
              })
            }}
          >
            <NavItemContent
              icon={<span className={cn(activeResource.activeIcon, 'ui-icon-nav')} />}
            />
          </Button>
        </NavTooltip>
      )}
      <CollectionResourceMenu activeResource={activeResource} />
    </>
  )
}

function CollectionResourceMenu({
  activeResource,
}: {
  activeResource: (typeof EXTRA_COLLECTION_RESOURCES)[number] | undefined
}) {
  const [panelState, setPanelState] = useAtom(nvaCollectionButtonAtomAction)

  return (
    <DropdownMenu>
      <NavTooltip label="更多收藏">
        <DropdownMenuTrigger asChild>
          <Button
            aria-label="更多收藏"
            variant="ghost"
            className="text-primary/65 hover:text-primary relative h-8 w-full shrink-0 justify-start gap-0 overflow-hidden px-0 py-1.5 text-xs"
          >
            <NavItemContent icon={<MoreHorizontalIcon className="ui-icon-nav" />} />
          </Button>
        </DropdownMenuTrigger>
      </NavTooltip>
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
