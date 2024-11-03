import { hoverCardOpenAtomAction, triggerClientRectAtom } from '@renderer/state/hover-card'
import { useSetAtom } from 'jotai'
import { PropsWithChildren, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

export function HoverCardTrigger({ children, onOpen }: PropsWithChildren<{ onOpen?: () => void }>) {
  const ref = useRef<HTMLDivElement>(null)
  const rectSet = useSetAtom(triggerClientRectAtom)
  const setOpen = useSetAtom(hoverCardOpenAtomAction)
  const { pathname } = useLocation()

  useEffect(() => {
    return () => setOpen(false)
  }, [setOpen, pathname])

  return (
    <div
      ref={ref}
      onMouseEnter={() => {
        rectSet(ref.current!.getBoundingClientRect())
        setOpen(true)
        onOpen?.()
      }}
      onMouseLeave={() => {
        setOpen(false)
      }}
    >
      {children}
    </div>
  )
}
