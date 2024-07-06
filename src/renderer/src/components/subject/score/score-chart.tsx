import { ResponsiveBar } from '@nivo/bar'
import { RatingCount } from '@renderer/constants/types/subject'

export default function ScoreChart({
  ratingCount,
  total,
}: {
  ratingCount: RatingCount
  total: number
}) {
  const data: { name: string; score: number }[] = []
  for (const key in ratingCount) {
    data.push({ name: key, score: ratingCount[key] })
  }
  data.reverse()
  return (
    <ResponsiveBar
      data={data}
      indexBy="name"
      keys={['score']}
      margin={{ top: 20, right: 0, bottom: 20, left: 0 }}
      padding={0.2}
      colors={{ scheme: 'pink_yellowGreen' }}
      colorBy="indexValue"
      enableTotals={true}
      enableLabel={false}
      enableGridY={false}
      axisLeft={null}
      tooltip={({ value, color }) => (
        <div style={{ color }} className="border bg-card px-4 py-2">
          {((value / total) * 100).toFixed(2)} %
        </div>
      )}
    />
  )
}
