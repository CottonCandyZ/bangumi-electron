import { Button } from '@renderer/components/ui/button'
import { Character } from '@renderer/data/types/character'
import { useResizeObserver } from '@renderer/hooks/use-resize'
import { Item } from '@renderer/modules/main/subject/character/gird/item'
import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'

export function CharactersGrid({ characters }: { characters: Character[] }) {
  const [fold, setFold] = useState(true)
  const [showNumber, setShowNumber] = useState(8)
  const slice = fold ? showNumber : characters.length
  const needFold = characters.length > showNumber
  const { pathname } = useLocation()
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    setFold(true)
  }, [pathname])
  useResizeObserver({
    ref,
    callback: (e) => {
      if (
        e.target.getBoundingClientRect().width >= 240 * 3 + 8 * 2 &&
        e.target.getBoundingClientRect().width <= 240 * 4 + 8 * 3
      ) {
        setShowNumber(9)
      } else {
        setShowNumber(8)
      }
    },
  })

  return (
    <div className="relative flex flex-row gap-2">
      <div className="grid w-full grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-2" ref={ref}>
        {characters.slice(0, slice).map((item) => (
          <Item character={item} key={item.id} />
        ))}
      </div>
      {needFold && (
        <div>
          <Button
            variant="outline"
            className="h-full rounded-xl whitespace-normal"
            onClick={() => setFold((fold) => !fold)}
          >
            {fold ? '展开' : '收起'}
          </Button>
        </div>
      )}
    </div>
  )
}
