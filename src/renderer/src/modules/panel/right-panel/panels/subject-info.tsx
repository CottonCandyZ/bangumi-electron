import { SubjectPersonTable } from '@renderer/modules/subject/person'
import { useParams } from 'react-router-dom'

export function SubjectInfoPanel() {
  const subjectId = useParams().subjectId
  if (subjectId) return <SubjectPersonTable subjectId={subjectId} />
  return null
}
