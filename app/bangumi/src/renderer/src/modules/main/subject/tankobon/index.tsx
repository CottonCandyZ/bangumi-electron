import { TooltipArrow } from '@radix-ui/react-tooltip'
import {
  ViewTransitionElement,
  ViewTransitionImage,
} from '@renderer/components/image/view-transition-image'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@renderer/components/ui/tooltip'
import { useRelatedSubjectsQuery } from '@renderer/data/hooks/api/subject'
import { useSubjectInfoQuery } from '@renderer/data/hooks/db/subject'
import { SubjectId } from '@renderer/data/types/bgm'
import { RelatedSubject } from '@renderer/data/types/subject'
import { isEmpty } from '@renderer/lib/utils/string'
import { OpenMonoListPanelButton } from '@renderer/modules/panel/left-panel/open-mono-list-panel'
import type { MonoListPanelTab } from '@renderer/state/panel'
import { Link, useViewTransitionState, useLocation } from 'react-router-dom'

interface Props {
  subjectId: SubjectId
}

/** 单行本列表 */
export function Tankobon({ subjectId }: Props) {
  const subjectInfoQuery = useSubjectInfoQuery({ subjectId, needKeepPreviousData: false })
  /** 由于 API 给单行版的列表现在是在关联条目里面，所以 */
  const relatedSubjects = useRelatedSubjectsQuery({
    id: subjectId,
    needKeepPreviousData: false,
  }).data
  const tankobon = relatedSubjects?.get('单行本')
  if (!relatedSubjects) return <TankobonSkeleton num={5} />
  if (tankobon === undefined) return null
  const sourceTitle =
    subjectInfoQuery.data?.name_cn || subjectInfoQuery.data?.name || `条目 ${subjectId}`
  const panelTab = {
    id: `subject-tankobon-${subjectId}`,
    type: 'subjectTankobon',
    title: '单行本',
    sourceTitle,
    subjectId,
    relatedSubjects: tankobon,
  } satisfies MonoListPanelTab

  return (
    <div className="flex flex-col gap-2">
      <div className="flex shrink-0 flex-row items-center gap-2">
        <h2 className="text-2xl font-medium">单行本</h2>
        <OpenMonoListPanelButton className="mt-1 size-8" tab={panelTab} title="在侧栏打开单行本" />
      </div>
      <div className="flex flex-row flex-wrap gap-2">
        {tankobon.map((item) => (
          <Item item={item} key={item.id} />
        ))}
      </div>
    </div>
  )
}

function Item({ item }: { item: RelatedSubject }) {
  const { key } = useLocation()
  const isTransitioning = useViewTransitionState(`/subject/${item.id}`)
  return (
    <Tooltip key={item.id} delayDuration={0}>
      <TooltipTrigger>
        <Link
          to={`/subject/${item.id}`}
          state={{ viewTransitionName: `cover-image-${key}` }}
          viewTransition
        >
          {!isEmpty(item.images.small) ? (
            <ViewTransitionImage
              active={isTransitioning}
              imageSrc={item.images.small}
              className="size-20 overflow-hidden rounded-xl border shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-xl"
              viewTransitionName={`cover-image-${key}`}
            />
          ) : (
            <ViewTransitionElement
              active={isTransitioning}
              className="bg-accent size-20 rounded-xl border shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-xl"
              viewTransitionName={`cover-image-${key}`}
            />
          )}
        </Link>
      </TooltipTrigger>
      <TooltipContent sideOffset={7}>
        <span>{item.name}</span>
        <TooltipArrow className="fill-primary" />
      </TooltipContent>
    </Tooltip>
  )
}

function TankobonSkeleton({ num }: { num: number }) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="shrink-0 text-2xl font-medium">单行本</h2>
      <div className="flex flex-row flex-wrap gap-2">
        {Array(num)
          .fill(0)
          .map((_, index) => (
            <Skeleton key={index} className="size-20" />
          ))}
      </div>
    </div>
  )
}
