import { Image } from '@renderer/components/image/image'
import { useSubjectInfoQuery } from '@renderer/data/hooks/db/subject'
import { SubjectId } from '@renderer/data/types/bgm'
import { isEmpty } from '@renderer/lib/utils/string'
import { SubjectBackground } from '@renderer/modules/main/subject/background/filter'
import { mainContainerLeft, mainContainerRight } from '@renderer/state/main-bounding-box'
import { useAtomValue } from 'jotai'

export function BackgroundImage({ subjectId }: { subjectId: SubjectId }) {
  const subjectInfoQuery = useSubjectInfoQuery({ subjectId, needKeepPreviousData: false })
  const subjectInfo = subjectInfoQuery.data
  const left = useAtomValue(mainContainerLeft)
  const right = useAtomValue(mainContainerRight)

  return (
    subjectInfo &&
    !isEmpty(subjectInfo.images.large) && (
      <Image
        key={subjectInfo.images.large}
        imageSrc={subjectInfo.images.large}
        loading="eager"
        className="fixed -z-10 h-full overflow-hidden"
        style={{
          left,
          right: window.innerWidth - right,
        }}
      >
        <SubjectBackground />
      </Image>
    )
  )
}
