import {
  useActiveHoverCard,
  useViewTransitionStatusState,
} from '@renderer/components/hover-card/state'
import { cn } from '@renderer/lib/utils'
import { flushSync } from 'react-dom'

export function BackCover({ className }: { className?: string }) {
  const activeId = useActiveHoverCard((state) => state.activeId)
  const setActiveId = useActiveHoverCard((state) => state.setActiveId)
  const setViewTransitionStatus = useViewTransitionStatusState((state) => state.setStatus)
  return (
    activeId && (
      <div
        className={cn('fixed inset-0 z-20', className)}
        onMouseEnter={() => {
          const transition = document.startViewTransition(() => {
            flushSync(() => setViewTransitionStatus(activeId))
            setActiveId(null)
          })
          transition.finished.finally(() => {
            setViewTransitionStatus(null)
          })
        }}
      />
    )
  )
}
