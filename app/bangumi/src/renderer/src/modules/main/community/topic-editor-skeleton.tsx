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

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 @4xl:grid-cols-2">
        {Array.from({ length: 2 }, (_, index) => (
          <section className="flex min-h-56 flex-col gap-2" key={index}>
            <Skeleton className="h-3 w-10" />
            <Skeleton className="min-h-0 flex-1" />
          </section>
        ))}
      </div>

      <footer className="flex shrink-0 justify-end gap-2 border-t pt-4">
        <Skeleton className="h-9 w-16" />
        <Skeleton className="h-9 w-20" />
      </footer>
    </div>
  )
}
