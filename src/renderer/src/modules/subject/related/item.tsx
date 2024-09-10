import { CoverMotionImage } from '@renderer/components/image/cover-motion-image'
import {
  HoverCardContent,
  HoverPopCard,
  PopCardContent,
} from '@renderer/components/hover-pop-card/dynamic-size'
import { Card, CardContent } from '@renderer/components/ui/card'
import { RelatedSubject } from '@renderer/data/types/subject'
import { Link } from 'react-router-dom'
import { activeHoverPopCardAtom } from '@renderer/state/hover-pop-card'
import { useAtomValue } from 'jotai'

const sectionId = 'RelatedSubjects'
export function Item({ relatedSubject }: { relatedSubject: RelatedSubject }) {
  const layoutId = `${sectionId}-${relatedSubject.id}`

  /* eslint-disable */
  // @ts-ignore: framer-motion needed
  const activeId = useAtomValue(activeHoverPopCardAtom) // framer motion 需要其用于确保 re-render ?
  /* eslint-enable */

  // const { key } = useLocation()
  // const isTransitioning = unstable_useViewTransitionState(`/subject/${relatedSubject.id}`)
  return (
    <HoverPopCard layoutId={layoutId}>
      <HoverCardContent>
        <div className="flex flex-col gap-2">
          <Link
            to={`/subject/${relatedSubject.id}`}
            className="cursor-default"
            // state={{ viewTransitionName: `${key}-cover-image` }}
            unstable_viewTransition
          >
            <Card
              className="overflow-hidden hover:-translate-y-0.5 hover:shadow-xl hover:duration-700"
              // style={{ viewTransitionName: isTransitioning ? `${key}-cover-image` : '' }}
            >
              <CardContent className="p-0">
                {/* FIXME:需要确保 image transition 正常，或重写该组件 */}
                {relatedSubject.images.common !== '' ? (
                  <CoverMotionImage
                    layoutId={`${layoutId}-image`}
                    imageSrc={relatedSubject.images.common}
                    className="aspect-square"
                  />
                ) : (
                  <div className="aspect-square bg-muted" />
                )}
              </CardContent>
            </Card>
          </Link>
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
                layoutId={`${layoutId}-image`}
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
