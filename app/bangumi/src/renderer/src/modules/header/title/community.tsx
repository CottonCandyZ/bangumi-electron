import { useGroupTopicQuery, useSubjectTopicQuery } from '@renderer/data/hooks/api/community'
import { StaticHeaderTitle } from '@renderer/modules/header/title/static'
import { communityTopicTitleInViewAtom } from '@renderer/state/in-view'
import { useAtomValue } from 'jotai'

export function CommunityTopicHeaderTitle({
  kind,
  topicId,
}: {
  kind: 'group' | 'subject'
  topicId: number
}) {
  const isInView = useAtomValue(communityTopicTitleInViewAtom)

  return kind === 'group' ? (
    <GroupTopicHeaderTitle topicId={topicId} visible={!isInView} />
  ) : (
    <SubjectTopicHeaderTitle topicId={topicId} visible={!isInView} />
  )
}

function GroupTopicHeaderTitle({ topicId, visible }: { topicId: number; visible: boolean }) {
  const query = useGroupTopicQuery({ topicId })
  if (!query.data) return null
  const sourceTitle = query.data.group.title || query.data.group.name

  return (
    <StaticHeaderTitle
      image={query.data.creator?.avatar.medium}
      imageFallback="话"
      name={sourceTitle}
      nameCn={query.data.title}
      presenceKey={`group-topic-${topicId}`}
      visible={visible}
    />
  )
}

function SubjectTopicHeaderTitle({ topicId, visible }: { topicId: number; visible: boolean }) {
  const query = useSubjectTopicQuery({ topicId })
  if (!query.data) return null
  const sourceTitle = query.data.subject.nameCN || query.data.subject.name

  return (
    <StaticHeaderTitle
      image={query.data.creator?.avatar.medium}
      imageFallback="话"
      name={sourceTitle}
      nameCn={query.data.title}
      presenceKey={`subject-topic-${topicId}`}
      visible={visible}
    />
  )
}
