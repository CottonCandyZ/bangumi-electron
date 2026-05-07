import { Skeleton } from '@renderer/components/ui/skeleton'
import { useSubjectInfoQuery } from '@renderer/data/hooks/db/subject'
import { SubjectId } from '@renderer/data/types/bgm'
import { Score } from '@renderer/modules/main/subject/score/score'

export function SubjectScore({ subjectId }: { subjectId: SubjectId }) {
  const subjectInfoQuery = useSubjectInfoQuery({ subjectId, needKeepPreviousData: false })
  const subjectInfo = subjectInfoQuery.data
  return (
    <section className="flex min-w-56 flex-col gap-2">
      {subjectInfo ? (
        <Score rating={subjectInfo.rating} ratingCount={subjectInfo.ratingCount} />
      ) : (
        <Skeleton className="h-60" />
      )}
    </section>
  )
}
