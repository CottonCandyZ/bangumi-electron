import { Image } from '@renderer/components/base/Image'
import { useCurrentHoverCard } from '@renderer/components/carousel/state'
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

export default function SubjectCard({ sectionPath, index }: SubjectCardProps) {
  const topList = useTopListQuery(sectionPath)
  const subjectId = topList?.data?.[index].SubjectId
  const follow = topList?.data?.[index].follow
  const subjectInfo = useQuerySubjectInfo({ id: subjectId, enabled: !!subjectId })

  const ref = useRef<HTMLDivElement>(null)
  const inset = useRef({ left: 0, right: 0, top: 0, bottom: 0 })
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const setActive = useCurrentHoverCard((state) => state.setActive)
  const active = useCurrentHoverCard((state) => ({
    sectionPath: state.sectionPath,
    index: state.index,
  }))

  return (
    <LayoutGroup id={sectionPath}>
      <div className="relative">
        <motion.div
          layoutId={index.toString()}
          ref={ref}
          className="relative z-[1] aspect-[2/3] w-full"
        >
          {/* <Card className="h-full w-full"></Card> */}
          <Card
            className="relative overflow-hidden hover:-translate-y-0.5 hover:shadow-lg hover:duration-500"
            onMouseEnter={() => {
              timeoutRef.current = setTimeout(() => {
                const bounding = ref.current!.getBoundingClientRect()
                let left = -(bounding.width / 4)
                let right = -(bounding.width / 4)
                let top = -(bounding.height / 20)
                let bottom = -(bounding.height / 20)
                const toLeft = bounding.left + left
                const toTop = bounding.top + top
                const toBottom = window.innerHeight - bounding.bottom + bottom
                const toRight = window.innerWidth - bounding.right + right
                if (toTop < 56) {
                  top += 56 - toTop
                  bottom -= 56 - toTop
                }
                if (toLeft + left < 80) {
                  left += 80 - toLeft
                  right -= 80 - toLeft
                }
                if (toRight < 24) {
                  right += 24 - toRight
                  left -= 24 - toRight
                }
                if (toBottom < 8) {
                  bottom += 8 - toBottom
                  top -= 8 - toBottom
                }
                inset.current = { left, right, top, bottom }
                setActive(sectionPath, index)
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
                  layoutId={`${index}-score`}
                >
                  {subjectInfo.data?.rating.score}
                </motion.div>
              </div>
            </CardContent>
          </Card>
          <div className="mt-2 p-0.5">
            <h1 className="truncate font-semibold">{subjectInfo.data?.name}</h1>
            <h2 className="mt-1 truncate text-xs">{subjectInfo.data?.name_cn}</h2>
          </div>
        </motion.div>
        <AnimatePresence>
          {active.sectionPath === sectionPath && active.index === index && (
            <motion.div
              className="absolute z-[10]"
              style={{
                left: `${inset.current.left}px`,
                right: `${inset.current.right}px`,
                bottom: `${inset.current.bottom}px`,
                top: `${inset.current.top}px`,
              }}
              onAnimationComplete={() => setActive(null, null)}
              layoutId={index.toString()}
              onMouseLeave={() => {
                setActive(sectionPath, null)
              }}
            >
              <Card className="h-full w-full">
                <CardContent></CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </LayoutGroup>
  )
}
