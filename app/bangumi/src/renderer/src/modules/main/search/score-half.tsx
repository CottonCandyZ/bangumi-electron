export function ScoreStarHalf({ score }: { score: number }) {
  const fillStar = Math.floor(score / 2)
  const halfStar = Math.round(score / 2 - fillStar)
  const emptyStar = 5 - fillStar - halfStar

  return (
    <div className="flex">
      {Array(fillStar)
        .fill(0)
        .map((_, index) => (
          <span
            key={index}
            className="i-mingcute-star-fill"
            style={{ color: `hsl(var(--chart-score-${Math.floor(score)}))` }}
          />
        ))}
      {halfStar !== 0 && (
        <span
          className="i-mingcute-star-half-fill"
          style={{ color: `hsl(var(--chart-score-${Math.floor(score)}))` }}
        />
      )}
      {Array(emptyStar)
        .fill(0)
        .map((_, index) => (
          <span
            key={index + fillStar}
            className="i-mingcute-star-line"
            style={{ color: `hsl(var(--chart-score-${Math.floor(score)}))` }}
          />
        ))}
    </div>
  )
}
