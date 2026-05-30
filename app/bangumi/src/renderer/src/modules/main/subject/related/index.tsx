import { usePageScrollRestoreReady } from '@renderer/components/scroll/page-scroll-wrapper'
import { Tabs } from '@renderer/components/tabs'
import { Button } from '@renderer/components/ui/button'
import { Card } from '@renderer/components/ui/card'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { useRelatedSubjectsQuery } from '@renderer/data/hooks/api/subject'
import { useSubjectInfoQuery } from '@renderer/data/hooks/db/subject'
import { SubjectId } from '@renderer/data/types/bgm'
import { RelatedSubjectsGrid } from '@renderer/modules/main/subject/related/content'
import { useOpenMonoListPanelTab } from '@renderer/modules/panel/left-panel/use-open-mono-list-panel-tab'
import { tabFilerAtom } from '@renderer/state/simple-tab'
import { useAtom } from 'jotai'
import { useMemo } from 'react'

interface Props {
  subjectId: SubjectId
}

export function RelatedSubjects({ subjectId }: Props) {
  const subjectInfoQuery = useSubjectInfoQuery({ subjectId, needKeepPreviousData: false })
  const openMonoListPanelTab = useOpenMonoListPanelTab()
  const relatedSubjectsQuery = useRelatedSubjectsQuery({
    id: subjectId,
    needKeepPreviousData: false,
  })
  const _relatedSubjects = relatedSubjectsQuery.data
  usePageScrollRestoreReady(!subjectInfoQuery.isPending && !relatedSubjectsQuery.isPending)
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
  const allRelatedSubjects = relatedSubjects ? [...relatedSubjects.values()].flat() : []
  const sourceTitle =
    subjectInfoQuery.data?.name_cn || subjectInfoQuery.data?.name || `条目 ${subjectId}`
  const openInSidePanel = () => {
    if (!relatedSubjects) return

    openMonoListPanelTab({
      id: `subject-related-${subjectId}`,
      type: 'subjectRelated',
      title: '关联条目',
      sourceTitle,
      subjectId,
      relatedSubjects: allRelatedSubjects,
    })
  }

  if (relatedSubjects?.size === 0) return null
  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-row items-start justify-between gap-10">
        <div className="flex shrink-0 flex-row items-center gap-2">
          <h2 className="text-2xl font-medium">关联条目</h2>
          <Button variant="ghost" size="icon" className="mt-1 size-8" onClick={openInSidePanel}>
            <span className="i-mingcute-box-3-line text-lg" />
          </Button>
        </div>
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
          <RelatedSubjectSkeleton key={index} />
        ))}
    </div>
  )
}

function RelatedSubjectSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <Card className="overflow-hidden shadow-none">
        <Skeleton className="aspect-square rounded-xl" />
      </Card>
      <div className="flex flex-col gap-1">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  )
}
