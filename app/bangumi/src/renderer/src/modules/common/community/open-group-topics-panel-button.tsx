import type { SlimGroup } from '@renderer/data/types/community'
import { cn } from '@renderer/lib/utils'
import { OpenMonoListPanelButton } from '@renderer/modules/panel/left-panel/open-mono-list-panel'
import { type MonoListPanelTab } from '@renderer/state/panel'

export function OpenGroupTopicsPanelButton({
  className,
  group,
}: {
  className?: string
  group: SlimGroup
}) {
  const panelTab = {
    group,
    groupName: group.name,
    id: `group-topics-${group.name}`,
    panelTitle: group.title || group.name,
    sourceTitle: '小组',
    sourceTo: `/group/${group.name}`,
    title: '话题',
    topics: [],
    type: 'communityGroupTopics',
  } satisfies MonoListPanelTab

  return (
    <OpenMonoListPanelButton
      className={cn('size-8 shrink-0', className)}
      iconClassName="text-base"
      preventDefault
      stopPropagation
      tab={panelTab}
      title="在侧栏打开话题"
    />
  )
}
