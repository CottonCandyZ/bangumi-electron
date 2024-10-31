import { Image } from '@renderer/components/image/image'
import { Card } from '@renderer/components/ui/card'
import { RelatedSubject } from '@renderer/data/types/subject'
import { Link, unstable_useViewTransitionState, useLocation } from 'react-router-dom'

const sectionId = 'RelatedSubjects'
export function Item({ relatedSubject }: { relatedSubject: RelatedSubject }) {
  const { key } = useLocation()
  const layoutId = `${sectionId}-${relatedSubject.id}-${key}`

  const isTransitioning = unstable_useViewTransitionState(`/subject/${relatedSubject.id}`)
  return (
    <div className="flex flex-col gap-2">
      <Link
        to={`/subject/${relatedSubject.id}`}
        className="cursor-default"
        state={{ viewTransitionName: `cover-image-${key}` }}
        unstable_viewTransition
      >
        <Card
          className="overflow-hidden hover:-translate-y-0.5 hover:shadow-xl hover:duration-700"
          style={{ viewTransitionName: isTransitioning ? `cover-image-${key}` : undefined }}
        >
          {relatedSubject.images.common !== '' ? (
            <Image
              key={`${layoutId}-image`}
              imageSrc={relatedSubject.images.common}
              className="aspect-square"
            />
          ) : (
            <div className="aspect-square bg-muted" />
          )}
        </Card>
      </Link>
      <div className="flex flex-col">
        <span className="line-clamp-3 text-xs">{relatedSubject.name}</span>
      </div>
    </div>
  )
}
