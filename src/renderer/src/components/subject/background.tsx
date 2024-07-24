import { ScrollContext } from '@renderer/components/base/page-scroll-wrapper'
import { SateContext } from '@renderer/components/wrapper/state-wrapper'
import { useContext, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

const initScrollTop = 700
const initPercent = -60
const scrollRange = 1500
const init = (top: number | undefined) => {
  return top === undefined
    ? initPercent
    : top >= scrollRange
      ? 100
      : (top / scrollRange) * (100 - initPercent) + initPercent
}

export default function SubjectBackground() {
  const instance = useContext(ScrollContext)
  if (!instance) throw Error('Component need to be wrapped in ScrollContext')
  const stateContext = useContext(SateContext)
  if (!stateContext) {
    throw new Error('PageScrollWrapper need in StateWrapper')
  }
  const { key } = useLocation()
  const { scrollCache } = stateContext
  const [percent, setPercent] = useState(init(scrollCache.get(key) ?? initScrollTop))
  const scrollListener = () => {
    const top = instance()?.elements().viewport?.scrollTop
    setPercent(init(top))
  }
  useEffect(() => {
    instance()?.on('scroll', scrollListener)
    return () => instance()?.off('scroll', scrollListener)
  }, [])
  return (
    <>
      <div
        className="absolute left-0 right-0 top-0 -z-10 h-[100rem]"
        style={{
          background: `linear-gradient(to top, hsl(var(--background)) ${percent}%, hsl(var(--background) / 0) ${percent + 130}%)`,
        }}
      ></div>
      <div className="absolute inset-0 top-[100rem] -z-10 bg-background"></div>
    </>
  )
}
