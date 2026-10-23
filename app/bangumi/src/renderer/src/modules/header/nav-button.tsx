import { HintTooltip } from '@renderer/components/tooltip-button/hint-tooltip'
import { Button } from '@renderer/components/ui/button'
import { getHotkeyForHook, isHotkeyEnabled } from '@renderer/lib/shortcut'
import { appConfigAtom } from '@renderer/state/app-config'
import { useAtomValue } from 'jotai'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useHotkeys } from 'react-hotkeys-hook'
import { useLocation, useNavigate } from 'react-router-dom'
import { cn } from '@renderer/lib/utils'
import { useLayoutEffect, useState } from 'react'

export function NavButton({ compact = false }: { compact?: boolean }) {
  const navigate = useNavigate()
  const { key } = useLocation()
  const shortcuts = useAtomValue(appConfigAtom).shortcuts
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

  useHotkeys(
    getHotkeyForHook(shortcuts.navigateBack),
    () => navigate(-1),
    {
      enabled: isHotkeyEnabled(shortcuts.navigateBack) && availability.back,
      preventDefault: true,
    },
    [availability.back, navigate, shortcuts.navigateBack],
  )
  useHotkeys(
    getHotkeyForHook(shortcuts.navigateForward),
    () => navigate(1),
    {
      enabled: isHotkeyEnabled(shortcuts.navigateForward) && availability.forward,
      preventDefault: true,
    },
    [availability.forward, navigate, shortcuts.navigateForward],
  )

  return (
    <div className="flex items-center justify-center gap-0.5">
      <HintTooltip content="后退" hotkey={shortcuts.navigateBack} side="bottom">
        <Button
          variant="ghost"
          aria-label="后退"
          className={cn(
            'no-drag-region aspect-square p-0.5 shadow-none focus-visible:ring-inset [&_svg]:size-6',
            compact && 'size-7 rounded-sm [&_svg]:size-4',
          )}
          onClick={() => navigate(-1)}
          disabled={!availability.back}
        >
          <ChevronLeft />
        </Button>
      </HintTooltip>
      <HintTooltip content="前进" hotkey={shortcuts.navigateForward} side="bottom">
        <Button
          variant="ghost"
          aria-label="前进"
          className={cn(
            'no-drag-region aspect-square p-0.5 shadow-none focus-visible:ring-inset [&_svg]:size-6',
            compact && 'size-7 rounded-sm [&_svg]:size-4',
          )}
          onClick={() => navigate(1)}
          disabled={!availability.forward}
        >
          <ChevronRight />
        </Button>
      </HintTooltip>
    </div>
  )
}
