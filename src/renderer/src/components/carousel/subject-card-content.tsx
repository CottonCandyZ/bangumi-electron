import { CoverMotionImage } from '@renderer/components/base/CoverMotionImage'
import { useActiveSection } from '@renderer/components/carousel/state'
import { useActiveHoverCard } from '@renderer/components/hoverCard/state'
import { hoverCardSize } from '@renderer/components/hoverCard/utils'
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
import { useQuerySubjectInfo } from '@renderer/constants/hooks/api/subject'
import { useTopListQuery } from '@renderer/constants/hooks/web/subject'
import { sectionPath } from '@renderer/constants/types/web'
import { cn } from '@renderer/lib/utils'
import dayjs from 'dayjs'
import { AnimatePresence, motion } from 'framer-motion'
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react'
import { useEffect, useRef } from 'react'
import { Link, unstable_useViewTransitionState } from 'react-router-dom'

export interface SubjectCardProps {
  sectionPath: sectionPath
  index: number
}
const sectionId = 'Home-Small-Carousel'

export default function SubjectCard({ sectionPath, index }: SubjectCardProps) {
  const topList = useTopListQuery(sectionPath)
  const subjectId = topList?.data?.[index].SubjectId
  // const follow = topList?.data?.[index].follow?.replace(/[^0-9]/g, '')
  const subjectInfo = useQuerySubjectInfo({ id: subjectId, enabled: !!subjectId })

  const ref = useRef<HTMLDivElement>(null)
  const inset = useRef({ left: 0, right: 0, top: 0, bottom: 0 })
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const setActiveId = useActiveHoverCard((state) => state.setActiveId)
  const activeId = useActiveHoverCard((state) => state.activeId)
  const setActionSection = useActiveSection((state) => state.setActiveSection)
  const id = `${sectionPath}-${index}`
  const layoutId = `${sectionId}-${id}`

  const isTransitioning = unstable_useViewTransitionState(`/subject/${subjectId}`)

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current)
  }, [])

  return (
    <div className="relative">
      <motion.div
        layoutId={layoutId}
        ref={ref}
        className="relative z-[1] aspect-[2/3] w-full"
        onMouseEnter={() => setActiveId(null)}
      >
        <Link to={`/subject/${subjectId}`} className="cursor-default" unstable_viewTransition>
          <Card
            className="relative overflow-hidden hover:-translate-y-0.5 hover:shadow-xl hover:duration-700"
            style={{ viewTransitionName: !activeId && isTransitioning ? 'cover-expand' : '' }}
            onMouseEnter={() => {
              timeoutRef.current = setTimeout(() => {
                const bounding = ref.current!.getBoundingClientRect()
                inset.current = hoverCardSize(bounding, 0.5, 0.05, 8, 8, 8, 8)
                setActionSection(sectionPath)
                setActiveId({ sectionId, id })
              }, 700)
            }}
            onMouseLeave={() => clearTimeout(timeoutRef.current)}
          >
            <CardContent className="p-0">
              <motion.div layoutId={`${layoutId}-image`}>
                <CoverMotionImage
                  className={cn('aspect-[2/3]', sectionPath === 'music' && 'aspect-square')}
                  imageSrc={subjectInfo.data?.images.common}
                />
              </motion.div>
              <div
                className={`absolute bottom-0 left-0 right-0 z-10 flex h-12 items-end justify-between bg-gradient-to-t from-black/50 px-2 py-1`}
              >
                <motion.div
                  className="flex items-center justify-center gap-1 font-bold text-white"
                  layoutId={`${layoutId}-score`}
                >
                  {subjectInfo.data?.rating.score.toFixed(1)}
                  <span className="i-mingcute-star-fill text-xs" />
                </motion.div>
                {/* <div className="mt-2 text-sm font-bold text-white"></div> */}
              </div>
            </CardContent>
          </Card>
        </Link>
        <motion.div className="mt-2 w-full p-0.5" layoutId={`${layoutId}-header`}>
          {subjectInfo.data ? (
            <>
              <motion.h1 className="h-6 truncate font-semibold">{subjectInfo.data.name}</motion.h1>
              <motion.h2 className="mt-1 h-4 truncate text-xs">
                {subjectInfo.data.name_cn}
              </motion.h2>
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
        {activeId?.sectionId === sectionId && activeId.id === id && (
          // {(
          <Link to={`/subject/${subjectId}`} className="cursor-default" unstable_viewTransition>
            <motion.div
              className="absolute z-10"
              style={{
                left: `${inset.current.left}px`,
                right: `${inset.current.right}px`,
                bottom: `${inset.current.bottom}px`,
                top: `${inset.current.top}px`,
              }}
              layoutId={layoutId}
            >
              <Card className="h-full w-full">
                <CardContent className="flex h-full flex-col p-0">
                  {/* Cover */}
                  <section className="flex w-full flex-row items-start gap-2 p-4">
                    <motion.div
                      className="shrink-0 basis-1/6 overflow-hidden rounded-lg shadow-lg"
                      layoutId={`${layoutId}-image`}
                    >
                      <CoverMotionImage
                        style={{ viewTransitionName: isTransitioning ? 'cover-expand' : '' }}
                        imageSrc={subjectInfo.data?.images.common}
                      />
                    </motion.div>
                    {/* 标题描述 */}
                    <section className="flex w-full flex-col justify-between gap-0.5">
                      <motion.div className="flex w-full flex-col" layoutId={`${layoutId}-header`}>
                        {subjectInfo.data ? (
                          <>
                            <motion.h1 className="text-xs font-bold">
                              {subjectInfo.data.name}
                            </motion.h1>
                            {/* <motion.h2 className="mt-1 text-xs">{subjectInfo.data.name_cn}</motion.h2> */}
                          </>
                        ) : (
                          <>
                            <MotionSkeleton className="h-5" />
                            <MotionSkeleton className="mt-1 h-4" />
                          </>
                        )}
                      </motion.div>
                      {/* meta */}
                      <div className="flex h-4 flex-wrap items-center justify-start gap-1 font-semibold">
                        <motion.div
                          className="flex items-center justify-center gap-1 text-xs"
                          layoutId={`${layoutId}-score`}
                        >
                          {subjectInfo.data?.rating.score.toFixed(1)}
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
                          {dayjs(subjectInfo.data?.date, 'YYYY-MM-DD').format('YY 年 M 月')}
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
                  <OverlayScrollbarsComponent
                    className="mb-4 ml-4 mr-1 mt-1 pr-3"
                    element="div"
                    options={{ overflow: { x: 'hidden' }, scrollbars: { autoHide: 'scroll' } }}
                  >
                    <motion.div
                      className="flex flex-wrap gap-2 py-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      {subjectInfo.data?.tags.map((item) => (
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
                  </OverlayScrollbarsComponent>
                </CardContent>
              </Card>
            </motion.div>
          </Link>
        )}
      </AnimatePresence>
    </div>
  )
}
