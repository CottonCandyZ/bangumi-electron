import { useEffect, useRef, useState } from 'react'

let tooltipIsHover = false
let globalHoverTimeId: ReturnType<typeof setTimeout> | undefined = undefined

export const useTooltipHover = <T extends HTMLElement = HTMLElement>({
  delay = 0,
}: {
  delay?: number
} = {}) => {
  const [isHover, setIsHover] = useState(false)
  const elementRef = useRef<T>(null)
  const timeId = useRef<ReturnType<typeof setTimeout> | undefined>()
  useEffect(() => {
    const handleMouseEnter = () => {
      clearTimeout(globalHoverTimeId)
      clearTimeout(timeId.current)
      if (tooltipIsHover) {
        setIsHover(true)
      } else {
        timeId.current = setTimeout(() => {
          tooltipIsHover = true
          setIsHover(true)
        }, delay)
      }
    }
    const handleMouseLeave = () => {
      clearTimeout(timeId.current)
      clearTimeout(globalHoverTimeId)
      setIsHover(false)
      globalHoverTimeId = setTimeout(() => {
        tooltipIsHover = false
      }, 300)
    }
    const handleMouseDown = () => {
      clearTimeout(timeId.current)
      setIsHover(false)
    }

    if (elementRef.current) {
      elementRef.current.addEventListener('mouseenter', handleMouseEnter)
      elementRef.current.addEventListener('mouseleave', handleMouseLeave)
      elementRef.current.addEventListener('mousedown', handleMouseDown)
    }
    return () => {
      if (elementRef.current) {
        elementRef.current.removeEventListener('mouseenter', handleMouseEnter)
        elementRef.current.removeEventListener('mouseleave', handleMouseLeave)
        elementRef.current.removeEventListener('mousedown', handleMouseDown)
      }
    }
  }, [elementRef])

  return { isHover, elementRef }
}
