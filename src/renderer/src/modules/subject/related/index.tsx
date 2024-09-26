import { Tabs } from '@renderer/components/tabs'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { useQueryRelatedSubjects } from '@renderer/data/hooks/api/subject'
import { SubjectId } from '@renderer/data/types/bgm'
import { RelatedSubjectsContent } from '@renderer/modules/subject/related/content'
import { tabFilerAtom } from '@renderer/state/simple-tab'
import { useAtom } from 'jotai'

export function RelatedSubjects({ subjectId }: { subjectId: SubjectId }) {
  const relatedSubjectsQuery = useQueryRelatedSubjects({
    id: subjectId,
    needKeepPreviousData: false,
  })
  const relatedSubjects = relatedSubjectsQuery.data
  // 书籍处理特殊化
  relatedSubjects?.delete('单行本')
  const id = `subject-related-tab-${subjectId}`
  const [filterMap, setFilter] = useAtom(tabFilerAtom)
  const filter = filterMap.get(id) ?? '全部'
  const relations = new Set<string>(['全部', ...(relatedSubjects?.keys() || [])])

  if (relatedSubjects?.size === 0) return null
  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-row items-start justify-between gap-10">
        <h2 className="shrink-0 text-2xl font-medium">关联条目</h2>
        {relatedSubjects ? (
          <Tabs
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

export function RelatedGridSkeleton() {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,_minmax(8rem,_1fr))] gap-3 py-2">
      {Array(5)
        .fill(0)
        .map((_, index) => (
          <Skeleton className="aspect-square" key={index} />
        ))}
    </div>
  )
}
