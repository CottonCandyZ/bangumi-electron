import { usePageScrollRestoreReady } from '@renderer/components/scroll/page-scroll-wrapper'
import { useCreateSubjectTopicMutation } from '@renderer/data/hooks/api/community'
import { useSubjectInfoQuery } from '@renderer/data/hooks/db/subject'
import type { SubjectId } from '@renderer/data/types/bgm'
import { client } from '@renderer/lib/client'
import { TopicEditor } from '@renderer/modules/main/community/topic-editor'
import { TopicEditorSkeleton } from '@renderer/modules/main/community/topic-editor-skeleton'
import { useNavigate } from 'react-router-dom'

export function CreateSubjectTopicPage({ subjectId }: { subjectId: SubjectId | undefined }) {
  const navigate = useNavigate()
  const subjectQuery = useSubjectInfoQuery({
    subjectId: subjectId ?? '',
    needKeepPreviousData: false,
  })
  const createMutation = useCreateSubjectTopicMutation()

  usePageScrollRestoreReady(!subjectQuery.isLoading || subjectQuery.isError)

  if (!subjectId || subjectQuery.isError) {
    return (
      <div className="flex h-full items-center justify-center px-6">
        <p className="text-muted-foreground text-sm">暂时无法读取条目。</p>
      </div>
    )
  }
  if (!subjectQuery.data) return <TopicEditorSkeleton />

  const subjectRoute = `/subject/${subjectId}`
  const subjectTitle = subjectQuery.data.name_cn || subjectQuery.data.name || `条目 ${subjectId}`

  return (
    <TopicEditor
      action="create"
      sourceLabel="条目"
      sourceTitle={subjectTitle}
      sourceTo={subjectRoute}
      onCancel={() => navigate(subjectRoute)}
      onSubmit={async ({ content, title }) => {
        const turnstileToken = await client.getTurnstileToken({})
        const result = await createMutation.mutateAsync({
          content,
          subjectId,
          title,
          turnstileToken,
        })
        navigate(`/subject/topic/${result.id}`)
      }}
    />
  )
}
