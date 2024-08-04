import SubjectPersonTable from '@renderer/components/subject/person'
import { useParams } from 'react-router-dom'

export default function MainRightPanel() {
  const subjectId = useParams().subjectId
  if (subjectId) return <SubjectPersonTable subjectId={subjectId} />
  return null
}
