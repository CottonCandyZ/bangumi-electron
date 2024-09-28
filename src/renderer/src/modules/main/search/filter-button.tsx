import { Button } from '@renderer/components/ui/button'
import { cn } from '@renderer/lib/utils'
import { rightPanelOpenAtom } from '@renderer/state/panel'
import { useAtom } from 'jotai'

export function FilterButton() {
  const [sideOpen, setSideOpen] = useAtom(rightPanelOpenAtom)
  return (
    <Button
      className={cn('rounded-2xl shadow-none', sideOpen && 'bg-accent')}
      variant="ghost"
      onClick={() => setSideOpen(!sideOpen)}
    >
      <span className="i-mingcute-filter-2-line text-xl" />
    </Button>
  )
}
