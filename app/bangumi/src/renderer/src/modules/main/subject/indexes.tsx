import type { SubjectId } from '@renderer/data/types/bgm'
import { useSubjectInfoQuery } from '@renderer/data/hooks/db/subject'
import { MonoIndexesSection } from '@renderer/modules/common/mono-indexes'

export function SubjectIndexes({ subjectId }: { subjectId: SubjectId }) {
  const subjectInfoQuery = useSubjectInfoQuery({ subjectId, needKeepPreviousData: false })
  const sourceTitle =
    subjectInfoQuery.data?.name_cn || subjectInfoQuery.data?.name || `条目 ${subjectId}`

  return (
    <MonoIndexesSection
      resourceId={subjectId}
      resourceType="subject"
      sourceTitle={sourceTitle}
      sourceTo={`/subject/${subjectId}`}
    />
  )
}
