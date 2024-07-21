import { CoverMotionImage } from '@renderer/components/base/cover-motion-image'
import { MyLink } from '@renderer/components/base/my-link'
import { HoverCardContent, HoverPopCard, PopCardContent } from '@renderer/components/hover-card'
import { Card, CardContent } from '@renderer/components/ui/card'
import { RelatedSubject } from '@renderer/data/types/subject'
import { unstable_useViewTransitionState, useLocation } from 'react-router-dom'

const sectionId = 'RelatedSubjects'
export default function Item({ relatedSubject }: { relatedSubject: RelatedSubject }) {
  const layoutId = `${sectionId}-${relatedSubject.id}`
  const isTransitioning = unstable_useViewTransitionState(`/subject/${relatedSubject.id}`)
  const { key } = useLocation()
  return (
    <HoverPopCard layoutId={layoutId}>
      <HoverCardContent>
        <div className="flex flex-col gap-2">
          <MyLink
            to={`/subject/${relatedSubject.id}`}
            className="cursor-default"
            state={{ viewTransitionName: `cover-image-${key}` }}
            unstable_viewTransition
          >
            <Card
              className="relative overflow-hidden hover:-translate-y-0.5 hover:shadow-xl hover:duration-700"
              style={{
                viewTransitionName: isTransitioning ? `cover-image-${key}` : '',
              }}
            >
              <CardContent className="aspect-square p-0">
                {relatedSubject.images.common !== '' ? (
                  <CoverMotionImage
                    layoutId={`${layoutId}-image-${key}`}
                    imageSrc={relatedSubject.images.small}
                    className="aspect-square"
                  />
                ) : (
                  <div className="aspect-square bg-muted" />
                )}
              </CardContent>
            </Card>
          </MyLink>
          <div className="flex flex-col">
            <span className="line-clamp-3 text-xs">{relatedSubject.name}</span>
          </div>
        </div>
      </HoverCardContent>
      <PopCardContent className="cursor-default">
        <Card className="min-h-48 w-56">
          <CardContent className="p-2">
            <div className="flex flex-row gap-2">
              <CoverMotionImage
                layoutId={`${layoutId}-image-${key}`}
                imageSrc={relatedSubject.images.common}
                className="h-fit shrink-0 basis-1/3 overflow-hidden rounded-md"
                loadingClassName="aspect-[2/3]"
              />
              <div className="text-xs font-bold">{relatedSubject.name}</div>
            </div>
          </CardContent>
        </Card>
      </PopCardContent>
    </HoverPopCard>
  )
}
