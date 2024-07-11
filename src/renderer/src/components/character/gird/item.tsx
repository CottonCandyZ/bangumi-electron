import { CoverMotionImage } from '@renderer/components/base/CoverMotionImage'
import { useActiveHoverCard } from '@renderer/components/hoverCard/state'
import { cHoverCardSize } from '@renderer/components/hoverCard/utils'
import { Card, CardContent } from '@renderer/components/ui/card'
import { Character } from '@renderer/constants/types/character'
import { getCharacterAvatarURL } from '@renderer/lib/utils/data-trans'
import { isEmpty } from '@renderer/lib/utils/string'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef } from 'react'

const sectionId = 'Characters'
export default function Item({ character }: { character: Character }) {
  const setActiveId = useActiveHoverCard((state) => state.setActiveId) // 全局 activeId 唯一
  const activeId = useActiveHoverCard((state) => state.activeId)
  const id = character.id
  const layoutId = `${sectionId}-${id}`

  const ref = useRef<HTMLDivElement>(null)
  const inset = useRef({ left: 0, right: 0, top: 0, bottom: 0 })
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    return () => {
      clearTimeout(timeoutRef.current)
      setActiveId(null)
    }
  }, [])

  return (
    <div className="relative">
      <motion.div
        layoutId={layoutId}
        ref={ref}
        onMouseEnter={() => {
          setActiveId(null)
          timeoutRef.current = setTimeout(() => {
            const bounding = ref.current!.getBoundingClientRect()
            inset.current = cHoverCardSize(bounding, {
              width: 0.2,
              height: 1,
              toViewTop: 8,
              toViewBottom: 8,
              toViewLeft: 8,
              toViewRight: 8,
            })
            setActiveId(layoutId)
          }, 700)
        }}
        onMouseLeave={() => clearTimeout(timeoutRef.current)}
      >
        <Card className="h-full hover:-translate-y-0.5 hover:shadow-xl hover:duration-700">
          <CardContent className="flex flex-row items-start gap-4 p-2">
            {!isEmpty(character.images.large) ? (
              <CoverMotionImage
                className="aspect-square size-14 shrink-0 overflow-hidden rounded-full"
                imageSrc={getCharacterAvatarURL(character.images.large)}
              />
            ) : (
              <div className="aspect-square size-14 rounded-full bg-secondary" />
            )}
            <section className="flex flex-col gap-1">
              <h3 className="font-medium">{character.name}</h3>
              <h4 className="text-sm">{character.relation}</h4>
              {/* <h4 className="text-sm">CV：{character.actors[0].name}</h4> */}
            </section>
          </CardContent>
        </Card>
      </motion.div>
      <AnimatePresence>
        {activeId === layoutId && (
          <motion.div
            layoutId={layoutId}
            className="absolute z-10"
            style={{
              left: `${inset.current.left}px`,
              right: `${inset.current.right}px`,
              bottom: `${inset.current.bottom}px`,
              top: `${inset.current.top}px`,
            }}
          >
            <Card className="h-full w-full">
              <CardContent>Content</CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
