import { BackgroundImage } from '@renderer/modules/main/subject/background'
import { SubjectContent } from '@renderer/modules/main/subject/content'
import { mainContainerHeight } from '@renderer/state/main-bounding-box'
import { useAtomValue } from 'jotai'
import { useParams } from 'react-router-dom'

export function Component() {
  const subjectId = useParams().subjectId
  const height = useAtomValue(mainContainerHeight)
  if (!subjectId) throw Error('Get Params Error')
  return (
    <>
      <BackgroundImage subjectId={subjectId} />
      <SubjectContent
        subjectId={subjectId}
        className="relative pb-10"
        style={{ paddingTop: `${height * 0.83}px` }}
      />
    </>
  )
}
