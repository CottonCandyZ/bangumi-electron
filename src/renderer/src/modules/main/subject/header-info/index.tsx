import { Separator } from '@renderer/components/ui/separator'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { useSubjectInfoQuery } from '@renderer/data/hooks/db/subject'
import { SubjectId } from '@renderer/data/types/bgm'
import { Collections } from '@renderer/modules/main/subject/header-info/collections'
import { Header } from '@renderer/modules/main/subject/header-info/header'
import { Meta } from '@renderer/modules/main/subject/header-info/meta'
import { Summary } from '@renderer/modules/main/subject/header-info/summary'

export function SubjectHeaderInfo({ subjectId }: { subjectId: SubjectId }) {
  const subjectInfoQuery = useSubjectInfoQuery({ subjectId, needKeepPreviousData: false })
  const subjectInfo = subjectInfoQuery.data
  if (!subjectInfo)
    return (
      <div className="flex w-full flex-1 flex-col gap-3">
        <section className="flex flex-col items-center gap-2 @3xl:items-start">
          <Skeleton className="h-10 w-96" />
          <Skeleton className="h-4 w-72" />
          <div className="flex flex-row items-center gap-1.5 text-muted-foreground">
            <Skeleton className="h-5 w-10" />
            <span>·</span>
            <Skeleton className="h-5 w-7" />
            <span>·</span>
            <Skeleton className="h-5 w-12" />
            <span>·</span>
            <Skeleton className="h-5 w-14" />
          </div>
        </section>
        <Separator className="bg-primary/10" />
        <section className="flex flex-col gap-1.5">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-5 w-56" />
          <Skeleton className="h-5 w-72" />
          <Skeleton className="h-5 w-56" />
          <Skeleton className="h-5 w-80" />
        </section>
      </div>
    )
  return (
    <div className="flex w-full flex-1 flex-col gap-3">
      <section className="flex flex-col items-center gap-2 @3xl:items-start">
        {/* 标题 */}
        <Header {...subjectInfo} />
        {/* 一些 meta 数据 */}
        <Meta {...subjectInfo} />
        {/* collections */}
        <Collections {...subjectInfo} />
      </section>
      <Separator className="bg-primary/10" />
      <section>
        <Summary {...subjectInfo} />
      </section>
    </div>
  )
}
