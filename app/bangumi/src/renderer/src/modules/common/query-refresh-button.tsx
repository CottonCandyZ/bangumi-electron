import { Button } from '@renderer/components/ui/button'
import { cn } from '@renderer/lib/utils'

export function QueryRefreshButton({
  className,
  disabled = false,
  label = '刷新',
  onRefresh,
  refreshing,
}: {
  className?: string
  disabled?: boolean
  label?: string
  onRefresh: () => Promise<unknown> | unknown
  refreshing: boolean
}) {
  return (
    <Button
      aria-label={label}
      className={cn('size-8 shrink-0', className)}
      disabled={disabled || refreshing}
      onClick={() => {
        void onRefresh()
      }}
      size="icon"
      title={label}
      variant="ghost"
    >
      <span className={cn('i-mingcute-refresh-2-line text-base', refreshing && 'animate-spin')} />
    </Button>
  )
}
