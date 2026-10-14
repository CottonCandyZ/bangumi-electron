import { cn } from '@renderer/lib/utils'
import { ChevronDownIcon } from 'lucide-react'

export function SectionFoldButton({
  fold,
  total,
  onToggle,
  className,
}: {
  fold: boolean
  total: number
  onToggle: () => void
  className?: string
}) {
  return (
    <button
      aria-expanded={!fold}
      className={cn(
        'text-muted-foreground hover:text-foreground hover:bg-accent focus-visible:ring-ring/50 flex h-8 w-full items-center justify-center gap-1 rounded-md text-xs transition-colors focus-visible:ring-2 focus-visible:outline-hidden',
        className,
      )}
      onClick={onToggle}
      type="button"
    >
      {fold ? `展开全部 ${total} 项` : '收起'}
      <ChevronDownIcon className={cn('size-3.5 transition-transform', !fold && 'rotate-180')} />
    </button>
  )
}
