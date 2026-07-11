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
    <div className={cn('flex flex-col gap-1', disabled && 'opacity-50')}>
      {displayedRate !== 0 ? (
        <div className="text-sm font-medium">
          我的评价：
          <span style={{ color: `hsl(var(--chart-score-${displayedRate}))` }}>
            {RATING_MAP[displayedRate]} {(isHover || form) && displayedRate}
            {!noNeedCaution && '（谨慎哦！）'}
          </span>
        </div>
      ) : (
        <div className="text-sm font-medium">还没有评价喔</div>
      )}
      <div className="flex flex-row items-center gap-1 text-xl">
        <div
          aria-label="评分"
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
                Number(key) > displayedRate ? 'i-mingcute-star-line' : 'i-mingcute-star-fill',
              )}
              style={
                Number(key) <= displayedRate
                  ? { color: `hsl(var(--chart-score-${displayedRate}))` }
                  : { color: `hsl(var(--chart-score-${key}))` }
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
        {rate !== 0 && (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                aria-label="清除评分"
                type="button"
                onClick={() => onRateChanged(0)}
                disabled={disabled}
                className="i-mingcute-broom-line"
              />
            </TooltipTrigger>
            <TooltipContent side="bottom">清除评分</TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  )
}
