import { TooltipContent, TooltipTrigger, Tooltip } from '@renderer/components/ui/tooltip'
import { CollectionData } from '@renderer/data/types/collection'
import { cn } from '@renderer/lib/utils'
import { RATING_MAP } from '@renderer/lib/utils/map'
import { useEffect, useState } from 'react'

export default function RateButtons({
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
  const [hoverValue, setHoverValue] = useState(rate)
  useEffect(() => {
    setHoverValue(rate)
  }, [rate])
  const [isHover, setIsHover] = useState(false)
  const noNeedCaution =
    (hoverValue !== 10 && hoverValue !== 1) || (!form && (rate === 10 || rate === 1))
  return (
    <div className={cn('flex flex-col gap-1', disabled && 'opacity-50')}>
      {hoverValue !== 0 ? (
        <div className="text-sm font-medium">
          我的评价：
          <span style={{ color: `hsl(var(--chart-score-${hoverValue}))` }}>
            {RATING_MAP[hoverValue]} {(isHover || form) && hoverValue}
            {!noNeedCaution && '（谨慎哦！）'}
          </span>
        </div>
      ) : (
        <div className="text-sm font-medium">还没有评价喔</div>
      )}
      <div className="flex flex-row items-center gap-1 text-xl">
        <div
          onMouseLeave={() => {
            setHoverValue(rate)
            setIsHover(false)
          }}
        >
          {Object.keys(RATING_MAP).map((key) => (
            <button
              type="button"
              key={key}
              className={cn(
                Number(key) > hoverValue ? 'i-mingcute-star-line' : 'i-mingcute-star-fill',
              )}
              style={
                Number(key) <= hoverValue
                  ? { color: `hsl(var(--chart-score-${hoverValue}))` }
                  : { color: `hsl(var(--chart-score-${key}))` }
              }
              onClick={() =>
                rate !== Number(key) && onRateChanged(Number(key) as CollectionData['rate'])
              }
              onMouseEnter={() => {
                setHoverValue(Number(key) as CollectionData['rate'])
                setIsHover(true)
              }}
              disabled={disabled}
            />
          ))}
        </div>
        {rate !== 0 && (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
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
