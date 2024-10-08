import { Separator } from '@renderer/components/ui/separator'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { useQuerySubjectInfo } from '@renderer/data/hooks/api/subject'
import { SubjectId } from '@renderer/data/types/bgm'
import { Header } from '@renderer/modules/main/subject/header-info/header'
import { Meta } from '@renderer/modules/main/subject/header-info/meta'
import { Summary } from '@renderer/modules/main/subject/header-info/summary'

export function SubjectHeaderInfo({ subjectId }: { subjectId: SubjectId }) {
  const subjectInfoQuery = useQuerySubjectInfo({ subjectId, needKeepPreviousData: false })
  const subjectInfo = subjectInfoQuery.data
  if (!subjectInfo)
    return (
      <div className="flex flex-1 flex-col gap-3">
        <section className="flex flex-col items-center gap-2 @3xl:items-start">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-5 w-full" />
        </section>
        <section>
          <Skeleton className="h-36" />
        </section>
      </div>
    )
  return (
    <div className="flex flex-1 flex-col gap-3">
      <section className="flex flex-col items-center gap-2 @3xl:items-start">
        {/* 标题 */}
        <Header {...subjectInfo} />
        {/* 一些 meta 数据 */}
        <Meta {...subjectInfo} />
      </section>
      <Separator className="bg-primary/10" />
      <section>
        <Summary {...subjectInfo} />
      </section>
    </div>
  )
}
