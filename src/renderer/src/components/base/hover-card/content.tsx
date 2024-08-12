import { calcPos } from '@renderer/components/base/hover-card/utils'
import { UI_CONFIG } from '@renderer/config'
import { cn } from '@renderer/lib/utils'
import { hoverCardOpenAtomAction, triggerClientRectAtom } from '@renderer/state/hover-card'
import { Align, Side } from '@renderer/type/ui'
import { motion } from 'framer-motion'
import { useAtomValue, useSetAtom } from 'jotai'
import { HTMLProps, PropsWithChildren, useLayoutEffect, useRef, useState } from 'react'

export default function HoverCardContent({
  children,
  className,
  margin = 5,
  align = 'start',
  collisionPadding = {
    right: 8,
    left: UI_CONFIG.NAV_WIDTH + 8,
    bottom: 8,
    top: UI_CONFIG.HEADER_HEIGHT + 8,
  },
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
  const ref = useRef<HTMLDivElement>(null)
  const [transition, setTransition] = useState({ X: 0, Y: 0 })
  const [position, setPosition] = useState<Record<'X' | 'Y', number> | null>(null)
  useLayoutEffect(() => {
    if (!triggerClientRect || !ref.current) return
    const c = calcPos({
      margin,
      collisionPadding,
      align,
      trigger: triggerClientRect,
      content: ref.current.getBoundingClientRect(),
    })
    if (position === null) setPosition({ ...c })
    else setTransition({ X: c.X - position.X, Y: c.Y - position.Y })
    isBottom && isBottom(c.bottom)
    const ob = new ResizeObserver(() => {
      if (!ref.current) return
      const c = calcPos({
        margin,
        collisionPadding,
        align,
        trigger: triggerClientRect,
        content: ref.current.getBoundingClientRect(),
      })
      if (position === null) setPosition({ ...c })
      else setTransition({ X: c.X - position.X, Y: c.Y - position.Y })
      isBottom && isBottom(c.bottom)
    })
    ob.observe(ref.current)
    return () => {
      ref.current && ob.unobserve(ref.current)
    }
  }, [triggerClientRect, ref])
  const setOpen = useSetAtom(hoverCardOpenAtomAction)

  return (
    <motion.div
      ref={ref}
      className={cn(
        'fixed z-50 w-64 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none',
        className,
      )}
      animate={{
        opacity: [0, 1],
        translateX: transition.X,
        translateY: transition.Y,
      }}
      transition={{
        duration: 0.2,
      }}
      style={{
        top: position?.Y ?? 0,
        left: position?.X ?? 0,
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {children}
    </motion.div>
  )
}
