import { Image } from '@renderer/components/base/Image'
import { BackCover } from '@renderer/components/hover-card/close'
import SubjectBackground from '@renderer/components/subject/background'
import SubjectContent from '@renderer/components/subject/content'
import { useQuerySubjectInfo } from '@renderer/data/hooks/api/subject'
import { SubjectId } from '@renderer/data/types/bgm'
import { isEmpty } from '@renderer/lib/utils/string'
import { useParams } from 'react-router-dom'

export function Component() {
  const subjectId = useParams().subjectId as SubjectId
  const subjectInfoQuery = useQuerySubjectInfo({ id: subjectId, needKeepPreviousData: false })
  const subjectInfo = subjectInfoQuery.data

  return (
    <div className="relative h-full overflow-hidden">
      {subjectInfo?.images.large && !isEmpty(subjectInfo.images.large) && (
        <Image
          imageSrc={subjectInfo.images.large}
          loading="eager"
          className="fixed left-[73px] top-[65px] aspect-[2/3] max-h-full w-full overflow-hidden rounded-tl-lg"
        />
      )}
      <div className="relative z-10">
        <div className="relative -mr-2 pb-96 pr-2 pt-[60rem]">
          <SubjectBackground />
          <SubjectContent subjectId={subjectId} />
          <BackCover />
        </div>
      </div>
    </div>
  )
}
