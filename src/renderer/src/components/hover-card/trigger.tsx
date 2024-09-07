import { hoverCardOpenAtomAction, triggerClientRectAtom } from '@renderer/state/hover-card'
import { useSetAtom } from 'jotai'
import { PropsWithChildren, useRef } from 'react'

export default function HoverCardTrigger({
  children,
  onOpen,
}: PropsWithChildren<{ onOpen: () => void }>) {
  const ref = useRef<HTMLDivElement>(null)
  const rectSet = useSetAtom(triggerClientRectAtom)
  const setOpen = useSetAtom(hoverCardOpenAtomAction)

  return (
    <div
      ref={ref}
      onMouseEnter={() => {
        rectSet(ref.current!.getBoundingClientRect())
        setOpen(true)
        onOpen()
      }}
      onMouseLeave={() => {
        setOpen(false)
      }}
    >
      {children}
    </div>
  )
}
