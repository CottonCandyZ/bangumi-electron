import { ViewTransitionImage } from '@renderer/components/image/view-transition-image'
import { MyLink } from '@renderer/components/my-link'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { useCalendarQuery } from '@renderer/data/hooks/api/calendar'
import type { CalendarItem } from '@renderer/data/types/calendar'
import dayjs from 'dayjs'
import { useLocation, useViewTransitionState } from 'react-router-dom'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useCarouselColumns } from './carousel-columns'
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
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import { userIdAtom } from '@renderer/state/session'
import { loginDialogAtom } from '@renderer/state/dialog/normal'
import { useWatchingSubjectIds } from '@renderer/data/collection/watching'
import { cn } from '@renderer/lib/utils'
import {
  BroadcastSortControl,
  BroadcastToggleButton,
  broadcastControlClass,
  broadcastSortAtom,
  sortBroadcastItems,
} from './broadcast-controls'
import { Eye, Maximize2, Star } from 'lucide-react'

export const watchingOnlyAtom = atomWithStorage('broadcast-watching-only', false, undefined, {
  getOnInit: true,
})

export const WEEKDAYS = [
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
  // A whole number of days fills the row; wide windows show the full week without cutting a day.
  const {
    ref: columnsRef,
    columns,
    itemStyle: dayStyle,
  } = useCarouselColumns<HTMLDivElement>({
    preferredRem: 14,
    gapRem: 0.75,
    minColumns: 1,
    maxColumns: WEEKDAYS.length,
  })
  const online = useOnline()
  const [watchingOnly, setWatchingOnly] = useAtom(watchingOnlyAtom)
  const sort = useAtomValue(broadcastSortAtom)
  const userId = useAtomValue(userIdAtom)
  const watching = useWatchingSubjectIds(watchingOnly)
  const openLogin = useSetAtom(loginDialogAtom)
  const watchingIds = new Set(watching.data ?? [])
  // When the whole week fits there is nothing to page through, so the controls go away.
  const canNavigate =
    columns < WEEKDAYS.length &&
    query.data !== undefined &&
    (!watchingOnly || (!!userId && watching.data !== undefined && !watching.isError))
  const weekStart = dayjs()
    .startOf('day')
    .subtract(Number(todayId) - 1, 'day')

  // Column widths can change in the parent's layout effect after Embla has measured them.
  // Refresh its snap positions before paint instead of waiting for ResizeObserver's next frame.
  useLayoutEffect(() => {
    api?.reInit()
  }, [api, columns])

  useEffect(() => {
    if (!api) return
    let timer: ReturnType<typeof setTimeout> | undefined
    const check = () => setTodayVisible(api.slidesInView().includes(Number(todayId) - 1))
    // Judge only once scrolling settles: mid-scroll the today column crosses the visibility
    // threshold back and forth, which made the button flicker.
    const update = () => {
      clearTimeout(timer)
      timer = setTimeout(check, 150)
    }
    check()
    api.on('settle', update).on('reInit', update)
    return () => {
      clearTimeout(timer)
      api.off('settle', update).off('reInit', update)
    }
  }, [api, todayId])

  return (
    <Carousel
      setApi={setApi}
      opts={{
        align: 'start',
        dragFree: true,
        startIndex: Number(todayId) - 1,
        inViewThreshold: 0.8,
      }}
      className="@container min-w-0"
      aria-label="每日放送"
    >
      {/* A draggable schedule of links; dragging it should never select its text. */}
      <section className="flex min-w-0 flex-col gap-3 select-none">
        <div className="flex min-w-0 flex-wrap items-end justify-between gap-x-4 gap-y-2">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold">每日放送</h2>
            <p className="text-muted-foreground mt-1 text-xs tabular-nums">
              {weekStart.format('M月D日')} — {weekStart.add(6, 'day').format('M月D日')}
            </p>
          </div>
          <div className="flex min-h-8 min-w-0 flex-wrap items-center gap-2">
            <BroadcastSortControl />
            <BroadcastToggleButton
              pressed={watchingOnly}
              onClick={() => setWatchingOnly(!watchingOnly)}
            >
              只看在追
            </BroadcastToggleButton>
            {canNavigate && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className={cn(
                    broadcastControlClass,
                    'order-first',
                    todayVisible && 'hidden @md:invisible @md:inline-flex',
                  )}
                  tabIndex={todayVisible ? -1 : undefined}
                  aria-hidden={todayVisible}
                  onClick={() => api?.scrollTo(Number(todayId) - 1)}
                >
                  回到今天
                </Button>
                <CarouselNavigation label="放送" />
              </>
            )}
            <Button
              size="icon"
              variant="outline"
              className={cn(broadcastControlClass, 'size-8 px-0')}
              title="展开完整放送表"
              aria-label="展开完整放送表"
              asChild
            >
              <MyLink to="/calendar">
                <Maximize2 className="size-4" />
              </MyLink>
            </Button>
          </div>
        </div>
        {watchingOnly && !userId ? (
          <div className="text-muted-foreground flex items-center gap-2 py-6 text-sm">
            登录后查看你在追的放送
            <Button size="sm" variant="outline" onClick={() => openLogin({ open: true })}>
              登录
            </Button>
          </div>
        ) : watchingOnly && watching.isError ? (
          <QueryFallback label="在追的放送" error={watching.error} onRetry={watching.refetch} />
        ) : query.data === undefined && (query.isError || !online) ? (
          <QueryFallback label="每日放送" error={query.error} onRetry={query.refetch} />
        ) : (
          <div ref={columnsRef}>
            <CarouselContent className="-ml-3">
              {WEEKDAYS.map((weekday) => {
                const ready = !watchingOnly || watching.data !== undefined
                const items = ready
                  ? sortBroadcastItems(
                      query.data?.[weekday.id]?.filter(
                        (item) => !watchingOnly || watchingIds.has(item.subject.id),
                      ),
                      sort,
                    )
                  : undefined
                return (
                  <CarouselItem key={weekday.id} className="pl-3" style={dayStyle}>
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
  // Measure new content before paint, including when cached calendar data returns.
  useLayoutEffect(() => {
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
    <div className="flex h-80 min-w-0 flex-col">
      <div
        className={cn(
          'flex items-center justify-between gap-2 border-b pb-3 pl-1.5',
          current ? 'border-foreground/50' : 'border-border/60',
        )}
      >
        <h3 className="flex items-baseline gap-2" aria-current={current ? 'date' : undefined}>
          <time
            dateTime={date}
            className={cn(
              'text-2xl leading-none font-semibold tracking-tight tabular-nums',
              !current && 'text-foreground/80',
            )}
          >
            {dayjs(date).format('DD')}
          </time>
          <span className="text-muted-foreground text-xs">{label}</span>
          {current && <span className="text-foreground text-xs font-medium">今天</span>}
        </h3>
        {items && (
          <span className="text-muted-foreground text-[10px] tabular-nums">{items.length} 部</span>
        )}
      </div>
      <div
        ref={scrollRef}
        style={scrollEdgeMask('bottom', edges.start, edges.end)}
        className="broadcast-scroll-fade flex min-h-0 min-w-0 flex-1 flex-col gap-0.5 overflow-y-auto py-2 [scrollbar-width:none]"
        tabIndex={0}
        aria-label={`${label}放送条目`}
      >
        {loading && !items ? (
          Array.from({ length: 4 }).map((_, index) => <BroadcastSkeletonItem key={index} />)
        ) : items?.length ? (
          items.map((item) => <BroadcastItem item={item} key={item.subject.id} />)
        ) : (
          <p className="text-muted-foreground flex flex-1 items-center justify-center text-xs">
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
  const score = subject.rating?.score
  const { key } = useLocation()
  const to = `/subject/${subject.id}`
  const isTransitioning = useViewTransitionState(to)
  const viewTransitionName = `cover-image-${subject.id}-${key}`

  return (
    <MyLink
      className="hover:bg-accent/60 flex min-w-0 shrink-0 cursor-default items-center gap-3 rounded-lg p-1.5 transition-colors"
      contextMenuTitle={subject}
      title={fullTitle}
      to={to}
      state={{ viewTransitionName }}
      viewTransition
    >
      {subject.images?.grid || subject.images?.small ? (
        <ViewTransitionImage
          active={isTransitioning}
          className="h-14 w-10 shrink-0 overflow-hidden rounded-md"
          imageSrc={subject.images.small || subject.images.grid}
          viewTransitionName={viewTransitionName}
        />
      ) : (
        <div className="bg-muted h-14 w-10 shrink-0 rounded-md" />
      )}
      <div className="min-w-0 flex-1">
        <div className="line-clamp-2 text-xs leading-4 font-medium" title={fullTitle}>
          {title}
        </div>
        <div className="text-muted-foreground mt-1 flex items-center gap-2.5 text-[0.68rem] leading-3.5 tabular-nums">
          <span className="flex items-center gap-1">
            <Eye className="size-3" aria-hidden />
            {item.watchers}
            <span className="sr-only">在看</span>
          </span>
          {!!score && (
            <span className="flex items-center gap-1">
              <Star className="size-3 fill-amber-400 text-amber-400" aria-hidden />
              {score.toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </MyLink>
  )
}

function BroadcastSkeletonItem() {
  return (
    <div className="flex min-w-0 items-center gap-3 p-1.5">
      <Skeleton className="h-14 w-10 shrink-0 rounded-md" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <Skeleton className="h-3 w-4/5" />
        <Skeleton className="h-2.5 w-2/5" />
      </div>
    </div>
  )
}

export function getBangumiWeekdayId() {
  const day = dayjs().day()
  return day === 0 ? '7' : day.toString()
}
