import { CoverMotionImage } from '@renderer/components/base/cover-motion-image'
import { CollectionHeader } from '@renderer/components/base/headers'
import { MyLink } from '@renderer/components/base/my-link'
import EpisodesGrid from '@renderer/components/episodes/grid'
import { Card, CardContent } from '@renderer/components/ui/card'
import { CollectionData } from '@renderer/data/types/collection'
import { cn } from '@renderer/lib/utils'
import { useLocation } from 'react-router-dom'

export default function CollectionItem({
  collectionItemInfo,
}: {
  collectionItemInfo: CollectionData
}) {
  const { pathname } = useLocation()
  const mainSubjectId = pathname.split('/').at(-1)

  return (
    <MyLink
      to={`/subject/${collectionItemInfo.subject_id}`}
      className={cn('group cursor-default')}
      onClick={(e) =>
        mainSubjectId === collectionItemInfo.subject_id.toString() && e.preventDefault()
      }
    >
      <Card
        className={cn(
          'h-full border-none shadow-none group-hover:bg-accent group-hover:duration-500',
          mainSubjectId === collectionItemInfo.subject_id.toString() && 'bg-accent',
        )}
      >
        <CardContent className="p-2">
          <div className="flex flex-row gap-2">
            <CoverMotionImage
              imageSrc={collectionItemInfo.subject.images.grid}
              className="aspect-square h-fit w-14 shrink-0 overflow-hidden rounded-md border shadow-sm"
            />
            <div className="flex flex-col gap-2">
              <CollectionHeader {...collectionItemInfo.subject} />
              <section>
                <EpisodesGrid
                  eps={collectionItemInfo.subject.eps}
                  size="small"
                  selector={false}
                  subjectId={collectionItemInfo.subject_id}
                />
              </section>
            </div>
          </div>
        </CardContent>
      </Card>
    </MyLink>
  )
}