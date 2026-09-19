import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from '@renderer/components/ui/popover'
import {
  findEpisodeByInput,
  getEpisodeProgress,
  getWatchedThroughEpisodes,
} from '@renderer/data/collection/episode-progress'
import { CollectionEpisode, EpisodeCollectionType } from '@renderer/data/types/collection'
import { useEpisodeCollectionActions } from '@renderer/modules/common/collections/use-episode-collection-actions'
import { ChevronDown, ChevronUp, ChevronsRight, LoaderCircle } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { toast } from 'sonner'

type Props = { episodes: CollectionEpisode[]; subjectId: string; sortOffset: number }

export function EpisodeProgressEditor(props: Props) {
  const [open, setOpen] = useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground h-7 gap-1 px-2"
          aria-label="输入章节数字，批量更新进度"
        >
          <ChevronsRight className="size-3.5" />
          快速标记
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-60 gap-3 rounded-lg p-3">
        <PopoverTitle className="text-xs">更新观看进度</PopoverTitle>
        <ProgressForm {...props} onSaved={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  )
}

function ProgressForm({
  episodes,
  subjectId,
  sortOffset,
  onSaved,
}: Props & { onSaved: () => void }) {
  const progress = getEpisodeProgress(episodes)
  const watchedCount = progress.main.filter(
    (item) => item.type === EpisodeCollectionType.watched,
  ).length
  const initial = progress.lastWatched ?? progress.main[0]
  const lastEpisodeSort = progress.main[progress.main.length - 1].episode.sort + sortOffset
  const [value, setValue] = useState(String(initial.episode.sort + sortOffset))
  const inputId = useId()
  const stepperRef = useRef<HTMLDivElement>(null)
  const target = findEpisodeByInput(progress.main, value, sortOffset)
  const numericValue = value.trim() === '' ? NaN : Number(value)
  const previous = Number.isFinite(numericValue)
    ? progress.main.findLast((item) => item.episode.sort + sortOffset < numericValue)
    : undefined
  const next = Number.isFinite(numericValue)
    ? progress.main.find((item) => item.episode.sort + sortOffset > numericValue)
    : progress.main[0]
  const selectEpisode = (item: CollectionEpisode | undefined) => {
    if (item && !isPending) setValue(String(item.episode.sort + sortOffset))
  }
  const canUpdate = !!target && getWatchedThroughEpisodes(episodes, target.episode.id).length > 0
  const { isPending, mutateByAction } = useEpisodeCollectionActions({
    index: episodes.findIndex((item) => item.episode.id === target?.episode.id),
    subjectId,
    episodes,
    onProgressSaved(count) {
      if (count) toast.success(`已标记 ${count} 集为看过`)
      onSaved()
    },
  })
  useEffect(() => {
    const stepper = stepperRef.current
    if (!stepper) return
    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.deltaY === 0) return
      event.preventDefault()
      const item = event.deltaY < 0 ? next : previous
      if (item && !isPending) setValue(String(item.episode.sort + sortOffset))
    }
    // React wheel listeners are passive, so use a native listener to keep the page still.
    stepper.addEventListener('wheel', onWheel, { passive: false })
    return () => stepper.removeEventListener('wheel', onWheel)
  }, [next, previous, isPending, sortOffset])

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault()
        if (canUpdate && !isPending) mutateByAction('看到')
      }}
    >
      <div className="flex items-center gap-2">
        <label htmlFor={inputId} className="shrink-0 text-xs select-none">
          看到第
        </label>
        <div
          ref={stepperRef}
          className="border-input/70 bg-muted/20 focus-within:border-ring/50 focus-within:ring-ring/15 flex min-w-0 flex-1 overflow-hidden rounded-lg border transition-shadow focus-within:ring-2"
        >
          <div className="relative flex min-w-0 flex-1 items-center justify-center gap-1 overflow-hidden px-2">
            <div
              role="progressbar"
              aria-label="我的完成度"
              aria-valuemin={0}
              aria-valuemax={progress.main.length}
              aria-valuenow={watchedCount}
              aria-valuetext={`已看 ${watchedCount} / ${progress.main.length} 集`}
              className="pointer-events-none absolute inset-y-0 left-0 bg-linear-to-r from-(--watched)/20 to-(--watched)/5 transition-[width] duration-300 motion-reduce:transition-none dark:from-(--watched-accent)/70 dark:to-(--watched-accent)/30"
              style={{ width: `${(watchedCount / progress.main.length) * 100}%` }}
            />
            <Input
              id={inputId}
              aria-label="章节序号"
              aria-describedby={`${inputId}-last-episode`}
              aria-invalid={value !== '' && !target}
              type="text"
              inputMode="decimal"
              role="spinbutton"
              aria-valuemin={progress.main[0].episode.sort + sortOffset}
              aria-valuemax={lastEpisodeSort}
              aria-valuenow={Number.isFinite(numericValue) ? numericValue : undefined}
              value={value}
              disabled={isPending}
              className="relative h-10 min-w-0 rounded-none border-0 bg-transparent px-0 text-right text-sm font-medium tabular-nums shadow-none focus-visible:ring-0 dark:bg-transparent"
              style={{ width: `${Math.max(1, value.length)}ch` }}
              onChange={(event) => {
                const input = event.target.value
                if (/^\d*(?:\.\d*)?$/.test(input)) setValue(input)
              }}
              onFocus={(event) => event.target.select()}
              onKeyDown={(event) => {
                if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
                  event.preventDefault()
                  selectEpisode(event.key === 'ArrowUp' ? next : previous)
                }
              }}
            />
            <span
              id={`${inputId}-last-episode`}
              aria-label={`本季最后一集：第 ${lastEpisodeSort} 集`}
              className="text-muted-foreground/80 relative shrink-0 text-xs tabular-nums select-none"
            >
              / {lastEpisodeSort}
            </span>
          </div>
          <div className="text-muted-foreground flex w-7 shrink-0 flex-col justify-center gap-0.5 p-0.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-4 w-full rounded-sm disabled:opacity-25"
              aria-label="下一集"
              disabled={isPending || !next}
              onClick={() => selectEpisode(next)}
            >
              <ChevronUp className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-4 w-full rounded-sm disabled:opacity-25"
              aria-label="上一集"
              disabled={isPending || !previous}
              onClick={() => selectEpisode(previous)}
            >
              <ChevronDown className="size-3.5" />
            </Button>
          </div>
        </div>
        <span className="text-muted-foreground shrink-0 text-xs select-none">集</span>
      </div>
      <Button
        type="submit"
        size="sm"
        disabled={!canUpdate || isPending}
        className="h-8 w-full gap-1.5"
      >
        {isPending && <LoaderCircle className="size-3.5 animate-spin" />}
        {isPending ? '正在保存…' : '更新'}
      </Button>
    </form>
  )
}
