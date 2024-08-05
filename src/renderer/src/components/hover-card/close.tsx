import { cn } from '@renderer/lib/utils'
import {
  activeHoverPopCardAtom,
  hoverPopCardViewTransitionStatusAtom,
} from '@renderer/state/hover-pop-card'
import { useAtom, useSetAtom } from 'jotai'
import { flushSync } from 'react-dom'

export function BackCover({ className }: { className?: string }) {
  const [activeId, setActiveId] = useAtom(activeHoverPopCardAtom)
  const setViewTransitionStatus = useSetAtom(hoverPopCardViewTransitionStatusAtom)
  return (
    activeId && (
      <div
        className={cn('fixed inset-0 z-20', className)}
        onMouseEnter={() => {
          const transition = document.startViewTransition(() => {
            flushSync(() => {
              setViewTransitionStatus(activeId)
              setActiveId(null)
            })
          })
          transition.finished.finally(() => {
            setViewTransitionStatus(null)
          })
        }}
      />
    )
  )
}
