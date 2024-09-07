import SubjectPersonTable from '@renderer/modules/subject/person'
import { useParams } from 'react-router-dom'

export default function SubjectInfoPanel() {
  const subjectId = useParams().subjectId
  if (subjectId) return <SubjectPersonTable subjectId={subjectId} />
  return null
}
