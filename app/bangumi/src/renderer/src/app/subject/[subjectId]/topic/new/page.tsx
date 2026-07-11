import { CreateSubjectTopicPage } from '@renderer/modules/main/subject/create-topic'
import { useParams } from 'react-router-dom'

export function Component() {
  const { subjectId } = useParams()
  return <CreateSubjectTopicPage subjectId={subjectId} />
}
