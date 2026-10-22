import {
  clearHoverCardContentElement,
  setHoverCardContentElement,
} from '@renderer/components/hover-card/safe-area'
import { calcPos } from '@renderer/components/hover-card/utils'
import { UI_CONFIG } from '@renderer/config'
import { cn } from '@renderer/lib/utils'
import {
  hoverCardInstantClosingAtom,
  hoverCardOpenAtomAction,
  triggerClientRectAtom,
} from '@renderer/state/hover-card'
import { Align, Side } from '@renderer/type/ui'
import { animate } from 'motion'
import { motion, useIsPresent } from 'motion/react'
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
  isBottom,
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
  const instantClosing = useAtomValue(hoverCardInstantClosingAtom)
  const isPresent = useIsPresent()

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
    isBottom?.(c.isBottom)
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
    // 首次的可能 resizeOb 会有抖动，本来加了个 tailing false 的 throttle 给 calc，不太合理，直接加个首次的时延这个可以解决
    setTimeout(() => {
      firstRender.current = false
    }, 100)
  }, [margin, align, triggerClientRect, isBottom, collisionPadding])

  // 供安全三角区判断鼠标是否正往卡片移动
  useLayoutEffect(() => {
    const element = aContainerRef.current
    setHoverCardContentElement(element)
    // 新卡片可能先于正在退出的旧卡片挂载，只清掉自己登记的那个
    return () => clearHoverCardContentElement(element)
  }, [])

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
        'bg-popover text-popover-foreground fixed z-50 rounded-md border shadow-xl',
        isCollision && 'w-max',
        'overflow-hidden',
      )}
      transition={{
        duration: instantClosing ? 0 : 0.15,
        ease: 'easeInOut',
      }}
      // 位移要小于和触发器的间距（margin），否则入场 / 退场时卡片会盖住触发器，
      // 鼠标在触发器靠近卡片的那一侧时就会反复离开、进入，造成闪烁
      initial={{
        opacity: 0,
        y: -Math.min(4, margin - 1),
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      exit={{
        opacity: 0.1,
        y: -Math.min(4, margin - 1),
        transition: { duration: instantClosing ? 0 : 0.15 },
      }}
      // 退出动画期间不再接收鼠标：否则淡出中的卡片会被鼠标重新「唤醒」，
      // 又挡住下面的触发器，形成反复开关的闪烁
      style={{ pointerEvents: isPresent ? undefined : 'none' }}
      onMouseEnter={() => {
        if (isPresent) setOpen(true)
      }}
      onMouseLeave={() => {
        if (isPresent) setOpen(false)
      }}
    >
      <div ref={ref} className={cn('h-max w-max', className)}>
        {children}
      </div>
    </motion.div>
  )
}
