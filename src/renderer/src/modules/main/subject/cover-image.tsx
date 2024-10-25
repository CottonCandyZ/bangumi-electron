import { Card } from '@renderer/components/ui/card'
import { SubjectId } from '@renderer/data/types/bgm'
import { Image } from '@renderer/components/image/image'
import { isEmpty } from '@renderer/lib/utils/string'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { useCallback, useEffect } from 'react'
import { useSetAtom } from 'jotai'
import { subjectCoverImageInViewAtom } from '@renderer/state/in-view'
import { unstable_useViewTransitionState, useLocation } from 'react-router-dom'
import { useInView } from 'react-intersection-observer'
import { useStateHook } from '@renderer/hooks/use-cache-state'
import { useSubjectInfoQuery } from '@renderer/data/hooks/db/subject'

export function SubjectCoverImage({ subjectId }: { subjectId: SubjectId }) {
  const { state } = useLocation()
  const subjectInfoQuery = useSubjectInfoQuery({ subjectId, needKeepPreviousData: false })
  const subjectInfo = subjectInfoQuery.data
  const setIsInView = useSetAtom(subjectCoverImageInViewAtom)
  const isTransitioning = unstable_useViewTransitionState(`/subject/${subjectId}`)
  const { ref: partialRef, inView: isPartialInView } = useInView({
    threshold: 0,
    initialInView: true,
  })
  const { init, setter } = useStateHook({ key: 'coverImageInView' })
  const { ref, inView: isWholeInView } = useInView({
    threshold: 1,
    initialInView: (init as boolean | undefined) ?? true,
  })
  const setRefs = useCallback(
    (node: HTMLDivElement) => {
      partialRef(node)
      ref(node)
    },
    [ref, partialRef],
  )
  useEffect(() => {
    setIsInView(isPartialInView)
  }, [isPartialInView, subjectId, setIsInView])
  useEffect(() => {
    setter(isWholeInView)
  }, [isWholeInView, setter])
  return (
    <Card
      className="h-min w-40 shrink-0 overflow-hidden border-none @3xl:w-48"
      style={{
        viewTransitionName:
          isWholeInView && isTransitioning && state?.viewTransitionName
            ? state.viewTransitionName
            : undefined,
      }}
      ref={setRefs}
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
