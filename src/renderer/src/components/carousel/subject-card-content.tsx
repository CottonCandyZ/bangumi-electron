import { Image } from '@renderer/components/base/Image'
import { Card, CardContent } from '@renderer/components/ui/card'
import { useQuerySubjectInfo } from '@renderer/constants/hooks/subjects'
import { useTopListQuery } from '@renderer/constants/hooks/web'
import { sectionPath } from '@renderer/constants/types/web'

export interface SubjectCardProps {
  sectionPath: sectionPath
  index: number
}

export default function SubjectCard({ sectionPath, index }: SubjectCardProps) {
  const topList = useTopListQuery(sectionPath)
  const subjectId = topList?.data?.[index].SubjectId
  const follow = topList?.data?.[index].follow
  const subjectInfo = useQuerySubjectInfo({ id: subjectId, enabled: !!subjectId })
  return (
    <>
      <Card className="relative overflow-hidden">
        <CardContent className="p-0">
          <Image
            className="z-[2] aspect-[2/3] w-full object-cover"
            src={subjectInfo.data?.images.common}
          />
          <div
            className={`absolute bottom-0 left-0 right-0 z-[3] flex h-12 justify-end bg-gradient-to-t from-black/50 pr-3 pt-3`}
          >
            <div className="text-2xl font-bold italic text-white">
              {subjectInfo.data?.rating.score}
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="mt-2 p-0.5">
        <h1 className="truncate font-semibold">{subjectInfo.data?.name}</h1>
        <h2 className="mt-1 truncate text-xs">{subjectInfo.data?.name_cn}</h2>
      </div>
    </>
  )
}
