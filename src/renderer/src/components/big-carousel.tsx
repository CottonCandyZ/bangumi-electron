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
    <div>
      <div className="flex flex-row gap-2">
        <Button
          onClick={() => {
            setCurrent((current) => {
              return [current[0] - 1, true]
            })
          }}
        >
          <ArrowLeft />
        </Button>
        <Button
          onClick={() => {
            setCurrent((current) => {
              return [current[0] + 1, true]
            })
          }}
        >
          <ArrowRight />
        </Button>
      </div>

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
