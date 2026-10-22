import {
  enterHoverCardTriggerInSafeArea,
  isHoverCardContent,
  isInHoverCardSafeArea,
  startHoverCardSafeArea,
} from '@renderer/components/hover-card/safe-area'
import { hoverCardOpenAtomAction, triggerClientRectAtom } from '@renderer/state/hover-card'
import { useSetAtom } from 'jotai'
import { PropsWithChildren, useEffect, useRef } from 'react'

/**
 * 注意：这里不要订阅路由（useLocation）。剧集按钮可能有上百个，
 * 每次路由切换都让它们重渲染并各自调度定时器，会拖慢 view transition。
 * 路由切换时由全局的 HoverCard 统一关闭。
 */
export function HoverCardTrigger({ children, onOpen }: PropsWithChildren<{ onOpen?: () => void }>) {
  const ref = useRef<HTMLDivElement>(null)
  const hoveringRef = useRef(false)
  const rectSet = useSetAtom(triggerClientRectAtom)
  const setOpen = useSetAtom(hoverCardOpenAtomAction)

  useEffect(() => {
    return () => {
      if (hoveringRef.current) setOpen(false)
    }
  }, [setOpen])

  const open = () => {
    if (!hoveringRef.current || !ref.current) return
    rectSet(ref.current.getBoundingClientRect())
    setOpen(true)
    onOpen?.()
  }
  const keepOpen = () => setOpen(true, 0, 0)

  return (
    <div
      ref={ref}
      onMouseEnter={() => {
        hoveringRef.current = true
        // 正往已打开的卡片走时，路过的其他触发器先不切换；回到自己则直接保持
        if (isInHoverCardSafeArea()) enterHoverCardTriggerInSafeArea(hoveringRef, open)
        else open()
      }}
      onMouseLeave={(event) => {
        hoveringRef.current = false
        if (isInHoverCardSafeArea()) return
        // 直接移进了卡片（卡片贴着或盖住触发器时）
        if (isHoverCardContent(event.relatedTarget)) return keepOpen()
        const started = startHoverCardSafeArea(
          { x: event.clientX, y: event.clientY },
          {
            close: () => setOpen(false),
            keepOpen,
            owner: hoveringRef,
            trigger: event.currentTarget.getBoundingClientRect(),
          },
        )
        if (!started) setOpen(false)
      }}
    >
      {children}
    </div>
  )
}
