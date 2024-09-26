import { TooltipArrow } from '@radix-ui/react-tooltip'
import { Image } from '@renderer/components/image/image'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@renderer/components/ui/tooltip'
import { useQueryRelatedSubjects } from '@renderer/data/hooks/api/subject'
import { SubjectId } from '@renderer/data/types/bgm'
import { RelatedSubject } from '@renderer/data/types/subject'
import { isEmpty } from '@renderer/lib/utils/string'
import { Link } from 'react-router-dom'

export function Tankobon({ subjectId }: { subjectId: SubjectId }) {
  const relatedSubjectsQuery = useQueryRelatedSubjects({
    id: subjectId,
    needKeepPreviousData: false,
  })
  const relatedSubjects = relatedSubjectsQuery.data
  const tankobon = relatedSubjects?.get('单行本')
  if (!relatedSubjects) return <TankobonSkeleton num={5} />
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
  return (
    <Tooltip key={item.id} delayDuration={0}>
      <TooltipTrigger>
        <Link to={`/subject/${item.id}`}>
          {!isEmpty(item.images.small) ? (
            <Image
              imageSrc={item.images.small}
              className="size-20 overflow-hidden rounded-xl border shadow transition-all duration-150 hover:shadow-xl"
            />
          ) : (
            <div className="size-20 rounded-xl border bg-accent shadow transition-all duration-150 hover:shadow-xl" />
          )}
        </Link>
      </TooltipTrigger>
      <TooltipContent>
        <span>{item.name}</span>
        <TooltipArrow />
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
