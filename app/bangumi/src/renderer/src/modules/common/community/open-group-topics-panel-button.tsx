import { Button } from '@renderer/components/ui/button'
import type { SlimGroup } from '@renderer/data/types/community'
import { cn } from '@renderer/lib/utils'
import { openMonoListPanelTabAtomAction, type MonoListPanelTab } from '@renderer/state/panel'
import { useSetAtom } from 'jotai'
import type { MouseEvent } from 'react'

export function OpenGroupTopicsPanelButton({
  className,
  group,
}: {
  className?: string
  group: SlimGroup
}) {
  const openMonoListPanelTab = useSetAtom(openMonoListPanelTabAtomAction)

  const open = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    openMonoListPanelTab({
      group,
      groupName: group.name,
      id: `group-topics-${group.name}`,
      panelTitle: group.title || group.name,
      sourceTitle: '小组',
      sourceTo: `/group/${group.name}`,
      title: '话题',
      topics: [],
      type: 'communityGroupTopics',
    } satisfies MonoListPanelTab)
  }

  return (
    <Button
      className={cn('size-8 shrink-0', className)}
      onClick={open}
      size="icon"
      title="在侧栏打开话题"
      variant="ghost"
    >
      <span className="i-mingcute-box-3-line text-base" />
    </Button>
  )
}
