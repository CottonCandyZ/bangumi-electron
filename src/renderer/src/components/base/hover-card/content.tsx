import { calcPos } from '@renderer/components/base/hover-card/utils'
import { UI_CONFIG } from '@renderer/config'
import { cn } from '@renderer/lib/utils'
import { hoverCardOpenAtomAction, triggerClientRectAtom } from '@renderer/state/hover-card'
import { Align, Side } from '@renderer/type/ui'
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
  useLayoutEffect(() => {
    if (!triggerClientRect || !ref.current) return
    const position = calcPos({
      margin,
      collisionPadding,
      align,
      trigger: triggerClientRect,
      content: ref.current.getBoundingClientRect(),
    })
    setTransition({ ...position })
    isBottom && isBottom(position.bottom)
    const ob = new ResizeObserver(() => {
      if (!ref.current) return
      const position = calcPos({
        margin,
        collisionPadding,
        align,
        trigger: triggerClientRect,
        content: ref.current.getBoundingClientRect(),
      })
      setTransition({ ...position })
      isBottom && isBottom(position.bottom)
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
        'fixed z-50 w-64 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        className,
      )}
      style={{ top: 0, left: 0, transform: `translate(${transition.X}px, ${transition.Y}px)` }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {children}
    </div>
  )
}
