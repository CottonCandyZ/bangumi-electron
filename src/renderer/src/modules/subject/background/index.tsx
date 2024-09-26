import { Image } from '@renderer/components/image/image'
import { useQuerySubjectInfo } from '@renderer/data/hooks/api/subject'
import { SubjectId } from '@renderer/data/types/bgm'
import { isEmpty } from '@renderer/lib/utils/string'
import { SubjectBackground } from '@renderer/modules/subject/background/filter'
import { mainContainerWidth } from '@renderer/state/main-bounding-box'
import { useAtomValue } from 'jotai'

export function BackgroundImage({ subjectId }: { subjectId: SubjectId }) {
  const subjectInfoQuery = useQuerySubjectInfo({ subjectId, needKeepPreviousData: false })
  const subjectInfo = subjectInfoQuery.data
  const width = useAtomValue(mainContainerWidth)

  return (
    subjectInfo?.images.large &&
    !isEmpty(subjectInfo.images.large) && (
      <Image
        imageSrc={subjectInfo.images.large}
        loading="eager"
        className="fixed -z-10 h-full overflow-hidden"
        style={{
          width: `${width}px`,
        }}
      >
        <SubjectBackground />
      </Image>
    )
  )
}
