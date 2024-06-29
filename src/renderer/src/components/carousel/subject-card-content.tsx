import { Image } from '@renderer/components/base/Image'
import { useActiveSection } from '@renderer/components/carousel/state'
import { useActiveHoverCard } from '@renderer/components/hoverCard/state'
import { hoverCardSize } from '@renderer/components/hoverCard/utils'
import { MotionSkeleton } from '@renderer/components/ui/MotionSekleton'
import { Card, CardContent } from '@renderer/components/ui/card'
import { useQuerySubjectInfo } from '@renderer/constants/hooks/subjects'
import { useTopListQuery } from '@renderer/constants/hooks/web'
import { sectionPath } from '@renderer/constants/types/web'
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion'
import { useRef } from 'react'

export interface SubjectCardProps {
  sectionPath: sectionPath
  index: number
}
const sectionId = 'Home-Small-Carousel'

export default function SubjectCard({ sectionPath, index }: SubjectCardProps) {
  const topList = useTopListQuery(sectionPath)
  const subjectId = topList?.data?.[index].SubjectId
  const follow = topList?.data?.[index].follow
  const subjectInfo = useQuerySubjectInfo({ id: subjectId, enabled: !!subjectId })

  const ref = useRef<HTMLDivElement>(null)
  const inset = useRef({ left: 0, right: 0, top: 0, bottom: 0 })
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const setActiveId = useActiveHoverCard((state) => state.setActiveId)
  const activeId = useActiveHoverCard((state) => state.activeId)
  const setActionSection = useActiveSection((state) => state.setActiveSection)
  const id = `${sectionPath}-${index}`
  const layoutId = `${sectionId}-${id}`

  return (
    <div className="relative">
      <motion.div
        layoutId={layoutId}
        ref={ref}
        className="relative z-[1] aspect-[2/3] w-full"
      >
        <Card
          className="relative overflow-hidden hover:-translate-y-0.5 hover:shadow-lg hover:duration-500"
          onMouseEnter={() => {
            timeoutRef.current = setTimeout(() => {
              const bounding = ref.current!.getBoundingClientRect()
              inset.current = hoverCardSize(bounding, 0.25, 0.05, 8, 8, 24, 8)
              setActionSection(sectionPath)
              setActiveId({sectionId, id})
            }, 500)
          }}
          onMouseLeave={() => clearTimeout(timeoutRef.current)}
        >
          <CardContent className="p-0">
            <Image
              className="z-[2] aspect-[2/3] w-full object-cover"
              src={subjectInfo.data?.images.common}
            />
            <div
              className={`absolute bottom-0 left-0 right-0 z-[3] flex h-12 justify-end bg-gradient-to-t from-black/50 pr-3 pt-3`}
            >
              <motion.div
                className="text-2xl font-bold italic text-white"
                layoutId={`${layoutId}-score`}
              >
                {subjectInfo.data?.rating.score.toFixed(1)}
              </motion.div>
            </div>
          </CardContent>
        </Card>
        <div className="mt-2 p-0.5">
          {subjectInfo.data ? (
            <h1 className="h-6 truncate font-semibold">{subjectInfo.data?.name}</h1>
          ) : (
            <MotionSkeleton className="h-6" />
          )}
          {subjectInfo.data ? (
            <h2 className="mt-1 h-4 truncate text-xs">{subjectInfo.data?.name_cn}</h2>
          ) : (
            <MotionSkeleton className="mt-1 h-4" />
          )}
        </div>
      </motion.div>
      <AnimatePresence>
        {activeId?.sectionId === sectionId && activeId.id === id &&  (
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
              setActiveId(null)
            }}
          >
            <Card className="h-full w-full">
              <CardContent></CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
