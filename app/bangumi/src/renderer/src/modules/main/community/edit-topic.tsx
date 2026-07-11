import {
  useGroupTopicQuery,
  useSubjectTopicQuery,
  useUpdateTopicMutation,
} from '@renderer/data/hooks/api/community'
import type { GroupTopic, SubjectTopic } from '@renderer/data/types/community'
import { TopicEditor } from '@renderer/modules/main/community/topic-editor'
import { TopicEditorSkeleton } from '@renderer/modules/main/community/topic-editor-skeleton'
import { useNavigate } from 'react-router-dom'

export function EditCommunityTopicPage({
  kind,
  topicId,
}: {
  kind: 'group' | 'subject'
  topicId: number
}) {
  if (!Number.isFinite(topicId)) return <EditTopicMessage text="话题 ID 无效。" />
  return kind === 'group' ? (
    <EditGroupTopicPage topicId={topicId} />
  ) : (
    <EditSubjectTopicPage topicId={topicId} />
  )
}

function EditGroupTopicPage({ topicId }: { topicId: number }) {
  const query = useGroupTopicQuery({ topicId })
  if (query.isLoading) return <TopicEditorSkeleton />
  if (query.isError || !query.data) return <EditTopicMessage text="暂时无法读取小组话题。" />
  return <ResolvedEditTopic kind="group" topic={query.data} />
}

function EditSubjectTopicPage({ topicId }: { topicId: number }) {
  const query = useSubjectTopicQuery({ topicId })
  if (query.isLoading) return <TopicEditorSkeleton />
  if (query.isError || !query.data) return <EditTopicMessage text="暂时无法读取条目讨论。" />
  return <ResolvedEditTopic kind="subject" topic={query.data} />
}

function ResolvedEditTopic({
  kind,
  topic,
}: {
  kind: 'group' | 'subject'
  topic: GroupTopic | SubjectTopic
}) {
  const navigate = useNavigate()
  const updateMutation = useUpdateTopicMutation()
  const topicRoute = `/${kind}/topic/${topic.id}`
  const source =
    kind === 'group'
      ? {
          label: '小组',
          title: (topic as GroupTopic).group.title || (topic as GroupTopic).group.name,
          to: `/group/${encodeURIComponent((topic as GroupTopic).group.name)}`,
        }
      : {
          label: '条目',
          title:
            (topic as SubjectTopic).subject.nameCN ||
            (topic as SubjectTopic).subject.name ||
            `条目 ${(topic as SubjectTopic).subject.id}`,
          to: `/subject/${(topic as SubjectTopic).subject.id}`,
        }

  return (
    <TopicEditor
      action="edit"
      initialDraft={topic.replies[0]?.content ?? ''}
      initialTitle={topic.title}
      sourceLabel={source.label}
      sourceTitle={source.title}
      sourceTo={source.to}
      onCancel={() => navigate(topicRoute)}
      onSubmit={async ({ content, title }) => {
        await updateMutation.mutateAsync({ content, kind, title, topicId: topic.id })
        navigate(topicRoute)
      }}
    />
  )
}

function EditTopicMessage({ text }: { text: string }) {
  return (
    <div className="flex h-full items-center justify-center px-6">
      <p className="text-muted-foreground text-sm">{text}</p>
    </div>
  )
}
