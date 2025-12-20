import { Tabs } from '@renderer/components/tabs'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { useRelatedSubjectsQuery } from '@renderer/data/hooks/api/subject'
import { SubjectId } from '@renderer/data/types/bgm'
import { RelatedSubjectsGrid } from '@renderer/modules/main/subject/related/content'
import { tabFilerAtom } from '@renderer/state/simple-tab'
import { useAtom } from 'jotai'
import { useMemo } from 'react'

interface Props {
  subjectId: SubjectId
}

export function RelatedSubjects({ subjectId }: Props) {
  const _relatedSubjects = useRelatedSubjectsQuery({
    id: subjectId,
    needKeepPreviousData: false,
  }).data
  // 书籍处理特殊化
  const relatedSubjects = useMemo(() => {
    if (_relatedSubjects) {
      const temp = new Map(_relatedSubjects)
      temp.delete('单行本')
      return temp
    }
    return undefined
  }, [_relatedSubjects])
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
        <RelatedSubjectsGrid relatedSubjects={relatedSubjects} filter={filter} />
      ) : (
        <RelatedGridSkeleton />
      )}
    </section>
  )
}

function RelatedGridSkeleton() {
  return (
    <div className="grid w-full grid-cols-[repeat(auto-fill,minmax(8rem,_1fr))] gap-x-2 gap-y-5 py-2">
      {Array(5)
        .fill(0)
        .map((_, index) => (
          <Skeleton className="aspect-square" key={index} />
        ))}
    </div>
  )
}
