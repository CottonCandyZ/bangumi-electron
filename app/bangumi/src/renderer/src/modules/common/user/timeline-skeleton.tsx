import { Skeleton } from '@renderer/components/ui/skeleton'
import { cn } from '@renderer/lib/utils'

export function UserTimelineSkeleton({
  className,
  count = 4,
  showUser = false,
  surface = 'card',
}: {
  className?: string
  count?: number
  showUser?: boolean
  surface?: 'card' | 'timeline'
}) {
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {Array.from({ length: count }).map((_, index) => (
        <UserTimelineSkeletonItem key={index} showUser={showUser} surface={surface} />
      ))}
    </div>
  )
}

export function UserTimelineSkeletonItem({
  showUser = false,
  surface = 'card',
}: {
  showUser?: boolean
  surface?: 'card' | 'timeline'
}) {
  if (surface === 'timeline') {
    return (
      <div className="relative flex min-w-0 flex-row gap-3 pl-1">
        <div className="flex w-6 shrink-0 justify-center">
          <div className="bg-border/70 relative h-full w-px">
            <div className="bg-background absolute top-0 left-1/2 flex size-6 -translate-x-1/2 items-center justify-center rounded-full">
              <Skeleton className="size-5 rounded-full" />
            </div>
          </div>
        </div>
        <div className="border-border/70 min-w-0 flex-1 border-b pb-4">
          <div className="flex min-w-0 flex-col gap-2">
            {showUser ? (
              <div className="flex min-w-0 flex-row items-center gap-2">
                <Skeleton className="size-6 shrink-0 rounded-full" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-10" />
              </div>
            ) : (
              <Skeleton className="h-3 w-10" />
            )}
            <div className="flex min-w-0 flex-row items-start gap-2">
              <Skeleton className="h-14 w-10 shrink-0 rounded border" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-3 w-3/5" />
                <Skeleton className="h-3 w-28" />
              </div>
            </div>
            <div className="flex flex-row items-center gap-1.5">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border p-3">
      <div className="flex flex-row justify-between gap-3">
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-3 w-10" />
      </div>
      <Skeleton className="h-14 w-full" />
    </div>
  )
}
