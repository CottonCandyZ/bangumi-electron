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
  const [translate, setTranslate] = useState({ X: 0 })
  const [position, setPosition] = useState<Record<'X' | 'top' | 'bottom', number | undefined>>({
    X: undefined,
    top: undefined,
    bottom: undefined,
  })
  const [isCollision, setIsCollision] = useState(false)
  const [height, setHeight] = useState<number | 'auto'>('auto')
  const [width, setWidth] = useState<number | 'auto'>('auto')

  const calc = useCallback(() => {
    if (!triggerClientRect || !ref.current) return
    const c = calcPos({
      margin,
      collisionPadding,
      align,
      trigger: triggerClientRect,
      content: ref.current.getBoundingClientRect(),
    })
    if (c.height != undefined) {
      setHeight(c.height)
      setIsCollision(true)
    } else {
      setHeight(ref.current.getBoundingClientRect().height)
      setWidth(ref.current.getBoundingClientRect().width)
      setIsCollision(false)
    }
    if (position.X === undefined) setPosition({ ...c })
    else {
      setTranslate({ X: c.X - (position.X ?? 0) })
      setPosition({ ...position, top: c.top, bottom: c.bottom })
    }
    isBottom && isBottom(c.bottom === undefined)
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
      className={cn(
        'fixed z-50 rounded-md border bg-popover text-popover-foreground shadow-md transition-[transform_height_width] duration-150 animate-in fade-in-0',
        isCollision ? 'overflow-x-hidden' : 'overflow-hidden',
      )}
      style={{
        top: position.top,
        left: position.X,
        bottom: position.bottom,
        transform: `translateX(${translate.X}px)`,
        height,
        width,
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <div ref={ref} className={cn('h-max w-max', className)}>
        {children}
      </div>
    </div>
  )
}
