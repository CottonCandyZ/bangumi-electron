import { CoverMotionImage } from '@renderer/components/image/cover-motion-image'
import { Button } from '@renderer/components/ui/button'
import { Card, CardContent } from '@renderer/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@renderer/components/ui/select'
import { Separator } from '@renderer/components/ui/separator'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { SectionPath } from '@renderer/data/types/web'
import { cn } from '@renderer/lib/utils'
import dayjs from 'dayjs'
import { motion } from 'motion/react'
import { memo } from 'react'
import { useViewTransitionState, useLocation } from 'react-router-dom'
import { MyLink } from '@renderer/components/my-link'
import { useAtomValue, useSetAtom } from 'jotai'
import { activeSectionAtom } from '@renderer/state/small-carousel'
import { activeHoverPopCardAtom } from '@renderer/state/hover-pop-card'
import {
  HoverCardContent,
  HoverPopCard,
  PopCardContent,
} from '@renderer/components/hover-pop-card/fixed-size'
import { Subject } from '@renderer/data/types/subject'

export interface SubjectCardProps {
  sectionPath: SectionPath
  subjectInfo: Subject
}
const sectionId = 'Home-Small-Carousel'

export const SubjectCard = memo(({ subjectInfo, sectionPath }: SubjectCardProps) => {
  // 获得数据
  // const topList = useTopListQuery(sectionPath)
  const subjectId = subjectInfo.id
  // const follow = topList?.data?.[index].follow?.replace(/[^0-9]/g, '')
  // const subjectInfo = useSubjectInfoQuery({ subjectId, enabled: !!subjectId })

  /* eslint-disable */
  // @ts-ignore: motion needed
  const activeId = useAtomValue(activeHoverPopCardAtom) // framer motion 需要其用于确保 re-render ?
  /* eslint-enable */

  // 一些状态
  const setActionSection = useSetAtom(activeSectionAtom) // 用来防止轮播图相互覆盖
  const id = `${sectionPath}-${subjectId}`
  const layoutId = `${sectionId}-${id}`
  const isActive = activeId === layoutId

  const isTransitioning = useViewTransitionState(`/subject/${subjectId}`) // viewTransition API
  const { key } = useLocation()

  return (
    <HoverPopCard
      layoutId={layoutId}
      isActive={(isActive) => (isActive ? setActionSection(sectionPath) : setActionSection(null))}
    >
      <HoverCardContent
        className="relative z-1 w-full cursor-default"
        style={{
          viewTransitionName: !isActive && isTransitioning ? `cover-image-${key}` : undefined,
        }}
        CardContent={
          <MyLink
            to={`/subject/${subjectId}`}
            className="cursor-default"
            viewTransition
            state={{ viewTransitionName: `cover-image-${key}` }}
          >
            <CardContent className="p-0">
              <CoverMotionImage
                className={cn(
                  'aspect-2/3 overflow-hidden rounded-xl',
                  sectionPath === 'music' && 'aspect-square',
                )}
                loading="eager"
                imageSrc={subjectInfo.images.common}
                layoutId={`${layoutId}-image`}
              />

              <div
                className={`absolute right-0 bottom-0 left-0 z-20 flex h-12 items-end justify-between bg-linear-to-t from-black/50 px-2 py-1`}
              >
                <motion.div
                  className="flex items-center justify-center gap-1 font-bold text-white"
                  layoutId={`${layoutId}-score`}
                >
                  {subjectInfo.rating.score.toFixed(1)}
                  <span className="i-mingcute-star-fill mt-0.5 text-xs" />
                </motion.div>
              </div>
            </CardContent>
          </MyLink>
        }
        Description={
          <div className="mt-2 w-full p-0.5">
            <motion.h1 className="font-jp h-6 truncate font-medium" layoutId={`${layoutId}-header`}>
              {subjectInfo.name}
            </motion.h1>
            <motion.h2 className="mt-1 h-4 truncate text-xs">{subjectInfo.name_cn}</motion.h2>
          </div>
        }
      />
      <PopCardContent>
        <MyLink
          to={`/subject/${subjectId}`}
          className="cursor-default"
          state={{ viewTransitionName: `cover-image-${key}` }}
        >
          <Card className="h-full w-full overflow-hidden">
            <CardContent className="flex h-full flex-col gap-1 p-0">
              {/* Cover */}
              <section className="flex w-full flex-row items-start gap-2 p-4">
                {subjectInfo ? (
                  <CoverMotionImage
                    imageSrc={subjectInfo.images.common}
                    className="shrink-0 basis-1/6 overflow-hidden rounded-lg shadow-lg"
                    layoutId={`${layoutId}-image`}
                    style={{
                      viewTransitionName: isTransitioning ? `cover-image-${key}` : undefined,
                    }}
                  />
                ) : (
                  <Skeleton className="aspect-square shrink-0 basis-1/6" />
                )}
                {/* 标题描述 */}
                <section className="flex w-full flex-col justify-between gap-0.5">
                  <div className="flex w-full flex-col">
                    <motion.h1
                      className="font-jp text-sm font-medium"
                      layoutId={`${layoutId}-header`}
                    >
                      {subjectInfo.name}
                    </motion.h1>
                  </div>
                  {/* meta */}
                  <div className="flex flex-wrap items-center justify-start gap-1 font-medium">
                    <motion.div
                      className="flex items-center justify-center gap-1 text-xs"
                      layoutId={`${layoutId}-score`}
                    >
                      {subjectInfo.rating.score.toFixed(1)}
                      <span className="i-mingcute-star-fill mt-[2px] text-[0.6rem]" />
                    </motion.div>
                    <Separator
                      orientation="vertical"
                      className="h-[0.85rem] w-[1.5px] rounded-2xl"
                    />
                    <motion.div
                      className="shrink-0 text-xs"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      {dayjs(subjectInfo.date, 'YYYY-MM-DD').format('YY 年 M 月')}
                    </motion.div>
                  </div>
                </section>
                {/* 标记下拉 */}
                <motion.div
                  className="grow-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  layout
                >
                  <Select>
                    <SelectTrigger className="flex-auto">
                      <SelectValue placeholder="标记为" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="想看">想看</SelectItem>
                      <SelectItem value="看过">看过</SelectItem>
                      <SelectItem value="在看">在看</SelectItem>
                      <SelectItem value="搁置">搁置</SelectItem>
                      <SelectItem value="抛弃">抛弃</SelectItem>
                    </SelectContent>
                  </Select>
                </motion.div>
              </section>
              {/* 标签 */}
              <motion.div
                className="mr-1 mb-4 ml-4 flex flex-wrap gap-2 overflow-x-hidden py-2 pr-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                layout
              >
                {subjectInfo.tags.map((item) => (
                  <Button
                    key={item.name}
                    className="h-auto flex-auto justify-center px-1.5 py-1.5 text-xs whitespace-normal"
                    variant="outline"
                    onClick={(e) => e.preventDefault()}
                  >
                    {item.name}
                  </Button>
                ))}
              </motion.div>
            </CardContent>
          </Card>
        </MyLink>
      </PopCardContent>
    </HoverPopCard>
  )
})

SubjectCard.displayName = 'SubjectCard'
