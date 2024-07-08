import { CoverMotionImage } from '@renderer/components/base/CoverMotionImage'
import EpisodesGrid from '@renderer/components/episode/grid'
import Header from '@renderer/components/subject/header'
import Meta from '@renderer/components/subject/meta'
import Score from '@renderer/components/subject/score'
import Summary from '@renderer/components/subject/summary'
import Tags from '@renderer/components/subject/tags'
import { Card } from '@renderer/components/ui/card'
import { Separator } from '@renderer/components/ui/separator'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { useQuerySubjectInfo } from '@renderer/constants/hooks/api/subject'
import { SubjectId } from '@renderer/constants/types/bgm'
import { useParams } from 'react-router-dom'

export function Component() {
  const subjectId = useParams().subjectId as SubjectId
  // const subjectId = 372010
  const subjectInfo = useQuerySubjectInfo({ id: subjectId })
  const subjectInfoData = subjectInfo.data

  return (
    <div className="">
      {/* cover && info */}
      <div className="mx-auto mb-40 mt-10 flex max-w-6xl flex-col gap-10 px-10">
        <section className="flex w-full flex-row gap-8">
          {/* cover */}
          <Card
            className="h-min w-52 shrink-0 overflow-hidden"
            style={{ viewTransitionName: 'cover-expand' }}
          >
            <CoverMotionImage imageSrc={subjectInfoData?.images.common} />
          </Card>
          {/* info */}
          <div className="flex flex-1 flex-col gap-5">
            <section className="flex flex-col gap-2">
              {/* 标题 */}
              {subjectInfoData ? <Header {...subjectInfoData} /> : <Skeleton className="h-14" />}

              {/* {subjectId} */}
              {/* 一些 meta 数据 */}
              {subjectInfoData ? <Meta {...subjectInfoData} /> : <Skeleton className="h-5" />}
            </section>
            <Separator />
            <section>
              {subjectInfoData ? <Summary {...subjectInfoData} /> : <Skeleton className="h-36" />}
            </section>
          </div>
        </section>
        <section className="flex flex-col gap-5">
          <h2 className="text-2xl font-semibold">章节</h2>
          <EpisodesGrid subjectId={subjectId} eps={subjectInfoData?.eps} />
        </section>
        <div className="flex flex-row gap-5">
          <section className="flex basis-3/4 flex-col gap-5">
            <h2 className="text-2xl font-semibold">标签</h2>
            <div>
              {subjectInfoData ? (
                <Tags tags={subjectInfoData.tags} />
              ) : (
                <Skeleton className="h-60" />
              )}
            </div>
          </section>
          <section className="flex min-w-56 flex-1 flex-col gap-2">
            <h2 className="text-2xl font-semibold">评分</h2>
            {subjectInfoData ? (
              <Score rating={subjectInfoData.rating} />
            ) : (
              <Skeleton className="h-60" />
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
