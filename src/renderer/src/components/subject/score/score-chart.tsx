import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@renderer/components/ui/chart'
import { RatingCount } from '@renderer/data/types/subject'
import { cn } from '@renderer/lib/utils'
import { Bar, BarChart, LabelList, XAxis } from 'recharts'

export default function ScoreChart({
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
        margin={{
          top: 30,
        }}
      >
        <XAxis dataKey="name" tickLine={false} axisLine={false} tickFormatter={(value) => value} />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent nameKey="percent" hideLabel />}
        />
        <Bar dataKey="score" radius={4}>
          <LabelList position="top" offset={10} className="fill-foreground" fontSize={10} />
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}
