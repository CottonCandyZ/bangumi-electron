import { Image } from '@renderer/components/image/image'
import { MyLink } from '@renderer/components/my-link'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { useCalendarQuery } from '@renderer/data/hooks/api/calendar'
import type { CalendarItem } from '@renderer/data/types/calendar'
import dayjs from 'dayjs'
import { useState } from 'react'
import { Button } from '@renderer/components/ui/button'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@renderer/components/ui/carousel'
import { QueryFallback } from '@renderer/components/query-fallback'
import { useOnline } from '@renderer/hooks/use-online'

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
  const [api, setApi] = useState<CarouselApi>()
  const online = useOnline()
  const weekStart = dayjs()
    .startOf('day')
    .subtract(Number(todayId) - 1, 'day')

  return (
    <Carousel
      setApi={setApi}
      opts={{ align: 'start', startIndex: Number(todayId) - 1 }}
      className="@container min-w-0"
      aria-label="每日放送"
    >
      <section className="flex min-w-0 flex-col gap-3">
        <div className="flex min-w-0 items-baseline justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold">每日放送</h2>
            <p className="text-muted-foreground mt-1 text-xs tabular-nums">
              {weekStart.format('M月D日')} — {weekStart.add(6, 'day').format('M月D日')}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => api?.scrollTo(Number(todayId) - 1)}>
              今天
            </Button>
            <CarouselPrevious
              aria-label="前一天放送"
              className="relative top-auto left-auto translate-y-0"
            />
            <CarouselNext
              aria-label="后一天放送"
              className="relative top-auto right-auto translate-y-0"
            />
          </div>
        </div>
        {query.data === undefined && (query.isError || !online) ? (
          <QueryFallback label="每日放送" error={query.error} onRetry={query.refetch} />
        ) : (
          <CarouselContent className="ml-0">
            {WEEKDAYS.map((weekday) => {
              const items = query.data?.[weekday.id]
              return (
                <CarouselItem key={weekday.id} className="max-w-56 basis-56 pl-0">
                  <BroadcastDayColumn
                    current={weekday.id === todayId}
                    items={items}
                    label={weekday.label}
                    date={weekStart.add(Number(weekday.id) - 1, 'day').format('YYYY-MM-DD')}
                    loading={query.isLoading}
                  />
                </CarouselItem>
              )
            })}
          </CarouselContent>
        )}
      </section>
    </Carousel>
  )
}

function BroadcastDayColumn({
  current,
  items,
  label,
  date,
  loading,
}: {
  current: boolean
  items: CalendarItem[] | undefined
  label: string
  date: string
  loading: boolean
}) {
  return (
    <div className="flex h-72 min-w-0 flex-col">
      <div className="border-border/60 relative flex items-end justify-between border-b pr-5 pb-3">
        <h3 className="flex items-baseline gap-2.5" aria-current={current ? 'date' : undefined}>
          <time dateTime={date} className="text-2xl font-medium tracking-tight tabular-nums">
            {dayjs(date).format('DD')}
          </time>
          <span className="text-muted-foreground text-xs">{label}</span>
          {current && <span className="text-xs text-rose-500">今天</span>}
        </h3>
        {items && (
          <span className="text-muted-foreground pb-0.5 text-[10px]">{items.length} 部</span>
        )}
        {current && (
          <span className="absolute -bottom-[3px] left-0 size-1.5 rounded-full bg-rose-400" />
        )}
      </div>
      <div
        className="mt-3 flex min-h-0 min-w-0 flex-1 flex-col gap-2 overflow-y-auto pr-5 [scrollbar-width:none]"
        tabIndex={0}
        aria-label={`${label}放送条目`}
      >
        {loading && !items ? (
          Array.from({ length: 4 }).map((_, index) => <BroadcastSkeletonItem key={index} />)
        ) : items?.length ? (
          items.map((item) => <BroadcastItem item={item} key={item.subject.id} />)
        ) : (
          <p className="text-muted-foreground p-2 text-xs">这一天暂无放送</p>
        )}
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
      className="hover:bg-accent/60 flex min-w-0 shrink-0 items-center gap-2.5 rounded-md py-1 pr-1 transition-colors"
      title={fullTitle}
      to={`/subject/${subject.id}`}
    >
      {subject.images?.grid || subject.images?.small ? (
        <Image
          className="h-12 w-9 shrink-0 overflow-hidden rounded-sm"
          imageSrc={subject.images.small || subject.images.grid}
        />
      ) : (
        <div className="bg-muted h-12 w-9 shrink-0 rounded-sm" />
      )}
      <div className="min-w-0 flex-1">
        <div className="line-clamp-2 text-xs leading-relaxed font-medium" title={fullTitle}>
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
      <Skeleton className="h-12 w-9 shrink-0 rounded-sm" />
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
