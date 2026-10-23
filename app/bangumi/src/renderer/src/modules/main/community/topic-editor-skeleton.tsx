import { Skeleton } from '@renderer/components/ui/skeleton'

export function TopicEditorSkeleton() {
  return (
    <div className="mx-auto flex h-full min-h-0 max-w-5xl flex-col gap-5 px-10 py-8">
      <header className="flex shrink-0 flex-col gap-3">
        <Skeleton className="h-6 w-40 rounded-full" />
        <Skeleton className="h-10 w-36" />
      </header>

      <section className="flex shrink-0 flex-col gap-2">
        <Skeleton className="h-3 w-8" />
        <Skeleton className="h-9 w-full" />
      </section>

      <section className="flex min-h-56 flex-1 flex-col gap-2">
        <Skeleton className="h-3 w-8" />
        <Skeleton className="min-h-0 flex-1 rounded-xl" />
      </section>
    </div>
  )
}
