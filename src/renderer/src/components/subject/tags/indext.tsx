import Tags from '@renderer/components/subject/tags/tags'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { useQuerySubjectInfo } from '@renderer/data/hooks/api/subject'
import { SubjectId } from '@renderer/data/types/bgm'

export default function SubjectTags({ subjectId }: { subjectId: SubjectId }) {
  const subjectInfoQuery = useQuerySubjectInfo({ id: subjectId, needKeepPreviousData: false })
  const subjectInfo = subjectInfoQuery.data
  if (subjectInfo?.tags.length === 0)
    return (
      <>
        <h2 className="text-2xl font-semibold">标签</h2>
        <p>暂无标签</p>
      </>
    )
  return (
    <>
      <h2 className="text-2xl font-semibold">标签</h2>
      <div>{subjectInfo ? <Tags tags={subjectInfo.tags} /> : <Skeleton className="h-60" />}</div>
    </>
  )
}
