import { Button } from '@renderer/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { cn } from '@renderer/lib/utils'

export function NavButton({ compact = false }: { compact?: boolean }) {
  const navigate = useNavigate()
  // Subscribe to router navigation so browser history availability is recalculated.
  useLocation()
  const historyIndex = typeof history.state?.idx === 'number' ? history.state.idx : 0
  const backDisable = historyIndex === 0
  const forwardDisable = historyIndex >= history.length - 1
  return (
    <div className="flex items-center justify-center gap-0.5">
      <Button
        variant="ghost"
        aria-label="后退"
        className={cn(
          'no-drag-region aspect-square p-0.5 shadow-none [&_svg]:size-6',
          compact && 'size-7 rounded-sm [&_svg]:size-4',
        )}
        onClick={() => navigate(-1)}
        disabled={backDisable}
      >
        <ChevronLeft />
      </Button>
      <Button
        variant="ghost"
        aria-label="前进"
        className={cn(
          'no-drag-region aspect-square p-0.5 shadow-none [&_svg]:size-6',
          compact && 'size-7 rounded-sm [&_svg]:size-4',
        )}
        onClick={() => navigate(1)}
        disabled={forwardDisable}
      >
        <ChevronRight />
      </Button>
    </div>
  )
}
