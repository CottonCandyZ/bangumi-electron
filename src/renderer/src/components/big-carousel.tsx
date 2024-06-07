import { Button } from '@renderer/components/ui/button'
import { Card, CardContent } from '@renderer/components/ui/card'
import clsx from 'clsx'
import { AnimationSequence, DynamicAnimationOptions, useAnimate } from 'framer-motion'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useEffect, useState } from 'react'

const items = 5
const smallWidth = 176
const bias = 36 // (9)

const bigWidth = 512

const animateConfig = {
  duration: 0.5,
  type: 'tween',
  ease: [0.25, 0.1, 0.25, 1],
} as DynamicAnimationOptions

export default function BigCarousel(): JSX.Element {
  // index
  const [currentIndex, setCurrentIndex] = useState(items)
  const [scope, animate] = useAnimate<HTMLDivElement>()

  useEffect(() => {
    let start = currentIndex
    const timeId = setInterval(() => {
      start = fromTo(start, start + 1)
    }, 5000)
    return () => clearInterval(timeId)
  }, [])

  useEffect(() => {
    animate(scope.current, { x: -smallWidth * currentIndex + bias }, { duration: 0 })
    for (const [index, child] of Array.from(scope.current.children).entries()) {
      animate(child, { width: index === currentIndex ? bigWidth : smallWidth }, { duration: 0 })
    }
  }, [])

  const animateFromTo = (begin: number, end: number) => {
    const sequence: AnimationSequence = [
      [scope.current, { x: [-smallWidth * begin + bias, -smallWidth * end + bias] }, animateConfig],
    ]
    for (const [index, child] of Array.from(scope.current.children).entries()) {
      if (index === begin)
        sequence.push([child, { width: [bigWidth, smallWidth] }, { ...animateConfig, at: '<' }])
      else if (index === end)
        sequence.push([child, { width: [smallWidth, bigWidth] }, { ...animateConfig, at: '<' }])
      else sequence.push([child, { width: smallWidth }, { duration: 0, at: '<' }])
    }
    animate(sequence)
  }

  const fromTo = (begin: number, end: number) => {
    if (begin === end) return end
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
    return nextIndex
  }

  return (
    <div className="relative group">
      <Button
        variant="outline"
        size="icon"
        onClick={() => {
          fromTo(currentIndex, currentIndex - 1)
        }}
        className="absolute z-10 left-2 top-1/2 -translate-y-1/2 opacity-0 h-8 w-8 rounded-full
         group-hover:opacity-100 transition-opacity"
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={() => {
          fromTo(currentIndex, currentIndex + 1)
        }}
        className="absolute z-10 right-2 top-1/2 -translate-y-1/2 opacity-0 h-8 w-8 rounded-full
        group-hover:opacity-100 transition-opacity"
      >
        <ArrowRight className="h-4 w-4" />
      </Button>

      <div className="overflow-hidden">
        <div className="flex flex-row -ml-2" ref={scope}>
          {Array.from({ length: items * 2 }).map((_, index) => (
            <div
              className="min-w-0 shrink-0 grow-0 pl-2 w-44"
              key={index}
              onClick={() => {
                fromTo(currentIndex, index)
              }}
            >
              <div className="p-1">
                <Card>
                  <CardContent className={clsx(`flex items-center justify-center p-6 h-80`)}>
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
