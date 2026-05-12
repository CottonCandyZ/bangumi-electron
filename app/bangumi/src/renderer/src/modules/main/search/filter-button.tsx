import { Button } from '@renderer/components/ui/button'
import { cn } from '@renderer/lib/utils'
import { rightPanelOpenAtom } from '@renderer/state/panel'
import { useAtom } from 'jotai'

export function FilterButton() {
  const [sideOpen, setSideOpen] = useAtom(rightPanelOpenAtom)
  return (
    <Button
      className={cn('size-9 shrink-0 rounded-2xl p-0 shadow-none', sideOpen && 'bg-accent')}
      variant="ghost"
      onClick={() => setSideOpen(!sideOpen)}
    >
      <span className="i-mingcute-filter-2-line text-xl" />
    </Button>
  )
}
