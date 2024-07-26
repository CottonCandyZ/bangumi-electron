import { Image } from '@renderer/components/base/Image'
import { BackCover } from '@renderer/components/hover-card/close'
import SubjectBackground from '@renderer/components/subject/background'
import SubjectContent from '@renderer/components/subject/content'
import { useQuerySubjectInfo } from '@renderer/data/hooks/api/subject'
import { SubjectId } from '@renderer/data/types/bgm'
import { isEmpty } from '@renderer/lib/utils/string'
import { useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'

export function Component() {
  const subjectId = useParams().subjectId as SubjectId
  const subjectInfoQuery = useQuerySubjectInfo({ id: subjectId, needKeepPreviousData: false })
  const subjectInfo = subjectInfoQuery.data
  const backImageRef = useRef<HTMLDivElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      if (backImageRef.current) {
        backImageRef.current.style.width = entries[0].target.getBoundingClientRect().width + 'px'
      }
    })
    if (containerRef.current) resizeObserver.observe(containerRef.current)
    return () => {
      if (containerRef.current) resizeObserver.unobserve(containerRef.current)
    }
  }, [backImageRef, containerRef])

  return (
    <div ref={containerRef}>
      {subjectInfo?.images.large && !isEmpty(subjectInfo.images.large) && (
        <Image
          imageSrc={subjectInfo.images.large}
          loading="eager"
          className="fixed -z-10 h-full overflow-hidden"
          ref={backImageRef}
        >
          <SubjectBackground />
        </Image>
      )}

      <div className="relative pb-10 pt-[60rem]">
        <SubjectContent subjectId={subjectId} />
        <BackCover />
      </div>
    </div>
  )
}
