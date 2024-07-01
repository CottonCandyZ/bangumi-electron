import { MotionImage } from '@renderer/components/base/MotionImage'
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
import dayjs from 'dayjs'
import { AnimatePresence, motion } from 'framer-motion'
import { useRef, useState } from 'react'

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
  const [onSelect, setOnSelect] = useState(false)

  return (
    <div className="relative">
      <motion.div layoutId={layoutId} ref={ref} className="relative z-[1] aspect-[2/3] w-full">
        <Card
          className="relative overflow-hidden hover:-translate-y-0.5 hover:shadow-xl hover:duration-500"
          onMouseEnter={() => {
            timeoutRef.current = setTimeout(() => {
              const bounding = ref.current!.getBoundingClientRect()
              inset.current = hoverCardSize(bounding, 0.5, 0.05, 8, 8, 24, 8)
              setActionSection(sectionPath)
              setActiveId({ sectionId, id })
            }, 500)
          }}
          onMouseLeave={() => clearTimeout(timeoutRef.current)}
        >
          <CardContent className="p-0">
            <motion.div layoutId={`${layoutId}-image`}>
              <MotionImage
                className="z-[2] aspect-[2/3] w-full object-cover"
                src={subjectInfo.data?.images.common}
              />
            </motion.div>
            <div
              className={`absolute bottom-0 left-0 right-0 z-[3] flex h-12 items-end justify-between bg-gradient-to-t from-black/50 px-2 py-1`}
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
      <AnimatePresence>
        {activeId?.sectionId === sectionId && activeId.id === id && (
        // {(
          <motion.div
            className="absolute z-[10]"
            style={{
              left: `${inset.current.left}px`,
              right: `${inset.current.right}px`,
              bottom: `${inset.current.bottom}px`,
              top: `${inset.current.top}px`,
            }}
            onAnimationComplete={() => setActionSection(null)}
            layoutId={layoutId}
            onMouseLeave={() => {
              if (onSelect) return
              setActiveId(null)
            }}
          >
            <Card className="h-full w-full">
              <CardContent className="flex h-full flex-col p-2">
                <section className="flex w-full flex-row items-start gap-2 p-2">
                  <motion.div
                    className="shrink-0 basis-1/6 overflow-hidden rounded-lg"
                    layoutId={`${layoutId}-image`}
                  >
                    <MotionImage
                      className="z-[2] aspect-[2/3] w-full object-cover shadow-md"
                      src={subjectInfo.data?.images.common}
                    />
                  </motion.div>
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
                    <div className="flex h-4 items-center justify-start gap-1 font-semibold">
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
                      <motion.div className="text-xs">
                        {dayjs(subjectInfo.data?.date, 'YYYY-MM-DD').format('YY 年 M 月')}
                      </motion.div>
                    </div>
                  </section>
                  <div
                    className="grow-0"
                    onMouseEnter={() => setOnSelect(true)}
                    onMouseLeave={() => setOnSelect(false)}
                  >
                    <Select onOpenChange={(open) => setOnSelect(open)}>
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
                  </div>
                </section>
                {/* <motion.div
                  className="text-2xl font-bold italic text-black"
                  layoutId={`${layoutId}-score`}
                >
                  {subjectInfo.data?.rating.score.toFixed(1)}
                </motion.div> */}
                <div className="mt-2 flex flex-wrap gap-2 overflow-auto p-2">
                  {subjectInfo.data?.tags.map((item) => (
                    <Button
                      key={item.name}
                      className="flex-auto px-1.5 text-xs"
                      variant={'outline'}
                    >
                      {item.name}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
