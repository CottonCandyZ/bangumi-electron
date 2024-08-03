import QuickTags from '@renderer/components/subject/collection/quick-tags'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { useSession } from '@renderer/components/wrapper/session-wrapper'
import { useQuerySubjectCollection } from '@renderer/data/hooks/api/collection'
import { useQuerySubjectInfo } from '@renderer/data/hooks/api/subject'
import { SubjectId } from '@renderer/data/types/bgm'

export default function SubjectTags({ subjectId }: { subjectId: SubjectId }) {
  const subjectInfoQuery = useQuerySubjectInfo({ id: subjectId, needKeepPreviousData: false })
  const subjectInfo = subjectInfoQuery.data
  const { userInfo, accessToken } = useSession()
  const subjectCollection = useQuerySubjectCollection({
    subjectId,
    username: userInfo?.username,
    enabled: !!userInfo,
    needKeepPreviousData: false,
  }).data

  if (subjectInfo === undefined)
    return (
      <section className="flex flex-col gap-5">
        <h2 className="text-2xl font-semibold">标签</h2>
        <Skeleton className="h-60" />
      </section>
    )

  if (subjectInfo?.tags.length === 0)
    return (
      <section className="flex flex-col gap-5">
        <h2 className="text-2xl font-semibold">标签</h2>
        <p>暂无标签</p>
      </section>
    )
  return (
    <section className="flex flex-col gap-5">
      <h2 className="text-2xl font-semibold">标签</h2>
      <QuickTags
        subjectTags={subjectInfo.tags}
        accessToken={accessToken}
        subjectCollection={subjectCollection}
        userInfo={userInfo}
      />
    </section>
  )
}
