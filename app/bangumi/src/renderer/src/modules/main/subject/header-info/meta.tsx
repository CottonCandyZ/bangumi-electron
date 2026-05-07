import { Separator } from '@renderer/components/ui/separator'
import { Subject } from '@renderer/data/types/subject'
import { extractInfoBox } from '@renderer/lib/utils/data-trans'
import { isEmpty } from '@renderer/lib/utils/string'
import dayjs from 'dayjs'
import { Fragment } from 'react/jsx-runtime'

export function Meta({
  date,
  eps,
  platform,
  infobox,
  rating,
}: Pick<Subject, 'date' | 'eps' | 'platform' | 'infobox' | 'rating'>) {
  const week_day = extractInfoBox(infobox, '放送星期')?.value as string | undefined
  return (
    <div className="flex flex-col gap-1.5 select-none">
      <section className="flex flex-row items-center gap-1.5">
        {rating.score !== 0 && (
          <>
            <div
              className="flex items-center gap-0.5 text-lg font-medium"
              style={{ color: `hsl(var(--chart-score-${Math.floor(rating.score + 0.5) || 1}))` }}
            >
              {rating.score == 0 ? '-.-' : rating.score.toFixed(1)}{' '}
              <span className="i-mingcute-star-fill" />
            </div>
            <Separator orientation="vertical" className="bg-primary/20 h-5" />
            <div className="flex items-center gap-0.5 text-base font-medium">
              <span className="i-mingcute-hashtag-line mt-0.5" />{' '}
              {rating.rank === 0 ? '--' : rating.rank}
            </div>
            <Separator orientation="vertical" className="bg-primary/20 h-5" />
          </>
        )}
        <div className="flex flex-row flex-wrap items-center gap-1 text-base font-medium">
          <MetaItemList
            listItem={[
              date ? dayjs(date, 'YYYY-MM-DD').format('YYYY 年 M 月 D 日') : null,
              platform,
              eps !== 0 ? `共 ${eps} 话` : null,
              week_day ? week_day : null,
            ]}
          />
        </div>
      </section>
    </div>
  )
}

function MetaItemList({ listItem }: { listItem: (string | null)[] }) {
  return listItem
    .filter((item) => item !== null && !isEmpty(item))
    .map((item, index) => (
      <Fragment key={item}>
        {index !== 0 && <span>·</span>}
        <span>{item}</span>
      </Fragment>
    ))
}
