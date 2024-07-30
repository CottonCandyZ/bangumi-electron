import { Card } from '@renderer/components/ui/card'
import { SubjectId } from '@renderer/data/types/bgm'
import { unstable_useViewTransitionState, useLocation } from 'react-router-dom'
import { Image } from '@renderer/components/base/Image'
import { isEmpty } from '@renderer/lib/utils/string'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { useQuerySubjectInfo } from '@renderer/data/hooks/api/subject'
import { create } from 'zustand'
import { useInView } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { useViewTransitionStatusState } from '@renderer/components/hover-card/state'

type CoverImageInView = {
  isInView: boolean
  setIsInView: (isInView: boolean) => void
}

export const useCoverImageInView = create<CoverImageInView>()((set) => ({
  isInView: true,
  setIsInView: (isInView: boolean) => set({ isInView }),
}))

export default function SubjectCoverImage({ subjectId }: { subjectId: SubjectId }) {
  const { state } = useLocation()
  const subjectInfoQuery = useQuerySubjectInfo({ id: subjectId, needKeepPreviousData: false })
  const subjectInfo = subjectInfoQuery.data
  const cardRef = useRef(null)
  const isInView = useInView(cardRef)
  const setIsInView = useCoverImageInView((state) => state.setIsInView)
  const isTransitioning = unstable_useViewTransitionState(`/subject/${subjectId}`)
  useEffect(() => {
    setIsInView(isInView)
  }, [isInView])
  return (
    <Card
      className="h-min w-56 shrink-0 overflow-hidden"
      style={{
        viewTransitionName:
          isTransitioning && state?.viewTransitionName ? state.viewTransitionName : '',
      }}
      ref={cardRef}
    >
      {subjectInfo !== undefined ? (
        !isEmpty(subjectInfo.images.common) ? (
          <Image imageSrc={subjectInfo.images.common} loadingClassName="aspect-[2/3]" />
        ) : (
          <div className="flex aspect-[2/3] items-center justify-center">还没有图片哦</div>
        )
      ) : (
        <Skeleton className="aspect-[2/3]" />
      )}
    </Card>
  )
}
