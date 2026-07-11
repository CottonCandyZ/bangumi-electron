import { usePageScrollRestoreReady } from '@renderer/components/scroll/page-scroll-wrapper'
import {
  useCreateGroupTopicMutation,
  useGroupByNameQuery,
} from '@renderer/data/hooks/api/community'
import { client } from '@renderer/lib/client'
import { TopicEditor } from '@renderer/modules/main/community/topic-editor'
import { useNavigate } from 'react-router-dom'

export function CreateGroupTopicPage({ groupName }: { groupName: string | undefined }) {
  const navigate = useNavigate()
  const groupQuery = useGroupByNameQuery({ groupName, enabled: !!groupName })
  const createMutation = useCreateGroupTopicMutation()

  usePageScrollRestoreReady(!groupQuery.isLoading || groupQuery.isError)

  if (!groupName) {
    return <TopicEditorMessage text="没有找到小组。" />
  }
  if (groupQuery.isError) {
    return <TopicEditorMessage text="暂时无法读取小组。" />
  }
  if (!groupQuery.data) return null

  const groupTitle = groupQuery.data.title || groupQuery.data.name || groupName
  const groupRoute = `/group/${encodeURIComponent(groupName)}`

  return (
    <TopicEditor
      action="create"
      sourceLabel="小组"
      sourceTitle={groupTitle}
      sourceTo={groupRoute}
      onCancel={() => navigate(groupRoute)}
      onSubmit={async ({ content, title }) => {
        const turnstileToken = await client.getTurnstileToken({})
        const result = await createMutation.mutateAsync({
          content,
          groupName,
          title,
          turnstileToken,
        })
        navigate(`/group/topic/${result.id}`)
      }}
    />
  )
}

function TopicEditorMessage({ text }: { text: string }) {
  return (
    <div className="flex h-full items-center justify-center px-6">
      <p className="text-muted-foreground text-sm">{text}</p>
    </div>
  )
}
