import { ViewTransitionImage } from '@renderer/components/image/view-transition-image'
import { MyLink } from '@renderer/components/my-link'
import { QueryFallback } from '@renderer/components/query-fallback'
import { Button } from '@renderer/components/ui/button'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { useWatchingSubjectIds } from '@renderer/data/collection/watching'
import { useCalendarQuery } from '@renderer/data/hooks/api/calendar'
import type { CalendarItem } from '@renderer/data/types/calendar'
import { useOnline } from '@renderer/hooks/use-online'
import { cn } from '@renderer/lib/utils'
import {
  BroadcastSortControl,
  BroadcastToggleButton,
  broadcastControlClass,
  broadcastSortAtom,
  sortBroadcastItems,
} from '@renderer/modules/main/home/broadcast-controls'
import {
  getBangumiWeekdayId,
  WEEKDAYS,
  watchingOnlyAtom,
} from '@renderer/modules/main/home/broadcast-schedule'
import { loginDialogAtom } from '@renderer/state/dialog/normal'
import { userIdAtom } from '@renderer/state/session'
import dayjs from 'dayjs'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { ChevronLeft, ChevronRight, Eye, Star, Trophy } from 'lucide-react'
import { useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { useLocation, useViewTransitionState } from 'react-router-dom'

/** The whole week at once: every day fully expanded, with more detail per subject. */
export function BroadcastWeek() {
  const query = useCalendarQuery()
  const todayId = getBangumiWeekdayId()
  const online = useOnline()
  const [watchingOnly, setWatchingOnly] = useAtom(watchingOnlyAtom)
  const sort = useAtomValue(broadcastSortAtom)
  const userId = useAtomValue(userIdAtom)
  const watching = useWatchingSubjectIds(watchingOnly)
  const openLogin = useSetAtom(loginDialogAtom)
  const watchingIds = new Set(watching.data ?? [])
  const ready = !watchingOnly || watching.data !== undefined
  const weekStart = dayjs()
    .startOf('day')
    .subtract(Number(todayId) - 1, 'day')

  const [scroller, setScroller] = useState<HTMLDivElement | null>(null)
  const todayRef = useRef<HTMLDivElement>(null)
  const loaded = query.data !== undefined
  const scroll = useHorizontalScroll(scroller, todayRef, loaded)

  return (
    // The day grid is its own scroll container so the page header stays put and day headers can
    // stick to its top while scrolling in both directions.
    <div className="flex h-full w-full min-w-0 flex-col gap-4 pt-4">
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 px-6 xl:px-10">
        <div>
          <h1 className="text-2xl font-semibold">每日放送</h1>
          <p className="text-muted-foreground mt-1 text-xs tabular-nums">
            {weekStart.format('M月D日')} — {weekStart.add(6, 'day').format('M月D日')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <BroadcastSortControl />
          <BroadcastToggleButton
            pressed={watchingOnly}
            onClick={() => setWatchingOnly(!watchingOnly)}
          >
            只看在追
          </BroadcastToggleButton>
          {scroll.overflowing && (
            <>
              <Button
                size="sm"
                variant="outline"
                className={cn(
                  broadcastControlClass,
                  'order-first',
                  scroll.todayVisible && 'invisible',
                )}
                tabIndex={scroll.todayVisible ? -1 : undefined}
                aria-hidden={scroll.todayVisible}
                onClick={scroll.scrollToToday}
              >
                回到今天
              </Button>
              <div
                className="border-border/60 flex shrink-0 items-center rounded-md border p-0.5"
                role="group"
                aria-label="浏览放送"
              >
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="向前浏览放送"
                  className="text-muted-foreground size-7 rounded-sm shadow-none disabled:opacity-25 [&_svg]:size-3.5"
                  disabled={!scroll.canPrev}
                  onClick={() => scroll.page(-1)}
                >
                  <ChevronLeft />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="向后浏览放送"
                  className="text-muted-foreground size-7 rounded-sm shadow-none disabled:opacity-25 [&_svg]:size-3.5"
                  disabled={!scroll.canNext}
                  onClick={() => scroll.page(1)}
                >
                  <ChevronRight />
                </Button>
              </div>
            </>
          )}
        </div>
      </header>

      {watchingOnly && !userId ? (
        <div className="text-muted-foreground flex items-center gap-2 px-6 py-6 text-sm xl:px-10">
          登录后查看你在追的放送
          <Button size="sm" variant="outline" onClick={() => openLogin({ open: true })}>
            登录
          </Button>
        </div>
      ) : watchingOnly && watching.isError ? (
        <div className="px-6 xl:px-10">
          <QueryFallback label="在追的放送" error={watching.error} onRetry={watching.refetch} />
        </div>
      ) : query.data === undefined && (query.isError || !online) ? (
        <div className="px-6 xl:px-10">
          <QueryFallback label="每日放送" error={query.error} onRetry={query.refetch} />
        </div>
      ) : (
        <div
          ref={setScroller}
          role="region"
          aria-label="一周放送"
          tabIndex={0}
          className="grid min-h-0 w-full min-w-0 flex-1 snap-x snap-mandatory scroll-px-6 auto-cols-[minmax(14rem,1fr)] grid-flow-col gap-x-6 overflow-auto overscroll-contain px-6 pb-16 xl:scroll-px-10 xl:px-10"
        >
          {WEEKDAYS.map((weekday) => {
            const items = ready
              ? sortBroadcastItems(
                  query.data?.[weekday.id]?.filter(
                    (item) => !watchingOnly || watchingIds.has(item.subject.id),
                  ),
                  sort,
                )
              : undefined
            const current = weekday.id === todayId
            return (
              <div
                key={weekday.id}
                ref={current ? todayRef : undefined}
                className="min-w-0 snap-start"
              >
                <WeekDayColumn
                  current={current}
                  date={weekStart.add(Number(weekday.id) - 1, 'day')}
                  items={items}
                  label={weekday.label}
                  loading={query.isLoading || !ready}
                  watchingOnly={watchingOnly}
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/**
 * Mice and some touchpads cannot scroll sideways, so the page offers buttons that move by whole
 * days. They only exist while the week does not fit.
 */
function useHorizontalScroll(
  scroller: HTMLDivElement | null,
  todayRef: RefObject<HTMLDivElement | null>,
  loaded: boolean,
) {
  const [state, setState] = useState({
    overflowing: false,
    canPrev: false,
    canNext: false,
    todayVisible: true,
  })

  useLayoutEffect(() => {
    if (!scroller) return
    // The grid can mount after a login, filter change or retry without changing `loaded`.
    // Bind to its DOM node so positioning and listeners follow every mount.
    const today = todayRef.current
    if (today) {
      scroller.scrollTo({
        left:
          scroller.scrollLeft +
          today.getBoundingClientRect().left -
          scroller.getBoundingClientRect().left,
      })
    }
    const update = () => {
      const max = scroller.scrollWidth - scroller.clientWidth
      const today = todayRef.current
      let todayVisible = true
      if (today) {
        const view = scroller.getBoundingClientRect()
        const rect = today.getBoundingClientRect()
        todayVisible = rect.left >= view.left - 1 && rect.right <= view.right + 1
      }
      const next = {
        overflowing: max > 1,
        canPrev: scroller.scrollLeft > 1,
        canNext: scroller.scrollLeft < max - 1,
        todayVisible,
      }
      setState((previous) =>
        Object.keys(next).every(
          (key) => previous[key as keyof typeof next] === next[key as keyof typeof next],
        )
          ? previous
          : next,
      )
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(scroller)
    // PageScrollWrapper cancels horizontal wheel events. Let this nested viewport consume them.
    const handleWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) event.stopPropagation()
    }
    scroller.addEventListener('scroll', update, { passive: true })
    scroller.addEventListener('wheel', handleWheel, { passive: true })
    return () => {
      observer.disconnect()
      scroller.removeEventListener('scroll', update)
      scroller.removeEventListener('wheel', handleWheel)
    }
  }, [scroller, todayRef, loaded])

  const page = (direction: 1 | -1) => {
    const column = scroller?.firstElementChild
    if (!scroller || !column) return
    const step =
      column.getBoundingClientRect().width + Number.parseFloat(getComputedStyle(scroller).columnGap)
    const visible = Math.max(1, Math.floor((scroller.clientWidth + 1) / step))
    // Snap points land the result on a day boundary.
    scroller.scrollBy({ left: direction * visible * step, behavior: 'smooth' })
  }

  const scrollToToday = () => {
    const today = todayRef.current
    if (!scroller || !today) return
    scroller.scrollBy({
      left: today.getBoundingClientRect().left - scroller.getBoundingClientRect().left,
      behavior: 'smooth',
    })
  }

  return { ...state, overflowing: !!scroller && state.overflowing, page, scrollToToday }
}

function WeekDayColumn({
  current,
  date,
  items,
  label,
  loading,
  watchingOnly,
}: {
  current: boolean
  date: dayjs.Dayjs
  items: CalendarItem[] | undefined
  label: string
  loading: boolean
  watchingOnly: boolean
}) {
  return (
    <section aria-label={`${label}放送`} className="flex h-full min-w-0 flex-col">
      <div
        className={cn(
          'bg-background sticky top-0 z-10 flex items-center justify-between gap-2 border-b pt-1 pb-3 pl-1.5',
          current ? 'border-foreground/50' : 'border-border/60',
        )}
      >
        <h2 className="flex items-baseline gap-2" aria-current={current ? 'date' : undefined}>
          <time
            dateTime={date.format('YYYY-MM-DD')}
            className={cn(
              'text-3xl leading-none font-semibold tracking-tight tabular-nums',
              !current && 'text-foreground/80',
            )}
          >
            {date.format('DD')}
          </time>
          <span className="text-muted-foreground text-sm">{label}</span>
          {current && <span className="text-foreground text-sm font-medium">今天</span>}
        </h2>
        {items && (
          <span className="text-muted-foreground text-xs tabular-nums">{items.length} 部</span>
        )}
      </div>
      <div className="flex flex-col gap-1 py-2">
        {loading && !items ? (
          Array.from({ length: 6 }).map((_, index) => <WeekItemSkeleton key={index} />)
        ) : items?.length ? (
          items.map((item) => <WeekItem item={item} key={item.subject.id} />)
        ) : (
          <p className="text-muted-foreground px-1.5 py-6 text-xs">
            {watchingOnly ? '这一天没有在追的放送' : '这一天暂无放送'}
          </p>
        )}
      </div>
    </section>
  )
}

function WeekItem({ item }: { item: CalendarItem }) {
  const subject = item.subject
  const title = subject.nameCN || subject.name
  const original = subject.nameCN && subject.nameCN !== subject.name ? subject.name : undefined
  const score = subject.rating?.score
  const rank = subject.rating?.rank
  const { key } = useLocation()
  const to = `/subject/${subject.id}`
  const isTransitioning = useViewTransitionState(to)
  const viewTransitionName = `cover-image-${subject.id}-${key}`

  return (
    <MyLink
      className="hover:bg-accent/60 flex min-w-0 cursor-default gap-3 rounded-lg p-1.5 transition-colors"
      contextMenuTitle={subject}
      title={original ? `${title} / ${original}` : title}
      to={to}
      state={{ viewTransitionName }}
      viewTransition
    >
      {subject.images?.common || subject.images?.medium || subject.images?.small ? (
        <ViewTransitionImage
          active={isTransitioning}
          viewTransitionName={viewTransitionName}
          className="h-[5.5rem] w-16 shrink-0 overflow-hidden rounded-md"
          imageSrc={subject.images.common || subject.images.medium || subject.images.small}
        />
      ) : (
        <div className="bg-muted h-[5.5rem] w-16 shrink-0 rounded-md" />
      )}
      <div className="flex min-w-0 flex-1 flex-col py-0.5">
        <div className="line-clamp-2 text-sm leading-5 font-medium">{title}</div>
        {original && (
          <div className="text-muted-foreground mt-0.5 line-clamp-1 text-xs">{original}</div>
        )}
        <div className="text-muted-foreground mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 pt-1.5 text-xs tabular-nums">
          <span className="flex items-center gap-1">
            <Eye className="size-3.5" aria-hidden />
            {item.watchers}
            <span className="sr-only">在看</span>
          </span>
          {!!score && (
            <span className="flex items-center gap-1">
              <Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden />
              {score.toFixed(1)}
            </span>
          )}
          {!!rank && (
            <span className="flex items-center gap-1">
              <Trophy className="size-3.5" aria-hidden />#{rank}
            </span>
          )}
        </div>
      </div>
    </MyLink>
  )
}

function WeekItemSkeleton() {
  return (
    <div className="flex min-w-0 gap-3 p-1.5">
      <Skeleton className="h-[5.5rem] w-16 shrink-0 rounded-md" />
      <div className="min-w-0 flex-1 space-y-2 py-1">
        <Skeleton className="h-3.5 w-4/5" />
        <Skeleton className="h-3 w-3/5" />
        <Skeleton className="h-3 w-2/5" />
      </div>
    </div>
  )
}
