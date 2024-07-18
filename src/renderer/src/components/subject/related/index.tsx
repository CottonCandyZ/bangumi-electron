import TabsOnly from '@renderer/components/base/tabs'
import RelatedSubjectsContent from '@renderer/components/subject/related/content'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { useQueryRelatedSubjects } from '@renderer/data/hooks/api/subject'
import { SubjectId } from '@renderer/data/types/bgm'
import { useEffect, useState } from 'react'

export default function RelatedSubjects({ subjectId }: { subjectId: SubjectId }) {
  const relatedSubjectsQuery = useQueryRelatedSubjects({
    id: subjectId,
    needKeepPreviousData: false,
  })
  const relatedSubjects = relatedSubjectsQuery.data
  const [filter, setFilter] = useState('全部')
  const relations = new Set<string>(['全部', ...(relatedSubjects?.keys() || [])])

  useEffect(() => {
    setFilter('全部')
  }, [subjectId])

  if (!relatedSubjects) return null
  if (relatedSubjects.size === 0) return null
  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-row items-start justify-between gap-10">
        <h2 className="shrink-0 text-2xl font-semibold">关联条目</h2>
        {relatedSubjects ? (
          relations.size !== 1 ? (
            <TabsOnly
              currentSelect={filter}
              setCurrentSelect={setFilter}
              tabsContent={relations}
              layoutId="subject-related-tab"
            />
          ) : null
        ) : (
          <Skeleton className="h-9 w-40" />
        )}
      </div>
      <RelatedSubjectsContent relatedSubjects={relatedSubjects} filter={filter} />
    </section>
  )
}
