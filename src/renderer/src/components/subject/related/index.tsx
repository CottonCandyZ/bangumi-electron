import TabsOnly from '@renderer/components/base/tabs'
import RelatedSubjectsContent from '@renderer/components/subject/related/content'
import RelatedGridSkeleton from '@renderer/components/subject/related/skelen'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { useQueryRelatedSubjects } from '@renderer/data/hooks/api/subject'
import { SubjectId } from '@renderer/data/types/bgm'
import { tabFilerAtom } from '@renderer/state/simple-tab'
import { useAtom } from 'jotai'

export default function RelatedSubjects({ subjectId }: { subjectId: SubjectId }) {
  const relatedSubjectsQuery = useQueryRelatedSubjects({
    id: subjectId,
    needKeepPreviousData: false,
  })
  const relatedSubjects = relatedSubjectsQuery.data
  const id = `subject-related-tab-${subjectId}`
  const [filterMap, setFilter] = useAtom(tabFilerAtom)
  const filter = filterMap.get(id) ?? '全部'
  const relations = new Set<string>(['全部', ...(relatedSubjects?.keys() || [])])

  if (relatedSubjects?.size === 0) return null
  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-row items-start justify-between gap-10">
        <h2 className="shrink-0 text-2xl font-semibold">关联条目</h2>
        {relatedSubjects ? (
          <TabsOnly
            currentSelect={filter}
            setCurrentSelect={setFilter}
            tabsContent={relations}
            layoutId={id}
          />
        ) : (
          <Skeleton className="h-9 w-40" />
        )}
      </div>
      {relatedSubjects ? (
        <RelatedSubjectsContent relatedSubjects={relatedSubjects} filter={filter} />
      ) : (
        <RelatedGridSkeleton />
      )}
    </section>
  )
}
