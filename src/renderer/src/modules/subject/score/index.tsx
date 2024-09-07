import { Skeleton } from '@renderer/components/ui/skeleton'
import { useQuerySubjectInfo } from '@renderer/data/hooks/api/subject'
import { SubjectId } from '@renderer/data/types/bgm'
import { Score } from '@renderer/modules/subject/score/score'

export function SubjectScore({ subjectId }: { subjectId: SubjectId }) {
  const subjectInfoQuery = useQuerySubjectInfo({ subjectId, needKeepPreviousData: false })
  const subjectInfo = subjectInfoQuery.data
  return (
    <section className="flex min-w-56 flex-col gap-2">
      {subjectInfo ? <Score rating={subjectInfo.rating} /> : <Skeleton className="h-60" />}
    </section>
  )
}
