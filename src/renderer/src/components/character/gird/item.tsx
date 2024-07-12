import { CoverMotionImage } from '@renderer/components/base/CoverMotionImage'
import Actors from '@renderer/components/character/gird/actor'
import Detail from '@renderer/components/character/gird/detail'
import { useActiveHoverCard } from '@renderer/components/hoverCard/state'
import { cHoverCardSize } from '@renderer/components/hoverCard/utils'
import { Card, CardContent } from '@renderer/components/ui/card'
import { Separator } from '@renderer/components/ui/separator'
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
        className="h-full"
        layoutId={layoutId}
        ref={ref}
        onMouseEnter={() => {
          setActiveId(null)
          timeoutRef.current = setTimeout(() => {
            const bounding = ref.current!.getBoundingClientRect()
            inset.current = cHoverCardSize(bounding, {
              width: 0.2,
              height: 1.2,
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
                layoutId={`${layoutId}-image`}
                className="aspect-square size-14 shrink-0 overflow-hidden rounded-full"
                imageSrc={getCharacterAvatarURL(character.images.large)}
              />
            ) : (
              <div className="aspect-square size-14 rounded-full bg-secondary" />
            )}
            <MetaInfo character={character} layoutId={`${layoutId}-meta`} />
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
              <CardContent className="flex h-full flex-col p-2">
                <div className="flex h-full grow flex-row gap-4">
                  <CoverMotionImage
                    layoutId={`${layoutId}-image`}
                    className="h-fit basis-1/4 overflow-hidden rounded-xl shadow-md"
                    imageSrc={character.images.grid}
                    loadingClassName="aspect-[9/16]"
                  />
                  <div className="flex h-full w-full flex-col gap-2">
                    <MetaInfo character={character} layoutId={`${layoutId}-meta`} />
                    <Separator />
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="h-full overflow-x-hidden"
                    >
                      <Detail characterId={character.id} />
                    </motion.div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function MetaInfo({ character, layoutId }: { character: Character; layoutId: string }) {
  return (
    <motion.section className="flex flex-col gap-1" layoutId={layoutId}>
      <div className="flex flex-col">
        <motion.h3 className="font-medium">{character.name}</motion.h3>
        <motion.h4 className="text-sm font-medium text-muted-foreground">
          {character.relation}
        </motion.h4>
      </div>
      {character.actors.length !== 0 && (
        <motion.div className="flex flex-row text-sm">
          CV：
          <Actors actors={character.actors} />
        </motion.div>
      )}
    </motion.section>
  )
}
