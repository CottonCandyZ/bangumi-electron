import { Button } from '@renderer/components/ui/button'
import type { CalendarItem } from '@renderer/data/types/calendar'
import { cn } from '@renderer/lib/utils'
import { useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import type { ComponentProps } from 'react'

export type BroadcastSortKey = 'watchers' | 'score'

// Shared by the home section and the full-week page so both lists agree.
export const broadcastSortAtom = atomWithStorage<BroadcastSortKey>(
  'broadcast-week-sort',
  'watchers',
  undefined,
  { getOnInit: true },
)

const SORTS: { id: BroadcastSortKey; label: string }[] = [
  { id: 'watchers', label: '在看' },
  { id: 'score', label: '评分' },
]

export function sortBroadcastItems(items: CalendarItem[] | undefined, sort: BroadcastSortKey) {
  if (!items) return items
  return [...items].sort((a, b) =>
    sort === 'score'
      ? (b.subject.rating?.score ?? 0) - (a.subject.rating?.score ?? 0)
      : b.watchers - a.watchers,
  )
}

/** Every toolbar control is a bordered 2rem box, matching the paging arrows next to them. */
export const broadcastControlClass =
  'border-border/60 text-muted-foreground hover:text-foreground h-8 rounded-md border bg-transparent px-2.5 text-xs font-normal shadow-none'

export function BroadcastSortControl() {
  const [sort, setSort] = useAtom(broadcastSortAtom)
  return (
    <div
      className="border-border/60 flex h-8 shrink-0 items-center rounded-md border p-0.5 text-xs"
      role="group"
      aria-label="排序"
    >
      {SORTS.map((item) => (
        <button
          key={item.id}
          type="button"
          aria-pressed={sort === item.id}
          onClick={() => setSort(item.id)}
          className={cn(
            'h-full rounded-sm px-2 transition-colors',
            sort === item.id
              ? 'bg-accent text-foreground'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

export function BroadcastToggleButton({
  pressed,
  className,
  ...props
}: ComponentProps<typeof Button> & { pressed: boolean }) {
  return (
    <Button
      variant="outline"
      size="sm"
      aria-pressed={pressed}
      className={cn(
        broadcastControlClass,
        pressed && 'bg-accent text-foreground border-foreground/20',
        className,
      )}
      {...props}
    />
  )
}
