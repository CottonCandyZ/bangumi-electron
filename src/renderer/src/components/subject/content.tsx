import { CoverMotionImage } from '@renderer/components/base/CoverMotionImage'
import EpisodesGrid from '@renderer/components/episode/grid'
import PersonsGrid from '@renderer/components/person/grid'
import Characters from '@renderer/components/subject/character'
import Header from '@renderer/components/subject/header'
import Meta from '@renderer/components/subject/meta'
import Score from '@renderer/components/subject/score'
import Summary from '@renderer/components/subject/summary'
import Tags from '@renderer/components/subject/tags'
import { Card } from '@renderer/components/ui/card'
import { Separator } from '@renderer/components/ui/separator'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { SubjectId } from '@renderer/constants/types/bgm'
import { Subject } from '@renderer/constants/types/subject'
import { memo } from 'react'

const SubjectContent = memo(
  ({ subjectId, subjectInfo }: { subjectId: SubjectId; subjectInfo: Subject | undefined }) => {
    return (
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-10">
        <section className="flex w-full flex-row gap-8">
          {/* cover */}
          <Card
            className="h-min w-56 shrink-0 overflow-hidden"
            style={{ viewTransitionName: 'cover-expand' }}
          >
            <CoverMotionImage imageSrc={subjectInfo?.images.common} />
          </Card>
          {/* info */}
          <div className="flex flex-1 flex-col gap-5">
            <section className="flex flex-col gap-2">
              {/* 标题 */}
              {subjectInfo ? <Header {...subjectInfo} /> : <Skeleton className="h-14" />}

              {/* {subjectId} */}
              {/* 一些 meta 数据 */}
              {subjectInfo ? <Meta {...subjectInfo} /> : <Skeleton className="h-5" />}
            </section>
            <Separator />
            <section>
              {subjectInfo ? <Summary {...subjectInfo} /> : <Skeleton className="h-36" />}
            </section>
          </div>
        </section>
        <section className="flex flex-col gap-5">
          <h2 className="text-2xl font-semibold">章节</h2>
          <EpisodesGrid subjectId={subjectId} eps={subjectInfo?.eps} />
        </section>
        <div className="flex flex-row gap-5">
          <section className="flex basis-3/4 flex-col gap-5">
            <h2 className="text-2xl font-semibold">标签</h2>
            <div>
              {subjectInfo ? <Tags tags={subjectInfo.tags} /> : <Skeleton className="h-60" />}
            </div>
          </section>
          <section className="flex min-w-56 flex-1 flex-col gap-2">
            <h2 className="text-2xl font-semibold">评分</h2>
            {subjectInfo ? <Score rating={subjectInfo.rating} /> : <Skeleton className="h-60" />}
          </section>
        </div>
        <Characters subjectId={subjectId} />
        <section className="flex flex-col gap-5">
          <h2 className="text-2xl font-semibold">相关信息</h2>
          <PersonsGrid subjectId={subjectId} />
        </section>
      </div>
    )
  },
)

SubjectContent.displayName = 'SubjectContent'
export default SubjectContent
