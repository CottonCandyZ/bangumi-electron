import { Button } from '@renderer/components/ui/button'
import { Card, CardContent } from '@renderer/components/ui/card'
import clsx from 'clsx'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

const items = 9
const smallWidth = 350
const bias = 36 // (9)

const bigWidth = 660
// const height = 450

const animateConfig: KeyframeAnimationOptions = {
  duration: 500,
  fill: 'forwards',
  easing: 'ease',
}

export function BigCarousel(): JSX.Element {
  // index
  const [currentIndex, setCurrentIndex] = useState(items)
  const flexBox = useRef<HTMLDivElement>(null)
  const timeId = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const fromTo = useCallback((begin: number, end: number) => {
    if (begin === end) return
    let nextIndex = end
    if (begin >= items && end >= items + 2) {
      // start from list begin
      animateFromTo(begin - items, end - items)
      nextIndex = end - items
    } else if (end <= 1) {
      // start from middle
      animateFromTo(begin + items, end + items)
      nextIndex = end + items
    } else {
      animateFromTo(begin, end)
    }
    setCurrentIndex(nextIndex)
  }, [])
  useEffect(() => {
    clearTimeout(timeId.current)
    timeId.current = setTimeout(() => fromTo(currentIndex, currentIndex + 1), 5000)
  }, [currentIndex, fromTo])

  useEffect(() => {
    if (!flexBox.current) return
    flexBox.current.animate(
      {
        transform: `translateX(${-smallWidth * currentIndex + bias}px)`,
      },
      { duration: 0, fill: 'forwards' },
    )
    for (const [index, child] of Array.from(flexBox.current.children).entries()) {
      child.animate(
        { width: index === currentIndex ? `${bigWidth}px` : `${smallWidth}px` },
        { duration: 0, fill: 'forwards' },
      )
    }
  }, [currentIndex])

  const animateFromTo = (begin: number, end: number) => {
    if (!flexBox.current) return
    flexBox.current.animate(
      {
        transform: [
          `translateX(${-smallWidth * begin + bias}px)`,
          `translateX(${-smallWidth * end + bias}px)`,
        ],
      },
      animateConfig,
    )
    for (const [index, child] of Array.from(flexBox.current.children).entries()) {
      if (index === begin)
        child.animate({ width: [`${bigWidth}px`, `${smallWidth}px`] }, animateConfig)
      else if (index === end)
        child.animate({ width: [`${smallWidth}px`, `${bigWidth}px`] }, animateConfig)
      else child.animate({ width: `${smallWidth}px` }, { duration: 0, fill: 'forwards' })
    }
  }

  return (
    <div className="group relative">
      <Button
        variant="outline"
        size="icon"
        onClick={() => {
          fromTo(currentIndex, currentIndex - 1)
        }}
        className="absolute left-2 top-1/2 z-10 h-8 w-8 -translate-y-1/2 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={() => {
          fromTo(currentIndex, currentIndex + 1)
        }}
        className="absolute right-2 top-1/2 z-10 h-8 w-8 -translate-y-1/2 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
      >
        <ArrowRight className="h-4 w-4" />
      </Button>

      <div className="overflow-hidden">
        <div className="-ml-2 flex flex-row" ref={flexBox}>
          {Array.from({ length: items * 2 }).map((_, index) => (
            <div
              className="w-44 min-w-0 shrink-0 grow-0 pl-2"
              key={index}
              onClick={() => {
                fromTo(currentIndex, index)
              }}
            >
              <div className="p-1">
                <Card>
                  <CardContent className={clsx(`flex h-96 items-center justify-center p-6`)}>
                    <span className="text-3xl font-semibold">{(index % items) + 1}</span>
                  </CardContent>
                </Card>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
