import { TooltipContent, TooltipTrigger, Tooltip } from '@renderer/components/ui/tooltip'
import { CollectionData } from '@renderer/data/types/collection'
import { RATING_MAP } from '@renderer/lib/utils/map'
import { useEffect, useState } from 'react'

export default function RateButtons({
  rate,
  onRateChanged,
}: {
  rate: CollectionData['rate']
  onRateChanged: (rate: CollectionData['rate']) => void
}) {
  const [hoverValue, setHoverValue] = useState(rate)
  useEffect(() => {
    setHoverValue(rate)
  }, [rate])
  return (
    <div className="flex flex-col gap-1">
      {hoverValue !== 0 ? (
        <div className="text-sm font-medium">
          我的评价：
          <span style={{ color: `hsl(var(--chart-score-${hoverValue}))` }}>
            {RATING_MAP[hoverValue]} {hoverValue}
            {(hoverValue === 10 || hoverValue === 1) && '（谨慎哦！）'}
          </span>
        </div>
      ) : (
        <div className="text-sm font-medium">还没有评价喔</div>
      )}
      <div className="flex flex-row gap-1">
        <div onMouseLeave={() => setHoverValue(rate)}>
          {Object.keys(RATING_MAP).map((key) => (
            <button
              key={key}
              onClick={() => onRateChanged(Number(key) as CollectionData['rate'])}
              onMouseEnter={() => setHoverValue(Number(key) as CollectionData['rate'])}
            >
              {Number(key) <= hoverValue ? (
                <span
                  className={`i-mingcute-star-fill`}
                  style={{ color: `hsl(var(--chart-score-${key}))` }}
                />
              ) : (
                <span
                  className={`i-mingcute-star-line`}
                  style={{ color: `hsl(var(--chart-score-${key}))` }}
                />
              )}
            </button>
          ))}
        </div>
        {rate !== 0 && (
          <Tooltip delayDuration={0}>
            <TooltipTrigger>
              <button onClick={() => onRateChanged(0)}>
                <span className="i-mingcute-broom-line" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">清除评分</TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  )
}
