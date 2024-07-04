import { CoverMotionImage } from '@renderer/components/base/CoverMotionImage'
import { Card } from '@renderer/components/ui/card'
import { useQuerySubjectInfo } from '@renderer/constants/hooks/api/subject'
import { SubjectId } from '@renderer/constants/types/bgm'
import { useParams } from 'react-router-dom'

export function Component() {
  const subjectId = useParams().subjectId as SubjectId
  const subjectInfo = useQuerySubjectInfo({ id: subjectId })

  return (
    <div className="">
      {/* cover && info */}
      <section>
        <Card className="w-60 overflow-hidden" style={{ viewTransitionName: 'cover-expand' }}>
          <CoverMotionImage imageSrc={subjectInfo.data?.images.medium} />
        </Card>
      </section>
    </div>
  )
}
