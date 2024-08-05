import { Image } from '@renderer/components/base/Image'
import SubjectBackground from '@renderer/components/subject/background'
import SubjectContent from '@renderer/components/subject/content'
import { useQuerySubjectInfo } from '@renderer/data/hooks/api/subject'
import { useResizeOb } from '@renderer/hooks/resize'
import { isEmpty } from '@renderer/lib/utils/string'
import { useRef } from 'react'
import { useParams } from 'react-router-dom'

export function Component() {
  const subjectId = useParams().subjectId
  const subjectInfoQuery = useQuerySubjectInfo({ id: subjectId, needKeepPreviousData: false })
  const subjectInfo = subjectInfoQuery.data
  const backImageRef = useRef<HTMLDivElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  useResizeOb({
    ref: containerRef,
    callback: (entries) => {
      if (backImageRef.current) {
        backImageRef.current.style.width = entries[0].target.getBoundingClientRect().width + 'px'
      }
    },
    deps: [backImageRef, subjectId],
  })
  if (!subjectId) throw Error('Get Params Error')
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
      </div>
    </div>
  )
}
