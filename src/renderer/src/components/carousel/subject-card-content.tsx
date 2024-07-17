import { CoverMotionImage } from '@renderer/components/base/CoverMotionImage'
import ScrollWrapper from '@renderer/components/base/scroll-warpper'
import { useActiveSection } from '@renderer/components/carousel/state'
import { useActiveHoverCard } from '@renderer/components/hoverCard/state'
import { cHoverCardSize } from '@renderer/components/hoverCard/utils'
import { MotionSkeleton } from '@renderer/components/ui/MotionSekleton'
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
import { useQuerySubjectInfo } from '@renderer/data/hooks/api/subject'
import { useTopListQuery } from '@renderer/data/hooks/web/subject'
import { sectionPath } from '@renderer/data/types/web'
import { cn } from '@renderer/lib/utils'
import dayjs from 'dayjs'
import { AnimatePresence, motion } from 'framer-motion'
import { memo, useEffect, useRef } from 'react'
import { Link, unstable_useViewTransitionState, useLocation } from 'react-router-dom'

export interface SubjectCardProps {
  sectionPath: sectionPath
  index: number
}
const sectionId = 'Home-Small-Carousel'

export const SubjectCard = memo(({ sectionPath, index }: SubjectCardProps) => {
  // 获得数据
  const topList = useTopListQuery(sectionPath)
  const subjectId = topList?.data?.[index].SubjectId
  // const follow = topList?.data?.[index].follow?.replace(/[^0-9]/g, '')
  const subjectInfo = useQuerySubjectInfo({ id: subjectId, enabled: !!subjectId })
  const subjectInfoData = subjectInfo.data

  // 计算 hover card 大小
  const ref = useRef<HTMLDivElement>(null)
  const inset = useRef({ left: 0, right: 0, top: 0, bottom: 0 })
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // 一些状态
  const setActiveId = useActiveHoverCard((state) => state.setActiveId) // 全局 activeId 唯一
  const activeId = useActiveHoverCard((state) => state.activeId)
  const setActionSection = useActiveSection((state) => state.setActiveSection) // 用来防止轮播图相互覆盖
  const id = `${sectionPath}-${index}`
  const layoutId = `${sectionId}-${id}`

  const isTransitioning = unstable_useViewTransitionState(`/subject/${subjectId}`) // viewTransition API
  const { key } = useLocation()

  // 延迟打开 card
  useEffect(() => {
    return () => {
      clearTimeout(timeoutRef.current)
      setActiveId(null)
    }
  }, [])

  // 没拿到 subjectId 的时候拒绝点击
  if (!subjectId) {
    return <Skeleton className="aspect-[2/3] w-full" />
  }

  return (
    <div className="relative">
      <motion.div
        layoutId={layoutId}
        ref={ref}
        className={cn('relative z-[1] w-full cursor-default')}
        onMouseEnter={() => setActiveId(null)}
      >
        <Link
          to={`/subject/${subjectId}`}
          className="cursor-default"
          unstable_viewTransition
          state={{ viewTransitionName: `${key}-cover-image` }}
        >
          <Card
            className="relative overflow-hidden hover:-translate-y-0.5 hover:shadow-xl hover:duration-700"
            style={{ viewTransitionName: !activeId && isTransitioning ? `${key}-cover-image` : '' }}
            onMouseEnter={() => {
              timeoutRef.current = setTimeout(() => {
                const bounding = ref.current!.getBoundingClientRect()
                inset.current = cHoverCardSize(bounding, {
                  width: 0.5,
                  height: 0.05,
                  toViewBottom: 8,
                  toViewTop: 8,
                  toViewLeft: 8,
                  toViewRight: 8,
                  minInnerHoverHeight: 270,
                  minInnerHoverWidth: 150,
                })
                setActionSection(sectionPath)
                setActiveId(layoutId)
              }, 700)
            }}
            onMouseLeave={() => clearTimeout(timeoutRef.current)}
          >
            <CardContent className="p-0">
              <CoverMotionImage
                className={cn('aspect-[2/3]', sectionPath === 'music' && 'aspect-square')}
                imageSrc={subjectInfoData?.images.common}
                layoutId={`${layoutId}-image`}
              />
              <div
                className={`absolute bottom-0 left-0 right-0 z-10 flex h-12 items-end justify-between bg-gradient-to-t from-black/50 px-2 py-1`}
              >
                <motion.div
                  className="flex items-center justify-center gap-1 font-bold text-white"
                  layoutId={`${layoutId}-score`}
                >
                  {subjectInfoData ? (
                    <>
                      {subjectInfoData?.rating.score.toFixed(1)}
                      <span className="i-mingcute-star-fill mt-0.5 text-xs" />
                    </>
                  ) : (
                    <MotionSkeleton className="h-6 w-10" />
                  )}
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <motion.div className="mt-2 w-full p-0.5" layoutId={`${layoutId}-header`}>
          {subjectInfoData ? (
            <>
              <motion.h1 className="h-6 truncate font-jp font-semibold">
                {subjectInfoData.name}
              </motion.h1>
              <motion.h2 className="mt-1 h-4 truncate text-xs">{subjectInfoData.name_cn}</motion.h2>
            </>
          ) : (
            <>
              <MotionSkeleton className="h-6" />
              <MotionSkeleton className="mt-1 h-4" />
            </>
          )}
        </motion.div>
      </motion.div>
      <AnimatePresence onExitComplete={() => setActionSection(null)}>
        {activeId === layoutId && (
          <motion.div
            className="absolute z-10 cursor-default"
            style={{
              left: `${inset.current.left}px`,
              right: `${inset.current.right}px`,
              bottom: `${inset.current.bottom}px`,
              top: `${inset.current.top}px`,
            }}
            layoutId={layoutId}
          >
            <Link
              to={`/subject/${subjectId}`}
              className="cursor-default"
              unstable_viewTransition
              state={{ viewTransitionName: `${key}-cover-image` }}
            >
              <Card className="h-full w-full">
                <CardContent className="flex h-full flex-col gap-1 p-0">
                  {/* Cover */}
                  <section className="flex w-full flex-row items-start gap-2 p-4">
                    <CoverMotionImage
                      imageSrc={subjectInfoData?.images.common}
                      className="shrink-0 basis-1/6 overflow-hidden rounded-lg shadow-lg"
                      layoutId={`${layoutId}-image`}
                      style={{ viewTransitionName: isTransitioning ? `${key}-cover-image` : '' }}
                    />
                    {/* 标题描述 */}
                    <section className="flex w-full flex-col justify-between gap-0.5">
                      <motion.div className="flex w-full flex-col" layoutId={`${layoutId}-header`}>
                        {subjectInfoData ? (
                          <>
                            <motion.h1 className="font-jp text-xs font-semibold">
                              {subjectInfoData.name}
                            </motion.h1>
                          </>
                        ) : (
                          <>
                            <MotionSkeleton className="h-5" />
                            <MotionSkeleton className="mt-1 h-4" />
                          </>
                        )}
                      </motion.div>
                      {/* meta */}
                      <div className="flex flex-wrap items-center justify-start gap-1 font-medium">
                        <motion.div
                          className="flex items-center justify-center gap-1 text-xs"
                          layoutId={`${layoutId}-score`}
                        >
                          {subjectInfoData ? (
                            <>
                              {subjectInfoData?.rating.score.toFixed(1)}
                              <span className="i-mingcute-star-fill mt-[2px] text-[0.6rem]" />
                            </>
                          ) : (
                            <MotionSkeleton className="h-4 w-8" />
                          )}
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
                          {subjectInfoData ? (
                            dayjs(subjectInfoData?.date, 'YYYY-MM-DD').format('YY 年 M 月')
                          ) : (
                            <MotionSkeleton className="h-4 w-16" />
                          )}
                        </motion.div>
                      </div>
                    </section>
                    {/* 标记下拉 */}
                    <motion.div
                      className="grow-0"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
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
                  {subjectInfoData ? (
                    <ScrollWrapper
                      className="mb-4 ml-4 mr-1 pr-3"
                      element="div"
                      options={{ overflow: { x: 'hidden' }, scrollbars: { autoHide: 'scroll' } }}
                    >
                      <motion.div
                        className="flex flex-wrap gap-2 py-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        {subjectInfoData.tags.map((item) => (
                          <Button
                            key={item.name}
                            className="h-auto flex-auto justify-center whitespace-normal px-1.5 py-1.5 text-xs"
                            variant={'outline'}
                            onClick={(e) => e.preventDefault()}
                          >
                            {item.name}
                          </Button>
                        ))}
                      </motion.div>
                    </ScrollWrapper>
                  ) : (
                    <Skeleton className="mb-4 ml-4 mr-4 h-full" />
                  )}
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})

SubjectCard.displayName = 'SubjectCard'
export default SubjectCard
