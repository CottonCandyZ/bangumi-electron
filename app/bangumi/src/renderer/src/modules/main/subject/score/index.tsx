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
        <ScoreSkeleton />
      )}
    </section>
  )
}

function ScoreSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <section className="flex flex-row items-center justify-between gap-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-5 w-16" />
      </section>
      <div className="flex min-h-32 items-end gap-1 md:min-h-40">
        {[36, 56, 72, 88, 104, 128, 96, 76, 52, 32].map((height, index) => (
          <div className="flex flex-1 flex-col items-center gap-2" key={index}>
            <Skeleton className="w-full rounded-sm" style={{ height }} />
            <Skeleton className="h-3 w-3" />
          </div>
        ))}
      </div>
      <Skeleton className="ml-auto h-4 w-20" />
    </div>
  )
}
