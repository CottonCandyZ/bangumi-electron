import { Image } from '@renderer/components/image/image'
import { MyLink } from '@renderer/components/my-link'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { useCalendarQuery } from '@renderer/data/hooks/api/calendar'
import type { CalendarItem } from '@renderer/data/types/calendar'
import dayjs from 'dayjs'
import { useEffect, useRef, useState } from 'react'
import { edgeStrength, scrollEdgeMask } from './carousel-edge-fade'
import './broadcast-schedule.css'
import { Button } from '@renderer/components/ui/button'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@renderer/components/ui/carousel'
import { QueryFallback } from '@renderer/components/query-fallback'
import { useOnline } from '@renderer/hooks/use-online'
import { CarouselNavigation } from './carousel-navigation'
import { Switch } from '@renderer/components/ui/switch'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import { userIdAtom } from '@renderer/state/session'
import { loginDialogAtom } from '@renderer/state/dialog/normal'
import { useWatchingSubjectIds } from '@renderer/data/collection/watching'
import {
  collectionSyncDialogAtom,
  useCollectionSyncOverview,
} from '@renderer/modules/common/collections/sync-dialog'

const watchingOnlyAtom = atomWithStorage('broadcast-watching-only', false, undefined, {
  getOnInit: true,
})

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
  const [todayVisible, setTodayVisible] = useState(true)
  const [edges, setEdges] = useState({ start: 0, end: 0 })
  const online = useOnline()
  const [watchingOnly, setWatchingOnly] = useAtom(watchingOnlyAtom)
  const userId = useAtomValue(userIdAtom)
  const watching = useWatchingSubjectIds(watchingOnly)
  const sync = useCollectionSyncOverview()
  const openSync = useSetAtom(collectionSyncDialogAtom)
  const openLogin = useSetAtom(loginDialogAtom)
  const watchingIds = new Set(watching.data ?? [])
  const needsSync = watchingOnly && !!userId && sync.data && !sync.data.listComplete
  const canNavigate =
    query.data !== undefined &&
    (!watchingOnly || (!!userId && sync.data?.listComplete && !watching.isError))
  const weekStart = dayjs()
    .startOf('day')
    .subtract(Number(todayId) - 1, 'day')

  useEffect(() => {
    if (!api) return
    const update = () => {
      const progress = api.scrollProgress()
      setTodayVisible(api.slidesInView().includes(Number(todayId) - 1))
      setEdges((previous) => {
        const distance = Math.max(0, api.containerNode().scrollWidth - api.rootNode().clientWidth)
        const start = edgeStrength(progress * distance)
        const end = edgeStrength((1 - progress) * distance)
        return previous.start === start && previous.end === end ? previous : { start, end }
      })
    }
    update()
    api.on('scroll', update).on('reInit', update).on('slidesInView', update)
    return () => {
      api.off('scroll', update).off('reInit', update).off('slidesInView', update)
    }
  }, [api, todayId])

  return (
    <Carousel
      setApi={setApi}
      opts={{ align: 'start', startIndex: Number(todayId) - 1, inViewThreshold: 0.8 }}
      className="@container min-w-0"
      aria-label="每日放送"
    >
      <section className="flex min-w-0 flex-col gap-3">
        <div className="flex min-w-0 flex-wrap items-end justify-between gap-x-4 gap-y-2">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold">每日放送</h2>
            <p className="text-muted-foreground mt-1 text-xs tabular-nums">
              {weekStart.format('M月D日')} — {weekStart.add(6, 'day').format('M月D日')}
            </p>
          </div>
          <div className="flex min-h-8 min-w-0 flex-wrap items-center gap-3">
            <label className="text-muted-foreground hover:text-foreground flex cursor-pointer items-center gap-2 text-xs transition-colors">
              <Switch size="sm" checked={watchingOnly} onCheckedChange={setWatchingOnly} />
              只看在追
            </label>
            {canNavigate && (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  className={`text-muted-foreground order-first h-8 px-2 text-xs font-normal ${todayVisible ? 'hidden @md:invisible @md:inline-flex' : ''}`}
                  tabIndex={todayVisible ? -1 : undefined}
                  aria-hidden={todayVisible}
                  onClick={() => api?.scrollTo(Number(todayId) - 1)}
                >
                  回到今天
                </Button>
                <CarouselNavigation label="放送" />
              </>
            )}
          </div>
        </div>
        {watchingOnly && !userId ? (
          <div className="text-muted-foreground flex items-center gap-2 py-6 text-sm">
            登录后查看你在追的放送
            <Button size="sm" variant="outline" onClick={() => openLogin({ open: true })}>
              登录
            </Button>
          </div>
        ) : watchingOnly && (sync.isError || watching.isError) ? (
          <QueryFallback
            label="在追的放送"
            error={sync.error ?? watching.error}
            onRetry={() => {
              void sync.refetch()
              void watching.refetch()
            }}
          />
        ) : needsSync ? (
          <div className="text-muted-foreground flex flex-wrap items-center gap-2 py-6 text-sm">
            {sync.data?.running
              ? '首次同步进行中，完成后即可查看在追的放送。'
              : '先同步收藏，再查看你在追的放送。'}
            <Button size="sm" variant="outline" onClick={() => openSync(true)}>
              {sync.data?.running ? '查看同步进度' : '同步收藏'}
            </Button>
          </div>
        ) : query.data === undefined && (query.isError || !online) ? (
          <QueryFallback label="每日放送" error={query.error} onRetry={query.refetch} />
        ) : (
          <div
            className="broadcast-scroll-fade"
            style={scrollEdgeMask('right', edges.start, edges.end)}
          >
            <CarouselContent className="ml-0">
              {WEEKDAYS.map((weekday) => {
                const ready =
                  !watchingOnly || (watching.data !== undefined && sync.data !== undefined)
                const items = ready
                  ? query.data?.[weekday.id]?.filter(
                      (item) => !watchingOnly || watchingIds.has(item.subject.id),
                    )
                  : undefined
                return (
                  <CarouselItem key={weekday.id} className="max-w-56 basis-56 pl-0">
                    <BroadcastDayColumn
                      current={weekday.id === todayId}
                      items={items}
                      label={weekday.label}
                      date={weekStart.add(Number(weekday.id) - 1, 'day').format('YYYY-MM-DD')}
                      loading={query.isLoading || !ready}
                      watchingOnly={watchingOnly}
                    />
                  </CarouselItem>
                )
              })}
            </CarouselContent>
          </div>
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
  watchingOnly,
}: {
  current: boolean
  items: CalendarItem[] | undefined
  label: string
  date: string
  loading: boolean
  watchingOnly: boolean
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [edges, setEdges] = useState({ start: 0, end: 0 })
  useEffect(() => {
    const element = scrollRef.current
    if (!element) return
    const update = () => {
      const start = edgeStrength(element.scrollTop)
      const end = edgeStrength(element.scrollHeight - element.clientHeight - element.scrollTop)
      setEdges((previous) =>
        previous.start === start && previous.end === end ? previous : { start, end },
      )
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    element.addEventListener('scroll', update, { passive: true })
    return () => {
      observer.disconnect()
      element.removeEventListener('scroll', update)
    }
  }, [items, loading])

  return (
    <div className="flex h-72 min-w-0 flex-col">
      <div className="border-border/60 relative flex items-end justify-between border-b pr-5 pb-3">
        <h3 className="flex items-baseline gap-2.5" aria-current={current ? 'date' : undefined}>
          <time dateTime={date} className="text-2xl font-medium tracking-tight tabular-nums">
            {dayjs(date).format('DD')}
          </time>
          <span className="text-muted-foreground text-xs">{label}</span>
          {current && <span className="sr-only">今天</span>}
        </h3>
        {items && (
          <span className="text-muted-foreground pb-0.5 text-[10px]">{items.length} 部</span>
        )}
        {current && (
          <span className="absolute -bottom-[3px] left-0 size-1.5 rounded-full bg-rose-400" />
        )}
      </div>
      <div
        ref={scrollRef}
        style={scrollEdgeMask('bottom', edges.start, edges.end)}
        className="broadcast-scroll-fade flex min-h-0 min-w-0 flex-1 flex-col gap-2 overflow-y-auto py-3 pr-5 [scrollbar-width:none]"
        tabIndex={0}
        aria-label={`${label}放送条目`}
      >
        {loading && !items ? (
          Array.from({ length: 4 }).map((_, index) => <BroadcastSkeletonItem key={index} />)
        ) : items?.length ? (
          items.map((item) => <BroadcastItem item={item} key={item.subject.id} />)
        ) : (
          <p className="text-muted-foreground p-2 text-xs">
            {watchingOnly ? '这一天没有在追的放送' : '这一天暂无放送'}
          </p>
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
      className="hover:bg-accent/60 flex min-w-0 shrink-0 items-center gap-2.5 rounded-md pr-1 transition-colors"
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
        <div className="line-clamp-2 text-xs leading-4 font-medium" title={fullTitle}>
          {title}
        </div>
        <div className="text-muted-foreground mt-0.5 flex items-center gap-1 text-[0.68rem] leading-3.5">
          <span className="tabular-nums">{item.watchers}</span>
          <span>在看</span>
        </div>
      </div>
    </MyLink>
  )
}

function BroadcastSkeletonItem() {
  return (
    <div className="flex min-w-0 items-center gap-2 pr-1">
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
