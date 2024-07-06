import ScoreChart from '@renderer/components/subject/score/score-chart'
import { Rating } from '@renderer/constants/types/subject'
import { getRating } from '@renderer/lib/utils/data-trans'

export default function Score({ rating }: { rating: Rating }) {
  return (
    <div className="flex flex-col gap-1">
      <section className="flex flex-row items-center justify-between gap-2">
        <div className="text-2xl font-bold text-pink-600/80">
          {rating.score.toFixed(1)} <span className="text-lg">{getRating(rating.score)}</span>
        </div>
        <div className="text-sm font-medium text-muted-foreground">
          Rank: # <span className="">{rating.rank}</span>
        </div>
      </section>
      <div></div>
      <div className="h-40">
        <ScoreChart ratingCount={rating.count} total={rating.total} />
      </div>
      <div className="pr-2 text-right text-sm text-muted-foreground">{rating.total} 人参与</div>
    </div>
  )
}
