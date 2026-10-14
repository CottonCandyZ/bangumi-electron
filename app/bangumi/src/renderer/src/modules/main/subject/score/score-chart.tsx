import { RatingCount } from '@renderer/data/types/subject'
import { cn } from '@renderer/lib/utils'

/**
 * 评分分布柱状图。
 * 只有 10 根柱子，用纯 CSS 实现：recharts 挂载时会测量每个刻度/标签的文字尺寸，
 * 在页面切换（view transition）时会带来上百毫秒的主线程阻塞。
 */
export function ScoreChart({
  ratingCount,
  total,
  className,
}: {
  ratingCount: RatingCount
  total: number
  className?: string
}) {
  const data = Object.keys(ratingCount)
    .map((key) => ({ name: key, score: ratingCount[key] as number }))
    .reverse()
  const max = Math.max(1, ...data.map((item) => item.score))

  return (
    <div className={cn('flex flex-row items-stretch gap-0.5', className)} role="list">
      {data.map(({ name, score }) => {
        const percent = total > 0 ? ((score / total) * 100).toFixed(2) : '0.00'
        return (
          <div
            aria-label={`${name} 分：${score} 人，占比 ${percent}%`}
            className="group/bar relative flex min-w-0 flex-1 flex-col items-center"
            key={name}
            role="listitem"
          >
            <div className="flex w-full flex-1 flex-col items-center justify-end pt-1">
              <span className="text-foreground mb-1 text-[10px] leading-none tabular-nums">
                {score}
              </span>
              <div
                className="w-full rounded-[4px] transition-opacity group-hover/bar:opacity-80"
                style={{
                  height: `${(score / max) * 100}%`,
                  minHeight: score > 0 ? 2 : 0,
                  backgroundColor: `hsl(var(--chart-score-${name}))`,
                }}
              />
            </div>
            <span className="text-muted-foreground mt-1.5 text-xs leading-none tabular-nums">
              {name}
            </span>
            <div className="bg-popover text-popover-foreground pointer-events-none absolute bottom-full left-1/2 z-20 mb-1 -translate-x-1/2 rounded-md border px-2 py-1 text-xs whitespace-nowrap opacity-0 shadow-md transition-opacity group-hover/bar:opacity-100">
              <span className="text-muted-foreground">占比</span>{' '}
              <span className="font-medium tabular-nums">{percent} %</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
