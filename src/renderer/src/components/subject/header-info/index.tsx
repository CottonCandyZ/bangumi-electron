import Header from '@renderer/components/subject/header-info/header'
import Meta from '@renderer/components/subject/header-info/meta'
import Summary from '@renderer/components/subject/header-info/summary'
import { Separator } from '@renderer/components/ui/separator'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { useQuerySubjectInfo } from '@renderer/data/hooks/api/subject'
import { SubjectId } from '@renderer/data/types/bgm'

export function SubjectHeaderInfo({ subjectId }: { subjectId: SubjectId }) {
  const subjectInfoQuery = useQuerySubjectInfo({ subjectId, needKeepPreviousData: false })
  const subjectInfo = subjectInfoQuery.data
  if (!subjectInfo)
    return (
      <div className="flex flex-1 flex-col gap-5">
        <section className="flex flex-col gap-2">
          <Skeleton className="h-10" />
          <Skeleton className="h-5" />
        </section>
        <section>
          <Skeleton className="h-36" />
        </section>
      </div>
    )
  return (
    <div className="flex flex-1 flex-col gap-3">
      <section className="flex flex-col gap-2">
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
