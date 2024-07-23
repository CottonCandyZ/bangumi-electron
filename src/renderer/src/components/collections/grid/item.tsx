import { CoverMotionImage } from '@renderer/components/base/cover-motion-image'
import { CollectionHeader } from '@renderer/components/base/headers'
import { MyLink } from '@renderer/components/base/my-link'
import EpisodesGrid from '@renderer/components/episodes/grid'
import { Card, CardContent } from '@renderer/components/ui/card'
import { CollectionData } from '@renderer/data/types/collection'
import { unstable_useViewTransitionState, useLocation } from 'react-router-dom'

export default function CollectionItem({
  collectionItemInfo,
}: {
  collectionItemInfo: CollectionData
}) {
  const isTransitioning = unstable_useViewTransitionState(
    `/subject/${collectionItemInfo.subject_id}`,
  )
  const { key } = useLocation()

  return (
    <MyLink
      to={`/subject/${collectionItemInfo.subject_id}`}
      className="group cursor-default"
      unstable_viewTransition
      state={{ viewTransitionName: `cover-image-${key}` }}
    >
      <Card className="h-full shadow-sm group-hover:shadow-md group-hover:duration-500">
        <CardContent className="p-2">
          <div className="flex flex-row gap-2">
            <CoverMotionImage
              imageSrc={collectionItemInfo.subject.images.grid}
              className="aspect-square h-fit w-14 shrink-0 overflow-hidden rounded-md border shadow-sm"
              style={{
                viewTransitionName: isTransitioning ? `cover-image-${key}` : '',
              }}
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
