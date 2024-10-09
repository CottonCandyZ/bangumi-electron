import { Separator } from '@renderer/components/ui/separator'
import { Subject } from '@renderer/data/types/subject'
import { extractInfoBox } from '@renderer/lib/utils/data-trans'
import dayjs from 'dayjs'

export function Meta({
  date,
  eps,
  platform,
  infobox,
  rating,
}: Pick<Subject, 'date' | 'eps' | 'platform' | 'infobox' | 'rating' | 'collection'>) {
  const week_day = extractInfoBox(infobox, '放送星期')?.value as string | undefined
  return (
    <div className="flex flex-col gap-1">
      <section className="flex flex-row items-center gap-1.5">
        {rating.score !== 0 && (
          <>
            <div
              className="flex items-center gap-0.5 text-base font-medium"
              style={{ color: `hsl(var(--chart-score-${Math.floor(rating.score + 0.5) || 1}))` }}
            >
              {rating.score == 0 ? '-.-' : rating.score.toFixed(1)}{' '}
              <span className="i-mingcute-star-fill" />
            </div>
            <Separator orientation="vertical" className="h-5 bg-primary/20" />
            <div className="flex items-center gap-0.5 text-sm font-medium">
              <span className="i-mingcute-hashtag-line mt-0.5" />{' '}
              {rating.rank === 0 ? '--' : rating.rank}
            </div>
            <Separator orientation="vertical" className="h-5 bg-primary/20" />
          </>
        )}
        <div className="flex flex-row flex-wrap items-center gap-1 text-sm font-medium">
          <MetaItem
            inner={date}
            content={dayjs(date, 'YYYY-MM-DD').format('YYYY 年 M 月 D 日')}
            first
          />
          <MetaItem inner={platform} content={platform} />
          <MetaItem inner={eps} content={`共 ${eps} 话`} />
          <MetaItem inner={week_day} content={week_day} />
        </div>
      </section>
    </div>
  )
}

function MetaItem({
  inner,
  content,
  first = false,
}: {
  content: string | number | undefined
  inner: string | undefined | number
  first?: boolean
}) {
  return (
    inner != 0 &&
    inner &&
    inner !== '' && (
      <>
        {!first && <span>·</span>}
        <span className="shrink-0">{content}</span>
      </>
    )
  )
}
