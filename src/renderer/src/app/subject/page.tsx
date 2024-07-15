import { CoverMotionImage } from '@renderer/components/base/CoverMotionImage'
import { Image } from '@renderer/components/base/Image'
import { ScrollContext } from '@renderer/components/base/page-scroll-wrapper'
import CharactersGrid from '@renderer/components/character/gird'
import EpisodesGrid from '@renderer/components/episode/grid'
import { BackCover } from '@renderer/components/hoverCard/close'
import Header from '@renderer/components/subject/header'
import Meta from '@renderer/components/subject/meta'
import Score from '@renderer/components/subject/score'
import Summary from '@renderer/components/subject/summary'
import Tags from '@renderer/components/subject/tags'
import { Card } from '@renderer/components/ui/card'
import { Separator } from '@renderer/components/ui/separator'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { SateContext } from '@renderer/components/wrapper/state-wrapper'
import { useQuerySubjectInfo } from '@renderer/constants/hooks/api/subject'
import { SubjectId } from '@renderer/constants/types/bgm'
import { useContext, useEffect, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'

const initScrollTop = 700
const initPercent = -60
const scrollRange = 1500
const init = (top: number | undefined) => {
  return top === undefined
    ? initPercent
    : top >= scrollRange
      ? 100
      : (top / scrollRange) * (100 - initPercent) + initPercent
}
export function Component() {
  const subjectId = useParams().subjectId as SubjectId
  // const subjectId = 385208
  const subjectInfo = useQuerySubjectInfo({ id: subjectId })
  const subjectInfoData = subjectInfo.data
  const instance = useContext(ScrollContext)
  if (!instance) throw Error('Component need to be wrapped in ScrollContext')
  const stateContext = useContext(SateContext)
  if (!stateContext) {
    throw new Error('PageScrollWrapper need in StateWrapper')
  }
  const { key } = useLocation()
  const { scrollCache } = stateContext
  const [percent, setPercent] = useState(init(scrollCache.get(key) ?? initScrollTop))
  const scrollListener = () => {
    const top = instance()?.elements().viewport?.scrollTop
    setPercent(init(top))
  }
  useEffect(() => {
    instance()
      ?.elements()
      .viewport?.scrollTo({ top: scrollCache.get(key) ?? initScrollTop })
    instance()?.on('scroll', scrollListener)
    return () => instance()?.off('scroll', scrollListener)
  }, [])

  return (
    <div className="relative h-full overflow-hidden">
      <Image
        imageSrc={subjectInfoData?.images.large}
        loading="eager"
        className="fixed left-[73px] top-[65px] aspect-[2/3] max-h-full w-full overflow-hidden rounded-tl-lg"
      />
      {/* cover && info */}
      <div className="relative z-10">
        <div className="relative -mr-2 pr-2 pt-[60rem]">
          <div
            className="absolute left-0 right-0 top-0 -z-10 h-[100rem]"
            style={{
              background: `linear-gradient(to top, hsl(var(--card)) ${percent}%, hsl(var(--card) / 0) ${percent + 130}%)`,
            }}
          ></div>
          <div className="absolute inset-0 top-[100rem] -z-10 bg-card"></div>
          <div className="mx-auto flex max-w-6xl flex-col gap-10 px-10 pb-40">
            <section className="flex w-full flex-row gap-8">
              {/* cover */}
              <Card
                className="h-min w-56 shrink-0 overflow-hidden"
                style={{ viewTransitionName: 'cover-expand' }}
              >
                <CoverMotionImage imageSrc={subjectInfoData?.images.common} />
              </Card>
              {/* info */}
              <div className="flex flex-1 flex-col gap-5">
                <section className="flex flex-col gap-2">
                  {/* 标题 */}
                  {subjectInfoData ? (
                    <Header {...subjectInfoData} />
                  ) : (
                    <Skeleton className="h-14" />
                  )}

                  {/* {subjectId} */}
                  {/* 一些 meta 数据 */}
                  {subjectInfoData ? <Meta {...subjectInfoData} /> : <Skeleton className="h-5" />}
                </section>
                <Separator />
                <section>
                  {subjectInfoData ? (
                    <Summary {...subjectInfoData} />
                  ) : (
                    <Skeleton className="h-36" />
                  )}
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
            <section className="flex flex-col gap-5">
              <h2 className="text-2xl font-semibold">角色</h2>
              <CharactersGrid subjectId={subjectId} />
            </section>
          </div>
          <BackCover />
        </div>
      </div>
    </div>
  )
}
