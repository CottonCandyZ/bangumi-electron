import Score from '@renderer/components/subject/score/score'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { useQuerySubjectInfo } from '@renderer/data/hooks/api/subject'
import { SubjectId } from '@renderer/data/types/bgm'

export default function SubjectScore({ subjectId }: { subjectId: SubjectId }) {
  const subjectInfoQuery = useQuerySubjectInfo({ id: subjectId, needKeepPreviousData: false })
  const subjectInfo = subjectInfoQuery.data
  return (
    <>
      <h2 className="text-2xl font-semibold">评分</h2>
      {subjectInfo ? <Score rating={subjectInfo.rating} /> : <Skeleton className="h-60" />}
    </>
  )
}
