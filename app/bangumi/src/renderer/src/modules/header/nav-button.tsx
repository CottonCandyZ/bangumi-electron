import { Button } from '@renderer/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { cn } from '@renderer/lib/utils'
import { useLayoutEffect, useState } from 'react'

export function NavButton({ compact = false }: { compact?: boolean }) {
  const navigate = useNavigate()
  const { key } = useLocation()
  const [availability, setAvailability] = useState({ back: false, forward: false })
  useLayoutEffect(() => {
    // Browser history is external mutable state. Read it after the route commits,
    // before painting, rather than allowing render-time reads to be memoized.
    const index = typeof history.state?.idx === 'number' ? history.state.idx : 0
    const next = { back: index > 0, forward: index < history.length - 1 }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAvailability((previous) =>
      previous.back === next.back && previous.forward === next.forward ? previous : next,
    )
  }, [key])
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
        disabled={!availability.back}
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
        disabled={!availability.forward}
      >
        <ChevronRight />
      </Button>
    </div>
  )
}
