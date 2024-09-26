import { BackgroundImage } from '@renderer/modules/subject/background'
import { SubjectContent } from '@renderer/modules/subject/content'
import { mainContainerHeight } from '@renderer/state/main-bounding-box'
import { useAtomValue } from 'jotai'
import { useParams } from 'react-router-dom'

export function Component() {
  const subjectId = useParams().subjectId
  const height = useAtomValue(mainContainerHeight)
  if (!subjectId) throw Error('Get Params Error')
  return (
    <div>
      <BackgroundImage subjectId={subjectId} />
      <SubjectContent
        subjectId={subjectId}
        className="relative pb-10 pt-[40rem]"
        style={{ paddingTop: `${height * 0.83}px` }}
      />
    </div>
  )
}
