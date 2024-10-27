import { cn } from '@renderer/lib/utils'
import { activeHoverPopCardAtom } from '@renderer/state/hover-pop-card'
import { useAtom } from 'jotai'

export function BackCover({ className }: { className?: string }) {
  const [activeId, setActiveId] = useAtom(activeHoverPopCardAtom)
  return (
    activeId && (
      <div className={cn('fixed inset-0 z-20', className)} onMouseEnter={() => setActiveId(null)} />
    )
  )
}
