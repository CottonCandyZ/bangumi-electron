import { usePageScrollRestoreReady } from '@renderer/components/scroll/page-scroll-wrapper'
import { Tabs } from '@renderer/components/tabs'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { useRelatedSubjectsQuery } from '@renderer/data/hooks/api/subject'
import { useSubjectInfoQuery } from '@renderer/data/hooks/db/subject'
import { SubjectId } from '@renderer/data/types/bgm'
import { SERIES_RELATIONS } from '@renderer/modules/main/subject/header-info/series-links'
import { RelatedSubjectsGrid } from '@renderer/modules/main/subject/related/content'
import { OpenMonoListPanelButton } from '@renderer/modules/panel/left-panel/open-mono-list-panel'
import type { MonoListPanelTab } from '@renderer/state/panel'
import { tabFilerAtom } from '@renderer/state/simple-tab'
import { useAtom } from 'jotai'
import { useMemo } from 'react'

interface Props {
  subjectId: SubjectId
}

export function RelatedSubjects({ subjectId }: Props) {
  const subjectInfoQuery = useSubjectInfoQuery({ subjectId, needKeepPreviousData: false })
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
      // 前传、续集已经放在标题下面
      SERIES_RELATIONS.forEach((relation) => temp.delete(relation))
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
  const panelTab = () => {
    if (!relatedSubjects) return

    return {
      id: `subject-related-${subjectId}`,
      type: 'subjectRelated',
      title: '关联条目',
      sourceTitle,
      subjectId,
      relatedSubjects: allRelatedSubjects,
    } satisfies MonoListPanelTab
  }

  if (relatedSubjects?.size === 0) return null
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-row items-center justify-between gap-6">
        <div className="flex shrink-0 flex-row items-center gap-2">
          <h2 className="text-base font-semibold">关联条目</h2>
          <OpenMonoListPanelButton
            className="size-6"
            disabled={!relatedSubjects}
            tab={panelTab}
            title="在侧栏打开关联条目"
          />
        </div>
        {relatedSubjects ? (
          <Tabs
            variant="underline"
            currentSelect={filter}
            setCurrentSelect={setFilter}
            tabsContent={relations}
            layoutId={id}
          />
        ) : (
          <Skeleton className="h-5 w-48" />
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
    <div className="grid w-full grid-cols-[repeat(auto-fill,minmax(7.5rem,1fr))] gap-x-3 gap-y-4">
      {Array(6)
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
      <Skeleton className="aspect-square rounded-lg" />
      <div className="flex flex-col gap-1">
        <Skeleton className="h-3 w-10" />
        <Skeleton className="h-3.5 w-full" />
      </div>
    </div>
  )
}
