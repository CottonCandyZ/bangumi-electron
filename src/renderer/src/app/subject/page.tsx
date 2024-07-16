import { Image } from '@renderer/components/base/Image'
import { ScrollContext } from '@renderer/components/base/page-scroll-wrapper'
import { BackCover } from '@renderer/components/hoverCard/close'
import SubjectContent from '@renderer/components/subject/content'
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
  const subjectInfoQuery = useQuerySubjectInfo({ id: subjectId })
  const subjectInfo = subjectInfoQuery.data
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
    setTimeout(
      () =>
        instance()
          ?.elements()
          .viewport?.scrollTo({ top: scrollCache.get(key) ?? initScrollTop }),
      0,
    )
    instance()?.on('scroll', scrollListener)
    return () => instance()?.off('scroll', scrollListener)
  }, [])

  return (
    <div className="relative h-full overflow-hidden">
      <Image
        imageSrc={subjectInfo?.images.large}
        loading="eager"
        className="fixed left-[73px] top-[65px] aspect-[2/3] max-h-full w-full overflow-hidden rounded-tl-lg"
      />
      {/* cover && info */}
      <div className="relative z-10">
        <div className="relative -mr-2 pb-96 pr-2 pt-[60rem]">
          <div
            className="absolute left-0 right-0 top-0 -z-10 h-[100rem]"
            style={{
              background: `linear-gradient(to top, hsl(var(--card)) ${percent}%, hsl(var(--card) / 0) ${percent + 130}%)`,
            }}
          ></div>
          <div className="absolute inset-0 top-[100rem] -z-10 bg-background"></div>
          <SubjectContent subjectId={subjectId} subjectInfo={subjectInfo} />
          <BackCover />
        </div>
      </div>
    </div>
  )
}
