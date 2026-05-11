import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@renderer/components/ui/chart'
import { RatingCount } from '@renderer/data/types/subject'
import { cn } from '@renderer/lib/utils'
import { Bar, BarChart, LabelList, XAxis } from 'recharts'
import type { ComponentClass } from 'react'

const BarCompat = Bar as unknown as ComponentClass<Record<string, unknown>>
const XAxisCompat = XAxis as unknown as ComponentClass<Record<string, unknown>>

export function ScoreChart({
  ratingCount,
  total,
  className,
}: {
  ratingCount: RatingCount
  total: number
  className: string
}) {
  const data: { name: string; score: number; fill: string; percent: string }[] = []
  const chartConfig = {}
  for (const key in ratingCount) {
    data.push({
      name: key,
      score: ratingCount[key],
      fill: `var(--color-${key})`,
      percent: `${((ratingCount[key] / total) * 100).toFixed(2)} %`,
    })
    chartConfig[key] = { color: `hsl(var(--chart-score-${key}))` }
  }
  chartConfig['percent'] = { label: '占比' }
  data.reverse()
  return (
    <ChartContainer config={chartConfig} className={cn('', className)}>
      <BarChart
        accessibilityLayer
        data={data}
        barCategoryGap={2}
        margin={{
          top: 30,
        }}
      >
        <XAxisCompat
          dataKey="name"
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => value}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent nameKey="percent" hideLabel />}
        />
        <BarCompat dataKey="score" radius={4}>
          <LabelList position="top" offset={10} className="fill-foreground" fontSize={10} />
        </BarCompat>
      </BarChart>
    </ChartContainer>
  )
}
