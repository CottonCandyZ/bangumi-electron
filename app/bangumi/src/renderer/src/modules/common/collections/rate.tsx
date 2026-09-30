import { TooltipContent, TooltipTrigger, Tooltip } from '@renderer/components/ui/tooltip'
import { CollectionData } from '@renderer/data/types/collection'
import { cn } from '@renderer/lib/utils'
import { RATING_MAP } from '@renderer/lib/utils/map'
import { useState } from 'react'

export function RateButtons({
  rate,
  onRateChanged,
  disabled = false,
  form = false,
}: {
  rate: CollectionData['rate']
  onRateChanged: (rate: CollectionData['rate']) => void
  disabled?: boolean
  form?: boolean
}) {
  const [hoverValue, setHoverValue] = useState<CollectionData['rate'] | null>(null)
  const displayedRate = hoverValue ?? rate
  const isHover = hoverValue !== null
  const noNeedCaution =
    (displayedRate !== 10 && displayedRate !== 1) || (!form && (rate === 10 || rate === 1))
  return (
    <div className={cn('flex flex-col gap-1.5', disabled && 'opacity-50')}>
      <div className="flex h-4 flex-row items-center gap-1.5 text-xs">
        <span className="text-muted-foreground">我的评分</span>
        <span
          className="ml-auto font-medium tabular-nums"
          style={
            displayedRate !== 0 ? { color: `hsl(var(--chart-score-${displayedRate}))` } : undefined
          }
        >
          {displayedRate !== 0 ? (
            <>
              {RATING_MAP[displayedRate]} {displayedRate}
              {!noNeedCaution && '（谨慎哦！）'}
            </>
          ) : (
            <span className="text-muted-foreground/70 font-normal">未评分</span>
          )}
        </span>
        {rate !== 0 && !isHover && (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                aria-label="清除评分"
                type="button"
                onClick={() => onRateChanged(0)}
                disabled={disabled}
                className="i-mingcute-broom-line text-muted-foreground hover:text-foreground transition-colors"
              />
            </TooltipTrigger>
            <TooltipContent side="bottom">清除评分</TooltipContent>
          </Tooltip>
        )}
      </div>
      <div
        aria-label="评分"
        className="flex flex-row items-center text-lg"
        onMouseLeave={() => {
          setHoverValue(null)
        }}
        role="group"
      >
        {Object.keys(RATING_MAP).map((key) => (
          <button
            aria-label={`${key} 分：${RATING_MAP[Number(key) as keyof typeof RATING_MAP]}`}
            aria-pressed={rate === Number(key)}
            type="button"
            key={key}
            className={cn(
              'transition-transform duration-100 hover:scale-110 motion-reduce:transform-none',
              Number(key) > displayedRate
                ? 'i-mingcute-star-line text-muted-foreground/35'
                : 'i-mingcute-star-fill',
            )}
            style={
              Number(key) <= displayedRate
                ? { color: `hsl(var(--chart-score-${displayedRate}))` }
                : undefined
            }
            onClick={() =>
              rate !== Number(key) && onRateChanged(Number(key) as CollectionData['rate'])
            }
            onMouseEnter={() => {
              setHoverValue(Number(key) as CollectionData['rate'])
            }}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  )
}
