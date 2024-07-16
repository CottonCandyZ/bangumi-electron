import ScoreChart from '@renderer/components/subject/score/score-chart'
import { Rating } from '@renderer/data/types/subject'
import { getRating } from '@renderer/lib/utils/data-trans'

export default function Score({ rating }: { rating: Rating }) {
  return (
    <div className="flex flex-col gap-1">
      <section className="flex flex-row items-center justify-between gap-2">
        <div
          className={`text-2xl font-bold`}
          style={{ color: `hsl(var(--chart-score-${Math.floor(rating.score + 0.5) || 1}))` }}
        >
          {rating.score.toFixed(1)} <span className="text-lg">{getRating(rating.score)}</span>
        </div>
        <div className="text-sm font-medium text-muted-foreground">
          Rank: # <span>{rating.rank}</span>
        </div>
      </section>
      <div></div>
      <ScoreChart
        ratingCount={rating.count}
        total={rating.total}
        className="min-h-32 md:min-h-40"
      />
      <div className="pr-2 text-right text-sm text-muted-foreground">{rating.total} 人参与</div>
    </div>
  )
}
