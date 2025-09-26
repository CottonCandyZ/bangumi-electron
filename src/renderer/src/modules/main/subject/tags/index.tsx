import { Skeleton } from '@renderer/components/ui/skeleton'
import { useSession } from '@renderer/data/hooks/session'
import { useQuerySubjectCollection } from '@renderer/data/hooks/api/collection'
import { SubjectId } from '@renderer/data/types/bgm'
import { QuickTags } from '@renderer/modules/main/subject/collection/quick-tags'
import { Fragment } from 'react/jsx-runtime'
import { useSubjectInfoQuery } from '@renderer/data/hooks/db/subject'

export function SubjectTags({ subjectId }: { subjectId: SubjectId }) {
  const subjectInfoQuery = useSubjectInfoQuery({ subjectId, needKeepPreviousData: false })
  const subjectInfo = subjectInfoQuery.data
  const userInfo = useSession()
  const subjectCollection = useQuerySubjectCollection({
    subjectId,
    username: userInfo?.username,
    enabled: !!userInfo,
    needKeepPreviousData: false,
  }).data

  if (subjectInfo === undefined)
    return (
      <section className="flex w-full flex-col gap-5">
        <h2 className="text-2xl font-medium">标签</h2>
        <div className="flex flex-row flex-wrap gap-2 after:grow-[999]">
          {Array(5)
            .fill(undefined)
            .map((_, index) => (
              <Fragment key={index}>
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-9 w-14" />
                <Skeleton className="h-9 w-16" />
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-12" />
              </Fragment>
            ))}
        </div>
      </section>
    )

  if (subjectInfo?.tags.length === 0)
    return (
      <section className="flex flex-col gap-5">
        <h2 className="text-2xl font-medium">标签</h2>
        <p>暂无标签</p>
      </section>
    )
  return (
    <section className="flex flex-col gap-5">
      <h2 className="text-2xl font-medium">标签</h2>
      <QuickTags subjectTags={subjectInfo.tags} subjectCollection={subjectCollection} />
    </section>
  )
}
