import { Button } from '@renderer/components/ui/button'
import { Character } from '@renderer/data/types/character'
import { useResizeObserver } from '@renderer/hooks/use-resize'
import { Item } from '@renderer/modules/main/subject/character/gird/item'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { useLocation } from 'react-router-dom'

const CHARACTER_CARD_MIN_WIDTH_REM = 15
const CHARACTER_GRID_GAP_REM = 0.5
const CHARACTER_TOGGLE_WIDTH_REM = 3
const CHARACTER_ROWS_WHEN_FOLDED = 2

const gridStyle = {
  '--character-card-min-width': `${CHARACTER_CARD_MIN_WIDTH_REM}rem`,
  '--character-grid-gap': `${CHARACTER_GRID_GAP_REM}rem`,
  '--character-toggle-width': `${CHARACTER_TOGGLE_WIDTH_REM}rem`,
} as CSSProperties

function getRemPx() {
  const fontSize = getComputedStyle(document.documentElement).fontSize
  const remPx = Number.parseFloat(fontSize)
  return Number.isFinite(remPx) ? remPx : 16
}

function getColumns(width: number, minWidth: number, gap: number) {
  return Math.max(1, Math.floor((width + gap) / (minWidth + gap)))
}

export function CharactersGrid({ characters }: { characters: Character[] }) {
  const [fold, setFold] = useState(true)
  const [showNumber, setShowNumber] = useState(CHARACTER_ROWS_WHEN_FOLDED * 4)
  const [canFold, setCanFold] = useState(false)
  const slice = fold ? showNumber : characters.length
  const { pathname } = useLocation()
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    setFold(true)
  }, [pathname])

  const updateLayout = useCallback(
    (width: number) => {
      const remPx = getRemPx()
      const cardMinWidth = CHARACTER_CARD_MIN_WIDTH_REM * remPx
      const gap = CHARACTER_GRID_GAP_REM * remPx
      const toggleWidth = CHARACTER_TOGGLE_WIDTH_REM * remPx
      const fullWidthColumns = getColumns(width, cardMinWidth, gap)
      const fullWidthShowNumber = fullWidthColumns * CHARACTER_ROWS_WHEN_FOLDED
      const nextCanFold = characters.length > fullWidthShowNumber
      const gridWidth = nextCanFold ? Math.max(0, width - toggleWidth - gap) : width
      const nextShowNumber = getColumns(gridWidth, cardMinWidth, gap) * CHARACTER_ROWS_WHEN_FOLDED

      setCanFold((prev) => (prev === nextCanFold ? prev : nextCanFold))
      setShowNumber((prev) => (prev === nextShowNumber ? prev : nextShowNumber))
    },
    [characters.length],
  )
  const handleResize = useCallback(
    (e: ResizeObserverEntry) => {
      updateLayout(e.contentRect.width)
    },
    [updateLayout],
  )

  useEffect(() => {
    if (ref.current) updateLayout(ref.current.getBoundingClientRect().width)
  }, [updateLayout])

  useResizeObserver({
    ref,
    callback: handleResize,
    deps: [handleResize],
  })

  return (
    <div
      className="relative flex flex-row gap-[var(--character-grid-gap)]"
      ref={ref}
      style={gridStyle}
    >
      <div className="grid min-w-0 flex-1 grid-cols-[repeat(auto-fill,minmax(var(--character-card-min-width),1fr))] gap-[var(--character-grid-gap)]">
        {characters.slice(0, slice).map((item) => (
          <Item character={item} key={item.id} />
        ))}
      </div>
      {canFold && (
        <div className="w-[var(--character-toggle-width)] shrink-0">
          <Button
            variant="outline"
            className="h-full w-full rounded-xl whitespace-normal"
            onClick={() => setFold((fold) => !fold)}
          >
            {fold ? '展开' : '收起'}
          </Button>
        </div>
      )}
    </div>
  )
}
