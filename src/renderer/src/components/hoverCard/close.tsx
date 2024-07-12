import { useActiveHoverCard } from '@renderer/components/hoverCard/state'
import { cn } from '@renderer/lib/utils'

export function BackCover({ className }: { className?: string }) {
  const activeId = useActiveHoverCard((state) => state.activeId)
  const setActiveId = useActiveHoverCard((state) => state.setActiveId)
  return (
    activeId && (
      <div className={cn('fixed inset-0 z-20', className)} onMouseEnter={() => setActiveId(null)} />
    )
  )
}
