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

  return (
    <div
      ref={ref}
      onMouseEnter={() => {
        hoveringRef.current = true
        rectSet(ref.current!.getBoundingClientRect())
        setOpen(true)
        onOpen?.()
      }}
      onMouseLeave={() => {
        hoveringRef.current = false
        setOpen(false)
      }}
    >
      {children}
    </div>
  )
}
