import { TooltipArrow } from '@radix-ui/react-tooltip'
import { Image } from '@renderer/components/image/image'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@renderer/components/ui/tooltip'
import { useRelatedSubjectsQuery } from '@renderer/data/hooks/api/subject'
import { SubjectId } from '@renderer/data/types/bgm'
import { RelatedSubject } from '@renderer/data/types/subject'
import { isEmpty } from '@renderer/lib/utils/string'
import { Suspense } from 'react'
import { Link, unstable_useViewTransitionState, useLocation } from 'react-router-dom'

interface Props {
  subjectId: SubjectId
}

function TankobonContent({ subjectId }: Props) {
  /** 由于 API 给单行版的列表现在是在关联条目里面，所以 */
  const relatedSubjects = useRelatedSubjectsQuery({
    id: subjectId,
    needKeepPreviousData: false,
  }).data
  const tankobon = relatedSubjects?.get('单行本')
  if (tankobon === undefined) return null

  return (
    <div className="flex flex-col gap-2">
      <h2 className="shrink-0 text-2xl font-medium">单行本</h2>
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
  const isTransitioning = unstable_useViewTransitionState(`/subject/${item.id}`)
  return (
    <Tooltip key={item.id} delayDuration={0}>
      <TooltipTrigger>
        <Link
          to={`/subject/${item.id}`}
          state={{ viewTransitionName: `cover-image-${key}` }}
          unstable_viewTransition
        >
          {!isEmpty(item.images.small) ? (
            <Image
              imageSrc={item.images.small}
              style={{ viewTransitionName: isTransitioning ? `cover-image-${key}` : undefined }}
              className="size-20 overflow-hidden rounded-xl border shadow transition-all duration-150 hover:-translate-y-0.5 hover:shadow-xl"
            />
          ) : (
            <div className="size-20 rounded-xl border bg-accent shadow transition-all duration-150 hover:-translate-y-0.5 hover:shadow-xl" />
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

/** 单行本列表 */
export function Tankobon(props: Props) {
  return (
    <Suspense fallback={<TankobonSkeleton num={5} />}>
      <TankobonContent {...props} />
    </Suspense>
  )
}
