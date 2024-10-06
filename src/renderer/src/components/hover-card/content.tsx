import { calcPos } from '@renderer/components/hover-card/utils'
import { UI_CONFIG } from '@renderer/config'
import { cn } from '@renderer/lib/utils'
import { hoverCardOpenAtomAction, triggerClientRectAtom } from '@renderer/state/hover-card'
import { Align, Side } from '@renderer/type/ui'
import { animate, motion } from 'framer-motion'
import { useAtomValue, useSetAtom } from 'jotai'
import { HTMLProps, PropsWithChildren, useCallback, useLayoutEffect, useRef, useState } from 'react'

const defaultCollisionPadding = {
  right: 8,
  left: UI_CONFIG.NAV_WIDTH + 8,
  bottom: 8,
  top: UI_CONFIG.HEADER_HEIGHT + 8,
}
export function HoverCardContent({
  children,
  className,
  margin = 5,
  align = 'start',
  collisionPadding = defaultCollisionPadding,
  isBottom = () => {},
}: PropsWithChildren<
  HTMLProps<'div'> & {
    margin?: number
    collisionPadding?: Partial<Record<Side, number>>
    align?: Align
    isBottom?: (isBottom: boolean) => void
  }
>) {
  const triggerClientRect = useAtomValue(triggerClientRectAtom)
  const aContainerRef = useRef<HTMLDivElement>(null)
  const ref = useRef<HTMLDivElement>(null)
  const [isCollision, setIsCollision] = useState(false)
  const beforeBottom = useRef(true)
  const firstRender = useRef(true)
  const setOpen = useSetAtom(hoverCardOpenAtomAction)

  const calc = useCallback(() => {
    if (!triggerClientRect || !ref.current) return
    const c = calcPos({
      margin,
      collisionPadding,
      align,
      trigger: triggerClientRect,
      content: ref.current.getBoundingClientRect(),
    })
    setIsCollision(c.collision)
    const isFlip = beforeBottom.current !== c.isBottom
    isBottom(c.isBottom)
    beforeBottom.current = c.isBottom
    if (!aContainerRef.current) return
    animate(
      aContainerRef.current,
      {
        left: c.left,
        top: c.top,
        right: c.right,
        bottom: c.bottom,
      },
      { duration: isFlip || firstRender.current ? 0 : 0.15 },
    )
    firstRender.current = false
  }, [margin, align, triggerClientRect, isBottom, collisionPadding, firstRender])

  useLayoutEffect(() => {
    if (!ref.current) return
    const ob = new ResizeObserver(() => {
      calc()
    })
    ob.observe(ref.current)
    return () => {
      ob.disconnect()
    }
  }, [triggerClientRect, calc])

  return (
    <motion.div
      ref={aContainerRef}
      className={cn(
        'fixed z-50 rounded-md border bg-popover text-popover-foreground shadow-md',
        isCollision ? 'w-max overflow-x-hidden' : 'overflow-hidden',
      )}
      transition={{
        duration: 0.15,
      }}
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      exit={{
        opacity: 0,
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <div ref={ref} className={cn('h-max w-max', className)}>
        {children}
      </div>
    </motion.div>
  )
}
