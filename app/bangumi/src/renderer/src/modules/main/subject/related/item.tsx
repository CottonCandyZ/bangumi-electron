import { MyLink } from '@renderer/components/my-link'
import { Image } from '@renderer/components/image/image'
import { ViewTransitionElement } from '@renderer/components/image/view-transition-image'
import { RelatedSubject } from '@renderer/data/types/subject'
import { useViewTransitionState, useLocation } from 'react-router-dom'

const sectionId = 'RelatedSubjects'
export function Item({
  relatedSubject,
  relation,
}: {
  relatedSubject: RelatedSubject
  /** 「全部」视图下显示关系标签 */
  relation?: string
}) {
  const { key } = useLocation()
  const layoutId = `${sectionId}-${relatedSubject.id}-${key}`

  const isTransitioning = useViewTransitionState(`/subject/${relatedSubject.id}`)

  return (
    <MyLink
      to={`/subject/${relatedSubject.id}`}
      contextMenuTitle={{ name: relatedSubject.name, nameCN: relatedSubject.name_cn }}
      className="group/related flex min-w-0 cursor-default flex-col gap-2 focus-visible:outline-hidden"
      state={{ viewTransitionName: `cover-image-${key}` }}
      viewTransition
    >
      <ViewTransitionElement
        active={isTransitioning}
        className="overflow-hidden rounded-lg"
        viewTransitionName={`cover-image-${key}`}
      >
        <div className="bg-muted group-focus-visible/related:ring-ring/50 overflow-hidden rounded-lg ring-1 ring-black/5 transition-[filter] group-hover/related:brightness-110 group-focus-visible/related:ring-2 dark:ring-white/10">
          {relatedSubject.images.common !== '' ? (
            <Image
              key={`${layoutId}-image`}
              imageSrc={relatedSubject.images.common}
              className="aspect-square"
            />
          ) : (
            <div className="aspect-square" />
          )}
        </div>
      </ViewTransitionElement>
      <div className="flex min-w-0 flex-col gap-0.5">
        {relation && <span className="text-muted-foreground text-xs">{relation}</span>}
        <span className="line-clamp-2 text-sm leading-snug group-hover/related:underline group-hover/related:underline-offset-2">
          {relatedSubject.name}
        </span>
      </div>
    </MyLink>
  )
}
