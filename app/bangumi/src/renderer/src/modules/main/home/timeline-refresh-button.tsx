import { Button } from '@renderer/components/ui/button'
import { cn } from '@renderer/lib/utils'

const REFRESH_AGE_VISIBLE_AFTER = 2 * 60 * 1000

export function TimelineRefreshButton({
  lastRefreshedAt,
  now,
  onRefresh,
  refreshing,
}: {
  lastRefreshedAt?: number
  now: number
  onRefresh: () => void
  refreshing: boolean
}) {
  const refreshAgeLabel = getRefreshAgeLabel(lastRefreshedAt, now)
  const expanded = !!refreshAgeLabel && !refreshing

  return (
    <Button
      aria-label={expanded ? `刷新时间线，${refreshAgeLabel}` : '刷新时间线'}
      className={cn(
        'h-8 shrink-0 justify-start overflow-hidden px-0 transition-[width,background-color,color] duration-300 ease-out',
        expanded ? 'w-40' : 'w-8',
      )}
      disabled={refreshing}
      onClick={onRefresh}
      size="sm"
      title={expanded ? refreshAgeLabel : '刷新时间线'}
      variant="ghost"
    >
      <span className="flex size-8 shrink-0 items-center justify-center">
        <span className={cn('i-mingcute-refresh-2-line text-base', refreshing && 'animate-spin')} />
      </span>
      <span
        className={cn(
          'min-w-0 pr-2 text-xs transition-[opacity,transform] duration-300 ease-out',
          expanded ? 'translate-x-0 opacity-100' : '-translate-x-1 opacity-0',
        )}
      >
        {refreshAgeLabel}
      </span>
    </Button>
  )
}

function getRefreshAgeLabel(lastRefreshedAt: number | undefined, now: number) {
  if (!lastRefreshedAt) return undefined

  const elapsed = Math.max(0, now - lastRefreshedAt)
  if (elapsed < REFRESH_AGE_VISIBLE_AFTER) return undefined

  const minutes = Math.max(1, Math.floor(elapsed / 60000))
  if (minutes < 60) return `上次刷新是 ${minutes} 分钟前`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `上次刷新是 ${hours} 小时前`

  return `上次刷新是 ${Math.floor(hours / 24)} 天前`
}
