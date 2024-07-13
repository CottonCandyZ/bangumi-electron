import { CoverMotionImage } from '@renderer/components/base/CoverMotionImage'
import Actors from '@renderer/components/character/gird/actor'
import Detail from '@renderer/components/character/gird/detail'
import { useActiveHoverCard } from '@renderer/components/hoverCard/state'
import { cPopSizeByC } from '@renderer/components/hoverCard/utils'
import { Badge } from '@renderer/components/ui/badge'
import { Card, CardContent } from '@renderer/components/ui/card'
import { Separator } from '@renderer/components/ui/separator'
import { Character } from '@renderer/constants/types/character'
import { cn } from '@renderer/lib/utils'
import { getCharacterAvatarURL } from '@renderer/lib/utils/data-trans'
import { isEmpty } from '@renderer/lib/utils/string'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'

const sectionId = 'Characters'
export default function Item({ character }: { character: Character }) {
  const setActiveId = useActiveHoverCard((state) => state.setActiveId) // 全局 activeId 唯一
  const activeId = useActiveHoverCard((state) => state.activeId)
  const id = character.id
  const layoutId = `${sectionId}-${id}`

  const ref = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const popRef = useRef<HTMLDivElement>(null)
  const [popCod, setPopCod] = useState({ top: 0, left: 0 })

  useEffect(() => {
    return () => {
      clearTimeout(timeoutRef.current)
      setActiveId(null)
    }
  }, [])
  useLayoutEffect(() => {
    if (activeId === layoutId) {
      const pop = popRef.current!.getBoundingClientRect()
      const hover = ref.current!.getBoundingClientRect()
      const { topOffset, leftOffset } = cPopSizeByC(pop, hover)
      setPopCod({ top: topOffset, left: leftOffset })
    }
  }, [activeId])

  return (
    <div className="relative">
      <motion.div
        className="h-full"
        layoutId={layoutId}
        ref={ref}
        onMouseEnter={() => {
          setActiveId(null)
          timeoutRef.current = setTimeout(() => {
            setActiveId(layoutId)
          }, 700)
        }}
        onMouseLeave={() => clearTimeout(timeoutRef.current)}
      >
        <Card className="h-full hover:-translate-y-0.5 hover:shadow-xl hover:duration-700">
          <CardContent
            className={cn(
              'flex flex-row items-start gap-4 p-2',
              isEmpty(character.images.large) && 'pl-4',
            )}
          >
            {!isEmpty(character.images.large) && (
              <CoverMotionImage
                className="aspect-square size-14 shrink-0 overflow-hidden rounded-full"
                imageSrc={getCharacterAvatarURL(character.images.large)}
              />
            )}
            <MetaInfo character={character} />
          </CardContent>
        </Card>
      </motion.div>
      <AnimatePresence>
        {activeId === layoutId && (
          <motion.div
            layoutId={layoutId}
            className="absolute z-30 w-96"
            ref={popRef}
            style={{
              top: `${popCod.top}px`,
              left: `${popCod.left}px`,
            }}
          >
            <Card className="h-fit w-full">
              <CardContent className="flex h-full flex-col p-2">
                <div className="flex h-full flex-row gap-4">
                  {!isEmpty(character.images.large) && (
                    <CoverMotionImage
                      className="h-fit basis-1/4 overflow-hidden rounded-xl shadow-md"
                      imageSrc={character.images.grid}
                      loadingClassName="aspect-[9/16]"
                    />
                  )}
                  <div className="flex w-full flex-col gap-2">
                    <MetaInfo character={character} />
                    <Separator />
                    <Detail characterId={character.id} />
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

function MetaInfo({ character }: { character: Character }) {
  return (
    <section className="flex flex-col gap-1">
      <div className="flex flex-col gap-0.5">
        <h3 className="font-medium">{character.name}</h3>
        <h4 className="text-sm font-medium text-muted-foreground">
          <Badge variant="outline">{character.relation}</Badge>
        </h4>
      </div>
      {character.actors.length !== 0 && (
        <div className="flex flex-row text-sm">
          CV：
          <Actors actors={character.actors} />
        </div>
      )}
    </section>
  )
}
