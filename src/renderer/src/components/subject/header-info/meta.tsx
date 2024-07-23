import { Subject } from '@renderer/data/types/subject'
import { extractInfoBox } from '@renderer/lib/utils/data-trans'
import dayjs from 'dayjs'

export default function Meta({
  date,
  eps,
  platform,
  infobox,
}: Pick<Subject, 'date' | 'eps' | 'platform' | 'infobox'>) {
  const week_day = extractInfoBox(infobox, '放送星期')?.value as string | undefined
  return (
    <div className="flex flex-row gap-1 text-sm font-medium">
      <MetaItem inner={date} content={dayjs(date, 'YYYY-MM-DD').format('YYYY 年 7 月')} first />
      <MetaItem inner={platform} content={platform} />
      <MetaItem inner={eps} content={`共 ${eps} 话`} />
      <MetaItem inner={week_day} content={week_day} />
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
        <span>{content}</span>
      </>
    )
  )
}
