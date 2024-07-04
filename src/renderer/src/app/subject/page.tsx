import { CoverMotionImage } from '@renderer/components/base/CoverMotionImage'
import { Card } from '@renderer/components/ui/card'
import { useQuerySubjectInfo } from '@renderer/constants/hooks/api/subject'
import { SubjectId } from '@renderer/constants/types/bgm'
import { useParams } from 'react-router-dom'

export function Component() {
  const subjectId = useParams().subjectId as SubjectId
  const subjectInfo = useQuerySubjectInfo({ id: subjectId })
  const subjectInfoData = subjectInfo.data

  return (
    <div className="">
      {/* cover && info */}
      <section className="flex flex-row">
        {/* cover */}
        <Card className="w-52 overflow-hidden" style={{ viewTransitionName: 'cover-expand' }}>
          <CoverMotionImage imageSrc={subjectInfoData?.images.medium} />
        </Card>
        {/* info */}

        <section className="">
          <h1 className="font-jp text-2xl">{subjectInfoData?.name}</h1>
          <h1 className="text-2xl">{subjectInfoData?.name_cn}</h1>
          {/* {dayjs(subjectInfoData?.date, 'YYYY-MM-DD').format('YY 年 M 月')} */}
        </section>
      </section>
    </div>
  )
}
