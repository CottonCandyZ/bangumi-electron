import { calcPos } from '@renderer/components/base/hover-card/utils'
import { UI_CONFIG } from '@renderer/config'
import { cn } from '@renderer/lib/utils'
import { hoverCardOpenAtomAction, triggerClientRectAtom } from '@renderer/state/hover-card'
import { Align, Side } from '@renderer/type/ui'
import { useAtomValue, useSetAtom } from 'jotai'
import { HTMLProps, PropsWithChildren, useCallback, useLayoutEffect, useRef, useState } from 'react'

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
  const [translate, setTranslate] = useState({ X: 0, Y: 0 })
  const [position, setPosition] = useState<Record<'X' | 'Y', number> | null>(null)

  const calc = useCallback(() => {
    if (!triggerClientRect || !ref.current) return
    const c = calcPos({
      margin,
      collisionPadding,
      align,
      trigger: triggerClientRect,
      content: ref.current.getBoundingClientRect(),
    })
    if (position === null) setPosition({ ...c })
    else {
      setTranslate({ X: c.X - position.X, Y: 0 })
      setPosition({ ...position, Y: c.Y })
    }
    isBottom && isBottom(c.bottom)
  }, [
    margin,
    collisionPadding,
    align,
    triggerClientRect,
    ref.current,
    setPosition,
    setTranslate,
    isBottom,
  ])

  useLayoutEffect(() => {
    if (!ref.current) return
    calc()
    const ob = new ResizeObserver(() => {
      calc()
    })
    ob.observe(ref.current)
    return () => {
      ref.current && ob.unobserve(ref.current)
    }
  }, [triggerClientRect, ref])
  const setOpen = useSetAtom(hoverCardOpenAtomAction)

  return (
    <div
      ref={ref}
      className={cn(
        'fixed z-50 w-64 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none transition-transform duration-100 animate-in fade-in-0',
        className,
      )}
      style={{
        top: position?.Y ?? 0,
        left: position?.X ?? 0,
        transform: `translateX(${translate.X}px)`,
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {children}
    </div>
  )
}
