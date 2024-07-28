import { Image } from '@renderer/components/base/Image'
import { MyLink } from '@renderer/components/base/my-link'
import {
  HoverCardContent,
  HoverCardItem,
  HoverPopCard,
  PopCardContent,
} from '@renderer/components/hover-card'
import { Card, CardContent } from '@renderer/components/ui/card'
import { RelatedSubject } from '@renderer/data/types/subject'
import { unstable_useViewTransitionState, useLocation } from 'react-router-dom'

const sectionId = 'RelatedSubjects'
export default function Item({ relatedSubject }: { relatedSubject: RelatedSubject }) {
  const { key } = useLocation()
  const layoutId = `${sectionId}-${relatedSubject.id}-${key}`
  const isTransitioning = unstable_useViewTransitionState(`/subject/${relatedSubject.id}`)
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
                <HoverCardItem layoutId="pop-image">
                  {relatedSubject.images.common !== '' ? (
                    <Image
                      imageSrc={relatedSubject.images.small}
                      className="aspect-square overflow-hidden rounded-xl"
                    />
                  ) : (
                    <div className="aspect-square bg-muted" />
                  )}
                </HoverCardItem>
              </CardContent>
            </Card>
          </MyLink>
          <HoverCardItem className="flex flex-col" layoutId="pop-title">
            <span className="line-clamp-3 text-xs">{relatedSubject.name}</span>
          </HoverCardItem>
        </div>
      </HoverCardContent>
      <PopCardContent className="cursor-default">
        <Card className="min-h-48 w-56">
          <CardContent className="p-2">
            <div className="flex flex-row gap-2">
              <Image
                imageSrc={relatedSubject.images.small}
                className="h-fit shrink-0 basis-1/3 overflow-hidden rounded-md"
                loadingClassName="aspect-[2/3]"
                style={{ viewTransitionName: 'pop-image' }}
              />
              <div className="text-xs font-bold" style={{ viewTransitionName: 'pop-title' }}>
                {relatedSubject.name}
              </div>
            </div>
          </CardContent>
        </Card>
      </PopCardContent>
    </HoverPopCard>
  )
}
