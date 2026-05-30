import { Image } from '@renderer/components/image/image'
import { MyLink } from '@renderer/components/my-link'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { useCalendarQuery } from '@renderer/data/hooks/api/calendar'
import type { CalendarItem } from '@renderer/data/types/calendar'
import { cn } from '@renderer/lib/utils'
import dayjs from 'dayjs'

const WEEKDAYS = [
  { id: '1', label: '周一' },
  { id: '2', label: '周二' },
  { id: '3', label: '周三' },
  { id: '4', label: '周四' },
  { id: '5', label: '周五' },
  { id: '6', label: '周六' },
  { id: '7', label: '周日' },
]

export function BroadcastSchedule() {
  const query = useCalendarQuery()
  const todayId = getBangumiWeekdayId()

  return (
    <section className="flex min-w-0 flex-col gap-3">
      <div className="flex min-w-0 items-baseline justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-2xl font-semibold">每日放送</h2>
          <p className="text-muted-foreground mt-0.5 text-sm">当前季度动画放送表</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-7">
        {WEEKDAYS.map((weekday) => {
          const items = query.data?.[weekday.id]
          return (
            <BroadcastDayColumn
              current={weekday.id === todayId}
              items={items}
              key={weekday.id}
              label={weekday.label}
              loading={query.isLoading}
            />
          )
        })}
      </div>
    </section>
  )
}

function BroadcastDayColumn({
  current,
  items,
  label,
  loading,
}: {
  current: boolean
  items: CalendarItem[] | undefined
  label: string
  loading: boolean
}) {
  return (
    <div
      className={cn(
        'bg-muted/25 flex h-80 min-w-0 flex-col rounded-md border p-2',
        current && 'border-primary/50 bg-primary/5',
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium">{label}</h3>
        {items && (
          <span className="text-muted-foreground text-xs tabular-nums">{items.length}</span>
        )}
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-1.5 overflow-y-auto pr-1">
        {loading && !items
          ? Array.from({ length: 4 }).map((_, index) => <BroadcastSkeletonItem key={index} />)
          : items?.map((item) => <BroadcastItem item={item} key={item.subject.id} />)}
      </div>
    </div>
  )
}

function BroadcastItem({ item }: { item: CalendarItem }) {
  const subject = item.subject
  const title = subject.nameCN || subject.name
  const fullTitle =
    subject.nameCN && subject.nameCN !== subject.name
      ? `${subject.nameCN} / ${subject.name}`
      : title

  return (
    <MyLink
      className="hover:bg-accent flex min-w-0 items-center gap-2 rounded-md p-1 transition-colors"
      title={fullTitle}
      to={`/subject/${subject.id}`}
    >
      {subject.images?.grid || subject.images?.small ? (
        <Image
          className="size-9 shrink-0 overflow-hidden rounded border"
          imageSrc={subject.images.grid || subject.images.small}
        />
      ) : (
        <div className="bg-muted size-9 shrink-0 rounded border" />
      )}
      <div className="min-w-0 flex-1">
        <div className="line-clamp-1 text-xs font-medium" title={fullTitle}>
          {title}
        </div>
        <div className="text-muted-foreground mt-0.5 flex items-center gap-1 text-[0.68rem]">
          <span className="tabular-nums">{item.watchers}</span>
          <span>在看</span>
        </div>
      </div>
    </MyLink>
  )
}

function BroadcastSkeletonItem() {
  return (
    <div className="flex min-w-0 items-center gap-2 p-1">
      <Skeleton className="size-9 shrink-0 rounded" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <Skeleton className="h-3 w-4/5" />
        <Skeleton className="h-2.5 w-2/5" />
      </div>
    </div>
  )
}

function getBangumiWeekdayId() {
  const day = dayjs().day()
  return day === 0 ? '7' : day.toString()
}
