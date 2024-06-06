import { Button } from '@renderer/components/ui/button'
import { Card, CardContent } from '@renderer/components/ui/card'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useEffect, useState } from 'react'
const items = 10
const big = 176

const before = 2
const after = 5
export default function BigCarousel(): JSX.Element {
  const [[current, normal], setCurrent] = useState([before, false])

  useEffect(() => {
    const timeId = setInterval(() => setCurrent((current) => [current[0] + 1, true]), 5000)
    return () => clearInterval(timeId)
  }, [])

  return (
    <div className="relative group">
      <Button
        variant="outline"
        size="icon"
        onClick={() => {
          setCurrent((current) => {
            return [current[0] - 1, true]
          })
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
          setCurrent((current) => {
            return [current[0] + 1, true]
          })
        }}
        className="absolute z-10 right-2 top-1/2 -translate-y-1/2 opacity-0 h-8 w-8 rounded-full
        group-hover:opacity-100 transition-opacity"
      >
        <ArrowRight className="h-4 w-4" />
      </Button>

      <div className="overflow-hidden">
        <motion.div
          className="flex flex-row -ml-2"
          initial={{ x: -big * current + 40 }}
          animate={{ x: -big * current + 40 }}
          transition={{ type: 'tween', duration: normal ? 0.5 : 0 }}
          layout
          onAnimationComplete={() => {
            console.log('hello')
            if (current == before - 1) setCurrent([before + items - 1, false])
            if (current >= before + items) setCurrent([current - items, false])
          }}
        >
          {Array.from({ length: items + before + after }).map((_, index) => (
            <div
              className={clsx(`min-w-0 shrink-0 grow-0 pl-2 `, {
                'w-[32rem]': current === index,
                'w-44': current !== index,
                'transition-[width] ease-out duration-500': normal,
              })}
              key={index}
              // transition={{ type: 'tween', duration: normal ? 0.4 : 0 }}
              // layout
              onClick={() => setCurrent([index, true])}
            >
              <div className="p-1">
                <Card>
                  <CardContent className={clsx(`flex items-center justify-center p-6 h-80`)}>
                    <span className="text-3xl font-semibold">
                      {index < before
                        ? items - before + index + 1
                        : index >= before + items
                          ? index - items - before + 1
                          : index - before + 1}
                    </span>
                  </CardContent>
                </Card>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
