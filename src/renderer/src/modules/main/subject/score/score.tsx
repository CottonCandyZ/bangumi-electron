import { Rating, RatingCount } from '@renderer/data/types/subject'
import { getRating } from '@renderer/lib/utils/data-trans'
import { ScoreChart } from '@renderer/modules/main/subject/score/score-chart'

export function Score({ rating, ratingCount }: { rating: Rating; ratingCount: RatingCount }) {
  return (
    <div className="flex flex-col gap-1">
      <section className="flex flex-row items-center justify-between gap-2">
        <div
          className={`text-2xl font-bold`}
          style={{ color: `hsl(var(--chart-score-${Math.floor(rating.score + 0.5) || 1}))` }}
        >
          {rating.score.toFixed(1)}{' '}
          {rating.total > 10 ? (
            <span className="text-lg">{getRating(rating.score)}</span>
          ) : (
            <span>--</span>
          )}
        </div>
        <div className="text-sm font-medium text-muted-foreground">
          Rank: # <span>{rating.rank !== 0 ? rating.rank : '--'}</span>
        </div>
      </section>
      <ScoreChart ratingCount={ratingCount} total={rating.total} className="min-h-32 md:min-h-40" />
      <div className="pr-2 text-right text-sm text-muted-foreground">
        {rating.total > 10 ? rating.total : '--'} 人参与
      </div>
    </div>
  )
}
