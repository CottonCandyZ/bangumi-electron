import { Card } from '@renderer/components/ui/card'
import { SubjectId } from '@renderer/data/types/bgm'
import { unstable_useViewTransitionState, useLocation } from 'react-router-dom'
import { Image } from '@renderer/components/image/image'
import { isEmpty } from '@renderer/lib/utils/string'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { useQuerySubjectInfo } from '@renderer/data/hooks/api/subject'
import { useInView } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { useSetAtom } from 'jotai'
import { subjectCoverImageInViewAtom } from '@renderer/state/in-view'

export default function SubjectCoverImage({ subjectId }: { subjectId: SubjectId }) {
  const { state } = useLocation()
  const subjectInfoQuery = useQuerySubjectInfo({ subjectId, needKeepPreviousData: false })
  const subjectInfo = subjectInfoQuery.data
  const cardRef = useRef(null)
  const isInView = useInView(cardRef)
  const setIsInView = useSetAtom(subjectCoverImageInViewAtom)
  const isTransitioning = unstable_useViewTransitionState(`/subject/${subjectId}`)
  useEffect(() => {
    setIsInView(isInView)
  }, [isInView, subjectId])
  return (
    <Card
      className="h-min w-56 shrink-0 overflow-hidden border-none"
      style={{
        viewTransitionName:
          isTransitioning && state?.viewTransitionName ? state.viewTransitionName : '',
      }}
      ref={cardRef}
    >
      {subjectInfo !== undefined ? (
        !isEmpty(subjectInfo.images.common) ? (
          <Image imageSrc={subjectInfo.images.common} loadingClassName="aspect-[22/31]" />
        ) : (
          <div className="flex aspect-[2/3] items-center justify-center">还没有图片哦</div>
        )
      ) : (
        <Skeleton className="aspect-[2/3]" />
      )}
    </Card>
  )
}
